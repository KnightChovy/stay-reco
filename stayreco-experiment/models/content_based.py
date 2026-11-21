"""Content-Based Filtering bằng TF-IDF + Cosine Similarity.

Cơ sở: Lops et al. (2011), "Content-based Recommender Systems"
Giải item cold-start: hotel mới có vector ngay khi nhập mô tả.

Trong production (StayReco) dùng embedding model + pgvector.
Ở đây dùng TF-IDF để đơn giản hóa thực nghiệm.

Cách dự đoán rating (item-based content kNN):
    Với hotel i cần đoán, tìm k hotel user đã chấm GIỐNG i nhất (cosine trên vector mô tả),
    rồi lấy trung bình có trọng số độ lệch rating của user trên các hotel đó:

        r̂(u,i) = b_ui + Σ_j sim(i,j)·(r_uj − b_uj) / (Σ_j sim(i,j) + 1)

    b_ui = μ + b_u + b_i là mức nền (baseline, Koren 2008), có shrinkage: user/hotel
    càng ít rating thì bias càng bị kéo về 0 → user mới chấm 2 hotel không bị
    đoán lệch theo 2 rating đó. Hotel mới: b_i = 0, phần độ lệch vẫn đến từ mô tả.

Không dùng "1 + cosine·4" vì cosine không cùng thang với rating
(mô tả giống nhau 80% không có nghĩa là user chấm 4.2 sao) → RMSE rất cao
và kéo lệch điểm Hybrid.
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from utils.batch import group_positions, map_default, top_k_rows


class ContentBasedFilter:
    """Content-Based recommender dùng TF-IDF trên mô tả hotel."""

    def __init__(self, k_neighbors=30, reg_item=10, reg_user=15):
        self.vectorizer = TfidfVectorizer()
        self.k = k_neighbors
        self.reg_item = reg_item    # shrinkage cho b_i
        self.reg_user = reg_user    # shrinkage cho b_u
        self.item_id_to_idx = None  # item_id → index trong ma trận
        self.item_sim = None        # ma trận cosine item × item
        self.user_history = {}      # user_id → (mảng index item đã chấm, mảng độ lệch r − b)
        self.item_bias = {}         # item_id → b_i
        self.user_bias = {}         # user_id → b_u
        self.global_mean = 3.0

    def fit(self, items_df, ratings_df, text_column="description"):
        """Tạo vector cho mỗi hotel từ mô tả + ghi nhớ lịch sử rating của user.

        Args:
            items_df: DataFrame (item_id, description) — gồm CẢ hotel chưa ai rating
            ratings_df: DataFrame train (user_id, item_id, rating)
        """
        self.item_id_to_idx = {iid: idx for idx, iid in enumerate(items_df["item_id"])}
        item_vectors = self.vectorizer.fit_transform(items_df[text_column].fillna(""))
        self.item_sim = cosine_similarity(item_vectors)

        # Baseline có shrinkage: b_i trước, rồi b_u trên phần còn lại
        mu = self.global_mean = ratings_df["rating"].mean()
        df = ratings_df[["user_id", "item_id", "rating"]].copy()
        dev = (df["rating"] - mu).groupby(df["item_id"]).agg(["sum", "count"])
        self.item_bias = (dev["sum"] / (dev["count"] + self.reg_item)).to_dict()
        df["resid"] = df["rating"] - mu - df["item_id"].map(self.item_bias)
        dev = df.groupby("user_id")["resid"].agg(["sum", "count"])
        self.user_bias = (dev["sum"] / (dev["count"] + self.reg_user)).to_dict()
        df["resid"] -= df["user_id"].map(self.user_bias)

        for user_id, user_df in df.groupby("user_id"):
            idx = user_df["item_id"].map(self.item_id_to_idx).to_numpy()
            self.user_history[user_id] = (idx, user_df["resid"].to_numpy(dtype=float))

        print(f"✓ Content-Based fitted: {len(self.item_id_to_idx)} items, "
              f"{item_vectors.shape[1]} features")

    def predict(self, user_id, item_id):
        """Dự đoán rating (1-5) cho 1 cặp (user, item)."""
        baseline = (self.global_mean + self.user_bias.get(user_id, 0.0)
                    + self.item_bias.get(item_id, 0.0))
        if user_id not in self.user_history or item_id not in self.item_id_to_idx:
            return float(np.clip(baseline, 1.0, 5.0))  # user chưa chấm gì → không biết gu

        rated_idx, resid = self.user_history[user_id]
        sims = self.item_sim[self.item_id_to_idx[item_id], rated_idx]
        # kind="stable": khi nhiều hotel giống nhau bằng nhau, luôn chọn cùng một
        # tập neighbor → chạy lại cho ra đúng số cũ, và khớp với predict_many()
        top = np.argsort(-sims, kind="stable")[:self.k]
        top = top[sims[top] > 0]

        pred = baseline
        if len(top) > 0:
            pred += np.dot(sims[top], resid[top]) / (sims[top].sum() + 1.0)
        return float(np.clip(pred, 1.0, 5.0))

    def predict_many(self, users, items):
        """Dự đoán cho nhiều cặp (user, item) cùng lúc — xem ghi chú ở cf_svdpp.py.

        Gom các cặp theo user: mỗi user chỉ cần lấy 1 lát ma trận độ giống
        (số hotel cần đoán × số hotel user đã chấm) rồi tính top-k theo hàng.
        """
        users = np.asarray(users)
        items = np.asarray(items)

        pred = (self.global_mean
                + map_default(users, self.user_bias, 0.0)
                + map_default(items, self.item_bias, 0.0))
        item_idx = map_default(items, self.item_id_to_idx, -1).astype(np.int64)

        for user_id, pos in group_positions(users):
            if user_id not in self.user_history:
                continue
            rated_idx, resid = self.user_history[user_id]
            if len(rated_idx) == 0:
                continue
            pos = pos[item_idx[pos] >= 0]   # hotel không có mô tả → giữ baseline
            if len(pos) == 0:
                continue

            sims = self.item_sim[np.ix_(item_idx[pos], rated_idx)]
            s, r = top_k_rows(sims, resid, self.k, by_abs=False)
            mask = s > 0
            pred[pos] += (s * r * mask).sum(axis=1) / ((s * mask).sum(axis=1) + 1.0)

        return np.clip(pred, 1.0, 5.0)

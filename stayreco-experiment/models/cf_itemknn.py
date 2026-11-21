"""Item-Item Collaborative Filtering (memory-based).

Dùng để dựng lại baseline của Tarek et al. (2023) — bài gần StayReco nhất về domain
hotel. Khác SVD++ ở chỗ KHÔNG phân rã ma trận, không học gu ẩn: chỉ tính độ giống
giữa các hotel dựa trên PATTERN RATING (ai chấm cái gì), rồi lấy trung bình có
trọng số.

    sim(i,j) = cosine giữa 2 cột rating (đã trừ trung bình item)
    r̂(u,i)  = mean_i + Σ_j sim(i,j)·(r_uj − mean_j) / Σ_j |sim(i,j)|

Lưu ý phân biệt với Content-Based: Content tính độ giống từ MÔ TẢ hotel,
Item-Item CF tính độ giống từ RATING. Vì vậy hotel mới (chưa ai rating) thì
Item-Item CF bó tay, còn Content vẫn chạy được.
"""

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import csr_matrix

from utils.batch import group_positions, map_default, top_k_rows


class ItemItemCF:
    """Item-Item CF theo kiểu Tarek et al. (2023)."""

    def __init__(self, k_neighbors=30, shrinkage=5):
        self.k = k_neighbors
        self.shrinkage = shrinkage
        self.item_sim = None
        self.item_id_to_idx = {}
        self.item_means = {}
        self.user_history = {}   # user_id → (index item đã chấm, độ lệch so với mean item)
        self.global_mean = 3.0

    def fit(self, ratings_df):
        """Tính ma trận độ giống item × item từ pattern rating."""
        self.global_mean = ratings_df["rating"].mean()
        item_ids = ratings_df["item_id"].unique()
        user_ids = ratings_df["user_id"].unique()
        self.item_id_to_idx = {iid: idx for idx, iid in enumerate(item_ids)}
        user_to_idx = {uid: idx for idx, uid in enumerate(user_ids)}

        stats = ratings_df.groupby("item_id")["rating"].agg(["sum", "count"])
        means = (stats["sum"] + self.shrinkage * self.global_mean) / (stats["count"] + self.shrinkage)
        self.item_means = means.to_dict()

        rows = ratings_df["item_id"].map(self.item_id_to_idx).to_numpy()
        cols = ratings_df["user_id"].map(user_to_idx).to_numpy()
        vals = ratings_df["rating"].to_numpy(dtype=float) - ratings_df["item_id"].map(self.item_means).to_numpy()

        # Ma trận item × user (ô trống = 0 = "đúng bằng mức trung bình")
        matrix = csr_matrix((vals, (rows, cols)), shape=(len(item_ids), len(user_ids)))
        self.item_sim = cosine_similarity(matrix)
        np.fill_diagonal(self.item_sim, 0.0)

        for user_id, user_df in ratings_df.groupby("user_id"):
            idx = user_df["item_id"].map(self.item_id_to_idx).to_numpy()
            dev = (user_df["rating"].to_numpy(dtype=float)
                   - user_df["item_id"].map(self.item_means).to_numpy())
            self.user_history[user_id] = (idx, dev)

        print(f"✓ Item-Item CF fitted: {len(item_ids)} items")

    def predict(self, user_id, item_id):
        """Dự đoán rating (1-5)."""
        base = self.item_means.get(item_id, self.global_mean)
        if user_id not in self.user_history or item_id not in self.item_id_to_idx:
            return float(np.clip(base, 1.0, 5.0))

        rated_idx, dev = self.user_history[user_id]
        sims = self.item_sim[self.item_id_to_idx[item_id], rated_idx]
        # kind="stable" để khớp với predict_many() — xem utils/batch.py
        top = np.argsort(-np.abs(sims), kind="stable")[:self.k]
        top = top[np.abs(sims[top]) > 0]

        pred = base
        if len(top) > 0:
            pred += np.dot(sims[top], dev[top]) / (np.abs(sims[top]).sum() + 1.0)
        return float(np.clip(pred, 1.0, 5.0))

    def predict_many(self, users, items):
        """Dự đoán cho nhiều cặp (user, item) cùng lúc — xem utils/batch.py.

        Khác Content ở hai chỗ: mức nền là trung bình item (không có bias user),
        và neighbor xếp theo |sim| vì tương quan âm cũng mang thông tin.
        """
        users = np.asarray(users)
        items = np.asarray(items)

        pred = map_default(items, self.item_means, float(self.global_mean))
        item_idx = map_default(items, self.item_id_to_idx, -1).astype(np.int64)

        for user_id, pos in group_positions(users):
            if user_id not in self.user_history:
                continue
            rated_idx, dev = self.user_history[user_id]
            if len(rated_idx) == 0:
                continue
            pos = pos[item_idx[pos] >= 0]   # hotel chưa ai rating → Item-Item CF bó tay
            if len(pos) == 0:
                continue

            sims = self.item_sim[np.ix_(item_idx[pos], rated_idx)]
            s, d = top_k_rows(sims, dev, self.k, by_abs=True)
            mask = np.abs(s) > 0
            pred[pos] += (s * d * mask).sum(axis=1) / (np.abs(s * mask).sum(axis=1) + 1.0)

        return np.clip(pred, 1.0, 5.0)

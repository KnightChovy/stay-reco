"""Serving components ported from stayreco-experiment/models."""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from surprise import SVDpp


class CollaborativeFilter:
    """SVD++ wrapper cho StayReco."""

    def __init__(self, n_factors=50, n_epochs=30, lr=0.005, reg=0.02, seed=None):
        self.model = SVDpp(
            n_factors=n_factors,
            n_epochs=n_epochs,
            lr_all=lr,
            reg_all=reg,
            random_state=seed,
            verbose=True,
        )
        self.is_trained = False

    def fit(self, trainset):
        """Train SVD++ trên trainset (Surprise format)."""
        print("Training SVD++...")
        self.model.fit(trainset)
        self.is_trained = True
        self._build_user_factors()
        print("✓ SVD++ trained")

    # ── Chấm điểm hàng loạt ──────────────────────────────
    # Vì sao cần: xếp hạng trên TOÀN BỘ catalog phải chấm ~1.5 triệu cặp
    # (user × hotel chưa xem). Gọi model.predict() từng cặp mất hàng chục phút.
    # Hàm dưới dựng lại ĐÚNG công thức của Surprise bằng phép toán ma trận.
    #
    # Surprise SVDpp.estimate():
    #     est = μ
    #     + b_u                        (nếu biết user)
    #     + b_i                        (nếu biết item)
    #     + q_i · (p_u + |N(u)|^-½ Σ_j y_j)   (nếu biết cả hai)
    # rồi predict() kẹp về [1, 5].
    # Phần trong ngoặc chỉ phụ thuộc user → tính trước 1 lần cho mọi user.

    def _build_user_factors(self):
        """Tính trước p_u + |N(u)|^-½ Σ_j y_j cho mọi user (phần implicit của SVD++)."""
        m, ts = self.model, self.model.trainset
        p_aug = m.pu.copy()
        for u in range(ts.n_users):
            rated = ts.ur[u]
            if rated:
                implicit = m.yj[[j for j, _ in rated]].sum(axis=0) / np.sqrt(len(rated))
                p_aug[u] += implicit
        self._p_aug = p_aug

    def predict_many(self, users, items):
        """Dự đoán cho nhiều cặp (user, item) cùng lúc.

        Args:
            users, items: mảng id GỐC (raw id), cùng độ dài

        Returns:
            np.ndarray float, đã kẹp về [1, 5] — khớp với predict() từng cặp
        """
        if not self.is_trained:
            raise RuntimeError("Model chưa train. Gọi fit() trước.")
        m, ts = self.model, self.model.trainset
        u_raw2inner = ts._raw2inner_id_users
        i_raw2inner = ts._raw2inner_id_items

        uin = np.fromiter((u_raw2inner.get(str(u), -1) for u in users), dtype=np.int64,
                          count=len(users))
        iin = np.fromiter((i_raw2inner.get(str(i), -1) for i in items), dtype=np.int64,
                          count=len(items))

        est = np.full(len(uin), ts.global_mean, dtype=float)
        ku, ki = uin >= 0, iin >= 0
        est[ku] += m.bu[uin[ku]]
        est[ki] += m.bi[iin[ki]]
        both = ku & ki
        if both.any():
            est[both] += np.einsum("ij,ij->i", m.qi[iin[both]], self._p_aug[uin[both]])
        return np.clip(est, 1.0, 5.0)

class DemographicFilter:
    """Gợi ý dựa trên nhóm nhân khẩu."""

    def __init__(self, group_cols=("gender", "age_group", "country"), shrinkage=5):
        self.group_cols = list(group_cols)
        self.shrinkage = shrinkage
        self.group_ratings = {}   # (age, country, trip, item_id) → rating
        self.item_means = {}      # item_id → rating
        self.user_demo = {}       # user_id → (age, country, trip)
        self.global_avg = 3.0

    def fit(self, ratings_df, demo_df):
        """Tính trung bình rating theo nhóm nhân khẩu.

        Args:
            ratings_df: DataFrame train (user_id, item_id, rating)
            demo_df: DataFrame (user_id, + các cột group_cols) — gồm CẢ user chưa rating
        """
        lam = self.shrinkage
        self.global_avg = float(ratings_df["rating"].mean()) if len(ratings_df) else 3.0

        item_stats = ratings_df.groupby("item_id")["rating"].agg(["sum", "count"])
        item_means = item_stats["sum"] / item_stats["count"]
        self.item_means = item_means.to_dict()

        complete = demo_df.dropna(subset=self.group_cols)
        merged = ratings_df.merge(complete, on="user_id", how="inner")
        group_stats = merged.groupby(self.group_cols + ["item_id"])["rating"].agg(["sum", "count"])
        prior = group_stats.index.get_level_values("item_id").map(self.item_means)
        group_means = (group_stats["sum"] + lam * prior) / (group_stats["count"] + lam)
        self.group_ratings = group_means.to_dict()

        self.user_demo = {
            row.user_id: tuple(getattr(row, c) for c in self.group_cols)
            for row in complete.itertuples()
        }
        print(f"✓ Demographic fitted: {len(self.group_ratings)} group-item pairs "
              f"(groups by {', '.join(self.group_cols)})")

    def predict_many(self, users, items):
        """Dự đoán cho nhiều cặp (user, item) cùng lúc — xem utils/batch.py.

        Chỉ là tra cứu dict nên không cần ma trận, nhưng vẫn gom thành một vòng
        lặp duy nhất thay vì gọi lại predict() 1.5 triệu lần.
        """
        no_group = (None,)
        fallback = self.item_means
        groups = self.user_demo
        table = self.group_ratings
        avg = self.global_avg
        out = np.empty(len(users), dtype=float)
        for pos, (user_id, item_id) in enumerate(zip(users, items)):
            group = groups.get(user_id, no_group)
            value = table.get(group + (item_id,))
            out[pos] = value if value is not None else fallback.get(item_id, avg)
        return out
class ContentBasedFilter:
    """TF-IDF item kNN with rating baselines and a profile for customers with no ratings."""

    def __init__(self, hotels, ratings):
        self.index = {item: i for i, item in enumerate(hotels["item_id"])}
        self.vectorizer = TfidfVectorizer()
        self.vectors = self.vectorizer.fit_transform(hotels["text"])
        self.mean = float(ratings["rating"].mean()) if len(ratings) else 3.0
        item = ratings.groupby("item_id")["rating"].agg(["sum", "count"])
        self.item_bias = ((item["sum"] - self.mean * item["count"]) / (item["count"] + 10)).to_dict()
        history = ratings.assign(resid=ratings["rating"] - self.mean - ratings["item_id"].map(self.item_bias))
        user = history.groupby("user_id")["resid"].agg(["sum", "count"])
        self.user_bias = (user["sum"] / (user["count"] + 15)).to_dict()
        self.history = {
            user_id: (group["item_id"].map(self.index).to_numpy(dtype=int),
                      group["resid"].to_numpy(dtype=float) - self.user_bias[user_id])
            for user_id, group in history.groupby("user_id")
        }

    def predict(self, user, items, profile):
        indices = [self.index[item] for item in items]
        vectors = self.vectors[indices]
        baseline = self.mean + self.user_bias.get(user, 0) + np.array(
            [self.item_bias.get(item, 0) for item in items]
        )
        if user in self.history:
            seen, residual = self.history[user]
            sims = (vectors @ self.vectors[seen].T).toarray()
            top = np.argsort(-sims, axis=1, kind="stable")[:, :30]
            similarity = np.take_along_axis(sims, top, axis=1)
            baseline += (similarity * residual[top]).sum(axis=1) / (similarity.sum(axis=1) + 1)
        elif profile:
            match = (vectors @ self.vectorizer.transform([profile]).T).toarray().ravel()
            baseline += match
        return np.clip(baseline, 1, 5)

"""Demographic Filtering — fallback cho user hoàn toàn mới.

Cơ sở: Pazzani (1999), "A Framework for Collaborative,
Content-Based and Demographic Filtering"

Ý tưởng: Nhóm users theo (age_group, country, trip_type),
tính trung bình rating của nhóm cho từng item.

Shrinkage: nhóm chỉ có 1-2 người chấm hotel thì trung bình rất nhiễu, nên kéo
về trung bình chung của hotel đó:
    score = (tổng rating nhóm + λ·item_mean) / (số rating nhóm + λ)
Nhóm càng đông → càng tin trung bình của nhóm.
"""

import numpy as np
import pandas as pd


class DemographicFilter:
    """Gợi ý dựa trên nhóm nhân khẩu."""

    def __init__(self, group_cols=("age_group", "country", "trip_type"), shrinkage=5):
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
        self.global_avg = ratings_df["rating"].mean()

        item_stats = ratings_df.groupby("item_id")["rating"].agg(["sum", "count"])
        item_means = (item_stats["sum"] + lam * self.global_avg) / (item_stats["count"] + lam)
        self.item_means = item_means.to_dict()

        merged = ratings_df.merge(demo_df, on="user_id", how="inner")
        group_stats = merged.groupby(self.group_cols + ["item_id"])["rating"].agg(["sum", "count"])
        prior = group_stats.index.get_level_values("item_id").map(self.item_means)
        group_means = (group_stats["sum"] + lam * prior) / (group_stats["count"] + lam)
        self.group_ratings = group_means.to_dict()

        self.user_demo = {
            row.user_id: tuple(getattr(row, c) for c in self.group_cols)
            for row in demo_df.itertuples()
        }
        print(f"✓ Demographic fitted: {len(self.group_ratings)} group-item pairs "
              f"(groups by {', '.join(self.group_cols)})")

    def predict(self, user_id, item_id):
        """Dự đoán rating dựa trên nhóm nhân khẩu của user.

        Fallback: nhóm chưa ai chấm hotel → trung bình hotel → trung bình toàn hệ thống.
        """
        group = self.user_demo.get(user_id)
        if group is not None and group + (item_id,) in self.group_ratings:
            return self.group_ratings[group + (item_id,)]
        return self.item_means.get(item_id, self.global_avg)

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

"""Hybrid Recommender — công thức chính StayReco.

score = α·CF + β·Content + γ·Demographic → lọc qua Knowledge

Cơ sở: Weighted hybrid (Burke, 2002)
Đóng góp: α động theo n (weighted-switching hybrid)
"""

import numpy as np
import pandas as pd

from utils.alpha_scheduler import compute_dynamic_alpha


class HybridRecommender:
    """Kết hợp CF + Content + Demographic với trọng số động."""

    def __init__(self, cf_model, cb_model, demo_model):
        """
        Args:
            cf_model: CollaborativeFilter (SVD++)
            cb_model: ContentBasedFilter
            demo_model: DemographicFilter
        """
        self.cf = cf_model
        self.cb = cb_model
        self.demo = demo_model

    def component_scores(self, pairs_df):
        """Hỏi ý kiến cả 3 model cho mỗi cặp (user, item).

        Tính 1 lần rồi dùng lại cho mọi cách trộn (7 phương pháp) → nhanh hơn nhiều.

        Returns:
            DataFrame có thêm 3 cột: cf, content, demo
        """
        pairs_df = pairs_df.copy()
        users, items = pairs_df["user_id"], pairs_df["item_id"]
        pairs_df["cf"] = [self.cf.predict(u, i) for u, i in zip(users, items)]
        pairs_df["content"] = [self.cb.predict(u, i) for u, i in zip(users, items)]
        pairs_df["demo"] = [self.demo.predict(u, i) for u, i in zip(users, items)]
        return pairs_df

    @staticmethod
    def blend(scores_df, weight_fn):
        """Trộn 3 cột điểm theo trọng số.

        Args:
            scores_df: output của component_scores() (cần thêm cột n, item_n)
            weight_fn: function(n, item_n) → {"alpha", "beta", "gamma"}

        Returns:
            np.array điểm dự đoán (1-5)
        """
        weights = pd.DataFrame(
            [weight_fn(n, item_n) for n, item_n in zip(scores_df["n"], scores_df["item_n"])],
            index=scores_df.index,
        )
        score = (weights["alpha"] * scores_df["cf"]
                 + weights["beta"] * scores_df["content"]
                 + weights["gamma"] * scores_df["demo"])
        return np.clip(score.to_numpy(), 1.0, 5.0)

    def predict(self, user_id, item_id, n_interactions, item_interactions=None,
                has_preferences=False):
        """Dự đoán rating hybrid cho 1 cặp (user, item) — dùng khi serve gợi ý thật.

        Args:
            n_interactions: số tương tác của user (quyết định α)
            item_interactions: số tương tác của hotel (0 = hotel mới → chỉ tin Content)
            has_preferences: user đã khai sở thích chưa
        """
        w = compute_dynamic_alpha(n_interactions, has_preferences=has_preferences,
                                  item_n=item_interactions)
        score = 0.0
        if w["alpha"] > 0:
            score += w["alpha"] * self.cf.predict(user_id, item_id)
        if w["beta"] > 0:
            score += w["beta"] * self.cb.predict(user_id, item_id)
        if w["gamma"] > 0:
            score += w["gamma"] * self.demo.predict(user_id, item_id)
        return max(1.0, min(5.0, score))

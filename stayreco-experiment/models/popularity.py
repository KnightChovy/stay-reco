"""Popularity baseline — "hotel nào được chấm cao nói chung".

Dùng 2 chỗ:
1. Knowledge-based fallback của Tarek et al. (2023): user hoàn toàn mới thì gợi ý
   hotel phổ biến / điểm cao.
2. Mốc tham chiếu thấp nhất: mọi model phải tốt hơn cái này.

Có shrinkage: hotel chỉ 1 người chấm 5 sao thì chưa chắc tốt.
"""

from utils.batch import map_default


class PopularityBaseline:
    def __init__(self, shrinkage=5):
        self.shrinkage = shrinkage
        self.item_means = {}
        self.global_mean = 3.0

    def fit(self, ratings_df):
        self.global_mean = ratings_df["rating"].mean()
        stats = ratings_df.groupby("item_id")["rating"].agg(["sum", "count"])
        means = (stats["sum"] + self.shrinkage * self.global_mean) / (stats["count"] + self.shrinkage)
        self.item_means = means.to_dict()
        print(f"✓ Popularity fitted: {len(self.item_means)} items")

    def predict(self, user_id, item_id):
        return self.item_means.get(item_id, self.global_mean)

    def predict_many(self, users, items):
        """Dự đoán cho nhiều cặp cùng lúc — xem utils/batch.py.

        Không phụ thuộc user: mọi khách đều thấy cùng một bảng xếp hạng. Chính vì
        vậy đây là mốc tham chiếu thấp nhất — mô hình nào không thắng được nó thì
        chưa học được gì về cá nhân hóa (Dacrema et al., 2019).
        """
        return map_default(items, self.item_means, float(self.global_mean))

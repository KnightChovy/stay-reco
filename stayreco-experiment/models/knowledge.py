"""Knowledge-Based Pre-filter — luật cứng lọc TRƯỚC ranking.

Cơ sở: Burke (2000), "Knowledge-Based Recommender Systems"
Cascade hybrid: Knowledge lọc trước, weighted hybrid xếp hạng sau.

Trong thực nghiệm offline, simulate bằng cách loại items
không thỏa điều kiện.
"""


class KnowledgeFilter:
    """Lọc items dựa trên luật nghiệp vụ."""

    def __init__(self):
        self.rules = []

    def add_rule(self, name, filter_fn):
        """Thêm luật lọc.

        Args:
            name: tên luật (vd: "budget", "availability")
            filter_fn: function(item_row) → bool (True = giữ lại)
        """
        self.rules.append({"name": name, "fn": filter_fn})
        print(f"  + Rule: {name}")

    def filter(self, items_df, user_context=None):
        """Lọc danh sách items theo tất cả luật.

        Args:
            items_df: DataFrame chứa thông tin hotels
            user_context: dict (vd: {"budget": 200, "checkin": "2026-01-15"})

        Returns:
            DataFrame: items đã lọc
        """
        filtered = items_df.copy()
        for rule in self.rules:
            before = len(filtered)
            filtered = filtered[filtered.apply(rule["fn"], axis=1)]
            dropped = before - len(filtered)
            if dropped > 0:
                print(f"  Knowledge [{rule['name']}]: loại {dropped} items")

        return filtered


def create_default_filter():
    """Tạo Knowledge filter mặc định cho hotel booking.

    Trong thực nghiệm offline, các luật này được simulate.
    Trong production: query DB thật.
    """
    kf = KnowledgeFilter()

    # Rule 1: Còn phòng (simulate: random 90% available)
    # kf.add_rule("availability", lambda row: row.get("available", True))

    # Rule 2: Trong ngân sách
    # kf.add_rule("budget", lambda row: row["price"] <= user_context["budget"])

    # Rule 3: Đã được duyệt (approved partner)
    # kf.add_rule("approved", lambda row: row.get("approved", True))

    return kf

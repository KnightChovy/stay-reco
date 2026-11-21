"""SVD++ có thật sự hơn SVD không?

Lý do StayReco chọn SVD++ là nhờ implicit feedback. Script này kiểm chứng bằng cách
so trực tiếp 2 cột điểm đã lưu trong results/score_table_seed*.csv, tách theo nhóm
cold-start. Không cần train lại.

Lưu ý quan trọng cho báo cáo: MovieLens KHÔNG có view/click/wishlist. Phần implicit
của SVD++ ở đây chỉ là "user đã chấm điểm cho phim nào" — đúng như Koren (2008) làm
trên Netflix, nhưng KHÔNG phải loại implicit feedback mà StayReco hướng tới.

Cách chạy:
    python compare_svd_svdpp.py _schein
"""

import sys
import glob
import numpy as np
import pandas as pd


def rmse(pred, true):
    return float(np.sqrt(np.mean((pred - true) ** 2)))


def main(suffix=""):
    rows = []
    for path in sorted(glob.glob(f"results/score_table_seed*{suffix}.csv")):
        if suffix == "" and "_" in path.split("seed")[1]:
            continue  # tránh bắt nhầm file có hậu tố
        df = pd.read_csv(path)
        for group in ["cold_item", "cold", "cool", "warm", "TỔNG"]:
            part = df if group == "TỔNG" else df[df["group"] == group]
            if len(part) == 0:
                continue
            rows.append({
                "seed": path,
                "group": group,
                "SVD": rmse(part["svd"], part["rating"]),
                "SVD++": rmse(part["svdpp"], part["rating"]),
            })

    res = pd.DataFrame(rows).groupby("group")[["SVD", "SVD++"]].mean()
    res["SVD++ tốt hơn"] = res["SVD"] - res["SVD++"]
    order = ["cold_item", "cold", "cool", "warm", "TỔNG"]
    print("RMSE trung bình qua các seed (thấp = tốt):")
    print(res.reindex([g for g in order if g in res.index]).round(4).to_string())
    print("\nDương = SVD++ tốt hơn SVD.")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "")

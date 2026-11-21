"""Tiện ích chấm điểm hàng loạt (vectorized).

Vì sao cần file này: để đo Precision@K / NDCG@K cho ĐÚNG, mỗi user phải được xếp
hạng trên toàn bộ catalog (xem evaluation/ranking.py), tức khoảng 1.5 triệu cặp
(user, hotel) mỗi seed. Gọi model.predict() từng cặp trong vòng lặp Python mất
hàng chục phút; các hàm dưới đây cho phép tính bằng phép toán ma trận.

Mọi hàm ở đây chỉ là tối ưu tốc độ — KHÔNG đổi công thức. Tính đúng đắn được
kiểm tra trong tests/test_predict_many.py: predict_many() phải trùng predict()
tới từng chữ số.
"""

import numpy as np


def map_default(keys, mapping, default):
    """Tra cứu mảng key trong dict, key lạ thì trả về `default`.

    Tương đương pandas Series.map(...).fillna(default) nhưng không cần tạo Series.
    """
    return np.fromiter((mapping.get(k, default) for k in keys),
                       dtype=float if isinstance(default, float) else np.int64,
                       count=len(keys))


def group_positions(values):
    """Gom các vị trí có cùng giá trị. Trả về iterator (giá trị, mảng vị trí).

    Dùng để xử lý từng user một: mọi cặp của cùng một user dùng chung một lát
    ma trận độ giống, nên gom lại tính một lần thay vì tính lại cho từng cặp.
    """
    values = np.asarray(values)
    order = np.argsort(values, kind="stable")
    sorted_vals = values[order]
    # Biên của mỗi nhóm giá trị giống nhau
    bounds = np.flatnonzero(np.r_[True, sorted_vals[1:] != sorted_vals[:-1], True])
    for start, end in zip(bounds[:-1], bounds[1:]):
        yield sorted_vals[start], order[start:end]


def top_k_rows(sims, weights, k, by_abs=False):
    """Với mỗi HÀNG của `sims`, lấy k cột có độ giống cao nhất.

    Đây là bản vectorized của:
        top = np.argsort(-sims, kind="stable")[:k]
        return sims[top], weights[top]

    Args:
        sims:    ma trận (số hotel cần đoán × số hotel user đã chấm)
        weights: mảng độ lệch rating, cùng độ dài với số cột của sims
        k:       số neighbor giữ lại
        by_abs:  True thì xếp theo |sim| (Item-Item CF dùng cả tương quan âm),
                 False thì xếp theo sim (Content chỉ dùng tương quan dương)

    Returns:
        (s, w): hai ma trận (số hàng × k_thực) — độ giống và độ lệch tương ứng
    """
    k = min(k, sims.shape[1])
    rank_key = -np.abs(sims) if by_abs else -sims
    top = np.argsort(rank_key, axis=1, kind="stable")[:, :k]
    return np.take_along_axis(sims, top, axis=1), weights[top]

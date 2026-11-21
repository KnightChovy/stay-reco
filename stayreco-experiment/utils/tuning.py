"""Grid search trên tập VALIDATION.

Vì sao cần file này: tham số của StayReco (α_max, n_threshold...) hiện được chọn
thủ công — điểm yếu lớn nhất khi so với OHWSF (2022, grid search σ₁) và
Do & Le (2020, trọng số theo hiệu năng). File này cho phép chọn tham số TỪ DỮ LIỆU.

NGUYÊN TẮC: chỉ được tune trên VALIDATION, không bao giờ trên TEST.
Tune trên test = xem trước đáp án = kết quả báo cáo không còn giá trị.
"""

import itertools
import numpy as np


def rmse(pred, true):
    return float(np.sqrt(np.mean((np.asarray(pred) - np.asarray(true)) ** 2)))


# Tiêu chí chọn tham số. Mặc định RMSE (như mọi lần chạy trước).
# run_experiment.py --tune-metric=ndcg đặt metric="ndcg" và gắn rổ ứng viên
# của VALIDATION vào đây; khi đó MỌI phương pháp có grid search đều được chọn
# theo NDCG@10 trên rổ đó — cùng một thủ tục cho tất cả, để so sánh công bằng.
TUNE = {"metric": "rmse", "frame": None, "fast": None}


def set_ndcg_target(frame, n_relevant):
    """Bật chế độ tune theo NDCG@10 trên rổ `frame` (output build_candidate_frame).

    Grid search gọi NDCG hàng nghìn lần, mà rank_metrics() sort theo item_id dạng
    CHUỖI — vài giây mỗi lần. Ở đây mã hoá user/item sang số nguyên MỘT lần,
    giữ đúng thứ tự (np.unique sắp chuỗi như lexsort), rồi mỗi lần chỉ sort số
    nguyên và cộng bằng bincount. Kết quả bằng đúng rank_metrics()["ndcg@10"]
    (kiểm tra trong tests/test_ranking_metrics.py).
    """
    _, ucode = np.unique(frame["user_id"].to_numpy(), return_inverse=True)
    _, icode = np.unique(frame["item_id"].to_numpy(), return_inverse=True)
    ucode, icode = ucode.ravel(), icode.ravel()
    user_ids = np.unique(frame["user_id"].to_numpy())
    n_users = len(user_ids)
    n_rel = n_relevant.reindex(user_ids).to_numpy().astype(int)
    disc = 1.0 / np.log2(np.arange(10) + 2)
    idcg = np.cumsum(disc)[np.minimum(n_rel, 10) - 1]
    # Xếp rổ thành ma trận user × cột, trong mỗi hàng cột tăng dần theo mã item
    # → hoà điểm thì cột trái (item_id nhỏ hơn) đứng trước, đúng như lexsort.
    order = np.lexsort((icode, ucode))
    u_s = ucode[order]
    starts = np.flatnonzero(np.r_[True, u_s[1:] != u_s[:-1]])
    sizes = np.diff(np.r_[starts, len(u_s)])
    col = np.arange(len(u_s)) - np.repeat(starts, sizes)
    width = int(max(sizes.max(), 10))
    rel2d = np.zeros((n_users, width), dtype=bool)
    rel2d[u_s, col] = frame["relevant"].to_numpy().astype(bool)[order]
    TUNE.update(metric="ndcg", frame=frame, fast={
        "order": order, "row": u_s, "col": col, "width": width,
        "rel2d": rel2d, "idcg": idcg, "disc": disc, "n_users": n_users})


def set_rmse_target():
    TUNE.update(metric="rmse", frame=None, fast=None)


def fast_ndcg10(pred):
    """NDCG@10 trung bình theo user, cùng định nghĩa và tie-break như rank_metrics().

    Không sort cả rổ: tìm ngưỡng điểm thứ 10 của mỗi user bằng np.partition,
    lấy mọi ô lớn hơn ngưỡng + các ô BẰNG ngưỡng tính từ trái (item_id nhỏ hơn)
    cho đủ 10, rồi chỉ sắp 10 ô đó.
    """
    f = TUNE["fast"]
    U, W = f["n_users"], f["width"]
    M = np.full((U, W), -np.inf)
    M[f["row"], f["col"]] = np.asarray(pred, dtype=float)[f["order"]]
    v10 = -np.partition(-M, 9, axis=1)[:, 9:10]          # điểm thứ 10 của mỗi user
    gt = M > v10
    eq = M == v10
    need = 10 - gt.sum(axis=1, keepdims=True)
    take = gt | (eq & (np.cumsum(eq, axis=1) <= need))  # đúng 10 ô mỗi hàng
    r, c = np.nonzero(take)
    c = c.reshape(U, 10)
    vals = np.take_along_axis(M, c, axis=1)
    o = np.lexsort((c, -vals), axis=1)                   # điểm giảm dần, hoà → cột trái
    c = np.take_along_axis(c, o, axis=1)
    hit = np.take_along_axis(f["rel2d"], c, axis=1)
    dcg = (hit * f["disc"][None, :]).sum(axis=1)
    return float(np.mean(dcg / f["idcg"]))


def _score(predict_fn, val_df, params):
    """Điểm để TỐI THIỂU HOÁ: RMSE, hoặc âm NDCG@10 trên rổ validation."""
    if TUNE["metric"] == "ndcg":
        return -fast_ndcg10(predict_fn(TUNE["frame"], **params))
    return rmse(predict_fn(val_df, **params), val_df["rating"])


def grid_search(param_grid, predict_fn, val_df, verbose=True):
    """Thử mọi tổ hợp tham số, chọn tổ hợp TỐT NHẤT trên validation.

    Tốt nhất = RMSE thấp nhất (mặc định), hoặc NDCG@10 cao nhất khi
    TUNE["metric"] == "ndcg" (xem ở trên).

    Args:
        param_grid: dict {tên tham số: [các giá trị thử]}
        predict_fn: function(scores_df, **params) → mảng dự đoán
        val_df: bảng điểm của tập validation (có cột 'rating' làm đáp án)

    Returns:
        best_params (dict), history (list of (params, rmse))
    """
    keys = list(param_grid)
    history = []
    for values in itertools.product(*(param_grid[k] for k in keys)):
        params = dict(zip(keys, values))
        score = _score(predict_fn, val_df, params)
        history.append((params, score))

    best_params, best_rmse = min(history, key=lambda x: x[1])
    if verbose:
        label = ("NDCG@10", -best_rmse) if TUNE["metric"] == "ndcg" else ("RMSE", best_rmse)
        print(f"    Grid search: {len(history)} tổ hợp → best val {label[0]} {label[1]:.4f}")
        print(f"    Tham số tốt nhất: {best_params}")
    return best_params, history

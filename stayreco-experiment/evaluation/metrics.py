"""Evaluation metrics cho recommender system.

Cơ sở: Herlocker et al. (2004), "Evaluating Collaborative Filtering
Recommender Systems"

File này chứa HAI nhóm hàm, dùng cho hai mục đích khác nhau:

1. ĐO SAI SỐ DỰ ĐOÁN — rmse(), mae()
   Chấm từng cặp (user, hotel) độc lập. Luôn hợp lệ.

2. ĐO XẾP HẠNG TRONG SỐ ITEM ĐÃ RATING — các hàm *_within_rated()
   ⚠️ KHÔNG dùng làm số chính trong báo cáo. Xem cảnh báo dưới đây.
   Metric xếp hạng dùng được nằm ở evaluation/ranking.py.

════════════════════════════════════════════════════════════════════════════
⚠️  CẢNH BÁO VỀ CÁC HÀM *_within_rated()
════════════════════════════════════════════════════════════════════════════
Chúng xếp hạng chỉ trong những item có mặt trong test set — tức item mà user
ĐÃ rating. Đó KHÔNG phải bài toán thật: production phải chọn K hotel trong
toàn bộ catalog, hầu hết là hotel khách chưa từng xem.

Hệ quả đo được trên MovieLens 100K (seed 42):

    Tỷ lệ rating >= 4 trong test          0.553   ← sàn tự nhiên
    Đoán bừa (random 1-5)   P@10 0.475    NDCG@10 0.838
    Đoán hằng số 3.5        P@10 0.468    NDCG@10 0.837
    SVD++                   P@10 0.520    NDCG@10 0.883
    StayReco (α tuned)      P@10 0.554    NDCG@10 0.893

Rổ ứng viên trung bình chỉ ~20 item (median 15), nên đoán bừa đã gần sát mô
hình tốt nhất. Toàn bộ 13 phương pháp dồn vào dải 0.88–0.89 trong khi dải động
thật chỉ là 0.838 → 1.000 → metric mất khả năng phân biệt. Thêm nữa, hotel mới
(chưa ai rating) không bao giờ có trong rổ, nên cold-start phía hotel không
được đo chút nào.

Cơ sở lý thuyết: Krichene & Rendle (KDD 2020), "On Sampled Metrics for Item
Recommendation" — metric trên tập ứng viên bị thu hẹp không nhất quán với
metric thật và có thể ĐẢO NGƯỢC kết luận "A tốt hơn B".

Giữ lại các hàm này để (a) tái lập được số của lần chạy trước, và (b) đưa vào
báo cáo như một ví dụ cho thấy cách đo sai làm số liệu lệch bao nhiêu.
"""

from collections import defaultdict

import numpy as np

RELEVANCE_THRESHOLD = 4.0


# ── 1. Sai số dự đoán rating ─────────────────────────────

def rmse(results):
    """Root Mean Squared Error.

    Args:
        results: list of (user, item, true_rating, pred_rating)
    """
    errors = [(true - pred) ** 2 for _, _, true, pred in results]
    return np.sqrt(np.mean(errors))


def mae(results):
    """Mean Absolute Error.

    Args:
        results: list of (user, item, true_rating, pred_rating)
    """
    errors = [abs(true - pred) for _, _, true, pred in results]
    return np.mean(errors)


def evaluate_rating(results):
    """Chỉ RMSE + MAE — hai metric luôn hợp lệ, không phụ thuộc rổ ứng viên."""
    return {"rmse": rmse(results), "mae": mae(results)}


def evaluate_rating_by_group(results, groups):
    """RMSE + MAE tách theo nhóm cold-start (warm / cool / cold / cold_item).

    Args:
        results: list of (user, item, true_rating, pred_rating)
        groups:  list tên nhóm, cùng thứ tự với results
    """
    by_group = defaultdict(list)
    for row, group in zip(results, groups):
        by_group[group].append(row)
    return {group: {"n_rows": len(rows), **evaluate_rating(rows)}
            for group, rows in by_group.items()}


# ── 2. Xếp hạng trong số item đã rating (⚠️ xem cảnh báo đầu file) ──

def precision_at_k_within_rated(results, k=10, threshold=RELEVANCE_THRESHOLD):
    """⚠️ Precision@K xếp hạng CHỈ trong item user đã rating. Xem cảnh báo đầu file.

    Mẫu số là min(k, số item của user) — user chỉ có 3 item test thì P@10 tối đa
    vẫn là 1.0, không bị chặn trần 0.3 như bản trước.
    """
    user_preds = defaultdict(list)
    for user, item, true, pred in results:
        user_preds[user].append((pred, true))

    precisions = []
    for preds in user_preds.values():
        preds.sort(key=lambda x: -x[0])
        top_k = preds[:k]
        relevant = sum(1 for _, true in top_k if true >= threshold)
        precisions.append(relevant / len(top_k))

    return float(np.mean(precisions)) if precisions else 0.0


def ndcg_at_k_within_rated(results, k=10):
    """⚠️ NDCG@K xếp hạng CHỈ trong item user đã rating. Xem cảnh báo đầu file.

    Gain tuyến tính theo số sao (không phải 2^rel − 1) và IDCG tính trên cùng
    tập item — chính vì vậy giá trị luôn rất cao (≈0.84 kể cả khi đoán bừa).
    """
    user_preds = defaultdict(list)
    for user, item, true, pred in results:
        user_preds[user].append((pred, true))

    ndcgs = []
    for preds in user_preds.values():
        if len(preds) < 2:
            continue
        preds.sort(key=lambda x: -x[0])
        dcg = sum(true / np.log2(i + 2) for i, (_, true) in enumerate(preds[:k]))
        ideal = sorted(preds, key=lambda x: -x[1])[:k]
        idcg = sum(true / np.log2(i + 2) for i, (_, true) in enumerate(ideal))
        if idcg > 0:
            ndcgs.append(dcg / idcg)

    return float(np.mean(ndcgs)) if ndcgs else 0.0


def coverage_at_k_within_rated(results, k=10):
    """⚠️ Coverage@K trong số item đã rating. Xem cảnh báo đầu file.

    Mẫu số là số item xuất hiện trong test, không phải toàn catalog → luôn cao
    hơn Coverage thật. Bản đúng ở evaluation/ranking.py.
    """
    user_preds = defaultdict(list)
    all_items = set()
    for user, item, true, pred in results:
        user_preds[user].append((pred, item))
        all_items.add(item)

    recommended = set()
    for preds in user_preds.values():
        preds.sort(key=lambda x: -x[0])
        recommended.update(item for _, item in preds[:k])

    return len(recommended) / len(all_items) if all_items else 0.0


def evaluate_within_rated(results, top_k_values=(5, 10, 20)):
    """⚠️ Bộ metric xếp hạng theo cách CŨ. Chỉ dùng để đối chiếu, xem cảnh báo đầu file."""
    metrics = evaluate_rating(results)
    for k in top_k_values:
        metrics[f"p@{k}_rated"] = precision_at_k_within_rated(results, k=k)
        metrics[f"ndcg@{k}_rated"] = ndcg_at_k_within_rated(results, k=k)
        metrics[f"cov@{k}_rated"] = coverage_at_k_within_rated(results, k=k)
    return metrics


def print_metrics(name, metrics):
    """In kết quả đẹp."""
    print(f"\n{'=' * 50}")
    print(f"  {name}")
    print(f"{'=' * 50}")
    for key, value in metrics.items():
        if isinstance(value, float):
            print(f"  {key:<16} {value:.4f}")
    print()

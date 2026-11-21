"""Kiểm tra công thức xếp hạng bằng ví dụ TÍNH TAY.

Vì sao cần: đây là các con số sẽ đi vào báo cáo. Một dấu trừ sai trong NDCG
không làm chương trình lỗi, nó chỉ làm kết luận sai. Mỗi test dưới đây có phần
tính tay viết ngay trong docstring để người đọc tự kiểm tra lại được.

    pytest tests/ -q
"""

import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from evaluation.ranking import (build_candidate_frame, cold_item_share,
                                rank_metrics)

LOG2 = np.log2


def make_frame(rows):
    """rows: list of (user_id, item_id, relevant, item_n)"""
    frame = pd.DataFrame(rows, columns=["user_id", "item_id", "relevant", "item_n"])
    frame["n"] = 10
    return frame


def test_perfect_ranking_gives_one():
    """Xếp hoàn hảo → P, R, NDCG đều đạt mức tối đa.

    1 user, 4 ứng viên, 2 cái liên quan, model đẩy đúng 2 cái đó lên đầu.
        P@2    = 2/2 = 1.0
        R@2    = 2/2 = 1.0
        NDCG@2 = 1.0   (DCG = IDCG)
    """
    frame = make_frame([(1, 10, True, 5), (1, 11, True, 5),
                        (1, 12, False, 5), (1, 13, False, 5)])
    pred = np.array([5.0, 4.9, 1.0, 1.0])
    m = rank_metrics(frame, pred, pd.Series({1: 2}), top_k=(2,))
    assert m["p@2"] == 1.0
    assert m["r@2"] == 1.0
    assert abs(m["ndcg@2"] - 1.0) < 1e-12


def test_worst_ranking_gives_zero():
    """Xếp ngược hoàn toàn → tất cả về 0."""
    frame = make_frame([(1, 10, True, 5), (1, 11, True, 5),
                        (1, 12, False, 5), (1, 13, False, 5)])
    pred = np.array([1.0, 1.1, 5.0, 4.9])
    m = rank_metrics(frame, pred, pd.Series({1: 2}), top_k=(2,))
    assert m["p@2"] == 0.0
    assert m["r@2"] == 0.0
    assert m["ndcg@2"] == 0.0


def test_ndcg_rewards_putting_hits_first():
    """NDCG phải phạt việc đặt item đúng xuống dưới.

    1 user, 3 ứng viên, CHỈ 1 cái liên quan. So hai trường hợp:
      (a) item đúng ở hạng 1 → DCG = 1/log2(2) = 1.0
      (b) item đúng ở hạng 3 → DCG = 1/log2(4) = 0.5
      IDCG (1 item liên quan) = 1/log2(2) = 1.0
      → NDCG@3 = 1.0  và  0.5
    P@3 của cả hai đều = 1/3 → chứng tỏ NDCG phân biệt được, Precision thì không.
    """
    frame = make_frame([(1, 10, True, 5), (1, 11, False, 5), (1, 12, False, 5)])
    rel_first = rank_metrics(frame, np.array([9.0, 2.0, 1.0]),
                             pd.Series({1: 1}), top_k=(3,))
    rel_last = rank_metrics(frame, np.array([1.0, 9.0, 2.0]),
                            pd.Series({1: 1}), top_k=(3,))
    assert abs(rel_first["ndcg@3"] - 1.0) < 1e-12
    assert abs(rel_last["ndcg@3"] - 0.5) < 1e-12
    assert abs(rel_first["p@3"] - rel_last["p@3"]) < 1e-12


def test_precision_recall_differ_when_more_relevant_than_k():
    """Khi số item liên quan > K thì Precision và Recall phải khác nhau.

    1 user, 5 ứng viên, 4 cái liên quan, top-2 bắt được 2 cái:
        P@2 = 2/2 = 1.0     (2 ô hiển thị đều đúng)
        R@2 = 2/4 = 0.5     (nhưng chỉ bắt được nửa số item user thích)
        IDCG@2 = 1/log2(2) + 1/log2(3) ; DCG@2 giống hệt → NDCG@2 = 1.0
    """
    frame = make_frame([(1, 10, True, 5), (1, 11, True, 5), (1, 12, True, 5),
                        (1, 13, True, 5), (1, 14, False, 5)])
    pred = np.array([5.0, 4.9, 1.0, 1.0, 1.0])
    m = rank_metrics(frame, pred, pd.Series({1: 4}), top_k=(2,))
    assert m["p@2"] == 1.0
    assert m["r@2"] == 0.5
    assert abs(m["ndcg@2"] - 1.0) < 1e-12


def test_metrics_average_over_users_not_rows():
    """Trung bình phải tính theo USER, không theo dòng.

    User 1 xếp hoàn hảo (P@1 = 1), user 2 xếp sai (P@1 = 0), nhưng user 2 có
    nhiều ứng viên hơn. Nếu trung bình theo dòng thì user 2 sẽ lấn át.
        P@1 đúng = (1 + 0) / 2 = 0.5
    """
    frame = make_frame([(1, 10, True, 5), (1, 11, False, 5),
                        (2, 10, True, 5), (2, 11, False, 5),
                        (2, 12, False, 5), (2, 13, False, 5)])
    pred = np.array([9.0, 1.0,
                     1.0, 9.0, 8.0, 7.0])
    m = rank_metrics(frame, pred, pd.Series({1: 1, 2: 1}), top_k=(1,))
    assert abs(m["p@1"] - 0.5) < 1e-12


def test_coverage_counts_distinct_items_shown():
    """Coverage@K = % catalog từng lọt top-K của ít nhất 1 user.

    2 user, catalog 4 item. Top-1 của user 1 là item 10, của user 2 là item 11
    → 2 item khác nhau được hiển thị / 4 item catalog = 0.5
    """
    frame = make_frame([(1, 10, True, 5), (1, 11, False, 5),
                        (2, 11, True, 5), (2, 10, False, 5)])
    pred = np.array([9.0, 1.0, 9.0, 1.0])
    m = rank_metrics(frame, pred, pd.Series({1: 1, 2: 1}), top_k=(1,), n_catalog=4)
    assert abs(m["cov@1"] - 0.5) < 1e-12


def test_tie_break_is_deterministic():
    """Mọi điểm bằng nhau → kết quả vẫn phải cố định, không phụ thuộc thứ tự dòng.

    Popularity trả về cùng một điểm cho mọi hotel chưa ai rating. Nếu không
    tie-break theo item_id thì mỗi lần chạy ra một số khác → không tái lập được.
    """
    rows = [(1, 10, True, 5), (1, 11, False, 5), (1, 12, False, 5)]
    pred = np.array([3.0, 3.0, 3.0])
    a = rank_metrics(make_frame(rows), pred, pd.Series({1: 1}), top_k=(1,))
    b = rank_metrics(make_frame(rows[::-1]), pred, pd.Series({1: 1}), top_k=(1,))
    assert a["p@1"] == b["p@1"]
    assert a["ndcg@1"] == b["ndcg@1"]


def test_cold_item_share():
    """newitem@K = tỷ lệ ô hiển thị dành cho hotel chưa ai rating (item_n == 0).

    1 user, top-2 gồm item 12 (item_n=0, hotel mới) và item 10 (item_n=5)
    → newitem@2 = 1/2 = 0.5
    """
    frame = make_frame([(1, 10, True, 5), (1, 11, False, 5), (1, 12, False, 0)])
    pred = np.array([8.0, 1.0, 9.0])
    m = cold_item_share(frame, pred, top_k=(2,))
    assert abs(m["newitem@2"] - 0.5) < 1e-12


# ── Dựng rổ ứng viên ─────────────────────────────────────

def test_candidate_frame_excludes_train_items():
    """Item user đã rating trong TRAIN phải bị loại khỏi rổ.

    Gợi ý lại khách sạn khách vừa ở xong không phải là gợi ý.
    """
    df_train = pd.DataFrame({"user_id": [1, 1], "item_id": [10, 11],
                             "rating": [5.0, 3.0]})
    df_eval = pd.DataFrame({"user_id": [1], "item_id": [12], "rating": [5.0]})
    frame, n_rel = build_candidate_frame(df_train, df_eval, catalog_items=[10, 11, 12, 13])

    assert set(frame["item_id"]) == {12, 13}       # 10, 11 đã thấy trong train
    assert n_rel[1] == 1
    assert frame.set_index("item_id").loc[12, "relevant"]
    assert not frame.set_index("item_id").loc[13, "relevant"]


def test_candidate_frame_keeps_new_items():
    """Hotel chưa ai rating PHẢI có trong rổ — đây là điểm cốt lõi của đề tài.

    Item 99 không xuất hiện trong train của bất kỳ ai (item_n = 0) nhưng vẫn
    phải được xếp hạng, nếu không thì cold-start phía hotel không đo được.
    """
    df_train = pd.DataFrame({"user_id": [1, 2], "item_id": [10, 10],
                             "rating": [5.0, 4.0]})
    df_eval = pd.DataFrame({"user_id": [1], "item_id": [11], "rating": [5.0]})
    frame, _ = build_candidate_frame(df_train, df_eval, catalog_items=[10, 11, 99])

    assert 99 in set(frame["item_id"])
    assert frame.set_index("item_id").loc[99, "item_n"] == 0


def test_candidate_frame_skips_users_without_relevant_items():
    """User không có item nào rating >= 4 thì không chấm được → bỏ qua.

    Giữ lại sẽ cho Recall = 0/0 và kéo trung bình xuống một cách vô nghĩa.
    """
    df_train = pd.DataFrame({"user_id": [1, 2], "item_id": [10, 10],
                             "rating": [5.0, 4.0]})
    df_eval = pd.DataFrame({"user_id": [1, 2], "item_id": [11, 11],
                            "rating": [5.0, 2.0]})   # user 2 chấm 2 sao
    frame, n_rel = build_candidate_frame(df_train, df_eval, catalog_items=[10, 11, 12])

    assert set(frame["user_id"]) == {1}
    assert list(n_rel.index) == [1]


def test_cold_item_share_new_item_relevance():
    """newprec / newrecall / newbase trên một rổ tính tay được.

    user a: top-2 theo điểm là h1 (mới, thích) và h2 (cũ); h3 (mới, thích) đứng 3.
    user b: top-2 là h4 (mới, KHÔNG thích) và h5 (cũ).
    Trong top-2: 2 ô hotel mới, 1 ô trúng → newprec@2 = 0.5.
    Cặp mới mà user thích: (a,h1), (a,h3) → newrecall@2 = 1/2.
    Rổ có 3 cặp mới, 2 cặp thích → newbase = 2/3.
    """
    import pandas as pd
    from evaluation.ranking import cold_item_share
    frame = pd.DataFrame({
        "user_id":  ["a", "a", "a", "b", "b"],
        "item_id":  ["h1", "h2", "h3", "h4", "h5"],
        "item_n":   [0, 7, 0, 0, 3],
        "relevant": [True, False, True, False, False],
    })
    pred = [0.9, 0.8, 0.1, 0.9, 0.5]
    out = cold_item_share(frame, pred, top_k=(2,))
    assert out["newitem@2"] == 0.5
    assert out["newprec@2"] == 0.5
    assert out["newrecall@2"] == 0.5
    assert abs(out["newbase"] - 2 / 3) < 1e-12


def test_cold_item_share_no_new_items_shown_gives_nan():
    import math
    import pandas as pd
    from evaluation.ranking import cold_item_share
    frame = pd.DataFrame({"user_id": ["a", "a"], "item_id": ["h1", "h2"],
                          "item_n": [5, 0], "relevant": [False, True]})
    out = cold_item_share(frame, [0.9, 0.1], top_k=(1,))
    assert out["newitem@1"] == 0.0
    assert math.isnan(out["newprec@1"])
    assert out["newrecall@1"] == 0.0


def test_fast_ndcg10_matches_rank_metrics():
    """Hàm NDCG nhanh dùng lúc tune phải ra ĐÚNG số của rank_metrics(),
    kể cả khi có điểm bằng nhau (tie-break theo item_id dạng chuỗi)."""
    import numpy as np
    import pandas as pd
    from evaluation.ranking import rank_metrics
    from utils import tuning
    rng = np.random.default_rng(0)
    users = np.repeat([f"u{j}" for j in range(40)], 30)
    items = np.tile([f"h{j:03d}" for j in rng.permutation(30)], 40)
    frame = pd.DataFrame({"user_id": users, "item_id": items,
                          "relevant": rng.random(len(users)) < 0.15})
    frame.loc[frame.groupby("user_id").head(1).index, "relevant"] = True
    n_rel = frame[frame.relevant].groupby("user_id").size()
    tuning.set_ndcg_target(frame, n_rel)
    try:
        for pred in (rng.random(len(frame)), np.round(rng.random(len(frame)), 1)):
            slow = rank_metrics(frame, pred, n_rel, (10,))["ndcg@10"]
            assert abs(tuning.fast_ndcg10(pred) - slow) < 1e-12
    finally:
        tuning.set_rmse_target()


def test_stayreco_blend_matches_row_by_row():
    """_blend (tính trên cặp (n, item_n) khác nhau) phải ra y hệt vòng lặp từng dòng."""
    from models import paper_baselines as pb
    from utils.alpha_scheduler import (compute_dynamic_alpha, compute_shrinkage_alpha,
                                       compute_two_stage_alpha)
    rng = np.random.default_rng(0)
    N = 3000
    scores = pd.DataFrame({
        "n": rng.integers(0, 40, N), "item_n": rng.choice([0, 0, 1, 3, 7, 50, 200], N),
        "svdpp": rng.uniform(1, 5, N), "content": rng.uniform(1, 5, N),
        "demo": rng.uniform(1, 5, N)})

    def row_by_row(fn):
        w = np.array([[v["alpha"], v["beta"], v["gamma"]]
                      for v in (fn(n, m) for n, m in zip(scores["n"], scores["item_n"]))])
        return np.clip(w[:, 0] * scores["svdpp"] + w[:, 1] * scores["content"]
                       + w[:, 2] * scores["demo"], 1.0, 5.0).to_numpy()

    cases = [
        (pb.stayreco(scores, alpha_max=0.8, n_threshold=20, gamma_base=0.1, alpha_min=0.1),
         lambda n, m: compute_dynamic_alpha(n, alpha_max=0.8, n_threshold=20,
                                            gamma_base=0.1, alpha_min=0.1, item_n=m)),
        (pb.stayreco_shrinkage(scores, k_user=20, k_item=50, gamma_base=0.2),
         lambda n, m: compute_shrinkage_alpha(n, item_n=m, k_user=20, k_item=50,
                                              gamma_base=0.2)),
    ]
    for combine in ("product", "user", "mean"):
        cases.append((
            pb.stayreco_two_stage(scores, k_user=40, k_item=20, k_c=3,
                                  zero_gamma_cold_item=True, combine=combine),
            lambda n, m, c=combine: compute_two_stage_alpha(
                n, item_n=m, k_user=40, k_item=20, k_c=3,
                zero_gamma_cold_item=True, combine=c)))
    for got, fn in cases:
        np.testing.assert_allclose(np.asarray(got), row_by_row(fn), rtol=0, atol=1e-12)


def test_fast_ndcg10_ragged_users_and_heavy_ties():
    """Rổ lệch (user có 3..60 ứng viên, thứ tự dòng xáo trộn) và điểm hoà dày đặc
    (điểm nguyên 1..5, như sau khi clip) — vẫn phải khớp rank_metrics()."""
    from evaluation.ranking import rank_metrics
    from utils import tuning
    rng = np.random.default_rng(1)
    rows = []
    for j in range(60):
        k = int(rng.integers(3, 61))
        for h in rng.choice(200, k, replace=False):
            rows.append((f"u{j:02d}", f"h{h}", rng.random() < 0.2))
    frame = pd.DataFrame(rows, columns=["user_id", "item_id", "relevant"])
    frame.loc[frame.groupby("user_id").head(1).index, "relevant"] = True
    frame = frame.sample(frac=1.0, random_state=3).reset_index(drop=True)
    n_rel = frame[frame.relevant].groupby("user_id").size()
    tuning.set_ndcg_target(frame, n_rel)
    try:
        for pred in (rng.integers(1, 6, len(frame)).astype(float),
                     np.full(len(frame), 5.0), rng.random(len(frame))):
            slow = rank_metrics(frame, pred, n_rel, (10,))["ndcg@10"]
            assert abs(tuning.fast_ndcg10(pred) - slow) < 1e-12
    finally:
        tuning.set_rmse_target()

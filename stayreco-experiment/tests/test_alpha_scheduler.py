"""Kiểm tra công thức α động — đóng góp chính của đề tài.

Nếu α + β + γ ≠ 1 ở một giá trị n nào đó thì mọi điểm hybrid tại đó bị lệch
thang, RMSE sai, mà chương trình vẫn chạy bình thường không báo lỗi gì.

    pytest tests/ -q
"""

import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.alpha_scheduler import compute_dynamic_alpha, compute_fixed_alpha

ALL_N = [0, 1, 2, 3, 5, 8, 10, 15, 20, 29, 30, 31, 50, 100, 1000]


@pytest.mark.parametrize("n", ALL_N)
@pytest.mark.parametrize("has_prefs", [False, True])
@pytest.mark.parametrize("item_n", [None, 0, 1, 50])
def test_weights_sum_to_one(n, has_prefs, item_n):
    """α + β + γ = 1 với MỌI tổ hợp đầu vào, kể cả các ca biên."""
    w = compute_dynamic_alpha(n, has_preferences=has_prefs, item_n=item_n)
    total = w["alpha"] + w["beta"] + w["gamma"]
    assert abs(total - 1.0) < 1e-12, f"n={n} prefs={has_prefs} item_n={item_n} → tổng {total}"


@pytest.mark.parametrize("n", ALL_N)
def test_weights_never_negative(n):
    """Trọng số âm = trừ điểm một thành phần, vô nghĩa về mặt mô hình."""
    w = compute_dynamic_alpha(n)
    assert min(w.values()) >= 0.0, f"n={n} → {w}"


@pytest.mark.parametrize("alpha_min", [0.0, 0.1, 0.3])
def test_extreme_params_still_valid(alpha_min):
    """Các tổ hợp trong STAYRECO_GRID cũng phải thỏa tổng = 1.

    Grid search thử ~240 tổ hợp; nếu một tổ hợp nào cho trọng số không hợp lệ
    thì nó vẫn được chấm điểm và có thể bị chọn là "tốt nhất".
    """
    for alpha_max in [0.5, 0.7, 0.9]:
        for n_threshold in [10, 30, 50]:
            for gamma_base in [0.10, 0.20]:
                for n in ALL_N:
                    w = compute_dynamic_alpha(
                        n, alpha_max=alpha_max, n_threshold=n_threshold,
                        gamma_base=gamma_base, alpha_min=alpha_min)
                    total = sum(w.values())
                    assert abs(total - 1.0) < 1e-12
                    assert min(w.values()) >= 0.0


def test_new_hotel_uses_content_only():
    """Hotel mới (item_n=0): CF và Demographic chưa có dữ liệu gì về nó → β=1.

    Đây là cơ chế giải cold-start PHÍA HOTEL của StayReco.
    """
    w = compute_dynamic_alpha(100, item_n=0)
    assert w["beta"] == 1.0
    assert w["alpha"] == 0.0 and w["gamma"] == 0.0


def test_alpha_increases_with_n():
    """α phải tăng đơn điệu theo n — càng biết nhiều về khách càng tin CF."""
    alphas = [compute_dynamic_alpha(n)["alpha"] for n in ALL_N]
    assert alphas == sorted(alphas), alphas


def test_alpha_saturates_at_alpha_max():
    """α không được vượt α_max, kể cả khi n rất lớn.

    Lưu ý: hàm normalize lại cho tổng = 1 nên α cuối cùng có thể LỚN HƠN
    α_max khi γ đã về 0 và β bị cắt. Test này ghim lại hành vi thực tế để
    nếu ai sửa công thức thì phải sửa cả báo cáo.
    """
    saturated = compute_dynamic_alpha(10_000, alpha_max=0.7, n_threshold=30)
    assert saturated["alpha"] == compute_dynamic_alpha(30, alpha_max=0.7,
                                                      n_threshold=30)["alpha"]
    assert saturated["gamma"] == 0.0


def test_gamma_decreases_with_n():
    """γ (Demographic) phải giảm dần — fallback nhường chỗ khi đã có dữ liệu thật."""
    gammas = [compute_dynamic_alpha(n)["gamma"] for n in ALL_N]
    assert gammas == sorted(gammas, reverse=True), gammas


def test_preferences_shift_weight_to_content():
    """User khai sở thích nhưng chưa tương tác → Content, không phải Demographic."""
    with_prefs = compute_dynamic_alpha(0, has_preferences=True)
    without = compute_dynamic_alpha(0, has_preferences=False)
    assert with_prefs["beta"] > without["beta"]
    assert with_prefs["gamma"] == 0.0


@pytest.mark.parametrize("alpha", [0.0, 0.3, 0.5, 0.7, 1.0])
def test_fixed_alpha_sums_to_one(alpha):
    """Baseline α cố định cũng phải thỏa tổng = 1, nếu không thì so sánh không công bằng."""
    w = compute_fixed_alpha(alpha)
    assert abs(sum(w.values()) - 1.0) < 1e-12
    assert w["alpha"] == alpha

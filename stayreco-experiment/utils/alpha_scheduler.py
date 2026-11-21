"""α Dynamic Scheduler — đóng góp chính của StayReco.

Cơ sở: Kết hợp weighted + switching hybrid (Burke, 2002)
α trượt liên tục theo n thay vì switch cứng.

Công thức:
    score = α(n)·CF + β(n)·Content + γ(n)·Demographic

    n = số tương tác của user
    n=0, không có sở thích  → γ cao, dựa Demographic + Content
    n=0, có sở thích        → β=1, Content 100%
    n tăng                  → α tăng tuyến tính tới α_max tại n_threshold
    hotel mới (item_n=0)    → β=1, chỉ Content biết gì về hotel này
"""


def compute_dynamic_alpha(n, alpha_max=0.7, n_threshold=30, gamma_base=0.15,
                          has_preferences=False, item_n=None, alpha_min=0.0):
    """Tính trọng số (α, β, γ) theo số tương tác n.

    Args:
        n: số tương tác của user
        alpha_max: α tối đa khi n lớn (default 0.7)
        n_threshold: n tại đó α đạt alpha_max (default 30)
        gamma_base: trọng số cơ bản cho Demographic
        has_preferences: user đã khai sở thích chưa
        item_n: số tương tác của hotel (None = không xét phía hotel)
        alpha_min: α tối thiểu, kể cả khi n=0. Với user mới, CF vẫn còn biết
            "hotel nào nói chung được chấm cao" (qua b_i), nên bỏ hẳn CF (α=0)
            là lãng phí. Giá trị này được chọn bằng grid search trên validation.

    Returns:
        dict: {"alpha": float, "beta": float, "gamma": float}
              sao cho alpha + beta + gamma = 1.0
    """
    if item_n == 0:
        # Hotel mới → CF và Demographic chưa có rating nào của hotel → chỉ tin Content
        return {"alpha": 0.0, "beta": 1.0, "gamma": 0.0}

    if n == 0 and not has_preferences:
        # User trắng hoàn toàn → Demographic + Content (chia phần còn lại 40/60)
        rest = 1.0 - alpha_min
        return {"alpha": alpha_min, "beta": 0.4 * rest, "gamma": 0.6 * rest}

    if n == 0 and has_preferences:
        # Có sở thích nhưng chưa tương tác → Content
        return {"alpha": alpha_min, "beta": 1.0 - alpha_min, "gamma": 0.0}

    # n > 0: α tăng dần theo n
    alpha = max(alpha_min, min(alpha_max, (n / n_threshold) * alpha_max))

    # γ giảm dần khi n tăng
    gamma = max(0.0, gamma_base * (1 - n / n_threshold))

    # β = phần còn lại
    beta = max(0.0, 1.0 - alpha - gamma)

    # Normalize để tổng = 1
    total = alpha + beta + gamma
    return {
        "alpha": alpha / total,
        "beta": beta / total,
        "gamma": gamma / total,
    }


def compute_fixed_alpha(alpha_value):
    """Trả về trọng số cố định (baseline để so sánh).

    Args:
        alpha_value: giá trị α cố định (0.0 → 1.0)

    Returns:
        dict: {"alpha": float, "beta": float, "gamma": float}
    """
    beta = (1.0 - alpha_value) * 0.7   # 70% phần còn lại cho Content
    gamma = (1.0 - alpha_value) * 0.3   # 30% cho Demographic
    return {"alpha": alpha_value, "beta": beta, "gamma": gamma}


# ── Test nhanh ───────────────────────────────────────────
if __name__ == "__main__":
    print("=== α Dynamic Schedule ===")
    print(f"{'n':>5} | {'α':>6} | {'β':>6} | {'γ':>6}")
    print("-" * 35)
    print(f"{'0*':>5} | " + " | ".join(f"{v:>6.3f}" for v in compute_dynamic_alpha(0, has_preferences=True).values())
          + "   (* đã khai sở thích)")
    for n in [0, 1, 3, 5, 10, 15, 20, 30, 50]:
        w = compute_dynamic_alpha(n)
        print(f"{n:>5} | {w['alpha']:>6.3f} | {w['beta']:>6.3f} | {w['gamma']:>6.3f}")


# ── Biến thể shrinkage: α = n/(n+k) ──────────────────────
# Cơ sở: ước lượng dựa trên ít dữ liệu thì kém tin cậy, nên co về giá trị
# mặc định. Koren (2008), công thức (2), dùng đúng dạng n/(n+λ) để hạ trọng số
# các cặp item có ít người cùng rating (λ ≈ 100). models/demographic.py cũng
# đã dùng dạng này cho điểm trung bình của item (shrinkage=5).
#
# Khác với bản tuyến tính ở ba điểm:
#   1. dốc mạnh lúc đầu rồi thoai thoải — tương tác đầu tiên đáng giá hơn
#   2. không đứng khựng tại n_threshold, tăng mãi theo n
#   3. phía hotel trượt mượt thay vì nhảy bậc ở item_n == 0

def compute_shrinkage_alpha(n, item_n=None, k_user=10.0, k_item=20.0,
                            gamma_base=0.15, has_preferences=False):
    """Tính (α, β, γ) theo shrinkage hai phía.

    Args:
        n: số tương tác của user
        item_n: số rating của hotel (None = không xét phía hotel)
        k_user: Content đáng giá ngang bao nhiêu lần tương tác của user
        k_item: cần bao nhiêu rating thì mới tin CF về hotel đó
        gamma_base: trọng số Demographic khi chưa biết gì về user
        has_preferences: user đã khai sở thích → bỏ Demographic, dồn cho Content

    Returns:
        dict {"alpha", "beta", "gamma"} với tổng bằng 1.
    """
    trust_user = n / (n + k_user)
    trust_item = 1.0 if item_n is None else item_n / (item_n + k_item)
    cf_trust = trust_user * trust_item          # CF phải hiểu CẢ user lẫn hotel

    # Demographic chỉ có ích khi chưa biết gì về user, và tắt dần theo đúng nhịp
    gamma = 0.0 if has_preferences else gamma_base * (1.0 - trust_user)

    alpha = cf_trust * (1.0 - gamma)
    beta = 1.0 - alpha - gamma
    return {"alpha": alpha, "beta": beta, "gamma": gamma}


# ── Biến thể 2 tầng (cấu trúc Ngô Minh Tân) + hệ số phía hotel ──
# Tầng 1: α tách CF khỏi phần còn lại, cần CẢ hai phía có dữ liệu.
# Tầng 2: π chia phần còn lại giữa Content và Demographic, cùng dạng n/(n+k).
# Khác bản shrinkage trước ở chỗ γ không còn trần cố định, mà trượt theo
# chính n — nhất quán một dạng hàm cho cả hai tầng.

def compute_two_stage_alpha(n, item_n=None, k_user=10.0, k_item=20.0, k_c=3.0,
                            has_preferences=False, zero_gamma_cold_item=False,
                            combine="product"):
    """Tính (α, β, γ) theo sơ đồ hai tầng.

    Args:
        n: số tương tác của user
        item_n: số rating của hotel (None = không xét phía hotel)
        k_user: mốc hòa phía user — CF đáng tin ngang phần còn lại
        k_item: mốc hòa phía hotel
        k_c: mốc hòa giữa Content và Demographic
        has_preferences: user đã khai sở thích → bỏ hẳn Demographic
        zero_gamma_cold_item: hotel chưa ai rating → ép γ=0, dồn cho Content.
            Demographic ở đó chỉ trả về trung bình chung, không phân biệt được
            hotel nào với hotel nào, nên chỉ làm loãng tín hiệu Content.
        combine: cách gộp hai hệ số tin cậy thành α — dùng cho ABLATION:
            "product" (đề xuất): α = t_user × t_item → thiếu dữ liệu ở BẤT KỲ
                phía nào thì α = 0.
            "user": α = t_user, bỏ phía hotel (dạng Melville 2002, Do & Le 2020)
                → khách quen vẫn dồn trọng số CF lên hotel chưa ai rating.
            "mean": α = (t_user + t_item)/2 → hotel mới vẫn nhận α = t_user/2.
    """
    trust_user = n / (n + k_user)
    trust_item = 1.0 if item_n is None else item_n / (item_n + k_item)

    if combine == "product":
        alpha = trust_user * trust_item      # CF phải hiểu cả hai phía
    elif combine == "user":
        alpha = trust_user
    elif combine == "mean":
        alpha = 0.5 * (trust_user + trust_item)
    else:
        raise ValueError("combine phai la product / user / mean: %r" % combine)
    rest = 1.0 - alpha

    if has_preferences or (zero_gamma_cold_item and item_n == 0):
        pi = 1.0
    else:
        pi = n / (n + k_c)

    return {"alpha": alpha, "beta": rest * pi, "gamma": rest * (1.0 - pi)}

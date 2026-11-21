"""Cấu hình cho thí nghiệm StayReco.

⚠️ NGUYÊN TẮC: file này phải khớp với lần chạy dùng cho báo cáo. Giá trị thật sự
đã dùng của MỖI lần chạy được ghi vào results/run_meta_<tag>.json (kể cả khi bị
CLI ghi đè), nên khi viết báo cáo thì đọc file json đó, không đọc file này.

Tham số nào CHỌN BẰNG GRID SEARCH thì không nằm ở đây — chúng được tune trên
validation và ghi vào results/chosen_params_<tag>.csv. Các hằng số α dưới đây chỉ
dùng cho biến thể "★ StayReco (α thủ công)" để so với bản đã tune.
"""

# ── Dataset ──────────────────────────────────────────────
# Hiện tại run_experiment.py gọi trực tiếp load_movielens_full().
# Dataset hotel (HotelRec / Expedia) chưa nối — data/loader.py đã có sẵn
# load_csv() / load_hotel_features() / load_user_demographics() để nối sau.
DATASET = "movielens-100k"
TEST_RATIO = 0.2
VAL_RATIO = 0.5          # nửa phần đã giấu dùng để CHỌN THAM SỐ, nửa còn lại để chấm điểm
RANDOM_SEED = 42

# ── SVD++ Hyperparameters ────────────────────────────────
SVDPP_FACTORS = 50       # số chiều ẩn (k)
SVDPP_EPOCHS = 30        # số vòng lặp
SVDPP_LR = 0.005         # learning rate
SVDPP_REG = 0.02         # regularization λ

# ── Cold-start simulation ────────────────────────────────
COLD_USER_RATIO = 0.3    # % user bị cắt lịch sử để giả lập user mới
MAX_COLD_N = 19          # user giả lập giữ ngẫu nhiên 0 → 19 rating
COLD_ITEM_RATIO = 0.20   # % hotel bị giấu toàn bộ rating (hotel mới).
                         # 0.20 theo Schein et al. (2002); ghi đè bằng --cold-item=
WARM_MIN_N = 20          # warm: n ≥ 20
COLD_MAX_N = 5           # cold: n < 5 ; cool: 5 ≤ n < 20

# ── Content-Based ────────────────────────────────────────
# Thực nghiệm dùng TF-IDF (số chiều do từ vựng quyết định, không đặt trước).
# Production dùng embedding 768 chiều (multilingual-e5-base) + pgvector.
CONTENT_K = 30           # số hotel giống nhất dùng để dự đoán

# ── Demographic ──────────────────────────────────────────
# Hotel: ("age_group", "country", "trip_type") ; MovieLens không có → dùng tuổi, giới tính, nghề
DEMO_COLS = ("age_group", "gender", "occupation")
DEMO_SHRINKAGE = 5       # nhóm càng ít rating càng bị kéo về trung bình hotel

# ── α Dynamic Schedule (biến thể "α thủ công") ──────────
# α(n) = min(α_max, n/n_threshold · α_max) ; γ(n) = γ_base·(1 − n/n_threshold)
#
# ⚠️ Đây là các con số CHỌN BẰNG TAY, dùng cho biến thể "★ StayReco (α thủ công)".
# Biến thể "★ StayReco (α tuned)" chọn bằng grid search trên validation và cho ra
# giá trị KHÁC (xem results/chosen_params_<tag>.csv). Báo cáo phải nói rõ hai
# biến thể là hai dòng khác nhau trong bảng kết quả.
#
# ⚠️ Công thức tuyến tính không khớp bảng mô tả trong CLAUDE.md: với α_max=0.7,
# n_threshold=30 thì n=10 cho α≈0.23 (không phải 0.5). Cần thống nhất lại bảng
# đó trong báo cáo, hoặc đổi sang dạng α(n) = n/(n+k).
ALPHA_MAX = 0.7
N_THRESHOLD = 30         # n tại đó α đạt α_max
GAMMA_BASE = 0.15        # trọng số demographic cơ bản

# ── LightGCN (tầng 2 của SL-ARec 2026) ──────────────────
GCN_FACTORS = 32         # chiều embedding
GCN_LAYERS = 3           # số lớp lan truyền trên đồ thị
GCN_EPOCHS = 300
GCN_LR = 0.01

# ── Baselines để so sánh ─────────────────────────────────
FIXED_ALPHAS = [0.0, 0.3, 0.5, 0.7, 1.0]

# ── Evaluation ───────────────────────────────────────────
TOP_K = [5, 10, 20]      # Precision@K, NDCG@K

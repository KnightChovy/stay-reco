# StayReco Recommender — Project Context

Capstone FA26SE056 (FPT University HCMC). StayReco là nền tảng đặt phòng khách sạn mới →
cold-start **hai phía** (user mới chưa có lịch sử, hotel mới chưa ai đặt).
Repo này là **thực nghiệm Python** chứng minh α động tốt hơn α cố định.

## Công thức chính (cascade + weighted-switching hybrid, Burke 2002)
```
Knowledge pre-filter (còn phòng, trong budget, hotel approved)  ← luật cứng, lọc TRƯỚC
  → score = α(n)·CF + β(n)·Content + γ(n)·Demo → sort → Top-K
```
- **CF** = SVD++ (Koren 2008), `surprise.SVDpp`, k=50, epochs=30, lr=0.005, reg=0.02.
  `r̂ = μ + b_u + b_i + q_iᵀ(p_u + |N(u)|^-½ Σ y_j)` — y_j là implicit feedback (view/click/booking).
  Chọn SVD++ thay SVD (có implicit) và thay TrustSVD (StayReco không có social graph).
- **Content** = embedding + cosine (production: pgvector; thực nghiệm: TF-IDF + cosine sklearn).
  User vector = trung bình có trọng số các hotel đã thích. Scale: `rating = 1 + sim*4`.
  Giải cold-start hotel (có vector ngay khi nhập mô tả) và user có khai sở thích.
- **Demographic** = avg rating của nhóm (age_group, country, trip_type) cho hotel (Pazzani 1999).
  Fallback cuối, accuracy thấp nhất nhưng luôn khả dụng.
- **Knowledge** = pre-filter business rules (Burke 2000, Felfernig 2006), không phải fallback.

## α động theo n (đóng góp chính) — `utils/alpha_scheduler.py`
| Trạng thái | n | α | β | γ |
|---|---|---|---|---|
| Trắng hoàn toàn | 0 | 0 | 0.4 | 0.6 |
| Có sở thích, chưa tương tác | 0 | 0 | 1.0 | 0 |
| Đã xem ~10 KS | 10 | 0.5 | ~0.4 | ~0.1 |
| Khách quen | ≥30 | 0.7+ | ~0.25 | ~0.05 |

Công thức: `alpha = min(alpha_max, n/n_threshold*alpha_max)`, `gamma = gamma_base*(1-n/n_threshold)`,
`beta = 1-alpha-gamma`; alpha_max=0.7, n_threshold=30, gamma_base=0.15.
⚠️ Công thức tuyến tính cho n=10 → α≈0.23 (không phải 0.5 như bảng); n=30 → γ=0, β=0.3. Cần thống nhất.

## Thí nghiệm
Baselines: CF only (1,0,0) · Content only (0,1,0) · Demo only (0,0,1) · Hybrid fixed α=0.3/0.5/0.7
(β:γ = 70:30 phần còn lại) · **StayReco α dynamic**.
Metrics: RMSE, MAE, Precision@K, NDCG@K (K=5,10,20).
Cold-start split: warm (n≥20), cool (5≤n<20), cold (n<5), cold items (chưa ai rating → chỉ Content).
Dataset: MovieLens 100K (test nhanh), TripAdvisor/Expedia (domain hotel).

## Tech stack
Thực nghiệm: scikit-surprise, scikit-learn, pandas, numpy, matplotlib, seaborn.
Production: Spring Boot + PostgreSQL/pgvector + custom SVD++ (Java), REST API.

## Bài báo liên quan (để so sánh trong báo cáo)
- Burke 2002 (7 chiến lược hybrid) · Koren 2008 (SVD++) · Koren, Bell & Volinsky 2009 (MF)
- Lops 2011 (Content) · Pazzani 1999 (Demo) · Burke 2000 / Felfernig 2006 (Knowledge)
- Schein 2002 (cold-start metrics) · Herlocker 2004 (evaluation)
- SL-ARec 2026: SVD++ + LightGCN + safety layer, α learned nhưng binary switch, domain phim
- Do & Le 2020: SVD + CBF, α theo performance, chỉ 2 thành phần
- OHWSF 2022: trộn SVD/SVD++ (σ₁ grid search), chỉ trong CF, không giải cold-start
- Tarek 2023: **gần nhất về domain** — Item-Item CF + Content + Knowledge (fallback), α cố định, không Demo
- Wang 2016 (CS229), Bayrak 2020: hotel CF+Content cơ bản
- Tran 2026: DNN embedding cho hotel, không cold-start → hướng upgrade tương lai

Đóng góp StayReco: đủ 4 paradigm trong 1 công thức cho hotel; α trượt liên tục, cross-paradigm,
interpretable; Knowledge là pre-filter (cascade); giải cold-start hai phía.

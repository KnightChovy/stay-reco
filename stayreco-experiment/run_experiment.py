"""
StayReco Experiment Runner
==========================

So sánh StayReco với 2 loại baseline:

  A. Baseline trọng số (cùng 3 model thành phần, chỉ khác cách trộn):
     CF only · Content only · Demographic only · Hybrid α=0.3/0.5/0.7 cố định · StayReco α động

  B. Phương pháp của 4 bài báo (dựng lại trong CÙNG khung thực nghiệm):
     Tarek 2023 · Do & Le 2020 · OHWSF 2022 · SL-ARec 2026 · StayReco (α tune trên validation)

Dữ liệu chia 3 phần: train (học model) → validation (chọn tham số) → test (chấm điểm).

Cách chạy:
    conda activate stayreco
    python run_experiment.py            # 1 seed
    python run_experiment.py 42 1 2     # nhiều seed, lấy trung bình ± độ lệch chuẩn

Output trong results/:
    comparison.csv           — metrics tổng thể trên tập test
    comparison_by_group.csv  — metrics theo nhóm cold-start
    chosen_params.csv        — tham số grid search đã chọn (để ghi vào báo cáo)
    comparison.png           — biểu đồ theo nhóm
    sensitivity_alpha.png    — RMSE thay đổi thế nào theo α_max (trả lời "vì sao 0.7?")
"""

import sys
import os
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))

from config import *
from data.loader import load_movielens_full, load_tripadvisor
from data.preprocessor import (simulate_cold_start, split_validation, assign_groups,
                               to_surprise_trainset)
from models.cf_svdpp import CollaborativeFilter, PlainSVD
from models.cf_itemknn import ItemItemCF
from models.content_based import ContentBasedFilter
from models.demographic import DemographicFilter
from models.popularity import PopularityBaseline
from models.lightgcn import LightGCN
from models import paper_baselines as papers
from utils.alpha_scheduler import compute_fixed_alpha
from utils import manifest
from utils import tuning
from evaluation.metrics import evaluate_rating, evaluate_rating_by_group
from evaluation.ranking import (RELEVANCE_THRESHOLD, build_candidate_frame,
                                cold_item_share, rank_metrics, rank_metrics_by_group)

GROUP_ORDER = ["cold_item", "cold", "cool", "warm"]
# Nhóm cho metric xếp hạng: gán theo USER nên không có cold_item (xem evaluation/ranking.py)
RANK_GROUP_ORDER = ["cold (rank)", "cool (rank)", "warm (rank)"]
GROUP_LABELS = {
    "cold_item": "Cold item (hotel mới)",
    "cold": f"Cold user (n<{COLD_MAX_N})",
    "cool": f"Cool user ({COLD_MAX_N}≤n<{WARM_MIN_N})",
    "warm": f"Warm user (n≥{WARM_MIN_N})",
}
STAYRECO_TUNED = "★ StayReco (α tuned)"
STAYRECO_MANUAL = "★ StayReco (α thủ công)"
SUFFIX = ""        # hậu tố file kết quả, đặt qua --tag=...
DATASET = "movielens"   # đặt qua --dataset=movielens|tripadvisor
MAX_EVAL_USERS = 0      # 0 = chấm mọi user; >0 = lấy mẫu, đặt qua --max-eval-users=
TUNE_METRIC = "rmse"    # tiêu chí grid search: rmse | ndcg, đặt qua --tune-metric=
DATA_DIR = ""      # thư mục TripAdvisor; rỗng = mặc định. Đặt qua --data-dir=


def weight_methods():
    """Nhóm A: 7 cách trộn cùng 3 model thành phần."""
    def blend(a, b, g):
        return lambda s: np.clip(a * s["svdpp"] + b * s["content"] + g * s["demo"], 1, 5)

    methods = {
        # Mốc tham chiếu thấp nhất: mọi phương pháp phải thắng được cái này.
        # Dacrema et al. (2019) cho thấy popularity đánh bại rất nhiều mô hình
        # phức tạp khi các mô hình đó không được tune tử tế.
        "Popularity": lambda s: np.clip(s["popular"], 1, 5),
        "CF Only (SVD++)": blend(1, 0, 0),
        "Content Only": blend(0, 1, 0),
        "Demographic Only": blend(0, 0, 1),
    }
    for a in FIXED_ALPHAS:
        if 0.0 < a < 1.0:
            w = compute_fixed_alpha(a)
            methods[f"Hybrid α={a} (fixed)"] = blend(w["alpha"], w["beta"], w["gamma"])
    methods[STAYRECO_MANUAL] = lambda s: papers.stayreco(
        s, alpha_max=ALPHA_MAX, n_threshold=N_THRESHOLD, gamma_base=GAMMA_BASE, alpha_min=0.0)
    return methods


def run_one_seed(seed):
    """Chạy trọn 1 lần thí nghiệm với 1 seed. Trả về (overall_df, by_group_df, chosen, history)."""
    print("\n" + "=" * 70)
    print(f"  SEED {seed}")
    print("=" * 70)

    # ── 1. Dữ liệu ───────────────────────────────────────
    print("\n[1/6] Loading dataset...")
    if DATASET == "tripadvisor":
        ratings_df, items_df, users_df = (load_tripadvisor(DATA_DIR) if DATA_DIR
                                          else load_tripadvisor())
    else:
        ratings_df, items_df, users_df = load_movielens_full()

    print("\n[2/6] Splitting data...")
    df_train, df_held = simulate_cold_start(
        ratings_df, test_ratio=TEST_RATIO, cold_user_ratio=COLD_USER_RATIO,
        max_cold_n=MAX_COLD_N, cold_item_ratio=COLD_ITEM_RATIO, seed=seed)
    df_held = assign_groups(df_held, df_train, warm_min=WARM_MIN_N, cold_max=COLD_MAX_N)
    df_held = split_validation(df_held, val_ratio=VAL_RATIO, seed=seed)
    print("  Rows theo nhóm:", df_held["group"].value_counts().reindex(GROUP_ORDER).to_dict())

    # ── 2. Train các model thành phần ────────────────────
    print("\n[3/6] Training models...")
    trainset = to_surprise_trainset(df_train)
    components = {}

    svdpp = CollaborativeFilter(SVDPP_FACTORS, SVDPP_EPOCHS, SVDPP_LR, SVDPP_REG, seed=seed)
    svdpp.fit(trainset)
    components["svdpp"] = svdpp

    svd = PlainSVD(SVDPP_FACTORS, SVDPP_EPOCHS, SVDPP_LR, SVDPP_REG, seed=seed)
    svd.fit(trainset)
    components["svd"] = svd

    itemknn = ItemItemCF(k_neighbors=CONTENT_K)
    itemknn.fit(df_train)
    components["itemknn"] = itemknn

    lightgcn = LightGCN(n_factors=GCN_FACTORS, n_layers=GCN_LAYERS,
                        n_epochs=GCN_EPOCHS, lr=GCN_LR, seed=seed)
    lightgcn.fit(df_train)
    components["lightgcn"] = lightgcn

    content = ContentBasedFilter(k_neighbors=CONTENT_K)
    content.fit(items_df, df_train)
    components["content"] = content

    demo_cols = ("region", "trip_type") if DATASET == "tripadvisor" else DEMO_COLS
    demo = DemographicFilter(group_cols=demo_cols, shrinkage=DEMO_SHRINKAGE)
    demo.fit(df_train, users_df)
    components["demo"] = demo

    popular = PopularityBaseline(shrinkage=DEMO_SHRINKAGE)
    popular.fit(df_train)
    components["popular"] = popular

    # ── 3. Hỏi mọi model 1 lần cho mọi dòng val+test ─────
    print("\n[4/6] Scoring cac cap val+test...")
    scores = df_held.copy()
    for name, model in components.items():
        scores[name] = [model.predict(u, i)
                        for u, i in zip(scores["user_id"], scores["item_id"])]

    val_scores = scores[scores["split"] == "val"]
    test_scores = scores[scores["split"] == "test"]

    # Lưu lại bảng điểm để xem bằng mắt: mỗi dòng là 1 câu hỏi, mỗi cột là ý kiến 1 model
    os.makedirs("results", exist_ok=True)
    cols = ["user_id", "item_id", "rating", "n", "item_n", "group",
            "svdpp", "svd", "itemknn", "lightgcn", "content", "demo", "popular"]
    test_scores[cols].round(3).to_csv(f"results/score_table_seed{seed}{SUFFIX}.csv", index=False)
    # Bản rút gọn: 50 dòng mỗi nhóm, để mở bằng Excel xem cho dễ
    (test_scores[cols].groupby("group", group_keys=False)
     .apply(lambda g: g.head(50)).round(3)
     .to_csv(f"results/score_table_sample_seed{seed}{SUFFIX}.csv", index=False))

    # ── 4. Tune các phương pháp trên validation ──────────
    if TUNE_METRIC == "ndcg":
        # Rổ ứng viên của VALIDATION: chỉ loại cặp đã có trong train. Test vẫn
        # nằm trong rổ như mọi hotel chưa biết — lúc tune ta không được biết test.
        print("\n  Tune theo NDCG@10: dựng rổ ứng viên validation...")
        val_frame, val_n_rel = build_candidate_frame(
            df_train, val_scores, items_df["item_id"].to_numpy(),
            df_exclude=df_train[["user_id", "item_id"]],
            max_users=MAX_EVAL_USERS, seed=seed + 10_000)
        for name, model in components.items():
            val_frame[name] = model.predict_many(val_frame["user_id"].to_numpy(),
                                                 val_frame["item_id"].to_numpy())
        tuning.set_ndcg_target(val_frame, val_n_rel)
    else:
        tuning.set_rmse_target()
    methods = weight_methods()
    paper_methods, chosen, history = papers.build_paper_methods(val_scores)
    methods.update(paper_methods)

    # ── 5. Rổ ứng viên TOÀN CATALOG để đo xếp hạng ───────
    # Đây là phần sửa lỗi quan trọng: Precision/Recall/NDCG phải được đo khi mỗi
    # user được xếp hạng trên toàn bộ hotel chưa đặt, không phải chỉ trong số
    # hotel user đã rating. Xem evaluation/ranking.py và evaluation/metrics.py.
    print("\n[5/6] Dựng rổ ứng viên toàn catalog...")
    catalog = items_df["item_id"].to_numpy()
    seen = pd.concat([df_train[["user_id", "item_id"]],
                      val_scores[["user_id", "item_id"]]], ignore_index=True)
    frame, n_relevant = build_candidate_frame(
        df_train, test_scores, catalog, df_exclude=seen,
        max_users=MAX_EVAL_USERS, seed=seed)

    print("  Chấm điểm từng model thành phần trên rổ...")
    for name, model in components.items():
        frame[name] = model.predict_many(frame["user_id"].to_numpy(),
                                         frame["item_id"].to_numpy())

    # Nhóm cold-start gán theo USER (xếp hạng là bài toán theo user, không theo dòng)
    user_n = frame.groupby("user_id")["n"].first()
    user_groups = pd.Series(
        np.select([user_n >= WARM_MIN_N, user_n >= COLD_MAX_N], ["warm", "cool"],
                  default="cold"),
        index=user_n.index)

    # ── 6. Chấm điểm trên test ───────────────────────────
    print("\n[6/6] Chấm điểm từng phương pháp...")
    overall, by_group_rows = {}, []
    for name, predict_fn in methods.items():
        # (a) Sai số dự đoán — trên các cặp có rating thật
        preds = predict_fn(test_scores)
        results = list(zip(test_scores["user_id"], test_scores["item_id"],
                           test_scores["rating"], preds))
        rating_metrics = evaluate_rating(results)

        # (b) Chất lượng xếp hạng — trên rổ toàn catalog
        ranked = predict_fn(frame)
        ranking = rank_metrics(frame, ranked, n_relevant, TOP_K, n_catalog=len(catalog))
        ranking.update(cold_item_share(frame, ranked, TOP_K))

        overall[name] = {**rating_metrics, **ranking}
        print(f"    {name:<32} RMSE {rating_metrics['rmse']:.4f}  "
              f"P@10 {ranking['p@10']:.4f}  NDCG@10 {ranking['ndcg@10']:.4f}")

        # Theo nhóm: RMSE giữ nguyên 4 nhóm (có cold_item), xếp hạng chỉ 3 nhóm user
        for group, metrics in evaluate_rating_by_group(results, test_scores["group"]).items():
            by_group_rows.append({"method": name, "group": group, **metrics})
        for group, metrics in rank_metrics_by_group(
                frame, ranked, n_relevant, user_groups, TOP_K, len(catalog)).items():
            by_group_rows.append({"method": name, "group": f"{group} (rank)", **metrics})

    overall_df = pd.DataFrame(overall).T
    overall_df.index.name = "method"
    return overall_df, pd.DataFrame(by_group_rows), chosen, history


def run(seeds):
    all_overall, all_by_group = [], []
    chosen, history = None, None

    for seed in seeds:
        overall_df, by_group_df, chosen, history = run_one_seed(seed)
        all_overall.append(overall_df.assign(seed=seed))
        all_by_group.append(by_group_df.assign(seed=seed))

    overall = pd.concat(all_overall)
    by_group = pd.concat(all_by_group)
    save_results(overall, by_group, chosen, history, seeds)


def save_results(overall, by_group, chosen, history, seeds):
    os.makedirs("results", exist_ok=True)
    overall.to_csv(f"results/comparison{SUFFIX}.csv")
    by_group.to_csv(f"results/comparison_by_group{SUFFIX}.csv", index=False)
    pd.DataFrame(chosen).T.to_csv(f"results/chosen_params{SUFFIX}.csv")

    # Trung bình qua các seed
    order = list(dict.fromkeys(overall.index))
    mean = overall.groupby("method").mean(numeric_only=True).reindex(order)
    std = overall.groupby("method").std(numeric_only=True).reindex(order)

    print("\n" + "=" * 78)
    print(f"  KẾT QUẢ TRÊN TEST ({len(seeds)} seed: {seeds})")
    print("=" * 78)
    summary = pd.DataFrame({
        "RMSE": [f"{m:.4f} ± {s:.4f}" if not np.isnan(s) else f"{m:.4f}"
                 for m, s in zip(mean["rmse"], std["rmse"])],
        "MAE": [f"{m:.4f}" for m in mean["mae"]],
        "P@10": [f"{m:.4f}" for m in mean["p@10"]],
        "R@10": [f"{m:.4f}" for m in mean["r@10"]],
        "NDCG@10": [f"{m:.4f}" for m in mean["ndcg@10"]],
        "Cov@10": [f"{m:.4f}" for m in mean["cov@10"]],
        "New@10": [f"{m:.4f}" for m in mean["newitem@10"]],
    }, index=mean.index)
    print("  P/R/NDCG/Cov = xếp hạng trên TOÀN CATALOG (xem evaluation/ranking.py)")
    print("  New@10 = tỷ lệ ô hiển thị dành cho hotel chưa ai rating (cold-start phía hotel)")
    print(summary.to_string())

    group_mean = by_group.groupby(["method", "group"])["rmse"].mean().unstack()
    group_mean = group_mean.reindex(index=order, columns=GROUP_ORDER)
    print("\n  RMSE THEO NHÓM (gán theo từng dòng test)")
    print(group_mean.round(4).to_string())

    rank_mean = by_group.groupby(["method", "group"])["ndcg@10"].mean().unstack()
    rank_mean = rank_mean.reindex(index=order, columns=RANK_GROUP_ORDER)
    print("\n  NDCG@10 THEO NHÓM USER (xếp hạng toàn catalog; không có nhóm cold_item")
    print("  vì xếp hạng là bài toán theo user — tình trạng hotel mới xem ở Cov@10 / New@10)")
    print(rank_mean.round(4).to_string())

    print("\n  THAM SỐ ĐÃ CHỌN TRÊN VALIDATION (seed cuối)")
    for name, params in chosen.items():
        print(f"    {name}: {params}")

    print("\n✓ Saved results/comparison.csv, comparison_by_group.csv, chosen_params.csv")
    for plot_fn, path in [(plot_by_group, f"comparison{SUFFIX}.png"), (plot_sensitivity, f"sensitivity_alpha{SUFFIX}.png")]:
        try:
            plot_fn(by_group if plot_fn is plot_by_group else history, order)
            print(f"✓ Chart saved to results/{path}")
        except Exception as e:
            print(f"⚠ Could not create results/{path}: {e}")


def _style(ax, ink_muted="#52514e"):
    ax.tick_params(axis="x", labelsize=8, colors=ink_muted)
    ax.tick_params(axis="y", length=0)
    ax.grid(axis="x", color="#e6e5e0", linewidth=0.8)
    ax.set_axisbelow(True)
    for side in ["top", "right", "left"]:
        ax.spines[side].set_visible(False)
    ax.spines["bottom"].set_color("#c3c2b7")


def plot_by_group(by_group_df, method_order):
    """Small multiples: mỗi cột 1 nhóm, hàng trên RMSE, hàng dưới NDCG@10."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    highlight, muted, ink = "#2a78d6", "#b4b2a9", "#0b0b0b"
    agg = by_group_df.groupby(["method", "group"]).mean(numeric_only=True)

    # Hàng trên: RMSE trên 4 nhóm (gán theo dòng test, có cold_item).
    # Hàng dưới: NDCG@10 trên 3 nhóm user (xếp hạng toàn catalog) — ô đầu để trống
    # vì xếp hạng không có nhóm cold_item.
    rows = [("rmse", "RMSE (thấp = tốt)", GROUP_ORDER),
            ("ndcg@10", "NDCG@10 toàn catalog (cao = tốt)", [None] + RANK_GROUP_ORDER)]

    fig, axes = plt.subplots(len(rows), len(GROUP_ORDER),
                             figsize=(19, 0.45 * len(method_order) * len(rows) + 3), sharey=True)
    y = list(range(len(method_order)))[::-1]
    for row, (metric, metric_label, groups) in enumerate(rows):
        for col, group in enumerate(groups):
            ax = axes[row][col]
            if group is None:
                ax.axis("off")
                continue
            values = np.array([agg.loc[(m, group), metric] for m in method_order])
            colors = [highlight if m.startswith("★") else muted for m in method_order]
            ax.barh(y, values, color=colors, height=0.7, edgecolor="white", linewidth=2)

            best = values.min() if metric == "rmse" else values.max()
            for yi, v in zip(y, values):
                ax.text(v, yi, f" {v:.3f}", va="center", fontsize=8,
                        color=ink, fontweight="bold" if v == best else "normal")

            lo, hi = values.min(), values.max()
            pad = (hi - lo) * 0.25 or 0.05
            ax.set_xlim(max(0, lo - pad), hi + pad * 1.8)
            if row == 0:
                n_rows = int(agg.loc[(method_order[0], group), "n_rows"])
                ax.set_title(f"{GROUP_LABELS[group]}\n{n_rows:,} test ratings", fontsize=10, color=ink)
            else:
                n_users = int(agg.loc[(method_order[0], group), "n_users"])
                ax.set_title(f"{group.replace(' (rank)', '')}\n{n_users:,} user",
                             fontsize=10, color=ink)
            if col == 0 or (row == 1 and col == 1):
                ax.set_yticks(y)
                ax.set_yticklabels(method_order, fontsize=8.5, color=ink)
            ax.set_xlabel(metric_label, fontsize=9, color="#52514e")
            _style(ax)

    fig.suptitle("StayReco vs baselines & 4 bài báo, theo nhóm cold-start (MovieLens 100K)",
                 fontsize=13, color=ink)
    plt.tight_layout()
    plt.savefig(f"results/comparison{SUFFIX}.png", dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def plot_sensitivity(history, _order):
    """Biểu đồ độ nhạy: RMSE trên validation thay đổi thế nào theo α_max và n_threshold.

    Đây là câu trả lời bằng hình ảnh cho câu hỏi "vì sao chọn α_max = 0.7?".
    """
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    df = pd.DataFrame([{**p, "rmse": r} for p, r in history])
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.2))
    palette = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"]

    for ax, (x, series) in zip(axes, [("alpha_max", "n_threshold"), ("n_threshold", "alpha_max")]):
        best = df.loc[df.groupby([x, series])["rmse"].idxmin()]
        for color, (key, part) in zip(palette, best.groupby(series)):
            part = part.sort_values(x)
            ax.plot(part[x], part["rmse"], marker="o", markersize=6, linewidth=2,
                    color=color, label=f"{series}={key}")
        ax.set_xlabel(x, fontsize=9, color="#52514e")
        ax.set_ylabel("validation RMSE (thấp = tốt)", fontsize=9, color="#52514e")
        ax.legend(fontsize=8, frameon=False)
        _style(ax)
        ax.grid(axis="y", color="#e6e5e0", linewidth=0.8)

    fig.suptitle("Độ nhạy của StayReco theo tham số α (chọn trên validation)", fontsize=12)
    plt.tight_layout()
    plt.savefig(f"results/sensitivity_alpha{SUFFIX}.png", dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)


if __name__ == "__main__":
    # python run_experiment.py 42 1 2 --cold-item=0.2 --tag=schein
    #   --cold-item : % hotel bị giấu toàn bộ rating (Schein et al. 2002 dùng ~0.2)
    #   --tag       : hậu tố cho file kết quả, để không ghi đè lần chạy trước
    seeds = [int(a) for a in sys.argv[1:] if not a.startswith("--")] or [RANDOM_SEED]
    for arg in sys.argv[1:]:
        if arg.startswith("--cold-item="):
            COLD_ITEM_RATIO = float(arg.split("=")[1])
        elif arg.startswith("--tag="):
            SUFFIX = "_" + arg.split("=")[1]
        elif arg.startswith("--dataset="):
            DATASET = arg.split("=")[1]
        elif arg.startswith("--max-eval-users="):
            MAX_EVAL_USERS = int(arg.split("=")[1])
        elif arg.startswith("--data-dir="):
            DATA_DIR = arg.split("=", 1)[1]
        elif arg.startswith("--cold-user="):
            COLD_USER_RATIO = float(arg.split("=")[1])
        elif arg.startswith("--tune-metric="):
            TUNE_METRIC = arg.split("=", 1)[1]
            assert TUNE_METRIC in ("rmse", "ndcg"), "--tune-metric phai la rmse hoac ndcg"
        elif arg.startswith("--test-ratio="):
            TEST_RATIO = float(arg.split("=")[1])
    print(f"DATASET={DATASET}, COLD_ITEM_RATIO={COLD_ITEM_RATIO}, "
      f"MAX_EVAL_USERS={MAX_EVAL_USERS}, output suffix='{SUFFIX}'")

    # Ghi manifest TRƯỚC khi chạy: config thật sự dùng, commit, phiên bản thư viện.
    # Không đọc lại config.py vì CLI có thể đã ghi đè (ví dụ --cold-item).
    manifest.write(
        f"results/run_meta{SUFFIX}.json",
        config={
            "dataset": ("tripadvisor" if DATASET == "tripadvisor" else "movielens-100k"),
            "data_dir": DATA_DIR or ("data/tripadvisor" if DATASET == "tripadvisor"
                                     else "data/ml-100k"),
            "max_eval_users": MAX_EVAL_USERS,
            "tune_metric": TUNE_METRIC,
            "test_ratio": TEST_RATIO, "val_ratio": VAL_RATIO,
            "cold_user_ratio": COLD_USER_RATIO, "max_cold_n": MAX_COLD_N,
            "cold_item_ratio": COLD_ITEM_RATIO,
            "warm_min_n": WARM_MIN_N, "cold_max_n": COLD_MAX_N,
            "svdpp": {"factors": SVDPP_FACTORS, "epochs": SVDPP_EPOCHS,
                      "lr": SVDPP_LR, "reg": SVDPP_REG},
            "lightgcn": {"factors": GCN_FACTORS, "layers": GCN_LAYERS,
                         "epochs": GCN_EPOCHS, "lr": GCN_LR},
            "content_k": CONTENT_K, "demo_cols": list(DEMO_COLS),
            "demo_shrinkage": DEMO_SHRINKAGE,
            "alpha_manual": {"alpha_max": ALPHA_MAX, "n_threshold": N_THRESHOLD,
                             "gamma_base": GAMMA_BASE},
            "fixed_alphas": FIXED_ALPHAS, "top_k": list(TOP_K),
            "relevance_threshold": RELEVANCE_THRESHOLD,
        },
        seeds=seeds,
        extra={"ranking_protocol": (
            "Precision/Recall/NDCG/Coverage@K xếp hạng trên TOÀN CATALOG: rổ ứng viên "
            "= mọi item user chưa rating trong train+validation; liên quan = item trong "
            "test với rating >= ngưỡng. Xem evaluation/ranking.py."
        ),
            "tuning_objective": (
            "Mọi phương pháp được grid search trên validation theo RMSE (không theo "
            "metric xếp hạng) — như nhau cho tất cả, nhưng phải ghi rõ trong báo cáo."
        )},
    )
    run(seeds)

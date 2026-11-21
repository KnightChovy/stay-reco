"""So sánh THEO CẶP giữa StayReco và từng đối thủ trên cùng seed, có kiểm định.

Vì sao cần: cùng một seed thì mọi phương pháp dùng CHUNG một cách chia dữ liệu,
nên so chênh lệch trên từng seed chính xác hơn nhiều so với chỉ nhìn trung bình
± độ lệch chuẩn (độ lệch đó phần lớn đến từ việc chia dữ liệu khác nhau, không
phải từ chất lượng phương pháp).

Vì sao cần KIỂM ĐỊNH: chênh lệch RMSE giữa các phương pháp hybrid chỉ cỡ 0.001.
Câu hỏi đầu tiên của hội đồng sẽ là "con số đó khác 0 thật, hay chỉ là nhiễu do
chia dữ liệu?". Trung bình + số seed thắng KHÔNG trả lời được câu đó.

Dùng Wilcoxon signed-rank (phi tham số, theo cặp) vì:
  • không giả định chênh lệch phân phối chuẩn — với 5-10 seed thì không kiểm tra
    được tính chuẩn một cách đáng tin;
  • đây là kiểm định theo cặp, khớp với thiết kế "cùng seed, cùng split".
Có in kèm paired t-test để đối chiếu.

⚠️ GHI RÕ TRONG BÁO CÁO: mỗi seed là một lần chia dữ liệu, KHÔNG phải một mẫu
độc lập theo nghĩa chặt (cùng một dataset gốc). p-value ở đây trả lời "chênh lệch
có ổn định qua các cách chia dữ liệu không", chứ không phải "có tổng quát hóa
sang dataset khác không". Xem Ihemelandu & Ekstrand (2021).
Với n < 6 seed, Wilcoxon hai phía không thể cho p < 0.05 về mặt lý thuyết
(số hoán vị quá ít) → cần ÍT NHẤT 6 seed, nên dùng 10.

Cách chạy:
    python analyze_seeds.py                     # results/comparison.csv
    python analyze_seeds.py _schein             # results/comparison_schein.csv
    python analyze_seeds.py _schein ndcg@10     # so trên metric khác
"""

import sys

import pandas as pd
from scipy import stats

REF = "★ StayReco (α tuned)"

# Metric nào thấp là tốt, metric nào cao là tốt
LOWER_IS_BETTER = {"rmse", "mae"}


def paired_report(pivot, metric, alpha=0.05):
    """Bảng so cặp + Wilcoxon signed-rank + paired t-test với từng đối thủ."""
    lower_better = metric in LOWER_IS_BETTER
    n_seeds = len(pivot)

    rows = []
    for method in pivot.columns:
        if method == REF:
            continue
        # Quy ước: `diff` > 0 luôn nghĩa là StayReco TỐT HƠN
        diff = (pivot[method] - pivot[REF]) if lower_better else (pivot[REF] - pivot[method])
        diff = diff.dropna()

        if diff.nunique() == 1 and diff.iloc[0] == 0:
            p_w = p_t = 1.0           # trùng khít, không có gì để kiểm định
        else:
            try:
                p_w = stats.wilcoxon(diff, alternative="two-sided").pvalue
            except ValueError:
                p_w = float("nan")    # toàn số 0 sau khi bỏ cặp bằng nhau
            p_t = stats.ttest_1samp(diff, 0.0).pvalue if len(diff) > 1 else float("nan")

        rows.append({
            "đối thủ": method,
            "chênh lệch TB": round(diff.mean(), 5),
            "độ lệch chuẩn": round(diff.std(), 5),
            "thắng": f"{int((diff > 0).sum())}/{len(diff)}",
            "Wilcoxon p": round(p_w, 4) if p_w == p_w else "—",
            "t-test p": round(p_t, 4) if p_t == p_t else "—",
            "kết luận": _verdict(diff.mean(), p_w, alpha),
        })

    table = pd.DataFrame(rows).sort_values("chênh lệch TB", ascending=False)
    print(f"\nSo cặp trên {metric} — dương = StayReco tốt hơn (n = {n_seeds} seed)")
    print(table.to_string(index=False))

    if n_seeds < 6:
        print(f"\n⚠ Chỉ có {n_seeds} seed. Wilcoxon hai phía cần >= 6 seed mới có thể")
        print("  đạt p < 0.05 (giới hạn toán học của kiểm định, không phải do dữ liệu).")
        print("  → Chạy thêm seed: python run_experiment.py 42 1 2 3 4 5 6 7 8 9 ...")
    return table


def _verdict(mean_diff, p, alpha):
    if p != p:
        return "không kiểm định được"
    if p >= alpha:
        return "chưa đủ bằng chứng"
    return "StayReco hơn" if mean_diff > 0 else "đối thủ hơn"


def main(suffix="", metric="rmse"):
    path = f"results/comparison{suffix}.csv"
    df = pd.read_csv(path)
    if metric not in df.columns:
        sys.exit(f"Không có cột '{metric}'. Các cột có sẵn: {list(df.columns)}")

    pivot = df.pivot(index="seed", columns="method", values=metric)
    print(f"=== {path} · metric = {metric} ===\n")
    print(f"{metric} từng seed ({'thấp' if metric in LOWER_IS_BETTER else 'cao'} = tốt):")
    print(pivot.round(4).T.to_string())

    paired_report(pivot, metric)


if __name__ == "__main__":
    # --ref="<tên phương pháp>" chọn phương pháp làm mốc so sánh (mặc định: REF ở trên).
    # Bài báo dùng --ref="★ StayReco (2 tang + gamma=0 hotel moi)".
    for a in sys.argv[1:]:
        if a.startswith("--ref="):
            REF = a.split("=", 1)[1]
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    main(args[0] if args else "", args[1] if len(args) > 1 else "rmse")

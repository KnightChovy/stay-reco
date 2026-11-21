# -*- coding: utf-8 -*-
"""Hinh cho muc 7 (bai chung): New@10 cua 4 bien the tren MovieLens va TripAdvisor.

So lieu lay tu results/comparison_ablation_ml.csv va comparison_ablation_ta.csv
(trung binh 10 seed). Chay:  conda run -n stayreco python paper/lncs/fig_newitem_ablation.py
Xuat: paper/lncs/fig_newitem_ablation.pdf (+ .png de xem nhanh)
"""
import os
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "paper", "lncs", "fig_newitem_ablation")

VARIANTS = [
    ("★ StayReco (2 tang + gamma=0 hotel moi)",          r"$a_u b_i$ (product)"),
    ("★ Ablation: alpha = t_user (chi phia user)",       r"$a_u$ only"),
    ("★ Ablation: alpha = (t_user+t_item)/2",            r"$(a_u+b_i)/2$"),
    ("★ StayReco (2 tang)",                               r"product, no $\gamma{=}0$ rule"),
]
DATASETS = [("ablation_ml", "MovieLens 100K"), ("ablation_ta", "TripAdvisor")]

ACCENT, NEUTRAL, INK, MUTED = "#2f6fab", "#c9ced4", "#222222", "#666666"

plt.rcParams.update({
    "font.family": "serif", "font.size": 8.5, "axes.titlesize": 9,
    "axes.labelsize": 8.5, "xtick.labelsize": 8, "ytick.labelsize": 8,
    "axes.spines.top": False, "axes.spines.right": False,
    "axes.edgecolor": MUTED, "xtick.color": INK, "ytick.color": INK,
    "hatch.linewidth": 0.6,
})

fig, axes = plt.subplots(1, 2, figsize=(4.9, 2.3))
for ax, (tag, title) in zip(axes, DATASETS):
    d = pd.read_csv(os.path.join(ROOT, "results", "comparison_%s.csv" % tag))
    means = d.groupby("method")["newitem@10"].mean()
    vals = [float(means[k]) for k, _ in VARIANTS]
    labels = [lab for _, lab in VARIANTS]
    colors = [ACCENT] + [NEUTRAL] * 3
    hatches = [""] + ["////"] * 3
    bars = ax.bar(range(4), vals, width=0.62, color=colors, edgecolor=MUTED, linewidth=0.6)
    for b, h in zip(bars, hatches):
        b.set_hatch(h)
    ymax = max(vals) * 1.28
    ax.set_ylim(0, ymax)
    for x, v in enumerate(vals):
        ax.text(x, v + ymax * 0.02, "%.4f" % v, ha="center", va="bottom", fontsize=7.5, color=INK)
    ax.set_xticks(range(4))
    ax.set_xticklabels(labels, rotation=28, ha="right")
    ax.set_title(title, loc="left", color=INK)
    ax.yaxis.grid(True, color="#e6e8eb", linewidth=0.6)
    ax.set_axisbelow(True)
    ax.tick_params(axis="y", length=0)
axes[0].set_ylabel("New@10")
fig.tight_layout(w_pad=1.6)
fig.savefig(OUT + ".pdf")
fig.savefig(OUT + ".png", dpi=200)
print("wrote", OUT + ".pdf / .png")

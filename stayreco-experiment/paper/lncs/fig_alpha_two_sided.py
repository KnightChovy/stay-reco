# -*- coding: utf-8 -*-
"""Hinh co che: alpha = t_user * t_item theo n_u, moi duong mot muc m_i.
Hang so lay theo lua chon pho bien tren TripAdvisor: k = 40, k' = 5.
Chay:  conda run -n stayreco python paper/lncs/fig_alpha_two_sided.py
"""
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fig_alpha_two_sided")
K_USER, K_ITEM = 40.0, 5.0
INK, MUTED = "#222222", "#666666"
# mot tong mau, sang -> dam theo m_i (sequential)
RAMP = ["#b9d3ea", "#7fb0d8", "#4f8cc0", "#2f6fab", "#1b4f80"]
M_LEVELS = [0, 1, 5, 20, 200]

plt.rcParams.update({
    "font.family": "serif", "font.size": 8.5, "axes.labelsize": 8.5,
    "xtick.labelsize": 8, "ytick.labelsize": 8, "legend.fontsize": 7.5,
    "axes.spines.top": False, "axes.spines.right": False, "axes.edgecolor": MUTED,
})

n = np.linspace(0, 200, 400)
t_user = n / (n + K_USER)
fig, ax = plt.subplots(figsize=(4.6, 2.5))
for m, c in zip(M_LEVELS, RAMP):
    t_item = m / (m + K_ITEM)
    a = t_user * t_item
    ax.plot(n, a, color=c, linewidth=2.0, label=r"$m_i = %d$" % m)
    ax.text(203, a[-1], r"$m_i{=}%d$" % m, va="center", fontsize=7.5, color=INK)
ax.axhline(0.3, color=MUTED, linewidth=0.8, linestyle=(0, (4, 3)))
ax.text(203, 0.315, "fixed 0.3", va="bottom", fontsize=7.5, color=MUTED)
ax.set_xlim(0, 235); ax.set_ylim(0, 1.0)
ax.set_xticks([0, 40, 80, 120, 160, 200])
ax.set_xlabel(r"user interaction count $n_u$")
ax.set_ylabel(r"collaborative weight $\alpha_{u,i}$")
ax.yaxis.grid(True, color="#e6e8eb", linewidth=0.6); ax.set_axisbelow(True)
ax.tick_params(length=0)
ax.legend(loc="upper left", frameon=False, ncol=1, title=r"item rating count", title_fontsize=7.5)
fig.tight_layout()
fig.savefig(OUT + ".pdf"); fig.savefig(OUT + ".png", dpi=200)
print("wrote", OUT + ".pdf / .png")

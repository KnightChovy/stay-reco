# -*- coding: utf-8 -*-
"""CONG KIEM TRA: diem chi tiet theo tieu chi co mang them thong tin khong?

Cau hoi duy nhat can tra loi truoc khi dau tu them:

    Ho so tieu chi cua khach san co du doan diem tong TOT HON
    trung binh diem tong cua chinh khach san do khong?

Neu khong -> cac tieu chi chi la ban sao cua diem tong (tuong quan tung cai
len toi 0.83), khong co dong gop nao, dung huong nay lai.

Cac bo du doan (TAT CA chi dung du lieu TRAIN):
    P0  trung binh toan he                      mu
    P1  trung binh khach san CO CO NGOT          (n*m + k*mu)/(n+k)
    P2  ho so tieu chi, he so toan cuc           mu + sum_a g_a*(q[i,a]-mu_a)
    P3  ho so tieu chi + trong so chu y cua khach
    P4  P1 + P2  (tieu chi co them gi NGOAI trung binh khach san?)
    P5  P1 + P3

P4 va P5 moi la cau tra loi that: he so cua phan tieu chi khac 0 bao nhieu.

Chay: conda run -n stayreco python -I experiments/gate_aspect.py 1 2 3
"""
import os
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data.preprocessor import simulate_cold_start, assign_groups, split_validation

ASP = ["asp_value", "asp_sleep", "asp_service", "asp_rooms", "asp_location", "asp_clean"]
GROUPS = ["cold_item", "cold", "cool", "warm"]

PATH = "data/tripadvisor/ratings_aspects.csv"
TEST_RATIO = 0.2
COLD_USER_RATIO = 0.3
COLD_ITEM_RATIO = 0.20
MAX_COLD_N = 19
VAL_RATIO = 0.5

K_ITEM_GRID = [1, 3, 5, 10, 20, 40, 80]
K_ASP_GRID = [1, 3, 5, 10, 20, 40]
K_W_GRID = [1, 3, 10, 30]


def shrunk_item_mean(df_train, k, mu):
    g = df_train.groupby("item_id")["rating"].agg(["size", "mean"])
    return ((g["size"] * g["mean"] + k * mu) / (g["size"] + k)), mu


def aspect_item_profile(df_train, k_a):
    """q[i,a] co co ngot ve trung binh toan he cua tieu chi a. Chi dung TRAIN."""
    mu_a = {a: df_train[a].mean() for a in ASP}
    q = {}
    for a in ASP:
        sub = df_train[["item_id", a]].dropna()
        g = sub.groupby("item_id")[a].agg(["size", "mean"])
        q[a] = (g["size"] * g["mean"] + k_a * mu_a[a]) / (g["size"] + k_a)
    return q, mu_a


def user_attention(df_train, k_w):
    """Trong so chu y: ti le review cua khach co cham tieu chi a.

    Y tuong: khach CHON cham tieu chi nao thi tiet lo ho quan tam dieu gi.
    Co ngot ve ti le toan cuc -> khach moi van co gia tri hop ly.
    """
    s_bar = {a: df_train[a].notna().mean() for a in ASP}
    m_u = df_train.groupby("user_id").size()
    w = {}
    for a in ASP:
        s_u = df_train.assign(h=df_train[a].notna()).groupby("user_id")["h"].mean()
        w[a] = (m_u * s_u + k_w * s_bar[a]) / (m_u + k_w)
    return w, s_bar


def feat_aspect(df, q, mu_a):
    """Ma tran dac trung: do lech ho so tieu chi cua khach san so voi toan he."""
    X = np.zeros((len(df), len(ASP)))
    for j, a in enumerate(ASP):
        X[:, j] = df["item_id"].map(q[a]).fillna(mu_a[a]).values - mu_a[a]
    return X


def feat_attention(df, q, mu_a, w, s_bar):
    """Mot cot: tong co trong so chu y cua khach."""
    num = np.zeros(len(df))
    den = np.zeros(len(df))
    for a in ASP:
        wa = df["user_id"].map(w[a]).fillna(s_bar[a]).values
        qa = df["item_id"].map(q[a]).fillna(mu_a[a]).values - mu_a[a]
        num += wa * qa
        den += wa
    return (num / np.where(den == 0, 1.0, den)).reshape(-1, 1)


def fit_ls(X, y):
    A = np.hstack([np.ones((len(X), 1)), X])
    coef, *_ = np.linalg.lstsq(A, y, rcond=None)
    return coef


def apply_ls(coef, X):
    A = np.hstack([np.ones((len(X), 1)), X])
    return A @ coef


def rmse(p, y):
    return float(np.sqrt(np.mean((np.clip(p, 1, 5) - y) ** 2)))


def run_seed(df, seed, verbose=False):
    df_train, df_held = simulate_cold_start(
        df, test_ratio=TEST_RATIO, cold_user_ratio=COLD_USER_RATIO,
        max_cold_n=MAX_COLD_N, cold_item_ratio=COLD_ITEM_RATIO, seed=seed)
    df_held = assign_groups(df_held, df_train)
    df_held = split_validation(df_held, val_ratio=VAL_RATIO, seed=seed)

    # ---- CHAN RO RI ----
    # simulate_cold_start dung ignore_index=True nen KHONG kiem tra bang index
    # duoc; phai gan row_id truoc khi chia (xem main()).
    s_tr, s_he = set(df_train["row_id"]), set(df_held["row_id"])
    assert len(s_tr & s_he) == 0, "RO RI: cung mot review nam o ca train va held"
    assert len(s_tr) + len(s_he) <= len(df), "RO RI: tong so dong vuot qua du lieu goc"
    for a in ASP:
        assert df_train[a].notna().sum() > 0, "thieu du lieu tieu chi trong train"

    val = df_held[df_held["split"] == "val"]
    test = df_held[df_held["split"] == "test"]
    mu = df_train["rating"].mean()
    y_val, y_test = val["rating"].values, test["rating"].values

    out = {}

    # ---------- P0 ----------
    out["P0 trung binh toan he"] = rmse(np.full(len(test), mu), y_test)

    # ---------- P1: chon k tren VALIDATION ----------
    best = (None, 1e9)
    for k in K_ITEM_GRID:
        im, _ = shrunk_item_mean(df_train, k, mu)
        p = val["item_id"].map(im).fillna(mu).values
        r = rmse(p, y_val)
        if r < best[1]:
            best = (k, r)
    k_item = best[0]
    im, _ = shrunk_item_mean(df_train, k_item, mu)
    f1_val = (val["item_id"].map(im).fillna(mu).values - mu).reshape(-1, 1)
    f1_test = (test["item_id"].map(im).fillna(mu).values - mu).reshape(-1, 1)
    out["P1 tb khach san co ngot"] = rmse(test["item_id"].map(im).fillna(mu).values, y_test)

    # ---------- chon k_a, k_w tren VALIDATION ----------
    best = (None, 1e9)
    for k_a in K_ASP_GRID:
        q, mu_a = aspect_item_profile(df_train, k_a)
        c = fit_ls(feat_aspect(df_train, q, mu_a), df_train["rating"].values)
        r = rmse(apply_ls(c, feat_aspect(val, q, mu_a)), y_val)
        if r < best[1]:
            best = (k_a, r)
    k_a = best[0]
    q, mu_a = aspect_item_profile(df_train, k_a)

    best = (None, 1e9)
    for k_w in K_W_GRID:
        w, s_bar = user_attention(df_train, k_w)
        c = fit_ls(feat_attention(df_train, q, mu_a, w, s_bar), df_train["rating"].values)
        r = rmse(apply_ls(c, feat_attention(val, q, mu_a, w, s_bar)), y_val)
        if r < best[1]:
            best = (k_w, r)
    k_w = best[0]
    w, s_bar = user_attention(df_train, k_w)

    X2tr, X2te = feat_aspect(df_train, q, mu_a), feat_aspect(test, q, mu_a)
    X3tr, X3te = feat_attention(df_train, q, mu_a, w, s_bar), feat_attention(test, q, mu_a, w, s_bar)
    f1_tr = (df_train["item_id"].map(im).fillna(mu).values - mu).reshape(-1, 1)
    ytr = df_train["rating"].values

    c2 = fit_ls(X2tr, ytr); out["P2 ho so tieu chi"] = rmse(apply_ls(c2, X2te), y_test)
    c3 = fit_ls(X3tr, ytr); out["P3 tieu chi + chu y"] = rmse(apply_ls(c3, X3te), y_test)
    c4 = fit_ls(np.hstack([f1_tr, X2tr]), ytr)
    out["P4 = P1 + P2"] = rmse(apply_ls(c4, np.hstack([f1_test, X2te])), y_test)
    c5 = fit_ls(np.hstack([f1_tr, X3tr]), ytr)
    out["P5 = P1 + P3"] = rmse(apply_ls(c5, np.hstack([f1_test, X3te])), y_test)

    # RMSE theo nhom cho P1 va P4
    pergroup = {}
    p1 = test["item_id"].map(im).fillna(mu).values
    p4 = apply_ls(c4, np.hstack([f1_test, X2te]))
    p5 = apply_ls(c5, np.hstack([f1_test, X3te]))
    for gname in GROUPS:
        m = (test["group"] == gname).values
        if m.sum() == 0:
            continue
        pergroup[gname] = {
            "n": int(m.sum()),
            "P1": rmse(p1[m], y_test[m]),
            "P4": rmse(p4[m], y_test[m]),
            "P5": rmse(p5[m], y_test[m]),
        }

    params = {"k_item": k_item, "k_aspect": k_a, "k_w": k_w}
    coef4 = {"tb_khach_san": float(c4[1]),
             **{a: float(c4[2 + j]) for j, a in enumerate(ASP)}}
    return out, pergroup, params, coef4


def main():
    seeds = [int(a) for a in sys.argv[1:]] or [1, 2, 3]
    print("Doc", PATH)
    df = pd.read_csv(PATH, dtype={"user_id": str, "item_id": str})
    df["row_id"] = np.arange(len(df))   # de kiem tra ro ri sau khi chia
    print(f"{len(df):,} dong, {df['user_id'].nunique():,} user, {df['item_id'].nunique():,} khach san")
    print()

    allout, allgrp, allpar, allcoef = [], [], [], []
    for s in seeds:
        print("=" * 72)
        print("SEED", s)
        print("=" * 72)
        o, g, p, c = run_seed(df, s)
        allout.append(o); allgrp.append(g); allpar.append(p); allcoef.append(c)
        for k, v in o.items():
            print("   %-28s RMSE %.4f" % (k, v))
        print("   tham so chon tren validation:", p)
        print()

    print("=" * 72)
    print("TRUNG BINH %d SEED" % len(seeds))
    print("=" * 72)
    keys = list(allout[0].keys())
    means = {k: np.mean([o[k] for o in allout]) for k in keys}
    for k in keys:
        vals = [o[k] for o in allout]
        print("   %-28s %.4f  +/- %.4f" % (k, np.mean(vals), np.std(vals, ddof=1) if len(vals) > 1 else 0))
    print()

    base = means["P1 tb khach san co ngot"]
    print("CONG KIEM TRA — moc la P1 = %.4f" % base)
    print("-" * 72)
    for k in ["P2 ho so tieu chi", "P3 tieu chi + chu y", "P4 = P1 + P2", "P5 = P1 + P3"]:
        d = base - means[k]
        wins = sum(1 for o in allout if o[k] < o["P1 tb khach san co ngot"])
        verdict = "TOT HON" if d > 0.002 else ("ngang" if d > -0.002 else "KEM HON")
        print("   %-28s %+.4f  thang %d/%d  -> %s" % (k, d, wins, len(allout), verdict))
    print()

    print("RMSE THEO NHOM (trung binh cac seed):")
    print("-" * 72)
    print("   %-12s %>8s %8s %8s %8s" % ("nhom", "so dong", "P1", "P4", "P5") if False else
          "   %-12s %8s %8s %8s %8s" % ("nhom", "so dong", "P1", "P4", "P5"))
    for gname in GROUPS:
        rows = [g[gname] for g in allgrp if gname in g]
        if not rows:
            continue
        print("   %-12s %8d %8.4f %8.4f %8.4f" % (
            gname, int(np.mean([r["n"] for r in rows])),
            np.mean([r["P1"] for r in rows]),
            np.mean([r["P4"] for r in rows]),
            np.mean([r["P5"] for r in rows])))
    print()

    print("HE SO HOI QUY cua P4 (trung binh seed) — cho biet tieu chi nao co ich:")
    print("-" * 72)
    for k in allcoef[0]:
        print("   %-16s %+.4f" % (k, np.mean([c[k] for c in allcoef])))


if __name__ == "__main__":
    main()

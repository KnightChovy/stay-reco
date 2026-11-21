# -*- coding: utf-8 -*-
"""CONG KIEM TRA cach 2: tin hieu VI TRI co mang them thong tin khong?

Khac cach 1 o diem then chot:

    Diem chi tiet den TU CHINH review bi giau -> khach san moi khong co
    tieu chi nao, dung luc can nhat thi khong co du lieu.

    Vi tri thi KHONG the. Khach san moi van thuoc mot vung da co du lieu;
    khach moi van den tu mot vung da co du lieu.

Nen ve ly thuyet vi tri co the giup o dung cho cach 1 that bai.

Cac bo du doan (chi dung TRAIN):
    P1  trung binh khach san co co ngot        <- moc phai vuot
    L1  trung binh vung KHACH SAN co co ngot
    L2  trung binh cap (vung khach, vung khach san)
    L3  P1 + L1
    L4  P1 + L1 + L2

Chay: conda run -n stayreco python -I experiments/gate_location.py 1 2 3
"""
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data.preprocessor import simulate_cold_start, assign_groups, split_validation

GROUPS = ["cold_item", "cold", "cool", "warm"]
RATINGS = "data/tripadvisor/ratings.csv"
ITEMS = "data/tripadvisor/items.csv"
USERS = "data/tripadvisor/users.csv"

TEST_RATIO, COLD_USER_RATIO, COLD_ITEM_RATIO, MAX_COLD_N, VAL_RATIO = 0.2, 0.3, 0.20, 19, 0.5
K_GRID = [1, 3, 5, 10, 20, 40, 80]


def load():
    df = pd.read_csv(RATINGS, dtype={"user_id": str, "item_id": str})
    items = pd.read_csv(ITEMS, dtype={"item_id": str})
    users = pd.read_csv(USERS, dtype={"user_id": str})

    rx = re.compile(r"region_(\S+)")
    def hreg(s):
        m = rx.search(s or "")
        return m.group(1) if m else "unknown"
    items["hotel_region"] = items["description"].map(hreg)

    df = df.merge(items[["item_id", "hotel_region"]], on="item_id", how="left")
    df = df.merge(users[["user_id", "region"]].rename(
        columns={"region": "user_region"}), on="user_id", how="left")
    df["hotel_region"] = df["hotel_region"].fillna("unknown")
    df["user_region"] = df["user_region"].fillna("unknown")
    df["region_pair"] = df["user_region"] + "||" + df["hotel_region"]
    df["row_id"] = np.arange(len(df))
    return df


def shrunk(df_train, key, k, mu):
    g = df_train.groupby(key)["rating"].agg(["size", "mean"])
    return (g["size"] * g["mean"] + k * mu) / (g["size"] + k)


def pick_k(df_train, val, key, mu, y_val):
    best = (None, 1e9)
    for k in K_GRID:
        m = shrunk(df_train, key, k, mu)
        p = val[key].map(m).fillna(mu).values
        r = float(np.sqrt(np.mean((np.clip(p, 1, 5) - y_val) ** 2)))
        if r < best[1]:
            best = (k, r)
    return best[0]


def fit_ls(X, y):
    A = np.hstack([np.ones((len(X), 1)), X])
    c, *_ = np.linalg.lstsq(A, y, rcond=None)
    return c


def apply_ls(c, X):
    return np.hstack([np.ones((len(X), 1)), X]) @ c


def rmse(p, y):
    return float(np.sqrt(np.mean((np.clip(p, 1, 5) - y) ** 2)))


def run_seed(df, seed):
    tr, he = simulate_cold_start(df, test_ratio=TEST_RATIO,
                                 cold_user_ratio=COLD_USER_RATIO,
                                 max_cold_n=MAX_COLD_N,
                                 cold_item_ratio=COLD_ITEM_RATIO, seed=seed)
    he = assign_groups(he, tr)
    he = split_validation(he, val_ratio=VAL_RATIO, seed=seed)
    assert len(set(tr["row_id"]) & set(he["row_id"])) == 0, "RO RI"

    val, test = he[he["split"] == "val"], he[he["split"] == "test"]
    mu = tr["rating"].mean()
    yv, yt = val["rating"].values, test["rating"].values

    ks = {key: pick_k(tr, val, key, mu, yv)
          for key in ("item_id", "hotel_region", "region_pair")}
    maps = {key: shrunk(tr, key, ks[key], mu) for key in ks}

    def col(d, key):
        return (d[key].map(maps[key]).fillna(mu).values - mu).reshape(-1, 1)

    out = {}
    out["P1 tb khach san"] = rmse(test["item_id"].map(maps["item_id"]).fillna(mu).values, yt)
    out["L1 tb vung khach san"] = rmse(
        test["hotel_region"].map(maps["hotel_region"]).fillna(mu).values, yt)
    out["L2 tb cap vung"] = rmse(
        test["region_pair"].map(maps["region_pair"]).fillna(mu).values, yt)

    ytr = tr["rating"].values
    f = lambda d, keys: np.hstack([col(d, k) for k in keys])
    c3 = fit_ls(f(tr, ["item_id", "hotel_region"]), ytr)
    out["L3 = P1 + L1"] = rmse(apply_ls(c3, f(test, ["item_id", "hotel_region"])), yt)
    c4 = fit_ls(f(tr, ["item_id", "hotel_region", "region_pair"]), ytr)
    out["L4 = P1 + L1 + L2"] = rmse(apply_ls(c4, f(test, ["item_id", "hotel_region", "region_pair"])), yt)

    p1 = test["item_id"].map(maps["item_id"]).fillna(mu).values
    p4 = apply_ls(c4, f(test, ["item_id", "hotel_region", "region_pair"]))
    per = {}
    for g in GROUPS:
        m = (test["group"] == g).values
        if m.sum():
            per[g] = {"n": int(m.sum()), "P1": rmse(p1[m], yt[m]), "L4": rmse(p4[m], yt[m])}

    coef = {"tb_khach_san": float(c4[1]), "tb_vung_ks": float(c4[2]), "tb_cap_vung": float(c4[3])}
    return out, per, ks, coef


def main():
    seeds = [int(a) for a in sys.argv[1:]] or [1, 2, 3]
    df = load()
    print("%d dong | %d vung khach san | %d vung khach | %d cap vung" % (
        len(df), df["hotel_region"].nunique(), df["user_region"].nunique(),
        df["region_pair"].nunique()))
    print("user_region = 'unknown': %.1f%%" % (100 * (df["user_region"] == "unknown").mean()))
    print()

    O, P, C = [], [], []
    for s in seeds:
        print("=" * 72); print("SEED", s); print("=" * 72)
        o, p, k, c = run_seed(df, s)
        O.append(o); P.append(p); C.append(c)
        for a, b in o.items():
            print("   %-24s RMSE %.4f" % (a, b))
        print("   k chon tren validation:", k)
        print()

    print("=" * 72); print("TRUNG BINH %d SEED" % len(seeds)); print("=" * 72)
    keys = list(O[0].keys())
    means = {k: float(np.mean([o[k] for o in O])) for k in keys}
    for k in keys:
        v = [o[k] for o in O]
        print("   %-24s %.4f  +/- %.4f" % (k, np.mean(v), np.std(v, ddof=1) if len(v) > 1 else 0))
    print()

    base = means["P1 tb khach san"]
    print("CONG KIEM TRA — moc P1 = %.4f" % base)
    print("-" * 72)
    for k in keys:
        if k.startswith("P1"):
            continue
        d = base - means[k]
        wins = sum(1 for o in O if o[k] < o["P1 tb khach san"])
        verdict = "TOT HON" if d > 0.002 else ("ngang" if d > -0.002 else "KEM HON")
        print("   %-24s %+.4f  thang %d/%d  -> %s" % (k, d, wins, len(O), verdict))
    print()

    print("RMSE THEO NHOM:")
    print("   %-12s %8s %8s %8s" % ("nhom", "so dong", "P1", "L4"))
    for g in GROUPS:
        rows = [p[g] for p in P if g in p]
        if rows:
            print("   %-12s %8d %8.4f %8.4f" % (
                g, int(np.mean([r["n"] for r in rows])),
                np.mean([r["P1"] for r in rows]), np.mean([r["L4"] for r in rows])))
    print()
    print("HE SO HOI QUY cua L4:")
    for k in C[0]:
        print("   %-16s %+.4f" % (k, np.mean([c[k] for c in C])))


if __name__ == "__main__":
    main()

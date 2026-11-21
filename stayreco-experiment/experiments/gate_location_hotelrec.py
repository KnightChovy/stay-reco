# -*- coding: utf-8 -*-
"""CONG KIEM TRA cach 2 tren HOTELREC 20-core: tin hieu VI TRI co gia tri khong?

Vi sao chay lai tren HotelRec khi tren TripAdvisor da that bai:

    TripAdvisor: 56 vung  -> "trung binh vung" gan nhu la trung binh toan cuc,
                             tin hieu qua tho, that bai la de hieu.
    HotelRec   : 10 194 vung (ma dia diem TripAdvisor g*) -> moi vung la mot
                             thanh pho that. Day moi la phep thu cong bang.

HotelRec KHONG co nhan khau hoc (khong co vung cua khach), nen bo du doan
"cap vung khach x vung khach san" cua ban TripAdvisor khong dung duoc. Thay
vao do ta dung HE PHAN CAP VI TRI phia khach san:

    khach san  ->  thanh pho (ma g)  ->  vung hanh chinh (duoi cua truong location)

Cac bo du doan (chi dung TRAIN):
    P1  trung binh khach san co co ngot        <- MOC phai vuot
    L1  trung binh thanh pho co co ngot
    L2  trung binh vung hanh chinh co co ngot
    L3  P1 + L1
    L4  P1 + L1 + L2

Chay: conda run -n stayreco python -I experiments/gate_location_hotelrec.py 1 2 3
"""
import os
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data.preprocessor import simulate_cold_start, assign_groups, split_validation

GROUPS = ["cold_item", "cold", "cool", "warm"]
RATINGS = "D:/hotelrec20/ratings.csv"
ITEMS = "D:/hotelrec20/items.csv"

TEST_RATIO, COLD_USER_RATIO, COLD_ITEM_RATIO, MAX_COLD_N, VAL_RATIO = 0.2, 0.3, 0.20, 19, 0.5
K_GRID = [1, 3, 5, 10, 20, 40, 80]


def coarse(loc):
    """'New Bern North Carolina' -> 'North Carolina' (2 tu cuoi, xap xi tinh/bang).

    Du lieu location la ten dia danh TripAdvisor noi lai, dang
    '<thanh pho> <don vi hanh chinh ...>'. Hai tu cuoi la lop tho nhat on dinh.
    """
    t = str(loc).split()
    return " ".join(t[-2:]) if len(t) >= 2 else (t[0] if t else "unknown")


def load():
    df = pd.read_csv(RATINGS, dtype={"user_id": str, "item_id": str})
    items = pd.read_csv(ITEMS, dtype={"item_id": str})
    items["city"] = items["region"]
    items["admin"] = items["location"].map(coarse)
    df = df.merge(items[["item_id", "city", "admin"]], on="item_id", how="left")
    df["city"] = df["city"].fillna("unknown")
    df["admin"] = df["admin"].fillna("unknown")
    # simulate_cold_start sap xep theo "timestamp" de giu n rating DAU TIEN
    # cua moi user. HotelRec chi co 'date' (phan lon chinh xac den thang),
    # nen doi sang giay epoch. Cac review cung thang se dong hang; sort_values
    # on dinh nen thu tu trong thang la thu tu trong file goc.
    df["timestamp"] = pd.to_datetime(df["date"]).astype("int64") // 10 ** 9
    df["row_id"] = np.arange(len(df))
    return df, items


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
    # simulate_cold_start dung ignore_index=True -> phai kiem tra ro ri bang row_id
    assert len(set(tr["row_id"]) & set(he["row_id"])) == 0, "RO RI train/test"

    val, test = he[he["split"] == "val"], he[he["split"] == "test"]
    mu = tr["rating"].mean()
    yv, yt = val["rating"].values, test["rating"].values

    keys = ("item_id", "city", "admin")
    ks = {k: pick_k(tr, val, k, mu, yv) for k in keys}
    maps = {k: shrunk(tr, k, ks[k], mu) for k in keys}

    def col(d, key):
        return (d[key].map(maps[key]).fillna(mu).values - mu).reshape(-1, 1)

    out = {}
    out["P1 tb khach san"] = rmse(test["item_id"].map(maps["item_id"]).fillna(mu).values, yt)
    out["L1 tb thanh pho"] = rmse(test["city"].map(maps["city"]).fillna(mu).values, yt)
    out["L2 tb vung hanh chinh"] = rmse(test["admin"].map(maps["admin"]).fillna(mu).values, yt)

    ytr = tr["rating"].values
    f = lambda d, kk: np.hstack([col(d, k) for k in kk])
    c3 = fit_ls(f(tr, ["item_id", "city"]), ytr)
    out["L3 = P1 + L1"] = rmse(apply_ls(c3, f(test, ["item_id", "city"])), yt)
    c4 = fit_ls(f(tr, ["item_id", "city", "admin"]), ytr)
    out["L4 = P1 + L1 + L2"] = rmse(apply_ls(c4, f(test, ["item_id", "city", "admin"])), yt)

    p1 = test["item_id"].map(maps["item_id"]).fillna(mu).values
    p4 = apply_ls(c4, f(test, ["item_id", "city", "admin"]))
    per = {}
    for g in GROUPS:
        m = (test["group"] == g).values
        if m.sum():
            per[g] = {"n": int(m.sum()), "P1": rmse(p1[m], yt[m]), "L4": rmse(p4[m], yt[m])}

    coef = {"tb_khach_san": float(c4[1]), "tb_thanh_pho": float(c4[2]),
            "tb_vung_hc": float(c4[3])}
    return out, per, ks, coef


def main():
    seeds = [int(a) for a in sys.argv[1:]] or [1, 2, 3]
    df, items = load()
    print("%d review | %d khach san | %d thanh pho | %d vung hanh chinh"
          % (len(df), df["item_id"].nunique(), df["city"].nunique(), df["admin"].nunique()))
    cs = items.groupby("city").size()
    print("khach san moi thanh pho: trung vi %d, lon nhat %d, thanh pho chi 1 ks: %.1f%%"
          % (cs.median(), cs.max(), 100 * (cs == 1).mean()))
    print(flush=True)

    O, P, C = [], [], []
    for s in seeds:
        print("=" * 72); print("SEED", s); print("=" * 72, flush=True)
        o, p, k, c = run_seed(df, s)
        O.append(o); P.append(p); C.append(c)
        for a, b in o.items():
            print("   %-24s RMSE %.4f" % (a, b))
        print("   k chon tren validation:", k)
        print(flush=True)

    print("=" * 72); print("TRUNG BINH %d SEED" % len(seeds)); print("=" * 72)
    keys = list(O[0].keys())
    means = {k: float(np.mean([o[k] for o in O])) for k in keys}
    for k in keys:
        v = [o[k] for o in O]
        print("   %-24s %.4f  +/- %.4f"
              % (k, np.mean(v), np.std(v, ddof=1) if len(v) > 1 else 0))
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
            print("   %-12s %8d %8.4f %8.4f"
                  % (g, int(np.mean([r["n"] for r in rows])),
                     np.mean([r["P1"] for r in rows]), np.mean([r["L4"] for r in rows])))
    print()
    print("HE SO HOI QUY cua L4:")
    for k in C[0]:
        print("   %-16s %+.4f" % (k, np.mean([c[k] for c in C])))


if __name__ == "__main__":
    main()

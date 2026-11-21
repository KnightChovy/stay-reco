# -*- coding: utf-8 -*-
"""Tao tap con TripAdvisor KHOP CHINH XAC voi bai bao GNN (ma = mh = 12).

Khac prep_tripadvisor.py o hai diem quan trong:

 1. Loc HAI PHIA (tac gia >= 12 review VA khach san >= 12 review), lap di lap
    lai den diem bat dong — dung nhu preprocess.py:75-95 cua ho.
 2. Dem TAT CA review khi loc (ke ca review khong co diem Overall), dung nhu
    load_review_ids() cua ho. Chi bo review thieu diem o buoc cuoi.

Muc tieu kiem chung: 76,692 review / 1,287 khach san / 4,404 tac gia
(luan van Mrazova & Behun 2023).

Chay:  conda run -n stayreco python -I data/prep_tripadvisor_m12.py
"""
import collections
import gzip
import json
import os
import re

import pandas as pd

RAW = "data/tripadvisor_raw"
OUT = "data/tripadvisor_m12"
MIN_AUTHOR = 12
MIN_HOTEL = 12


def _slug(s):
    return re.sub(r"[^a-z0-9]+", "", str(s).lower())


def _rooms_band(n):
    if n is None:
        return "unknown"
    n = int(n)
    if n < 30:
        return "small"
    if n < 100:
        return "medium"
    if n < 300:
        return "large"
    return "xlarge"


def load_review_ids():
    """Luot 1: doc MOI review -> {review_id: (author_id, hotel_id)}."""
    reviews = {}
    with gzip.open(os.path.join(RAW, "reviews.json.gz"), "rt", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            d = json.loads(line)
            reviews[d["id"]] = (d["author_id"], d["hotel_id"])
    print(f"      doc duoc {len(reviews):,} review id")
    return reviews


def filter_once(reviews):
    by_a = collections.Counter()
    by_h = collections.Counter()
    for a, h in reviews.values():
        by_a[a] += 1
        by_h[h] += 1
    keep_a = {a for a, c in by_a.items() if c >= MIN_AUTHOR}
    keep_h = {h for h, c in by_h.items() if c >= MIN_HOTEL}
    return {r: (a, h) for r, (a, h) in reviews.items()
            if a in keep_a and h in keep_h}


def filter_to_fixpoint(reviews):
    """Loc lap lai cho den khi khong bo them review nao nua."""
    old = len(reviews)
    rnd = 1
    while True:
        reviews = filter_once(reviews)
        cnt = len(reviews)
        diff = old - cnt
        a = len({x[0] for x in reviews.values()})
        h = len({x[1] for x in reviews.values()})
        print(f"      vong {rnd}: {cnt:,} review  ({a:,} tac gia, {h:,} khach san)"
              f"  -bo {diff:,}")
        if diff == 0:
            return reviews
        old = cnt
        rnd += 1


def build_items(keep_hotels):
    rows = []
    with gzip.open(os.path.join(RAW, "hotels.json.gz"), "rt", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            h = json.loads(line)
            if h["id"] not in keep_hotels:
                continue
            tok = [
                "cat_" + _slug(h.get("category")),
                "type_" + _slug(h.get("type")),
                "region_%s" % h.get("region_id"),
                "rooms_" + _rooms_band(h.get("num_rooms")),
            ]
            stars = h.get("stars")
            if stars:
                tok.append("star_%d" % int(float(stars)))
            for a in (h.get("amenities") or []):
                tok.append("amenity_" + _slug(a))
            for lg in (h.get("languages") or []):
                tok.append("lang_" + _slug(lg))
            rows.append({"item_id": str(h["id"]), "description": " ".join(tok)})
    return pd.DataFrame(rows)


def build_ratings(keep_rids):
    """Luot 2: lay diem + thoi gian + trip_type cho cac review da chon."""
    rows = []
    trip = collections.defaultdict(collections.Counter)
    no_rating = 0
    with gzip.open(os.path.join(RAW, "reviews.json.gz"), "rt", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            r = json.loads(line)
            if r["id"] not in keep_rids:
                continue
            ov = (r.get("ratings") or {}).get("Overall")
            if ov is None:
                no_rating += 1
                continue
            date = r.get("stay_date") or r.get("created") or ""
            rows.append({
                "user_id": r["author_id"],
                "item_id": str(r["hotel_id"]),
                "rating": float(ov),
                "timestamp": pd.Timestamp(date).value // 10**9 if date else 0,
            })
            if r.get("trip_type"):
                trip[r["author_id"]][r["trip_type"]] += 1
    print(f"      bo {no_rating:,} review thieu diem Overall")
    return pd.DataFrame(rows), trip


def build_users(user_ids, trip):
    want = set(user_ids)
    home = {}
    with gzip.open(os.path.join(RAW, "authors.json.gz"), "rt", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            a = json.loads(line)
            if a["id"] in want:
                ht = a.get("hometown")
                home[a["id"]] = ht.split(",")[-1].strip() if ht else "unknown"
    rows = []
    for u in user_ids:
        tt = trip[u].most_common(1)
        rows.append({
            "user_id": u,
            "region": home.get(u, "unknown"),
            "trip_type": tt[0][0] if tt else "unknown",
        })
    return pd.DataFrame(rows)


def main():
    os.makedirs(OUT, exist_ok=True)

    print(f"[1/4] doc toan bo review id ...")
    reviews = load_review_ids()

    print(f"[2/4] loc hai phia >= {MIN_AUTHOR} / >= {MIN_HOTEL}, lap den diem bat dong ...")
    reviews = filter_to_fixpoint(reviews)

    n_r = len(reviews)
    authors = {x[0] for x in reviews.values()}
    hotels = {x[1] for x in reviews.values()}

    print()
    print("  KIEM CHUNG voi luan van:")
    for name, got, want in (("review", n_r, 76692),
                            ("khach san", len(hotels), 1287),
                            ("tac gia", len(authors), 4404)):
        mark = "KHOP" if got == want else f"LECH {got - want:+,}"
        print(f"    {name:10} : {got:>8,}  (luan van {want:,})  -> {mark}")
    print()

    print("[3/4] lay diem cho cac review da chon ...")
    ratings_df, trip = build_ratings(set(reviews.keys()))
    print(f"      {len(ratings_df):,} rating co diem")

    print("[4/4] dung items + users ...")
    items_df = build_items(hotels)
    items_df = items_df[items_df["item_id"].isin(set(ratings_df["item_id"]))]
    users_df = build_users(ratings_df["user_id"].unique(), trip)
    print(f"      {len(items_df):,} khach san, {len(users_df):,} user")

    ratings_df.to_csv(os.path.join(OUT, "ratings.csv"), index=False)
    items_df.to_csv(os.path.join(OUT, "items.csv"), index=False)
    users_df.to_csv(os.path.join(OUT, "users.csv"), index=False)

    n_u, n_i, n_r2 = len(users_df), len(items_df), len(ratings_df)
    print()
    print(f"Users {n_u:,} | Items {n_i:,} | Ratings {n_r2:,}")
    print(f"Sparsity: {1 - n_r2/(n_u*n_i):.4%}")
    print(f"Trung binh {n_r2/n_u:.1f} review/user, {n_r2/n_i:.1f} review/khach san")
    print()
    print("Phan bo so review moi user (quan trong cho cold-start):")
    c = ratings_df.groupby("user_id").size()
    print(c.describe().to_string())
    print()
    print(f"Da ghi vao {OUT}/")


if __name__ == "__main__":
    main()

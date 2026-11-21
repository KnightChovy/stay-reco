# -*- coding: utf-8 -*-
"""Chuyen TripAdvisor (3 file json.gz) sang 3 CSV dung dang repo can.

Nguon: github.com/elkablo/gnn-social-tripadvisor (Mrazova & Behun, 2023)
Du lieu goc dung cho nghien cuu hoc thuat.

Chay:  conda run -n stayreco python data/prep_tripadvisor.py --min-reviews=5
"""
import argparse
import collections
import gzip
import json
import os
import re

import pandas as pd

RAW = "data/tripadvisor_raw"
OUT = "data/tripadvisor"


def _slug(s):
    """Doi chuoi tu do thanh token an toan cho TF-IDF."""
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


def build_items():
    """hotels.json.gz -> items_df (item_id, description).

    description la chuoi token cach nhau bang dau cach, dung cho TF-IDF —
    cung dinh dang nhu _movie_description() dung cho MovieLens.
    """
    rows = []
    with gzip.open(os.path.join(RAW, "hotels.json.gz"), "rt", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            h = json.loads(line)
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


def count_reviews_per_author():
    """Luot 1: dem so review moi tac gia de biet ai du nguong."""
    c = collections.Counter()
    with gzip.open(os.path.join(RAW, "reviews.json.gz"), "rt", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            r = json.loads(line)
            if (r.get("ratings") or {}).get("Overall") is not None:
                c[r["author_id"]] += 1
    return c


def build_ratings(keep_authors):
    """Luot 2: giu lai review cua tac gia du nguong.

    Tra ve ratings_df va trip_type pho bien nhat cua tung tac gia.
    """
    rows = []
    trip = collections.defaultdict(collections.Counter)
    with gzip.open(os.path.join(RAW, "reviews.json.gz"), "rt", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            r = json.loads(line)
            a = r["author_id"]
            if a not in keep_authors:
                continue
            ov = (r.get("ratings") or {}).get("Overall")
            if ov is None:
                continue
            date = r.get("stay_date") or r.get("created") or ""
            rows.append({
                "user_id": a,
                "item_id": str(r["hotel_id"]),
                "rating": float(ov),
                "timestamp": pd.Timestamp(date).value // 10**9 if date else 0,
            })
            if r.get("trip_type"):
                trip[a][r["trip_type"]] += 1
    return pd.DataFrame(rows), trip


def build_users(user_ids, trip):
    """authors.json.gz + trip_type -> users_df (user_id, region, trip_type).

    CHU Y: du lieu nay KHONG co tuoi, gioi tinh hay nghe nghiep nhu MovieLens.
    Chi co hometown (55% co gia tri) va trip_type suy tu review.
    Day la BAN THICH NGHI, phai ghi ro trong bao cao.
    """
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
    ap = argparse.ArgumentParser()
    ap.add_argument("--min-reviews", type=int, default=5,
                    help="chi giu tac gia co it nhat ngan nay review")
    args = ap.parse_args()

    os.makedirs(OUT, exist_ok=True)

    print("[1/4] hotels.json -> items ...")
    items_df = build_items()
    print(f"      {len(items_df):,} khach san")

    print("[2/4] dem review moi tac gia ...")
    counts = count_reviews_per_author()
    keep = {a for a, c in counts.items() if c >= args.min_reviews}
    print(f"      giu {len(keep):,} tac gia (>= {args.min_reviews} review)")

    print("[3/4] reviews.json -> ratings ...")
    ratings_df, trip = build_ratings(keep)
    print(f"      {len(ratings_df):,} rating")

    print("[4/4] authors.json -> users ...")
    users_df = build_users(ratings_df["user_id"].unique(), trip)
    print(f"      {len(users_df):,} user")

    # Chi giu khach san thuc su xuat hien, de catalog khop voi du lieu
    items_df = items_df[items_df["item_id"].isin(set(ratings_df["item_id"]))]

    ratings_df.to_csv(os.path.join(OUT, "ratings.csv"), index=False)
    items_df.to_csv(os.path.join(OUT, "items.csv"), index=False)
    users_df.to_csv(os.path.join(OUT, "users.csv"), index=False)

    n_u, n_i, n_r = len(users_df), len(items_df), len(ratings_df)
    print()
    print(f"Users {n_u:,} | Items {n_i:,} | Ratings {n_r:,}")
    print(f"Sparsity: {1 - n_r/(n_u*n_i):.4%}")
    print(f"Trung binh {n_r/n_u:.1f} review/user, {n_r/n_i:.1f} review/khach san")
    print()
    print("region pho bien:")
    print(users_df["region"].value_counts().head(8).to_string())
    print()
    print("trip_type:")
    print(users_df["trip_type"].value_counts().to_string())
    print()
    print(f"Da ghi vao {OUT}/")


if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""Boc diem chi tiet theo tieu chi (sub-ratings) tu TripAdvisor.

Sinh data/tripadvisor/ratings_aspects.csv gom:
    user_id, item_id, rating, timestamp, + 6 cot tieu chi

Dung cung bo loc nhu prep_tripadvisor.py (tac gia >= min-reviews) nen so dong
phai khop ratings.csv (382,279 voi nguong 5).

Hai tieu chi "Check in / front desk" va "Business service" bi bo vi chi phu
~1.9% va ~1.3% — khong du de dung.

Chay:  conda run -n stayreco python -I data/prep_aspects.py --min-reviews=5
"""
import argparse
import collections
import gzip
import json
import os

import pandas as pd

RAW = "data/tripadvisor_raw"
OUT = "data/tripadvisor"

# 6 tieu chi co do phu >= 45%; ten cot trong file goc -> ten cot CSV
ASPECTS = {
    "Value": "asp_value",
    "Sleep Quality": "asp_sleep",
    "Service": "asp_service",
    "Rooms": "asp_rooms",
    "Location": "asp_location",
    "Cleanliness": "asp_clean",
}


def count_authors():
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


def build(keep):
    rows = []
    with gzip.open(os.path.join(RAW, "reviews.json.gz"), "rt", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            r = json.loads(line)
            a = r["author_id"]
            if a not in keep:
                continue
            rt = r.get("ratings") or {}
            ov = rt.get("Overall")
            if ov is None:
                continue
            date = r.get("stay_date") or r.get("created") or ""
            row = {
                "user_id": a,
                "item_id": str(r["hotel_id"]),
                "rating": float(ov),
                "timestamp": pd.Timestamp(date).value // 10**9 if date else 0,
            }
            for src, col in ASPECTS.items():
                v = rt.get(src)
                row[col] = float(v) if v is not None else None
            rows.append(row)
    return pd.DataFrame(rows)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--min-reviews", type=int, default=5)
    ap.add_argument("--out", default="ratings_aspects.csv")
    args = ap.parse_args()

    print("[1/2] dem review moi tac gia ...")
    counts = count_authors()
    keep = {a for a, c in counts.items() if c >= args.min_reviews}
    print(f"      giu {len(keep):,} tac gia (>= {args.min_reviews} review)")

    print("[2/2] boc rating + diem chi tiet ...")
    df = build(keep)
    print(f"      {len(df):,} dong")

    path = os.path.join(OUT, args.out)
    df.to_csv(path, index=False)

    print()
    print("Do phu tung tieu chi:")
    for col in ASPECTS.values():
        n = df[col].notna().sum()
        print(f"   {col:14} {n:>8,}  ({100*n/len(df):5.1f}%)")

    k = df[list(ASPECTS.values())].notna().sum(axis=1)
    print()
    print("So tieu chi duoc cham moi dong:")
    for i in range(7):
        c = int((k == i).sum())
        print(f"   {i} tieu chi : {c:>8,}  ({100*c/len(df):5.1f}%)")
    print()
    print(f"Co >= 1 tieu chi : {int((k >= 1).sum()):,}  ({100*(k>=1).mean():.1f}%)")
    print(f"Da ghi {path}")


if __name__ == "__main__":
    main()

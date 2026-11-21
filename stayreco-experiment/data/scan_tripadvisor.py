# -*- coding: utf-8 -*-
"""Quet reviews.json.gz de do do phu va phan bo truoc khi chuyen doi."""
import gzip
import json
import collections

PATH = "data/tripadvisor_raw/reviews.json.gz"

n = 0
has_overall = 0
has_trip = 0
trip = collections.Counter()
per_author = collections.Counter()
per_hotel = collections.Counter()
rating_dist = collections.Counter()
years = collections.Counter()

with gzip.open(PATH, "rt", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            r = json.loads(line)
        except Exception:
            continue
        n += 1
        ov = (r.get("ratings") or {}).get("Overall")
        if ov is not None:
            has_overall += 1
            rating_dist[ov] += 1
            per_author[r["author_id"]] += 1
            per_hotel[r["hotel_id"]] += 1
            d = r.get("created") or ""
            if len(d) >= 4:
                years[d[:4]] += 1
        tt = r.get("trip_type")
        if tt:
            has_trip += 1
            trip[tt] += 1

print(f"Tong review           : {n:,}")
print(f"Co rating Overall     : {has_overall:,}  ({100*has_overall/n:.1f}%)")
print(f"Co trip_type          : {has_trip:,}  ({100*has_trip/n:.1f}%)")
print(f"So tac gia (co rating): {len(per_author):,}")
print(f"So khach san          : {len(per_hotel):,}")
print()

print("Phan bo diem:")
for k in sorted(rating_dist):
    print(f"   {k} sao : {rating_dist[k]:>9,}  ({100*rating_dist[k]/has_overall:5.1f}%)")
print()

print("trip_type:")
for k, v in trip.most_common():
    print(f"   {k:14} {v:>9,}  ({100*v/has_trip:5.1f}%)")
print()

print("So tac gia theo so review (de chon nguong loc):")
bucket = collections.Counter()
for c in per_author.values():
    if c == 1:
        bucket["1"] += 1
    elif c <= 4:
        bucket["2-4"] += 1
    elif c <= 9:
        bucket["5-9"] += 1
    elif c <= 19:
        bucket["10-19"] += 1
    else:
        bucket[">=20"] += 1
for k in ["1", "2-4", "5-9", "10-19", ">=20"]:
    print(f"   {k:7} {bucket[k]:>9,}")
print()

for thr in (2, 3, 5, 10):
    keep = [a for a, c in per_author.items() if c >= thr]
    rows = sum(per_author[a] for a in keep)
    print(f"Loc tac gia >= {thr:2} review : {len(keep):>8,} tac gia, {rows:>10,} review")
print()

print("Nam gan nhat:")
for y in sorted(years)[-6:]:
    print(f"   {y}: {years[y]:>9,}")

# -*- coding: utf-8 -*-
"""VONG 2b: quet lai zip, xuat dung tap 20-core ra CSV dung duoc.

Tap giu lai = {dong : tac gia thuoc core20_users VA khach san thuoc core20_hotels}.
Dieu nay dung CHINH XAC bang mat na k-core, vi o vong cuoi khong con dong nao
bi bo -> moi dong con lai deu co ca hai phia dat nguong.

Xuat ra <thu_muc_ra>/
    ratings.csv   user_id,item_id,rating,date
    items.csv     item_id,region,name,location,description
    aspects.csv   user_id,item_id + 8 cot diem tieu chi (property_dict, thua)

LUU Y ve so khach san: bai bao bao 38 903 item cho 20-core, ta xuat 38 898.
Chenh 5 la do 5 khach san duoc dang duoi HAI URL khac nhau, cung ma dia diem
va cung ma khach san 'd', chi khac cach viet ten:
    Courtyard_Basel          = Courtyard_by_Marriott_Basel   (d1657424)
    Hotel_Savoy              = Savoy_Hotel                   (d228162)
    Hotel_Orphee             = Grand_Hotel_Orphee            (d265352)
    Hotel_Kyriad_Disneyland  = ..._Disneyland_Paris          (d487413)
    Ibis_Nuernberg_Altstadt  = ..._Altstadt_Hotel            (d234065)
Bai bao dem URL; ta dem khach san that (gop theo ma 'd'). So REVIEW khong doi
(2 222 373), chi danh tinh item cua 5 khach san nay la khac.

hotel_url co dang:
    Hotel_Review-g194775-d1121769-Reviews-Hotel_Baltic-Giulianova_Province...html
    -> region = g194775 (ma dia diem TripAdvisor), item_id = d1121769

Chay: conda run -n stayreco python -I data/extract_hotelrec.py <zip> <work> <ra> [K]
"""
import csv
import json
import os
import sys
import time
import zipfile
from hashlib import blake2b

import numpy as np

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

H0 = b'{"hotel_url": "'
A0 = b'", "author": "'
D0 = b'", "date": "'
R0 = b'", "rating": '
P0 = b'"property_dict": '
HEAD = 420

ASPECTS = ["service", "cleanliness", "value", "location", "sleep quality",
           "rooms", "check in / front desk", "business service"]


def parse_url(u):
    """Hotel_Review-g194775-d1121769-Reviews-Ten-Dia_Diem.html"""
    s = u[:-5] if u.endswith(".html") else u
    parts = s.split("-")
    region = parts[1] if len(parts) > 1 else "unknown"
    item = parts[2] if len(parts) > 2 else s
    try:
        i = parts.index("Reviews")
        name = parts[i + 1] if len(parts) > i + 1 else ""
        loc = parts[i + 2] if len(parts) > i + 2 else ""
    except ValueError:
        name, loc = "", ""
    return region, item, name, loc


def main():
    zp, work, out = sys.argv[1], sys.argv[2], sys.argv[3]
    K = int(sys.argv[4]) if len(sys.argv) > 4 else 20
    os.makedirs(out, exist_ok=True)

    keep_u = set(int(x) for x in np.load(os.path.join(work, "core%d_users.npy" % K)))
    keep_h = set(int(x) for x in np.load(os.path.join(work, "core%d_hotels.npy" % K)))
    print("giu %d nguoi dung, %d khach san" % (len(keep_u), len(keep_h)), flush=True)

    hid = {}
    with open(os.path.join(work, "hotels.txt"), "rb") as g:
        for i, line in enumerate(g):
            hid[line.rstrip(b"\n")] = i
    print("bang tra %d khach san" % len(hid), flush=True)

    fr = open(os.path.join(out, "ratings.csv"), "w", newline="", encoding="utf-8")
    fa = open(os.path.join(out, "aspects.csv"), "w", newline="", encoding="utf-8")
    wr = csv.writer(fr); wa = csv.writer(fa)
    wr.writerow(["user_id", "item_id", "rating", "date"])
    wa.writerow(["user_id", "item_id"] + ["asp_" + a.split()[0].replace("/", "") for a in ASPECTS])

    items = {}
    n = 0
    n_asp = 0
    t0 = time.time()

    with zipfile.ZipFile(zp) as z:
        with z.open(z.namelist()[0]) as f:
            for ln, line in enumerate(f):
                head = line[:HEAD]
                p = head.find(A0, 15)
                if p < 0:
                    continue
                hotel = head[15:p]
                hi = hid.get(hotel)
                if hi is None or hi not in keep_h:
                    continue
                q = head.find(D0, p + 14)
                if q < 0:
                    continue
                author = head[p + 14:q]
                uh = int.from_bytes(blake2b(author, digest_size=8).digest(), "little")
                if uh not in keep_u:
                    continue
                r = head.find(R0, q + 12)
                e = head.find(b",", r + 13)
                try:
                    rating = float(head[r + 13:e])
                except ValueError:
                    continue
                date = head[q + 12:q + 22].decode("ascii", "replace")

                url = hotel.decode("utf-8", "replace")
                region, item, name, loc = parse_url(url)
                uid = author.decode("utf-8", "replace")
                if item not in items:
                    items[item] = (region, name, loc)

                wr.writerow([uid, item, rating, date])

                k = line.rfind(P0)
                if k >= 0:
                    try:
                        d = json.loads(line[k + len(P0):].rstrip(b"}\n ") + b"}")
                    except Exception:
                        d = {}
                    if d:
                        wa.writerow([uid, item] + [d.get(a, "") for a in ASPECTS])
                        n_asp += 1

                n += 1
                if n % 250000 == 0:
                    print("   %8d dong giu | da quet %10d | %5.1f phut"
                          % (n, ln, (time.time() - t0) / 60), flush=True)

    fr.close(); fa.close()

    with open(os.path.join(out, "items.csv"), "w", newline="", encoding="utf-8") as g:
        w = csv.writer(g)
        w.writerow(["item_id", "region", "name", "location", "description"])
        for it, (region, name, loc) in sorted(items.items()):
            desc = "region_%s %s %s" % (region, name.replace("_", " "), loc.replace("_", " "))
            w.writerow([it, region, name.replace("_", " "), loc.replace("_", " "), desc])

    print()
    print("XONG vong 2 sau %.1f phut" % ((time.time() - t0) / 60))
    print("   review xuat    : %d" % n)
    print("   khach san xuat : %d" % len(items))
    print("   co diem tieu chi: %d (%.1f%%)" % (n_asp, 100 * n_asp / max(n, 1)))


if __name__ == "__main__":
    main()

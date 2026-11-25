# -*- coding: utf-8 -*-
"""VONG 1: quet HotelRec.zip (50,4 GB) de lay 3 cot can cho loc 20-core.

Khong giai nen ra dia. Doc truc tiep tu zip theo dong, cat chuoi thay vi
json.loads (thu tu field co dinh: hotel_url, author, date, rating, ...).

Luu y bo nho: 22 trieu tac gia neu luu dang chuoi se ton ~3,5 GB. Nen ta
luu HASH 64-bit (numpy uint64) -> 8 byte/dong, 50 trieu dong = 400 MB.
Xac suat trung hash voi 22 trieu khoa la ~1e-5, khong anh huong ket qua.
Vong 2 se dung lai chuoi thuc de xuat CSV.

Chay: conda run -n stayreco python -I data/scan_hotelrec.py <duong_dan_zip> <thu_muc_ra>
"""
import os
import sys
import time
import zipfile

import numpy as np

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

H0 = b'{"hotel_url": "'
A0 = b'", "author": "'
D0 = b'", "date": "'
R0 = b'", "rating": '

CHUNK = 4_000_000          # so dong moi khoi numpy
HEAD = 420                 # chi can dau dong, khong can doc het 'text'


def main():
    zp, out = sys.argv[1], sys.argv[2]
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 0   # 0 = het file
    os.makedirs(out, exist_ok=True)

    # Dung hashlib-free, nhanh hon: dict tra ve id tang dan, nhung chi cho
    # hotel (365k, nho). Tac gia thi dung hash(bytes) cua Python? Khong on
    # dinh giua cac lan chay -> ta dung int.from_bytes cua blake2b 8 byte.
    from hashlib import blake2b

    def ah(b):
        return int.from_bytes(blake2b(b, digest_size=8).digest(), "little")

    hotel_id = {}          # hotel_url bytes -> id nho (int32)
    a_parts, h_parts, r_parts = [], [], []
    a_buf = np.empty(CHUNK, dtype=np.uint64)
    h_buf = np.empty(CHUNK, dtype=np.int32)
    r_buf = np.empty(CHUNK, dtype=np.float32)

    n = 0          # tong dong hop le
    bad = 0        # dong khong parse duoc
    j = 0          # vi tri trong buffer
    t0 = time.time()

    with zipfile.ZipFile(zp) as z:
        member = z.namelist()[0]
        with z.open(member) as f:
            for line in f:
                head = line[:HEAD]
                if not head.startswith(H0):
                    bad += 1
                    continue
                p = head.find(A0, 15)
                if p < 0:
                    bad += 1
                    continue
                hotel = head[15:p]
                q = head.find(D0, p + 14)
                if q < 0:
                    bad += 1
                    continue
                author = head[p + 14:q]
                r = head.find(R0, q + 12)
                if r < 0:
                    bad += 1
                    continue
                e = head.find(b",", r + 13)
                try:
                    rating = float(head[r + 13:e])
                except ValueError:
                    bad += 1
                    continue

                hid = hotel_id.get(hotel)
                if hid is None:
                    hid = len(hotel_id)
                    hotel_id[hotel] = hid

                a_buf[j] = ah(author)
                h_buf[j] = hid
                r_buf[j] = rating
                j += 1
                n += 1

                if limit and n >= limit:
                    break

                if j == CHUNK:
                    a_parts.append(a_buf.copy()); h_parts.append(h_buf.copy())
                    r_parts.append(r_buf.copy()); j = 0
                    el = time.time() - t0
                    print("   %12d dong | %6.1f phut | %6.0f nghin dong/giay | %d khach san"
                          % (n, el / 60, n / el / 1000, len(hotel_id)), flush=True)

    if j:
        a_parts.append(a_buf[:j].copy()); h_parts.append(h_buf[:j].copy())
        r_parts.append(r_buf[:j].copy())

    a = np.concatenate(a_parts); h = np.concatenate(h_parts); r = np.concatenate(r_parts)
    np.save(os.path.join(out, "author_hash.npy"), a)
    np.save(os.path.join(out, "hotel_id.npy"), h)
    np.save(os.path.join(out, "rating.npy"), r)

    # Bang tra hotel id -> url, de vong 2 dung lai
    with open(os.path.join(out, "hotels.txt"), "wb") as g:
        for url, hid in sorted(hotel_id.items(), key=lambda kv: kv[1]):
            g.write(url + b"\n")

    el = time.time() - t0
    print()
    print("XONG vong 1 sau %.1f phut" % (el / 60))
    print("   review hop le : %d" % n)
    print("   dong loi      : %d" % bad)
    print("   khach san     : %d" % len(hotel_id))
    print("   tac gia (hash): %d" % len(np.unique(a)))
    print("   rating tb     : %.4f" % float(r.mean()))


if __name__ == "__main__":
    main()

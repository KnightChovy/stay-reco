# -*- coding: utf-8 -*-
"""VONG 2a: loc k-core tren ket qua quet vong 1 (thuan numpy, khong doc lai zip).

TAI LAP CHINH XAC Table 1 cua Antognini & Faltings (LREC 2020):
    5-core  2 012 162 nguoi | 312 081 ks | 21 108 245 tuong tac | thua 99.99664%
   20-core     72 603 nguoi |  38 903 ks |  2 222 373 tuong tac | thua 99.92132%

HAI DIEU KIEN de khop (bai bao khong noi, code tac gia khong cong bo —
kho README tren GitHub chi co README, khong co script):

  1. BO hai tai khoan gia. Truong 'author' suy ra tu URL ho so nguoi dung;
     khi thieu, bo thu thap ghi '/undefined' (1 193 017 review) hoac 'null'
     (23 889 review). Gop chung lai thanh 2 "sieu nguoi dung" 2,42% du lieu,
     keo theo hang nghin khach san le ra phai bi loai van song sot.
  2. Loc LAP LAI den diem bat dong (bo nguoi dung lam khach san tut xuong
     duoi k, va nguoc lai). 20-core can 34 vong.

Chay: conda run -n stayreco python -I data/core20_hotelrec.py <thu_muc_work> [K]
"""
import os
import sys
import time

import numpy as np

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# blake2b-8 cua b'/undefined' va b'null'
BAD_AUTHORS = (10258702450635650536, 7985457161556883059)


def main():
    work = sys.argv[1]
    K = int(sys.argv[2]) if len(sys.argv) > 2 else 20

    t0 = time.time()
    ah = np.load(os.path.join(work, "author_hash.npy"))
    h = np.load(os.path.join(work, "hotel_id.npy"))
    r = np.load(os.path.join(work, "rating.npy"))
    print("nap %d review trong %.1f giay" % (len(ah), time.time() - t0), flush=True)

    good = ~np.isin(ah, list(BAD_AUTHORS))
    print("bo %d review khong co ID nguoi dung (%.2f%%)"
          % ((~good).sum(), 100 * (~good).mean()), flush=True)
    ah, h, r = ah[good], h[good], r[good]
    del good

    ua, ai = np.unique(ah, return_inverse=True)
    nu, nh = len(ua), int(h.max()) + 1
    print("ban dau: %d review | %d nguoi dung | %d khach san"
          % (len(ai), nu, nh), flush=True)

    keep = np.ones(len(ai), dtype=bool)
    rnd = 0
    while True:
        rnd += 1
        uc = np.bincount(ai[keep], minlength=nu)
        hc = np.bincount(h[keep], minlength=nh)
        ok = keep & (uc[ai] >= K) & (hc[h] >= K)
        removed = int(keep.sum() - ok.sum())
        keep = ok
        print("   vong %2d: %10d review | bo %d" % (rnd, int(keep.sum()), removed),
              flush=True)
        if removed == 0:
            break

    uc = np.bincount(ai[keep], minlength=nu)
    hc = np.bincount(h[keep], minlength=nh)
    keep_users = ua[uc >= K]
    keep_hotels = np.flatnonzero(hc >= K)
    n = int(keep.sum())
    u, it = len(keep_users), len(keep_hotels)

    np.save(os.path.join(work, "core%d_users.npy" % K), keep_users)
    np.save(os.path.join(work, "core%d_hotels.npy" % K), keep_hotels)

    rr = r[keep]
    print()
    print("XONG loc %d-core sau %.1f phut (%d vong)" % (K, (time.time() - t0) / 60, rnd))
    print("   nguoi dung : %d" % u)
    print("   khach san  : %d" % it)
    print("   tuong tac  : %d" % n)
    print("   do thua    : %.5f%%" % (100 * (1 - n / (u * it))))
    print("   rating tb  : %.4f" % float(rr.mean()))


if __name__ == "__main__":
    main()

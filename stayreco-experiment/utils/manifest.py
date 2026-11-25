"""Ghi lại "lần chạy này là gì" vào results/run_meta_<tag>.json.

Vì sao cần: bảng số trong báo cáo phải truy được về đúng commit, đúng config,
đúng phiên bản thư viện đã sinh ra nó. Không có file này thì sáu tháng sau
(hoặc lúc phản biện) không ai dựng lại được con số, kể cả chính mình — đây là
tiêu chí "Artifacts Evaluated — Functional" của ACM (artifact phải *consistent
with the paper* và *exercisable*), và là khuyến nghị trung tâm của
Bellogín & Said (2021) về reproducibility trong recommender systems.

Phiên bản thư viện được ghi vì nó ĐỔI ĐƯỢC SỐ: MKL/BLAS khác nhau cho kết quả
khác nhau ở chữ số thập phân thứ 4-5 của RMSE.
"""

import json
import os
import platform
import subprocess
import sys
from datetime import datetime

TRACKED_PACKAGES = ["numpy", "pandas", "scipy", "scikit-learn", "scikit-surprise",
                    "matplotlib", "torch"]


def _git(*args):
    try:
        out = subprocess.run(["git", *args], capture_output=True, text=True,
                             timeout=10, cwd=os.path.dirname(os.path.dirname(
                                 os.path.abspath(__file__))))
        return out.stdout.strip() or None
    except Exception:
        return None


def _package_versions():
    from importlib import metadata
    versions = {}
    for name in TRACKED_PACKAGES:
        try:
            versions[name] = metadata.version(name)
        except metadata.PackageNotFoundError:
            versions[name] = None
    return versions


def _blas_info():
    """Thư viện BLAS đang dùng — ảnh hưởng tới chữ số thập phân cuối của RMSE.

    numpy >= 1.25 dùng np.__config__.show(mode="dicts"); bản cũ hơn dùng
    get_info("blas_opt"). Thử cả hai.
    """
    try:
        import numpy as np
        config = np.__config__
        if hasattr(config, "show"):
            dicts = config.show(mode="dicts")
            build = dicts.get("Build Dependencies", {})
            return {key: {k: v for k, v in val.items()
                          if k in ("name", "version", "openblas configuration")}
                    for key, val in build.items() if key in ("blas", "lapack")}
        return config.get_info("blas_opt") or {"note": "numpy không báo cáo blas_opt"}
    except Exception as exc:
        return {"error": f"{type(exc).__name__}: {exc}"}


def write(path, config, seeds, extra=None):
    """Ghi manifest. Gọi NGAY TRƯỚC khi chạy, để kể cả run lỗi cũng có dấu vết.

    Args:
        path:   đường dẫn file json
        config: dict các hằng số cấu hình đã DÙNG THẬT (không phải đọc lại config.py,
                vì CLI có thể đã ghi đè)
        seeds:  danh sách seed
        extra:  dict thông tin thêm (ví dụ lệnh chạy)
    """
    meta = {
        "timestamp": datetime.now().astimezone().isoformat(timespec="seconds"),
        "command": " ".join([os.path.basename(sys.argv[0]), *sys.argv[1:]]),
        "seeds": list(seeds),
        "git": {
            "commit": _git("rev-parse", "HEAD"),
            "branch": _git("rev-parse", "--abbrev-ref", "HEAD"),
            # Có thay đổi chưa commit không? Nếu có, con số này KHÔNG tái lập được
            # chỉ bằng commit hash → phải commit trước khi chạy bản dùng cho báo cáo.
            "dirty": bool(_git("status", "--porcelain")),
        },
        "config": config,
        "environment": {
            "python": sys.version.split()[0],
            "platform": platform.platform(),
            "packages": _package_versions(),
            "blas": _blas_info(),
        },
    }
    if extra:
        meta.update(extra)

    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(meta, fh, indent=2, ensure_ascii=False, default=str)

    if meta["git"]["dirty"]:
        print(f"⚠ Có thay đổi chưa commit — số của lần chạy này không tái lập được "
              f"chỉ từ commit {meta['git']['commit'][:8] if meta['git']['commit'] else '?'}")
    print(f"✓ Manifest: {path}")
    return meta

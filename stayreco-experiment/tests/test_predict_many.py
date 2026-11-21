"""predict_many() phải cho ra ĐÚNG số như predict() gọi từng cặp.

Vì sao test này quan trọng: predict_many() chỉ là tối ưu tốc độ để xếp hạng trên
toàn bộ catalog. Nếu nó lệch khỏi predict(), mọi số Precision@K / NDCG@K trong
báo cáo đều sai mà không có cách nào phát hiện bằng mắt. Test này chạy nhanh
(dataset tí hon) nên nên chạy trước mỗi lần chạy thí nghiệm.

    pytest tests/ -q
"""

import os
import sys

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.preprocessor import to_surprise_trainset
from models.cf_itemknn import ItemItemCF
from models.cf_svdpp import CollaborativeFilter, PlainSVD
from models.content_based import ContentBasedFilter
from models.demographic import DemographicFilter
from models.popularity import PopularityBaseline

N_USERS, N_ITEMS = 40, 25


@pytest.fixture(scope="module")
def toy():
    """Dataset tí hon nhưng có đủ các ca khó: user mới, item mới, user không rating."""
    rng = np.random.RandomState(0)
    rows = []
    for u in range(1, N_USERS + 1):
        # user 1-3 chỉ có 0-2 rating → ca cold user
        n = {1: 0, 2: 1, 3: 2}.get(u, rng.randint(5, 15))
        for i in rng.choice(np.arange(1, N_ITEMS - 4), size=n, replace=False):
            rows.append({"user_id": u, "item_id": int(i),
                         "rating": float(rng.randint(1, 6))})
    ratings = pd.DataFrame(rows)

    # 5 item cuối KHÔNG có rating nào → ca cold item (hotel mới)
    items = pd.DataFrame({
        "item_id": np.arange(1, N_ITEMS + 1),
        "description": [f"genre{i % 4} decade{i % 3} word{i}" for i in range(1, N_ITEMS + 1)],
    })
    users = pd.DataFrame({
        "user_id": np.arange(1, N_USERS + 1),
        "age_group": [f"a{u % 3}" for u in range(1, N_USERS + 1)],
        "gender": [f"g{u % 2}" for u in range(1, N_USERS + 1)],
        "occupation": [f"o{u % 4}" for u in range(1, N_USERS + 1)],
    })
    return ratings, items, users


@pytest.fixture(scope="module")
def pairs(toy):
    """Mọi cặp (user, item) — gồm cả cặp đã có trong train và cặp hoàn toàn mới."""
    ratings, items, _ = toy
    users = np.r_[ratings["user_id"].unique(), [999]]        # 999 = user chưa tồn tại
    grid = [(u, i) for u in users for i in items["item_id"]]
    return np.array([u for u, _ in grid]), np.array([i for _, i in grid])


def assert_same(model, users, items, name, tol=1e-9):
    """So predict_many() với predict() từng cặp.

    tol mặc định 1e-9 = "trùng khít" với số float64. LightGCN giữ embedding ở
    float32 (PyTorch) nên phép nhân ma trận và phép nhân từng cặp làm tròn khác
    nhau ở chữ số thứ 8 — đó là giới hạn của float32, không phải sai công thức.
    """
    batch = np.asarray(model.predict_many(users, items), dtype=float)
    one_by_one = np.array([float(model.predict(u, i)) for u, i in zip(users, items)])
    worst = np.abs(batch - one_by_one).max()
    assert worst < tol, (
        f"{name}: predict_many lệch khỏi predict tối đa {worst:.2e} "
        f"tại {np.abs(batch - one_by_one).argmax()} / {len(users)} cặp"
    )


def test_svdpp(toy, pairs):
    ratings, _, _ = toy
    model = CollaborativeFilter(n_factors=8, n_epochs=5, seed=1)
    model.fit(to_surprise_trainset(ratings))
    assert_same(model, *pairs, name="SVD++")


def test_svd(toy, pairs):
    ratings, _, _ = toy
    model = PlainSVD(n_factors=8, n_epochs=5, seed=1)
    model.fit(to_surprise_trainset(ratings))
    assert_same(model, *pairs, name="SVD")


def test_content(toy, pairs):
    ratings, items, _ = toy
    model = ContentBasedFilter(k_neighbors=5)
    model.fit(items, ratings)
    assert_same(model, *pairs, name="Content")


def test_itemknn(toy, pairs):
    ratings, _, _ = toy
    model = ItemItemCF(k_neighbors=5)
    model.fit(ratings)
    assert_same(model, *pairs, name="Item-Item CF")


def test_demographic(toy, pairs):
    ratings, _, users = toy
    model = DemographicFilter(group_cols=("age_group", "gender", "occupation"))
    model.fit(ratings, users)
    assert_same(model, *pairs, name="Demographic")


def test_popularity(toy, pairs):
    ratings, _, _ = toy
    model = PopularityBaseline()
    model.fit(ratings)
    assert_same(model, *pairs, name="Popularity")


def test_lightgcn(toy, pairs):
    torch = pytest.importorskip("torch")
    from models.lightgcn import LightGCN
    ratings, _, _ = toy
    model = LightGCN(n_factors=8, n_layers=2, n_epochs=20, seed=1)
    model.fit(ratings)
    assert_same(model, *pairs, name="LightGCN", tol=1e-5)   # embedding float32

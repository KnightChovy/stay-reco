"""Tiền xử lý: tách train/test và tạo cold-start scenarios."""

import pandas as pd
import numpy as np
from surprise import Dataset, Reader
from surprise.model_selection import train_test_split as surprise_split


def split_data(surprise_dataset, test_size=0.2, seed=42):
    """Tách train/test cho Surprise."""
    trainset, testset = surprise_split(surprise_dataset, test_size=test_size, random_state=seed)
    print(f"✓ Split: train={trainset.n_ratings}, test={len(testset)}")
    return trainset, testset


def count_user_interactions(df):
    """Đếm số tương tác n cho mỗi user (dùng cho α động).

    Returns:
        dict: {user_id: n}
    """
    counts = df.groupby("user_id").size().to_dict()
    return counts


def to_surprise_trainset(df, rating_scale=(1, 5)):
    """Chuyển DataFrame train sang Surprise trainset để train SVD++."""
    reader = Reader(rating_scale=rating_scale)
    data = Dataset.load_from_df(df[["user_id", "item_id", "rating"]], reader)
    return data.build_full_trainset()


def simulate_cold_start(df, test_ratio=0.2, cold_user_ratio=0.3, max_cold_n=19,
                        max_test_per_cold_user=20, cold_item_ratio=0.05, seed=42):
    """Tách train/test mô phỏng nền tảng mới (có cả cold users và cold items).

    MovieLens user nào cũng có ≥ 20 rating → không có cold user thật.
    Nên ta "cắt" lịch sử của một phần user để giả lập user mới:

    - Cold items (cold_item_ratio): giấu TOÀN BỘ rating → item không có trong train,
      giống hotel vừa đăng ký chưa ai đặt.
    - Simulated users (cold_user_ratio): chỉ giữ n rating ĐẦU TIÊN (theo thời gian)
      trong train, n ngẫu nhiên từ 0 → max_cold_n. Lấy tối đa max_test_per_cold_user
      rating còn lại làm test (để nhóm này không lấn át test set).
    - User còn lại: tách ngẫu nhiên test_ratio rating làm test.

    Returns:
        df_train, df_test: DataFrame (user_id, item_id, rating, ...)
    """
    rng = np.random.RandomState(seed)

    # 1. Cold items: đưa hết rating sang test
    items = df["item_id"].unique()
    cold_items = set(rng.choice(items, int(len(items) * cold_item_ratio), replace=False))
    is_cold_item = df["item_id"].isin(cold_items)
    test_parts = [df[is_cold_item]]
    rest = df[~is_cold_item]

    # 2. Chọn simulated users
    users = rest["user_id"].unique()
    sim_users = set(rng.choice(users, int(len(users) * cold_user_ratio), replace=False))

    train_parts = []
    for user_id, user_df in rest.groupby("user_id"):
        if user_id in sim_users:
            user_df = user_df.sort_values("timestamp")
            n_keep = rng.randint(0, max_cold_n + 1)
            train_parts.append(user_df.iloc[:n_keep])
            remaining = user_df.iloc[n_keep:]
            n_test = min(max_test_per_cold_user, len(remaining))
            test_parts.append(remaining.sample(n_test, random_state=rng))
        else:
            is_test = rng.rand(len(user_df)) < test_ratio
            train_parts.append(user_df[~is_test])
            test_parts.append(user_df[is_test])

    df_train = pd.concat(train_parts, ignore_index=True)
    df_test = pd.concat(test_parts, ignore_index=True)

    print("✓ Cold-start simulation:")
    print(f"  Cold items: {len(cold_items)} (giấu toàn bộ rating)")
    print(f"  Simulated users: {len(sim_users)} (chỉ giữ 0-{max_cold_n} rating đầu tiên)")
    print(f"  Train: {len(df_train)}, Test: {len(df_test)}")

    return df_train, df_test


def split_validation(df_test, val_ratio=0.5, seed=42):
    """Tách tập đã giấu thành VALIDATION và TEST.

    Validation dùng để CHỌN THAM SỐ (α_max, σ₁, ngưỡng safety layer...).
    Test chỉ dùng 1 lần cuối để chấm điểm. Chọn tham số trên test là gian lận số liệu.

    Returns:
        df_test có thêm cột 'split' nhận giá trị "val" hoặc "test"
    """
    rng = np.random.RandomState(seed)
    df_test = df_test.copy()
    df_test["split"] = np.where(rng.rand(len(df_test)) < val_ratio, "val", "test")
    counts = df_test["split"].value_counts().to_dict()
    print(f"✓ Validation split: val={counts.get('val', 0)}, test={counts.get('test', 0)}")
    return df_test


def assign_groups(df_test, df_train, warm_min=20, cold_max=5):
    """Gán nhóm cold-start cho mỗi dòng test theo n (số rating của user trong train).

    - cold_item: item không có rating nào trong train
    - warm (n ≥ 20), cool (5 ≤ n < 20), cold (n < 5)

    Returns:
        df_test có thêm cột n, item_n, group
    """
    user_n = df_train.groupby("user_id").size()
    item_n = df_train.groupby("item_id").size()

    df_test = df_test.copy()
    df_test["n"] = df_test["user_id"].map(user_n).fillna(0).astype(int)
    df_test["item_n"] = df_test["item_id"].map(item_n).fillna(0).astype(int)

    df_test["group"] = np.select(
        [df_test["item_n"] == 0, df_test["n"] >= warm_min, df_test["n"] >= cold_max],
        ["cold_item", "warm", "cool"],
        default="cold",
    )
    return df_test

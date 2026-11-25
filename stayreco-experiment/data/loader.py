"""Load dataset cho thực nghiệm.

Dùng Surprise library để load. Hai lựa chọn:
1. movielens-100k: nhỏ, test nhanh (100K ratings)
2. File CSV tự chuẩn bị: user_id, item_id, rating, [timestamp]

Mọi ID đều được đổi sang string để CF / Content / Demo dùng chung một kiểu khóa.
"""

import os
import re
import pandas as pd
from surprise import Dataset, Reader
from surprise.builtin_datasets import get_dataset_dir


def load_movielens():
    """Load MoviLens 100K từ Surprise (có sẵn, không cần download)."""
    data = Dataset.load_builtin("ml-100k", prompt=False)
    print("✓ Loaded MovieLens 100K")
    return data


def load_movielens_full():
    """Load MovieLens 100K dạng DataFrame, đủ dữ liệu cho cả 3 model.

    MovieLens đóng vai "hotel" để test pipeline trước khi có dataset hotel:
      - ratings  → CF (SVD++)
      - items    → Content: thể loại phim + thập niên  (thay cho mô tả hotel)
      - users    → Demographic: tuổi, giới tính, nghề   (thay cho tuổi, quốc tịch, loại chuyến)

    Returns:
        ratings_df: user_id, item_id, rating, timestamp
        items_df:   item_id, description
        users_df:   user_id, age_group, gender, occupation
    """
    load_movielens()  # đảm bảo đã download
    folder = os.path.join(get_dataset_dir(), "ml-100k", "ml-100k")

    ratings_df = pd.read_csv(
        os.path.join(folder, "u.data"), sep="\t",
        names=["user_id", "item_id", "rating", "timestamp"],
        dtype={"user_id": str, "item_id": str},
    )

    genres = pd.read_csv(os.path.join(folder, "u.genre"), sep="|", names=["genre", "idx"])["genre"].tolist()
    items_df = pd.read_csv(
        os.path.join(folder, "u.item"), sep="|", encoding="latin-1",
        names=["item_id", "title", "release_date", "video_date", "url"] + genres,
        dtype={"item_id": str},
    )
    items_df["description"] = items_df.apply(lambda row: _movie_description(row, genres), axis=1)

    users_df = pd.read_csv(
        os.path.join(folder, "u.user"), sep="|",
        names=["user_id", "age", "gender", "occupation", "zip"],
        dtype={"user_id": str},
    )
    users_df["age_group"] = pd.cut(
        users_df["age"], bins=[0, 17, 24, 34, 44, 54, 200],
        labels=["<18", "18-24", "25-34", "35-44", "45-54", "55+"],
    ).astype(str)

    print(f"  Users: {len(users_df)}, Items: {len(items_df)}, Ratings: {len(ratings_df)}")
    return (
        ratings_df,
        items_df[["item_id", "description"]],
        users_df[["user_id", "age_group", "gender", "occupation"]],
    )


def _movie_description(row, genres):
    """Ghép thể loại + thập niên thành 1 đoạn text, vd: "genre_action genre_scifi decade_1990"."""
    tokens = ["genre_" + re.sub(r"[^a-z]", "", g.lower()) for g in genres if row[g] == 1]
    year = re.search(r"(\d{4})", str(row["release_date"]))
    if year:
        tokens.append(f"decade_{int(year.group(1)) // 10 * 10}")
    return " ".join(tokens)


def load_csv(filepath, rating_scale=(1, 5)):
    """Load dataset từ file CSV.

    CSV cần có ít nhất 3 cột: user_id, item_id, rating
    Có thể thêm: timestamp, user_age, user_country, trip_type,
                  hotel_description, hotel_amenities, ...

    Args:
        filepath: đường dẫn tới file CSV
        rating_scale: (min, max) rating

    Returns:
        surprise.Dataset
    """
    df = pd.read_csv(filepath)

    # Cột tối thiểu cho Surprise
    required = ["user_id", "item_id", "rating"]
    for col in required:
        assert col in df.columns, f"Thiếu cột '{col}' trong CSV"

    reader = Reader(rating_scale=rating_scale)
    data = Dataset.load_from_df(df[required], reader)

    print(f"✓ Loaded {filepath}")  
    print(f"  Users: {df['user_id'].nunique()}")
    print(f"  Items: {df['item_id'].nunique()}")
    print(f"  Ratings: {len(df)}")
    print(f"  Sparsity: {1 - len(df) / (df['user_id'].nunique() * df['item_id'].nunique()):.2%}")

    return data, df


def load_hotel_features(filepath):
    """Load features khách sạn cho Content-Based.

    CSV cần có: item_id, description, amenities, star_rating, location, ...
    """
    df = pd.read_csv(filepath)
    assert "item_id" in df.columns, "Thiếu cột 'item_id'"
    print(f"✓ Loaded hotel features: {len(df)} hotels")
    return df


def load_user_demographics(filepath):
    """Load thông tin nhân khẩu cho Demographic filtering.

    CSV cần có: user_id, age_group, country, trip_type
    """
    df = pd.read_csv(filepath)
    assert "user_id" in df.columns, "Thiếu cột 'user_id'"
    print(f"✓ Loaded user demographics: {len(df)} users")
    return df


def load_tripadvisor(folder="data/tripadvisor"):
    """Load TripAdvisor đã tiền xử lý — trả về cùng dạng load_movielens_full().

    Nguồn: github.com/elkablo/gnn-social-tripadvisor
    (Mrázová & Behún, 2023). Dữ liệu dùng cho nghiên cứu học thuật.
    Chạy data/prep_tripadvisor.py để sinh 3 file CSV trước.

    ⚠️ KHÁC MovieLens ở phần Demographic: dữ liệu này KHÔNG có tuổi, giới tính
    hay nghề nghiệp. Chỉ dựng được 2 cột — region (suy từ hometown, 55% có giá
    trị) và trip_type (loại chuyến đi phổ biến nhất của người đó). Đây là BẢN
    THÍCH NGHI, phải ghi rõ khi báo cáo: Demographic ở đây yếu hơn trên
    MovieLens vì chỉ có một chiều địa lý thay vì ba chiều nhân khẩu.

    Returns:
        ratings_df: user_id, item_id, rating, timestamp
        items_df:   item_id, description
        users_df:   user_id, region, trip_type
    """
    ratings_df = pd.read_csv(os.path.join(folder, "ratings.csv"),
                             dtype={"user_id": str, "item_id": str})
    items_df = pd.read_csv(os.path.join(folder, "items.csv"),
                           dtype={"item_id": str})
    users_df = pd.read_csv(os.path.join(folder, "users.csv"),
                           dtype={"user_id": str})

    print(f"  Users: {len(users_df):,}, Items: {len(items_df):,}, "
          f"Ratings: {len(ratings_df):,}")
    return (
        ratings_df,
        items_df[["item_id", "description"]],
        users_df[["user_id", "region", "trip_type"]],
    )

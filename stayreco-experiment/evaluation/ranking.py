"""Đánh giá xếp hạng trên TOÀN BỘ catalog (top-N recommendation).

════════════════════════════════════════════════════════════════════════════
VÌ SAO CÓ FILE NÀY — lỗi mà nó sửa
════════════════════════════════════════════════════════════════════════════
Cách đo CŨ (evaluation/metrics.py, các hàm *_within_rated) chỉ xếp hạng trong
những item đã có mặt trong test set — tức là item mà user ĐÃ rating. Hệ quả:

  • Rổ ứng viên trung bình chỉ ~20 item, trong đó ~55% là item user thích,
    nên đoán bừa đã được P@10 ≈ 0.47 và NDCG@10 ≈ 0.84.
  • Mọi phương pháp dồn vào dải 0.88–0.89 → metric mất khả năng phân biệt.
  • Hotel mới (chưa ai rating) KHÔNG BAO GIỜ có trong rổ → đúng cái mà đề tài
    cold-start muốn chứng minh lại nằm ngoài phép đo.

Krichene & Rendle (KDD 2020), "On Sampled Metrics for Item Recommendation":
metric tính trên tập ứng viên bị thu hẹp KHÔNG nhất quán với metric thật, và
có thể đảo ngược kết luận "A tốt hơn B". Khuyến nghị của họ: đừng lấy mẫu.

Cách đo ĐÚNG, cài trong file này:

    Rổ ứng viên = TẤT CẢ item trong catalog mà user chưa rating trong train
                  (giống production: khách chưa đặt khách sạn nào trong số đó)
    Liên quan   = item nằm trong tập đánh giá của user và rating >= ngưỡng
    → xếp rổ theo điểm dự đoán, chấm Precision/Recall/NDCG/Coverage @K

Quy ước theo Herlocker et al. (2004) và Cremonesi et al. (2010):
  • Chỉ tính cho user có >= 1 item liên quan (user không có thì không chấm được).
  • Item user đã rating trong TRAIN bị loại khỏi rổ — gợi ý lại chỗ khách vừa ở
    không phải là gợi ý.
  • Item trong tập đánh giá nhưng rating < ngưỡng VẪN ở trong rổ và tính là
    gợi ý sai nếu lọt top-K (ta biết chắc user không thích).
  • Relevance NHỊ PHÂN cho NDCG (liên quan / không), không dùng rating làm gain:
    với rổ hàng nghìn item thì gain theo số sao làm IDCG phụ thuộc vào việc user
    tình cờ chấm bao nhiêu phim 5 sao, gây nhiễu khi so giữa các nhóm.
"""

import numpy as np
import pandas as pd

RELEVANCE_THRESHOLD = 4.0   # rating >= 4 (trên 5) = user thật sự thích


def build_candidate_frame(df_train, df_eval, catalog_items,
                          threshold=RELEVANCE_THRESHOLD, df_exclude=None,
                          max_users=0, seed=42):
    """Dựng bảng ứng viên: mỗi dòng là một cặp (user, hotel user CHƯA rating).

    Args:
        df_train:      DataFrame train (user_id, item_id, rating). Dùng để ĐẾM
                       n / item_n — phải là train vì đó là tất cả những gì model
                       nhìn thấy lúc huấn luyện.
        df_eval:       DataFrame tập đánh giá (test hoặc validation), có cột rating
        catalog_items: mảng toàn bộ item_id của catalog (gồm cả hotel chưa ai rating)
        threshold:     rating >= ngưỡng này thì coi là user thích
        max_users:     >0 thì chỉ chấm ngẫu nhiên ngần này user, để rổ không
                       phình quá lớn trên dataset nhiều user. Vẫn xếp hạng trên
                       TOÀN catalog cho mỗi user được chọn — đây là lấy mẫu TẬP
                       ĐÁNH GIÁ, không phải lấy mẫu rổ ứng viên, nên không vi
                       phạm Krichene & Rendle (2020).
        seed:          seed cho việc lấy mẫu user ở trên.
        df_exclude:    DataFrame các cặp cần LOẠI khỏi rổ. None → dùng df_train.
                       Khi chấm trên test, nên truyền train + validation: item
                       nằm trong validation ta đã biết đáp án nhưng nó không
                       thuộc tập đang chấm, để lại trong rổ chỉ gây nhiễu.

    Returns:
        frame: DataFrame (user_id, item_id, n, item_n, relevant) đã sort theo user.
        n_relevant: Series {user_id: số item liên quan} — mẫu số của Recall@K
    """
    catalog = np.asarray(sorted(set(catalog_items)))
    if df_exclude is None:
        df_exclude = df_train

    # Chỉ chấm user có ít nhất 1 item liên quan trong tập đánh giá
    relevant_pairs = df_eval[df_eval["rating"] >= threshold]
    n_relevant = relevant_pairs.groupby("user_id").size()
    users = np.asarray(sorted(n_relevant.index))

    if max_users and len(users) > max_users:
        rng = np.random.RandomState(seed)
        users = np.sort(rng.choice(users, max_users, replace=False))
        n_relevant = n_relevant.loc[users]
        print(f"  (lấy mẫu {max_users:,} user để chấm xếp hạng)")

    # Item mỗi user đã rating (train, và cả validation nếu được truyền) → loại khỏi rổ
    train_seen = df_exclude.groupby("user_id")["item_id"].apply(set).to_dict()

    user_col, item_col = [], []
    for user_id in users:
        seen = train_seen.get(user_id, ())
        candidates = catalog[~np.isin(catalog, list(seen))] if seen else catalog
        user_col.append(np.full(len(candidates), user_id))
        item_col.append(candidates)

    frame = pd.DataFrame({
        "user_id": np.concatenate(user_col),
        "item_id": np.concatenate(item_col),
    })

    # n / item_n đếm trên train — giống lúc serve thật (chưa biết tương lai)
    user_n = df_train.groupby("user_id").size()
    item_n = df_train.groupby("item_id").size()
    frame["n"] = frame["user_id"].map(user_n).fillna(0).astype(int)
    frame["item_n"] = frame["item_id"].map(item_n).fillna(0).astype(int)

    # Nhãn: cặp nào là "user thật sự thích"
    relevant_set = set(zip(relevant_pairs["user_id"], relevant_pairs["item_id"]))
    frame["relevant"] = [
        (u, i) in relevant_set for u, i in zip(frame["user_id"], frame["item_id"])
    ]

    print(f"✓ Rổ ứng viên (toàn catalog): {len(users)} user × ~{len(frame) // len(users)} "
          f"hotel = {len(frame):,} cặp; {frame['relevant'].sum():,} cặp liên quan")
    return frame, n_relevant


def rank_metrics(frame, pred, n_relevant, top_k=(5, 10, 20), n_catalog=None):
    """Chấm Precision@K, Recall@K, NDCG@K, Coverage@K trên rổ toàn catalog.

    Args:
        frame:      output của build_candidate_frame(), cột user_id/item_id/relevant
        pred:       mảng điểm dự đoán, cùng thứ tự với frame
        n_relevant: Series {user_id: số item liên quan}
        top_k:      các giá trị K cần báo cáo
        n_catalog:  tổng số item của catalog (mẫu số Coverage@K).
                    None → dùng số item duy nhất xuất hiện trong frame.

    Returns:
        dict {"p@5": ..., "r@5": ..., "ndcg@5": ..., "cov@5": ..., ...}
    """
    pred = np.asarray(pred, dtype=float)
    users = frame["user_id"].to_numpy()
    items = frame["item_id"].to_numpy()
    relevant = frame["relevant"].to_numpy()

    # Sắp xếp: nhóm theo user, trong mỗi user thì điểm cao lên trước.
    # Tie-break bằng item_id để kết quả KHÔNG phụ thuộc thứ tự dòng đầu vào —
    # nếu không, mô hình trả về điểm bằng nhau cho mọi hotel (ví dụ Popularity
    # với hotel chưa ai rating) sẽ cho số khác nhau mỗi lần chạy.
    order = np.lexsort((items, -pred, users))
    users_s = users[order]
    items_s = items[order]
    relevant_s = relevant[order]

    # Biên của từng user trong mảng đã sort
    starts = np.flatnonzero(np.r_[True, users_s[1:] != users_s[:-1]])
    ends = np.r_[starts[1:], len(users_s)]
    user_ids = users_s[starts]
    n_rel = n_relevant.reindex(user_ids).to_numpy()

    if n_catalog is None:
        n_catalog = len(np.unique(items))

    # Hệ số giảm dần theo vị trí: 1/log2(rank+2), rank tính từ 0
    max_k = max(top_k)
    discount = 1.0 / np.log2(np.arange(max_k) + 2)

    # Ma trận (số user × max_k): top-max_k của mỗi user có liên quan không.
    # `filled` đánh dấu ô thật sự có gợi ý — user nào có ít hơn max_k ứng viên
    # (gần như không xảy ra với catalog hàng nghìn item, nhưng phải xử lý đúng).
    # Dùng mask thay vì giá trị sentinel vì item_id có thể là chuỗi.
    hits = np.zeros((len(starts), max_k), dtype=bool)
    top_items = np.empty((len(starts), max_k), dtype=items_s.dtype)
    filled = np.zeros((len(starts), max_k), dtype=bool)
    for row, (start, end) in enumerate(zip(starts, ends)):
        take = min(max_k, end - start)
        hits[row, :take] = relevant_s[start:start + take]
        top_items[row, :take] = items_s[start:start + take]
        filled[row, :take] = True

    out = {}
    for k in top_k:
        hit_k = hits[:, :k]
        n_hits = hit_k.sum(axis=1)

        # Precision@K: trong K gợi ý, bao nhiêu cái user thích.
        # Chia cho K là đúng ở đây vì rổ có hàng nghìn item → mọi user đều đủ K.
        out[f"p@{k}"] = float(np.mean(n_hits / k))

        # Recall@K: trong những item user thích, bắt được bao nhiêu phần
        out[f"r@{k}"] = float(np.mean(n_hits / n_rel))

        # NDCG@K với relevance nhị phân.
        # IDCG = trường hợp lý tưởng: min(K, số item liên quan) cái đúng xếp đầu.
        dcg = (hit_k * discount[:k]).sum(axis=1)
        ideal_len = np.minimum(n_rel, k).astype(int)
        idcg = np.cumsum(discount[:k])[ideal_len - 1]
        out[f"ndcg@{k}"] = float(np.mean(dcg / idcg))

        # Coverage@K: bao nhiêu % catalog từng lọt top-K của ít nhất 1 user.
        # Đây là metric sống còn của đề tài: hotel mới có được hiển thị không?
        shown = top_items[:, :k][filled[:, :k]]
        out[f"cov@{k}"] = float(len(np.unique(shown)) / n_catalog)

    return out


def rank_metrics_by_group(frame, pred, n_relevant, user_groups,
                          top_k=(5, 10, 20), n_catalog=None):
    """Như rank_metrics() nhưng tách theo nhóm cold-start của USER.

    Lưu ý khác biệt so với cách đo cũ: xếp hạng là bài toán theo USER, nên nhóm
    phải gán cho user (dựa trên n của user), không gán cho từng dòng. Vì vậy ở
    đây KHÔNG có nhóm "cold_item" — tình trạng hotel mới được đo bằng
    Coverage@K và bằng cold_item_share() dưới đây.

    Args:
        user_groups: dict {user_id: tên nhóm} hoặc Series cùng ý nghĩa
    """
    groups = pd.Series(user_groups)
    out = {}
    for group, members in groups.groupby(groups):
        mask = frame["user_id"].isin(set(members.index)).to_numpy()
        if not mask.any():
            continue
        sub_users = frame.loc[mask, "user_id"].unique()
        out[group] = {
            "n_users": len(sub_users),
            **rank_metrics(frame[mask], pred[mask],
                           n_relevant.reindex(sub_users), top_k, n_catalog),
        }
    return out


def cold_item_share(frame, pred, top_k=(5, 10, 20)):
    """Tỷ lệ gợi ý trong top-K là hotel MỚI (item_n == 0, chưa ai rating).

    Vì sao cần: đóng góp chính của StayReco là giải cold-start HAI PHÍA. Nhưng
    Precision@K chỉ đo phía user — một hệ thống không bao giờ hiện hotel mới vẫn
    có Precision cao. Chỉ số này đo trực tiếp phía hotel: trong 10 ô hiển thị,
    bao nhiêu ô dành cho hotel chưa ai đặt.

    KHÔNG phải "càng cao càng tốt" — đẩy toàn hotel mới lên thì Precision sập.
    Đọc nó CÙNG Precision@K: tốt = giữ Precision mà vẫn chia được chỗ cho hotel mới.

    Ngoài newitem@K còn trả về ba chỉ số trả lời câu "hotel mới được hiện lên
    có ĐÚNG là hotel user thích không, hay chỉ được chèn vào cho có?":

      newprec@K   trong các ô top-K dành cho hotel mới, bao nhiêu % là hotel
                  user thật sự thích trong tập đánh giá. NaN nếu không hiện
                  hotel mới nào (không có gì để đo).
      newrecall@K trong mọi cặp (user, hotel mới) mà user thích, bao nhiêu %
                  lọt vào top-K.
      newbase     mốc ngẫu nhiên của newprec: tỷ lệ cặp (user, hotel mới) trong
                  rổ là cặp user thích. newprec > newbase nghĩa là phương pháp
                  chọn hotel mới TỐT HƠN chọn bừa.
    """
    pred = np.asarray(pred, dtype=float)
    users = frame["user_id"].to_numpy()
    items = frame["item_id"].to_numpy()
    is_new = (frame["item_n"].to_numpy() == 0)
    relevant = frame["relevant"].to_numpy().astype(bool)

    order = np.lexsort((items, -pred, users))
    users_s, is_new_s, rel_s = users[order], is_new[order], relevant[order]
    starts = np.flatnonzero(np.r_[True, users_s[1:] != users_s[:-1]])
    ends = np.r_[starts[1:], len(users_s)]

    max_k = max(top_k)
    new_flags = np.zeros((len(starts), max_k), dtype=bool)
    new_hits = np.zeros((len(starts), max_k), dtype=bool)
    filled = np.zeros((len(starts), max_k), dtype=bool)
    for row, (start, end) in enumerate(zip(starts, ends)):
        take = min(max_k, end - start)
        new_flags[row, :take] = is_new_s[start:start + take]
        new_hits[row, :take] = is_new_s[start:start + take] & rel_s[start:start + take]
        filled[row, :take] = True

    n_new_pairs = int(is_new.sum())
    n_new_rel = int((is_new & relevant).sum())
    out = {"newbase": (n_new_rel / n_new_pairs) if n_new_pairs else float("nan")}
    for k in top_k:
        shown = int(new_flags[:, :k].sum())
        hits = int(new_hits[:, :k].sum())
        out[f"newitem@{k}"] = float(shown / filled[:, :k].sum())
        out[f"newprec@{k}"] = (hits / shown) if shown else float("nan")
        out[f"newrecall@{k}"] = (hits / n_new_rel) if n_new_rel else float("nan")
    return out

"""Score each customer's eligible hotels with the served two-sided formula, and evaluate that same formula.

`Scorer` holds the three components fitted on one set of ratings (SVD++, TF-IDF content, demographic) and blends them
with `weights.weights`. `recommend` uses it on every rating to publish the lists; `evaluate` fits it on the paper's
cold-start split and measures it, against single-component baselines, with the paper's own protocol code
(stayreco-experiment/data/preprocessor.py and evaluation/ranking.py, imported rather than copied). What is measured is
exactly what is served.
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd

from components import CollaborativeFilter, ContentBasedFilter, DemographicFilter
from reco_db import fold
from styles import hotel_styles
from weights import weights

HERE = Path(__file__).resolve().parent
# The paper's protocol: next to this file in the Docker image, a sibling folder in the repository.
for _paper in (HERE / "paper", HERE.parent / "stayreco-experiment"):
    if _paper.exists():
        sys.path.append(str(_paper))
        break

MIN_RATINGS = 50
DEMO_COLS = ["gender", "age_group", "country"]
SVDPP = dict(n_factors=50, n_epochs=30, lr=0.005, reg=0.02)
# Hotels stored per customer. Search orders by this list; hotels past it fall back to the default order.
TOP_K = 100
# A hotel whose cheapest room is more than this over the stated budget per night is ranked after the others.
BUDGET_SLACK = 1.2
# The paper's split: 20% of hotels lose every rating, 30% of guests keep only their first 0-19 stays.
SPLIT = dict(test_ratio=0.2, cold_user_ratio=0.3, max_cold_n=19, cold_item_ratio=0.2)
K = 10
# How much the stated preferences still count for a guest with stays: PREF_GAIN * PREF_K / (n + PREF_K) after n rated
# stays (a guest with none gets them in full). The tuned pipeline of 2026-11-23 picked gain 0.5 with K = 3.
PREF_GAIN = 0.5
PREF_K = 3
# A hotel the guest stayed at and rated at least LIKED_AGAIN is suggested again ("Bạn đã ở đây…"); one rated below
# DISLIKED is never suggested to them.
LIKED_AGAIN = 4.0
DISLIKED = 3.0

AMENITY_WORDS = {
    "pool": "hồ bơi", "view": "view biển view sông ban công", "breakfast": "bữa sáng",
    "spa": "spa massage", "quiet": "yên tĩnh", "tub": "bồn tắm",
    "shuttle": "đưa đón sân bay", "parking": "chỗ đậu xe",
}
# The travel style ids of the preferences screen and onboarding, in words the hotel text uses.
STYLE_WORDS = {
    "resort": "khu nghỉ dưỡng ven biển hồ bơi spa villa thư giãn bãi biển riêng",
    "nature": "nhà gỗ rừng thông sinh thái thiên nhiên yên tĩnh trekking vườn núi",
    "foodie": "phố cổ ẩm thực quán ăn chợ đêm văn hoá di sản nấu ăn",
    "business": "trung tâm công tác phòng họp bàn làm việc wifi tốc độ cao doanh nhân",
    "family": "gia đình trẻ em khu vui chơi phòng gia đình rộng hồ bơi trẻ em",
    "chill": "homestay cà phê chụp ảnh thiết kế đẹp decor vintage góc check-in",
}
STYLE_LABELS = {
    "resort": "nghỉ dưỡng", "nature": "thiên nhiên", "foodie": "ẩm thực & văn hoá",
    "business": "công tác", "family": "gia đình", "chill": "cà phê & chụp ảnh",
}
PREFERENCE_KEYS = ("likedHotels", "favouriteCity", "roomAmenities", "preferredViews", "travelStyles")


def _split(value):
    return [part.strip() for part in (value or "").split(",") if part.strip()]


def cities_of(prefs):
    """The cities the customer picked (onboarding keeps them all; the preferences page keeps one), folded."""
    picked = _split(prefs.get("preferredCities")) or _split(prefs.get("favouriteCity"))
    return {fold(city) for city in picked}


def budget_of(prefs):
    try:
        value = float(prefs.get("budgetPerNight") or "")
        return value if value > 0 else None
    except ValueError:
        return None


class Scorer:
    """The served formula fitted on one set of ratings."""

    def __init__(self, ratings, hotels, customers, amenities, seed=42):
        self.hotels = hotels
        self.amenities = amenities
        self.user_n = ratings.groupby("user_id").size()
        self.item_n = ratings.groupby("item_id").size()
        self.cf = None
        if len(ratings) >= MIN_RATINGS:
            from surprise import Dataset, Reader

            self.cf = CollaborativeFilter(**SVDPP, seed=seed)
            self.cf.model.verbose = False
            self.cf.fit(Dataset.load_from_df(
                ratings[["user_id", "item_id", "rating"]], Reader(rating_scale=(1, 5))
            ).build_full_trainset())
        self.content = ContentBasedFilter(hotels, ratings[ratings["item_id"].isin(hotels["item_id"])])
        self.demographic = DemographicFilter(group_cols=DEMO_COLS, shrinkage=5)
        self.demographic.fit(ratings, customers[["user_id", *DEMO_COLS]])
        self.texts = hotels.set_index("item_id")["text"].to_dict()
        self.names = dict(zip(hotels["item_id"], hotels["name"]))
        self.cities = dict(zip(hotels["item_id"], hotels["city"]))
        # The styles each hotel is (styles.py), the same reading the onboarding hotel step uses.
        self.styles = {item: hotel_styles(text) for item, text in self.texts.items()}
        self.prefs = dict(zip(customers["user_id"], customers["preferences"]))
        liked = ratings[(ratings["rating"] >= 4) & ratings["item_id"].isin(self.content.index)]
        self.liked = {user: list(zip(group["item_id"], group["rating"])) for user, group in liked.groupby("user_id")}
        # What each guest gave each hotel they stayed at: a liked one may be suggested again, a disliked one not.
        self.own = {(u, i): float(r) for u, i, r in ratings[["user_id", "item_id", "rating"]].itertuples(index=False)}
        self.disliked = {}
        for (u, i), r in self.own.items():
            if r < DISLIKED:
                self.disliked.setdefault(u, set()).add(i)
        self.item_mean = ratings.groupby("item_id")["rating"].mean()
        self.global_mean = float(ratings["rating"].mean()) if len(ratings) else 3.0

    def profile(self, prefs):
        """The preferences as a query in the hotel text's vocabulary."""
        return fold(" ".join(filter(None, [
            prefs.get("favouriteCity"),
            *(STYLE_WORDS.get(style) for style in _split(prefs.get("travelStyles"))),
            *(self.amenities.get(key, AMENITY_WORDS.get(key, key)) for key in _split(prefs.get("roomAmenities"))),
            *(self.texts.get(item) for item in _split(prefs.get("likedHotels"))),
            *(self.amenities.get(view) for view in _split(prefs.get("preferredViews"))),
        ])))

    def components(self, user, items):
        """Component predictions and weights of one user over `items`."""
        prefs = self.prefs.get(user, {})
        has_prefs = any(prefs.get(key) for key in PREFERENCE_KEYS)
        users = [user] * len(items)
        a, b, g = weights(self.user_n.get(user, 0), self.item_n.reindex(items, fill_value=0).to_numpy(),
                          has_prefs, use_cf=self.cf is not None)
        cf = self.cf.predict_many(users, items) if self.cf is not None else np.zeros(len(items))
        content = self.content.predict(user, items, self.profile(prefs), pref_gain=PREF_GAIN, pref_k=PREF_K)
        demo = self.demographic.predict_many(users, items)
        served = np.round(np.clip(a * cf + b * content + g * demo, 1, 5), 3)
        return dict(cf=cf, content=content, demo=demo, served=served,
                    a=np.broadcast_to(a, len(items)), b=np.broadcast_to(b, len(items)),
                    g=np.broadcast_to(g, len(items)))

    def popularity(self, items):
        return self.item_mean.reindex(items).fillna(self.global_mean).to_numpy()

    def reason(self, user, item, a, b, g, *, away=False):
        """One line the guest can read: which part of the score carried this hotel.

        `away`: the hotel is outside the cities the guest picked, so it is listed after them and the line says why it
        is there at all.
        """
        new = "Khách sạn mới trên StayReco. " if self.item_n.get(item, 0) == 0 else ""
        if away:
            new = "Ngoài điểm đến bạn chọn. " + new
        if user is None:
            return new.strip() or "Được khách StayReco đánh giá cao."
        mine = self.own.get((user, item))
        if mine is not None and mine >= LIKED_AGAIN:
            return new + f"Bạn đã ở đây và chấm {mine:.1f}★."
        if a >= max(b, g) and a > 0:
            return new + "Khách có gu giống bạn đánh giá cao nơi này."
        if b >= g:
            liked = self.liked.get(user)
            if liked:
                index = self.content.index
                sims = (self.content.vectors[index[item]] @ self.content.vectors[[index[i] for i, _ in liked]].T)
                best, rating = liked[int(np.argmax(sims.toarray().ravel()))]
                if best != item:
                    return new + f"Giống {self.names.get(best, 'nơi')} mà bạn đã chấm {rating:.1f}★."
            prefs = self.prefs.get(user, {})
            parts = []
            # Only the chosen styles this hotel actually is: a homestay is not "nghỉ dưỡng" because the guest chose it.
            styles = [STYLE_LABELS[s] for s in _split(prefs.get("travelStyles"))
                      if s in STYLE_LABELS and s in self.styles.get(item, ())]
            if styles:
                parts.append("phong cách " + ", ".join(styles))
            city = self.cities.get(item, "")
            if city and fold(city) in cities_of(prefs):
                parts.append(f"ở {city}")
            if parts:
                return new + "Hợp sở thích của bạn: " + "; ".join(parts) + "."
            return new + "Mô tả khớp với những gì bạn tìm."
        return new + "Được khách cùng nhóm tuổi, giới tính và quốc tịch với bạn đánh giá cao."


def recommend(scorer, customers, booked, top_k=TOP_K):
    """Yields (customer, hotel, score, rank, reason): the top-K per customer, then the signed-out list.

    `booked` holds the hotels each customer has a stay coming up or under way at (reco_db.load_booked): those are left
    out, as are hotels they rated below DISLIKED. A hotel they stayed at and liked stays in the list and may come back
    ("Bạn đã ở đây…"); the score decides its place, as for any other hotel. Search shows every hotel anyway. Nothing is
    removed for taste: hotels of none of the travel styles the customer chose come after the ones that are, hotels
    outside the cities picked after the ones in them, and a hotel well over the budget per night after all of those,
    so the list leads with what was asked for and still has the rest.
    """
    hotels = scorer.hotels
    if hotels.empty:
        return
    min_price = hotels.set_index("item_id")["min_price"]
    city_of = hotels.set_index("item_id")["city"].map(fold)
    for user, prefs in [(None, {}), *zip(customers["user_id"], customers["preferences"])]:
        skip = set(booked.get(user, ())) | scorer.disliked.get(user, set())
        items = hotels.loc[~hotels["item_id"].isin(skip), "item_id"].to_numpy()
        if not len(items):
            continue
        c = scorer.components(user, items)
        budget = budget_of(prefs)
        over = (min_price.reindex(items).fillna(0).to_numpy() > budget * BUDGET_SLACK) if budget else np.zeros(len(items))
        cities = cities_of(prefs)
        away = ~city_of.reindex(items).isin(cities).to_numpy() if cities else np.zeros(len(items), dtype=bool)
        chosen = {s for s in _split(prefs.get("travelStyles")) if s in STYLE_LABELS}
        off_style = (np.array([not (scorer.styles.get(i, set()) & chosen) for i in items])
                     if chosen else np.zeros(len(items), dtype=bool))
        # np.lexsort sorts by the last key first: within budget, then of a chosen style, then in a city picked, then
        # by score. Style before city: a resort lover is better served by a resort elsewhere than a kids' club nearby.
        order = np.lexsort((items, -c["served"], away, off_style, over))[:top_k]
        for rank, i in enumerate(order, 1):
            yield (user, items[i], float(c["served"][i]), rank,
                   scorer.reason(user, items[i], c["a"][i], c["b"][i], c["g"][i], away=bool(away[i])))


def _predict_pairs(scorer, users, items):
    """Component and baseline predictions for arbitrary (user, hotel) pairs, grouped by user."""
    users, items = np.asarray(users, dtype=object), np.asarray(items, dtype=object)
    out = {key: np.zeros(len(users)) for key in ("served", "cf", "content", "pop")}
    for user in pd.unique(users):
        pos = np.flatnonzero(users == user)
        c = scorer.components(user, items[pos])
        out["served"][pos] = c["served"]
        out["cf"][pos] = c["cf"] if scorer.cf is not None else np.nan
        out["content"][pos] = c["content"]
        out["pop"][pos] = scorer.popularity(items[pos])
    return out


def evaluate(ratings, hotels, customers, amenities, seed=42, log=print):
    """The paper's protocol on the app's data, applied to the served formula and three baselines.

    Returns (headline metrics of the served formula, per-method comparison, split sizes), or None when there are too
    few ratings or nobody in the held-out set liked a hotel.
    """
    from data.preprocessor import simulate_cold_start
    from evaluation.ranking import RELEVANCE_THRESHOLD, build_candidate_frame, cold_item_share, rank_metrics

    catalog = hotels["item_id"].to_numpy()
    ratings = ratings[ratings["item_id"].isin(catalog)]
    if len(ratings) < MIN_RATINGS:
        log(f"Evaluation skipped: {len(ratings)} ratings of bookable hotels (need {MIN_RATINGS}).")
        return None
    train, test = simulate_cold_start(ratings, seed=seed, **SPLIT)
    if not (test["rating"] >= RELEVANCE_THRESHOLD).any():
        log("Evaluation skipped: nobody in the held-out set rated a hotel 4 or more.")
        return None
    scorer = Scorer(train, hotels, customers, amenities, seed)
    on_test = _predict_pairs(scorer, test["user_id"], test["item_id"])
    frame, n_rel = build_candidate_frame(train, test, catalog)
    on_frame = _predict_pairs(scorer, frame["user_id"], frame["item_id"])

    cold = frame["item_n"].to_numpy() == 0
    n_cold = len(set(frame.loc[cold, "item_id"]))
    names = {"served": "StayReco two-sided (served)", "cf": "CF only (SVD++)",
             "content": "Content only", "pop": "Popularity"}
    comparison = {}
    for key, name in names.items():
        if np.isnan(on_test[key]).any():
            continue
        rm = rank_metrics(frame, on_frame[key], n_rel, top_k=(K,), n_catalog=len(catalog))
        ci = cold_item_share(frame, on_frame[key], top_k=(K,))
        error = on_test[key] - test["rating"].to_numpy()
        comparison[name] = {
            "rmse": float(np.sqrt(np.mean(error ** 2))), "mae": float(np.mean(np.abs(error))),
            "precision": rm[f"p@{K}"], "recall": rm[f"r@{K}"], "ndcg": rm[f"ndcg@{K}"],
            "new_share": ci[f"newitem@{K}"],
            "coldstart_coverage": _cold_coverage(frame, on_frame[key], n_cold),
        }
    metrics = {**comparison[names["served"]], "k": K, "threshold": RELEVANCE_THRESHOLD}
    split = {**SPLIT, "train": len(train), "test": len(test), "ranked_users": int(len(n_rel)),
             "catalog": int(len(catalog)), "hidden_or_new_hotels": n_cold}
    return metrics, comparison, split


def _cold_coverage(frame, pred, n_cold):
    """Share of the hotels nobody rated in train that reach some guest's top-K at least once."""
    if not n_cold:
        return float("nan")
    df = pd.DataFrame({"u": frame["user_id"].to_numpy(), "i": frame["item_id"].to_numpy(), "p": pred,
                       "cold": frame["item_n"].to_numpy() == 0})
    top = df.sort_values(["u", "p", "i"], ascending=[True, False, True]).groupby("u").head(K)
    return float(top.loc[top["cold"], "i"].nunique() / n_cold)

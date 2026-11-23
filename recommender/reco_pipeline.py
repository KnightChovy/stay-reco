"""The paper's recommender, run on the app's data.

Everything that decides a score comes from stayreco-experiment/, imported rather than copied, so the production
numbers are the paper's method and a fix there is a fix here:

    CF            models/cf_svdpp.py         SVD++ (Surprise), same hyperparameters as the paper
    Content       models/content_based.py    TF-IDF over the hotel text, item-based kNN on rating deviations
    Demographic   models/demographic.py      group mean per hotel, shrunk to the hotel mean
    Weights       utils/alpha_scheduler.py   compute_two_stage_alpha: α = n_u/(n_u+k) · m_i/(m_i+k'),
                                             π = n_u/(n_u+k_c), γ = 0 for a hotel nobody rated
    Protocol      data/preprocessor.py       simulate_cold_start + split_validation (the paper's split)
                  evaluation/ranking.py      full-catalogue P/R/NDCG@K and the new-hotel share (New@K)

Two things are added here because the app has data the paper's datasets did not:

1. The preferences screen. A guest who picked travel styles, amenities and a city is matched to hotel text by the
   content model's own TF-IDF space, and `has_preferences` is passed to the weight rule (π = 1, as the scheduler
   already supports). Whether to use them, and how strongly, is chosen on validation like every other parameter, so
   if they do not help the grid turns them off.
2. A knowledge pre-filter on the stored list (Burke 2000, as in the project's design): a hotel whose cheapest room is
   well over the guest's stated budget per night is not recommended. Availability depends on dates, so the API and
   the assistant check it at query time.
"""

import itertools
import sys
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pandas as pd

EXPERIMENT = Path(__file__).resolve().parent.parent / "stayreco-experiment"
sys.path.insert(0, str(EXPERIMENT))

from data.preprocessor import simulate_cold_start, split_validation, to_surprise_trainset  # noqa: E402
from evaluation.ranking import RELEVANCE_THRESHOLD, build_candidate_frame, cold_item_share, rank_metrics  # noqa: E402
from models.cf_svdpp import CollaborativeFilter  # noqa: E402
from models.content_based import ContentBasedFilter  # noqa: E402
from models.demographic import DemographicFilter  # noqa: E402
from models.paper_baselines import TWO_STAGE_GRID  # noqa: E402
from models.popularity import PopularityBaseline  # noqa: E402
from utils.alpha_scheduler import compute_fixed_alpha, compute_two_stage_alpha  # noqa: E402

from reco_db import fold  # noqa: E402

# Same values as stayreco-experiment/config.py, the ones the paper's numbers come from.
SVDPP = dict(n_factors=50, n_epochs=30, lr=0.005, reg=0.02)
CONTENT_K = 30
DEMO_COLS = ("age_group", "country", "trip_type")
DEMO_SHRINKAGE = 5
# The paper's split: 20% of hotels lose every rating, 30% of guests keep only their first 0-19.
SPLIT = dict(test_ratio=0.2, cold_user_ratio=0.3, max_cold_n=19, cold_item_ratio=0.2)
K = 10

# How the preference match fades as the guest's own history grows: half strength at PREF_K stays.
PREF_K = 3.0
PREF_GRID = [(False, 0.0), (True, 0.25), (True, 0.5), (True, 1.0)]
# Budget pre-filter: the cheapest room may be this much over the stated budget per night.
BUDGET_SLACK = 1.2

# The ids of the preferences screen (frontend .../account/preferences/page.tsx) in words the hotel text uses.
STYLE_WORDS = {
    "resort": "khu nghỉ dưỡng ven biển hồ bơi spa villa thư giãn bãi biển riêng",
    "nature": "nhà gỗ rừng thông sinh thái thiên nhiên yên tĩnh trekking vườn núi",
    "foodie": "phố cổ ẩm thực quán ăn chợ đêm văn hoá di sản nấu ăn",
    "business": "trung tâm công tác phòng họp bàn làm việc wifi tốc độ cao doanh nhân",
    "family": "gia đình trẻ em khu vui chơi phòng gia đình rộng hồ bơi trẻ em",
    "chill": "homestay cà phê chụp ảnh thiết kế đẹp decor vintage góc check-in",
}
STYLE_LABELS = {
    "resort": "nghỉ dưỡng",
    "nature": "thiên nhiên",
    "foodie": "ẩm thực & văn hoá",
    "business": "công tác",
    "family": "gia đình",
    "chill": "cà phê & chụp ảnh",
}
AMENITY_WORDS = {
    "pool": "hồ bơi",
    "view": "view biển view sông ban công",
    "breakfast": "bữa sáng",
    "spa": "spa massage",
    "quiet": "yên tĩnh",
    "tub": "bồn tắm",
    "shuttle": "đưa đón sân bay",
    "parking": "chỗ đậu xe",
}


def preference_text(prefs):
    """The preferences screen as a query in the hotel text's vocabulary; '' when nothing useful is filled in."""
    words = []
    for style in (prefs.get("travelStyles") or "").split(","):
        words.append(STYLE_WORDS.get(style.strip(), ""))
    for amenity in (prefs.get("roomAmenities") or "").split(","):
        words.append(AMENITY_WORDS.get(amenity.strip(), ""))
    city = (prefs.get("favouriteCity") or "").strip()
    if city:
        words.append(f"{city} {city}")
    return " ".join(w for w in words if w).strip()


def budget_of(prefs):
    try:
        value = float(prefs.get("budgetPerNight") or "")
        return value if value > 0 else None
    except ValueError:
        return None


@dataclass
class Params:
    k_user: float = 40.0
    k_item: float = 5.0
    k_c: float = 1.0
    use_prefs: bool = True
    pref_gain: float = 0.5

    def as_dict(self):
        return dict(k_user=self.k_user, k_item=self.k_item, k_c=self.k_c,
                    use_prefs=self.use_prefs, pref_gain=self.pref_gain)


@dataclass
class Components:
    """The three predictors of the paper, plus the preference match, fitted on one set of ratings."""

    hotels: pd.DataFrame
    customers: pd.DataFrame
    seed: int = 42
    user_n: dict = field(default_factory=dict)
    item_n: dict = field(default_factory=dict)

    def fit(self, ratings):
        self.ratings = ratings
        self.cf = CollaborativeFilter(**SVDPP, seed=self.seed)
        self.cf.model.verbose = False
        self.cf.fit(to_surprise_trainset(ratings))

        self.content = ContentBasedFilter(k_neighbors=CONTENT_K)
        self.content.fit(self.hotels[["item_id", "text"]], ratings, text_column="text")

        self.demo = DemographicFilter(group_cols=DEMO_COLS, shrinkage=DEMO_SHRINKAGE)
        self.demo.fit(ratings, self.customers[["user_id", *DEMO_COLS]])

        self.pop = PopularityBaseline()
        self.pop.fit(ratings)

        self.user_n = ratings.groupby("user_id").size().to_dict()
        self.item_n = ratings.groupby("item_id").size().to_dict()
        self._fit_preferences()
        return self

    def _fit_preferences(self):
        """z-score of the cosine between each guest's preference text and every hotel, in the content model's space."""
        vectorizer = self.content.vectorizer
        item_vectors = vectorizer.transform(self.hotels["text"].fillna(""))
        self.item_index = {iid: i for i, iid in enumerate(self.hotels["item_id"])}
        self.pref_z = {}
        for row in self.customers.itertuples():
            text = preference_text(row.preferences)
            if not text:
                continue
            sims = (item_vectors @ vectorizer.transform([text]).T).toarray().ravel()
            sd = sims.std()
            if sd > 0:
                self.pref_z[row.user_id] = (sims - sims.mean()) / sd

    def table(self, users, items):
        """Component scores and evidence counts for (user, hotel) pairs, the input of `blend`."""
        users = np.asarray(users)
        items = np.asarray(items)
        idx = np.fromiter((self.item_index.get(i, -1) for i in items), dtype=np.int64, count=len(items))
        pref = np.zeros(len(users))
        has_pref = np.zeros(len(users), dtype=bool)
        for pos in range(len(users)):
            z = self.pref_z.get(users[pos])
            if z is not None and idx[pos] >= 0:
                pref[pos] = z[idx[pos]]
                has_pref[pos] = True
        return pd.DataFrame({
            "user_id": users,
            "item_id": items,
            "svdpp": self.cf.predict_many(users, items),
            "content": self.content.predict_many(users, items),
            "demo": self.demo.predict_many(users, items),
            "pop": self.pop.predict_many(users, items),
            "pref_z": pref,
            "has_pref": has_pref,
            "n": [self.user_n.get(u, 0) for u in users],
            "item_n": [self.item_n.get(i, 0) for i in items],
        })


def blend(t, p: Params):
    """The two-sided rule over a component table. Returns (prediction, α, β, γ, content used)."""
    n = t["n"].to_numpy()
    has_pref = t["has_pref"].to_numpy() & p.use_prefs
    content = t["content"].to_numpy()
    if p.use_prefs and p.pref_gain:
        content = content + p.pref_gain * t["pref_z"].to_numpy() * (PREF_K / (n + PREF_K))

    keys = np.column_stack([n, t["item_n"].to_numpy(), has_pref.astype(int)])
    uniq, inv = np.unique(keys, axis=0, return_inverse=True)
    w = np.array([[v["alpha"], v["beta"], v["gamma"]] for v in (
        compute_two_stage_alpha(int(un), item_n=int(im), k_user=p.k_user, k_item=p.k_item, k_c=p.k_c,
                                has_preferences=bool(hp), zero_gamma_cold_item=True)
        for un, im, hp in uniq)])[inv.ravel()]
    pred = w[:, 0] * t["svdpp"].to_numpy() + w[:, 1] * content + w[:, 2] * t["demo"].to_numpy()
    return np.clip(pred, 1.0, 5.0), w[:, 0], w[:, 1], w[:, 2], content


def _rmse(pred, true):
    return float(np.sqrt(np.mean((np.asarray(pred) - np.asarray(true)) ** 2)))


def tune(val_table, val_ratings):
    """Grid search on validation by RMSE, as in the paper: TWO_STAGE_GRID × the preference options."""
    best, history = None, []
    for (k_user, k_item, k_c), (use_prefs, gain) in itertools.product(
            itertools.product(TWO_STAGE_GRID["k_user"], TWO_STAGE_GRID["k_item"], TWO_STAGE_GRID["k_c"]),
            PREF_GRID):
        p = Params(k_user, k_item, k_c, use_prefs, gain)
        score = _rmse(blend(val_table, p)[0], val_ratings)
        history.append((p, score))
        if best is None or score < best[1]:
            best = (p, score)
    paper_only = min((h for h in history if not h[0].use_prefs), key=lambda h: h[1])
    return best[0], best[1], paper_only[0]


def evaluate(ratings, hotels, customers, seed=42, log=print):
    """The paper's protocol on the app's data: what the numbers on `model_run` mean.

    Returns (chosen params, headline metrics, per-method comparison).
    """
    train, held = simulate_cold_start(ratings, seed=seed, **SPLIT)
    held = split_validation(held, val_ratio=0.5, seed=seed)
    val, test = held[held["split"] == "val"], held[held["split"] == "test"]

    comp = Components(hotels, customers, seed).fit(train)
    params, val_rmse, paper_params = tune(comp.table(val["user_id"], val["item_id"]), val["rating"])
    log(f"  tuned on validation: {params.as_dict()} (RMSE {val_rmse:.4f})")

    test_t = comp.table(test["user_id"], test["item_id"])
    catalog = hotels["item_id"].to_numpy()
    frame, n_rel = build_candidate_frame(train, test, catalog, df_exclude=pd.concat([train, val]))
    frame_t = comp.table(frame["user_id"], frame["item_id"])

    fixed = compute_fixed_alpha(0.3)
    methods = {
        "StayReco two-sided + preferences": lambda t: blend(t, params)[0],
        "StayReco two-sided (paper, no preferences)": lambda t: blend(t, paper_params)[0],
        "Fixed α = 0.3": lambda t: np.clip(fixed["alpha"] * t["svdpp"] + fixed["beta"] * t["content"]
                                           + fixed["gamma"] * t["demo"], 1, 5).to_numpy(),
        "CF only (SVD++)": lambda t: t["svdpp"].to_numpy(),
        "Content only": lambda t: t["content"].to_numpy(),
        "Popularity": lambda t: t["pop"].to_numpy(),
    }
    cold = frame["item_n"].to_numpy() == 0
    n_cold = len(set(frame.loc[cold, "item_id"]))
    comparison = {}
    for name, fn in methods.items():
        pred_test = fn(test_t)
        pred_rank = np.asarray(fn(frame_t), dtype=float)
        rm = rank_metrics(frame, pred_rank, n_rel, top_k=(K,), n_catalog=len(catalog))
        ci = cold_item_share(frame, pred_rank, top_k=(K,))
        comparison[name] = {
            "rmse": _rmse(pred_test, test["rating"]),
            "mae": float(np.mean(np.abs(np.asarray(pred_test) - test["rating"].to_numpy()))),
            "precision": rm[f"p@{K}"], "recall": rm[f"r@{K}"], "ndcg": rm[f"ndcg@{K}"],
            "coverage": rm[f"cov@{K}"],
            "new_share": ci[f"newitem@{K}"], "new_precision": ci[f"newprec@{K}"],
            "coldstart_coverage": _cold_coverage(frame, pred_rank, n_cold),
        }
    head = comparison["StayReco two-sided + preferences"]
    metrics = {**head, "k": K, "threshold": RELEVANCE_THRESHOLD}
    split = {"train": len(train), "validation": len(val), "test": len(test),
             "ranked_users": int(len(n_rel)), "catalog": int(len(catalog)), "hidden_or_new_hotels": n_cold}
    return params, metrics, comparison, split


def _cold_coverage(frame, pred, n_cold):
    """Share of the hotels nobody rated that reach some guest's top-K at least once."""
    if not n_cold:
        return float("nan")
    df = pd.DataFrame({"u": frame["user_id"].to_numpy(), "i": frame["item_id"].to_numpy(), "p": pred,
                       "cold": frame["item_n"].to_numpy() == 0})
    top = df.sort_values(["u", "p", "i"], ascending=[True, False, True]).groupby("u").head(K)
    return float(top.loc[top["cold"], "i"].nunique() / n_cold)


# ── Serving ─────────────────────────────────────────────────

ANONYMOUS = "__anonymous__"


def recommend(ratings, hotels, customers, params: Params, top_k=20, seed=42):
    """Fits on every rating and returns the top-K rows for every customer, plus a list for signed-out visitors."""
    comp = Components(hotels, customers, seed).fit(ratings)
    names = dict(zip(hotels["item_id"], hotels["name"]))
    min_price = dict(zip(hotels["item_id"], hotels["min_price"]))
    items = hotels["item_id"].to_numpy()
    rated = ratings.groupby("user_id")["item_id"].apply(set).to_dict()
    liked = (ratings[ratings["rating"] >= RELEVANCE_THRESHOLD]
             .groupby("user_id")[["item_id", "rating"]]
             .apply(lambda g: list(zip(g["item_id"], g["rating"]))).to_dict())
    prefs = dict(zip(customers["user_id"], customers["preferences"]))

    users = [*customers["user_id"], ANONYMOUS]
    pair_users, pair_items = [], []
    for u in users:
        seen = rated.get(u, set())
        for i in items:
            if i not in seen:
                pair_users.append(u)
                pair_items.append(i)
    t = comp.table(pair_users, pair_items)
    pred, a, b, g, _ = blend(t, params)
    t["score"], t["a"], t["b"], t["g"] = pred, a, b, g

    rows = []
    for u, group in t.groupby("user_id", sort=False):
        budget = budget_of(prefs.get(u, {}))
        if budget:
            within = group[[(min_price.get(i) or 0) <= budget * BUDGET_SLACK for i in group["item_id"]]]
            if len(within) >= top_k:
                group = within
        top = group.sort_values(["score", "item_id"], ascending=[False, True]).head(top_k)
        for rank, r in enumerate(top.itertuples(), start=1):
            rows.append({
                "customer_id": None if u == ANONYMOUS else u,
                "hotel_id": r.item_id,
                "score": r.score,
                "rank": rank,
                "reason": _reason(comp, r, liked.get(u, []), prefs.get(u, {}), names, params),
            })
    return rows


def _reason(comp, r, liked, prefs, names, params):
    """One line the guest can read: which part of the score carried this hotel."""
    new = "Khách sạn mới trên StayReco. " if r.item_n == 0 else ""
    if r.user_id == ANONYMOUS:
        return new.strip() if new else "Được khách StayReco đánh giá cao."
    if r.a >= max(r.b, r.g) and r.n > 0:
        return new + "Khách có gu giống bạn đánh giá cao nơi này."
    if r.b >= r.g:
        if liked and r.item_id in comp.content.item_id_to_idx:
            row = comp.content.item_sim[comp.content.item_id_to_idx[r.item_id]]
            best = max(liked, key=lambda x: row[comp.content.item_id_to_idx[x[0]]]
                       if x[0] in comp.content.item_id_to_idx else -1)
            return new + f"Giống {names.get(best[0], 'nơi')} mà bạn đã chấm {best[1]:.1f}★."
        if params.use_prefs and r.has_pref:
            styles = [STYLE_LABELS[s] for s in (prefs.get("travelStyles") or "").split(",") if s in STYLE_LABELS]
            city = (prefs.get("favouriteCity") or "").strip()
            parts = []
            if styles:
                parts.append("phong cách " + ", ".join(styles))
            if city and fold(city) in fold(names.get(r.item_id, "") + " " + _city(comp, r.item_id)):
                parts.append(f"ở {city}")
            if parts:
                return new + "Hợp sở thích của bạn: " + "; ".join(parts) + "."
        return new + "Mô tả khớp với những gì khách tương tự bạn thích."
    return new + "Được khách cùng độ tuổi và quốc tịch với bạn đánh giá cao."


def _city(comp, item_id):
    row = comp.hotels.loc[comp.hotels["item_id"] == item_id, "city"]
    return row.iloc[0] if len(row) else ""

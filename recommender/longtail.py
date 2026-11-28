"""Long-tail re-ranking: personalised Smooth xQuAD (Abdollahpouri, Burke & Mobasher, FLAIRS 2019, arXiv 1901.07555).

The model favours hotels many guests rated: they get more data, rank higher, get booked and rated more. This step,
applied to the ranked list of any model, builds the top of each list one hotel at a time, scoring every remaining one
by

    (1 - λ) · P(v|u)  +  λ · Σ_d P(d|u) · [v ∈ d] · (1 - share of d already in the list)

with d the short head (the most rated 20% of hotels) or the long tail (the rest, new hotels included), P(v|u) the
model's score scaled to [0, 1] over the list, and P(d|u) the share of that guest's own stays in d. A guest who only
ever stays at well-known hotels keeps a list of well-known hotels; one who likes lesser-known places gets more of them.
That follows the paper, and PDA (Zhang et al., SIGIR 2021): popular hotels are often popular because they are good, so
popularity is balanced per guest rather than pushed down for everyone.

λ is not tuned on the test set: `choose_lambda` picks it on a validation split carved out of the training ratings, the
largest one whose NDCG@10 stays within MAX_NDCG_LOSS of λ = 0 while giving the long tail most of the top 10.
"""

import numpy as np

#: The short head: this share of the catalogue, most rated first (the admin page and the evaluation use the same cut).
HEAD_SHARE = 0.2
#: The λ tried on the validation split.
LAMBDAS = tuple(round(x, 2) for x in np.arange(0.0, 0.55, 0.05))
#: How much NDCG@10 (relative) the re-ranking may cost on the validation split.
MAX_NDCG_LOSS = 0.03
#: Positions re-ranked; below them the model's order is kept (the page and the metrics look at the top 10).
DEPTH = 20


def head_items(ratings, catalog):
    """The most rated HEAD_SHARE of the catalogue (at least one hotel); unrated hotels are never in it."""
    counts = ratings.groupby("item_id").size().reindex(catalog, fill_value=0).sort_values(ascending=False, kind="stable")
    n = max(1, int(round(len(counts) * HEAD_SHARE)))
    return set(counts.index[:n][counts.iloc[:n] > 0])


def tail_tendency(ratings, head):
    """P(tail|u): the share of each guest's rated stays outside the head, and the mean of it for guests with none."""
    if ratings.empty:
        return {}, 0.5
    in_tail = ~ratings["item_id"].isin(head)
    share = in_tail.groupby(ratings["user_id"]).mean()
    return share.to_dict(), float(share.mean())


def rerank(scores, is_tail, tendency, lam, depth=DEPTH, tiers=None):
    """Indices into `scores` in their new order. `scores`, `is_tail` and `tiers` are in the model's order already.

    `tiers` (lower first) are kept: a hotel is only picked among the remaining ones of the best tier left, so the order
    by budget, travel style and city of `recommend` stands and only the order within a tier changes.
    """
    n = len(scores)
    if n == 0 or lam <= 0:
        return np.arange(n)
    scores = np.asarray(scores, dtype=float)
    is_tail = np.asarray(is_tail, dtype=bool)
    tiers = np.zeros(n, dtype=int) if tiers is None else np.asarray(tiers)
    span = scores.max() - scores.min()
    relevance = (scores - scores.min()) / span if span > 0 else np.ones(n)
    remaining = np.ones(n, dtype=bool)
    picked, tail_picked = [], 0
    for _ in range(min(depth, n)):
        size = len(picked)
        tail_cover = tail_picked / size if size else 0.0
        head_cover = (size - tail_picked) / size if size else 0.0
        bonus = np.where(is_tail, tendency * (1 - tail_cover), (1 - tendency) * (1 - head_cover))
        value = (1 - lam) * relevance + lam * bonus
        allowed = remaining & (tiers == tiers[remaining].min())
        value = np.where(allowed, value, -np.inf)
        best = int(np.argmax(value))  # the first of equals: the model's order breaks ties
        picked.append(best)
        tail_picked += int(is_tail[best])
        remaining[best] = False
    return np.array(picked + list(np.flatnonzero(remaining)), dtype=int)


def rerank_frame(frame, pred, head, tendency, default, lam, k):
    """The predictions of a full-catalogue candidate frame with each guest's top k re-ranked, for the metrics.

    The re-ranked top k get scores above any prediction, in their new order; the rest keep theirs.
    """
    pred = np.asarray(pred, dtype=float)
    if lam <= 0:
        return pred
    out = pred.copy()
    users = frame["user_id"].to_numpy()
    items = frame["item_id"].to_numpy()
    tail = ~np.isin(items, list(head))
    # The order rank_metrics sorts by: user, then score, then item id.
    order = np.lexsort((items, -pred, users))
    starts = np.flatnonzero(np.r_[True, users[order][1:] != users[order][:-1]])
    ends = np.r_[starts[1:], len(order)]
    top = pred.max() + 1
    for start, end in zip(starts, ends):
        rows = order[start:end]
        new = rerank(pred[rows], tail[rows], tendency.get(users[rows[0]], default), lam, depth=k)[:k]
        out[rows[new]] = top + np.arange(len(new))[::-1]
    return out


def choose_lambda(grid_results):
    """The λ to serve from [(λ, ndcg, tail_share)], λ = 0 first: the most long tail within MAX_NDCG_LOSS of λ = 0."""
    base = grid_results[0][1]
    allowed = [r for r in grid_results if r[1] >= base * (1 - MAX_NDCG_LOSS)]
    return max(allowed, key=lambda r: (r[2], -r[0]))[0]

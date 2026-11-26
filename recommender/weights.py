"""Two-sided shrinkage for rating-scale component predictions.

The three constants are the ones the paper's grid search picked on this app's data (validation RMSE, the tuned
pipeline of 2026-11-23), fixed rather than re-tuned on every run: the paper's README notes that a deployed system
picks them once. Against the earlier K_USER=40, K_CONTENT=1 they lift NDCG@10 from 0.213 to 0.255 on the seeded data.
"""

K_USER = 5
K_ITEM = 5
K_CONTENT = 3


def weights(n_user, n_item, has_preferences, *, use_cf=True):
    alpha = n_user / (n_user + K_USER) * n_item / (n_item + K_ITEM)
    pi = 1.0 if has_preferences else n_user / (n_user + K_CONTENT)
    beta = (1 - alpha) * pi
    gamma = (1 - alpha) * (1 - pi)
    if not use_cf:
        beta, alpha = beta + alpha, 0 * alpha
    return alpha, beta + gamma * (n_item == 0), gamma * (n_item != 0)

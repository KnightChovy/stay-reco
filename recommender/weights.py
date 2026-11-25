"""Two-sided shrinkage for rating-scale component predictions."""

K_USER = 40
K_ITEM = 5
K_CONTENT = 1


def weights(n_user, n_item, has_preferences, *, use_cf=True):
    alpha = n_user / (n_user + K_USER) * n_item / (n_item + K_ITEM)
    pi = 1.0 if has_preferences else n_user / (n_user + K_CONTENT)
    beta = (1 - alpha) * pi
    gamma = (1 - alpha) * (1 - pi)
    if not use_cf:
        beta, alpha = beta + alpha, 0 * alpha
    return alpha, beta + gamma * (n_item == 0), gamma * (n_item != 0)

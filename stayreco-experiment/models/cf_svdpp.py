"""Collaborative Filtering bằng SVD++ (Surprise library).

Cơ sở: Koren (2008), "Factorization Meets the Neighborhood"
"""

import numpy as np
from surprise import SVDpp, SVD
from surprise import accuracy


class CollaborativeFilter:
    """SVD++ wrapper cho StayReco."""

    def __init__(self, n_factors=50, n_epochs=30, lr=0.005, reg=0.02, seed=None):
        self.model = SVDpp(
            n_factors=n_factors,
            n_epochs=n_epochs,
            lr_all=lr,
            reg_all=reg,
            random_state=seed,
            verbose=True,
        )
        self.is_trained = False

    def fit(self, trainset):
        """Train SVD++ trên trainset (Surprise format)."""
        print("Training SVD++...")
        self.model.fit(trainset)
        self.is_trained = True
        self._build_user_factors()
        print("✓ SVD++ trained")

    # ── Chấm điểm hàng loạt ──────────────────────────────
    # Vì sao cần: xếp hạng trên TOÀN BỘ catalog phải chấm ~1.5 triệu cặp
    # (user × hotel chưa xem). Gọi model.predict() từng cặp mất hàng chục phút.
    # Hàm dưới dựng lại ĐÚNG công thức của Surprise bằng phép toán ma trận.
    #
    # Surprise SVDpp.estimate():
    #     est = μ
    #     + b_u                        (nếu biết user)
    #     + b_i                        (nếu biết item)
    #     + q_i · (p_u + |N(u)|^-½ Σ_j y_j)   (nếu biết cả hai)
    # rồi predict() kẹp về [1, 5].
    # Phần trong ngoặc chỉ phụ thuộc user → tính trước 1 lần cho mọi user.

    def _build_user_factors(self):
        """Tính trước p_u + |N(u)|^-½ Σ_j y_j cho mọi user (phần implicit của SVD++)."""
        m, ts = self.model, self.model.trainset
        p_aug = m.pu.copy()
        for u in range(ts.n_users):
            rated = ts.ur[u]
            if rated:
                implicit = m.yj[[j for j, _ in rated]].sum(axis=0) / np.sqrt(len(rated))
                p_aug[u] += implicit
        self._p_aug = p_aug

    def predict_many(self, users, items):
        """Dự đoán cho nhiều cặp (user, item) cùng lúc.

        Args:
            users, items: mảng id GỐC (raw id), cùng độ dài

        Returns:
            np.ndarray float, đã kẹp về [1, 5] — khớp với predict() từng cặp
        """
        if not self.is_trained:
            raise RuntimeError("Model chưa train. Gọi fit() trước.")
        m, ts = self.model, self.model.trainset
        u_raw2inner = ts._raw2inner_id_users
        i_raw2inner = ts._raw2inner_id_items

        uin = np.fromiter((u_raw2inner.get(str(u), -1) for u in users), dtype=np.int64,
                          count=len(users))
        iin = np.fromiter((i_raw2inner.get(str(i), -1) for i in items), dtype=np.int64,
                          count=len(items))

        est = np.full(len(uin), ts.global_mean, dtype=float)
        ku, ki = uin >= 0, iin >= 0
        est[ku] += m.bu[uin[ku]]
        est[ki] += m.bi[iin[ki]]
        both = ku & ki
        if both.any():
            est[both] += np.einsum("ij,ij->i", m.qi[iin[both]], self._p_aug[uin[both]])
        return np.clip(est, 1.0, 5.0)

    def predict(self, user_id, item_id):
        """Dự đoán rating cho 1 cặp (user, item).

        Returns:
            float: predicted rating (1-5)
        """
        if not self.is_trained:
            raise RuntimeError("Model chưa train. Gọi fit() trước.")
        # User/hotel chưa có trong train → Surprise tự dùng μ + bias còn lại
        pred = self.model.predict(str(user_id), str(item_id))
        return pred.est

    def predict_batch(self, testset):
        """Dự đoán cho toàn bộ testset.

        Args:
            testset: list of (user_id, item_id, true_rating)

        Returns:
            list of Prediction objects
        """
        predictions = self.model.test(testset)
        return predictions

    def evaluate(self, testset):
        """Tính RMSE và MAE trên testset."""
        predictions = self.predict_batch(testset)
        rmse = accuracy.rmse(predictions, verbose=False)
        mae = accuracy.mae(predictions, verbose=False)
        return {"rmse": rmse, "mae": mae, "predictions": predictions}


class PlainSVD(CollaborativeFilter):
    """SVD thường (KHÔNG có implicit feedback).

    Dùng để dựng lại OHWSF (2022) — bài đó trộn SVD với SVD++, nên cần cả hai.
    Cũng là bằng chứng cho lựa chọn "SVD++ thay vì SVD" của StayReco.
    """

    def __init__(self, n_factors=50, n_epochs=30, lr=0.005, reg=0.02, seed=None):
        self.model = SVD(
            n_factors=n_factors,
            n_epochs=n_epochs,
            lr_all=lr,
            reg_all=reg,
            random_state=seed,
        )
        self.is_trained = False

    def fit(self, trainset):
        print("Training SVD...")
        self.model.fit(trainset)
        self.is_trained = True
        self._build_user_factors()
        print("✓ SVD trained")

    def _build_user_factors(self):
        """SVD không có phần implicit → user factor chính là p_u."""
        self._p_aug = self.model.pu

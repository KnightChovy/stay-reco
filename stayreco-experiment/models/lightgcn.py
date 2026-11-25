"""LightGCN — tầng 2 của SL-ARec (2026).

Ý tưởng: coi dữ liệu như một ĐỒ THỊ hai phía (user ↔ hotel). Mỗi vòng lan truyền,
embedding của user được cập nhật bằng trung bình embedding các hotel nó nối tới,
và ngược lại. Sau K vòng, embedding của user mang thông tin của "hàng xóm của hàng xóm"
→ nắm được quan hệ bậc cao: A thích X, B cũng thích X, B thích Y → gợi ý Y cho A,
dù A và B chưa từng chấm chung hotel nào khác.

    E⁽ᵏ⁺¹⁾ = Â · E⁽ᵏ⁾ ,  Â = D^(-1/2)·A·D^(-1/2)
    E_final = trung bình của E⁽⁰⁾ … E⁽ᴷ⁾
    r̂(u,i) = μ + b_u + b_i + e_u · e_i

⚠️ LƯU Ý KHI VIẾT BÁO CÁO:
LightGCN gốc (He et al., 2020) học xếp hạng bằng BPR loss trên implicit feedback,
không dự đoán số sao. Ở đây ta huấn luyện bằng MSE trên rating để nó cùng thang đo
với SVD++ / Content / Demographic, nếu không thì không trộn và không tính RMSE được.
Đây là một BẢN THÍCH NGHI, không phải bản sao nguyên gốc — phải ghi rõ trong báo cáo.
"""

import numpy as np

from utils.batch import map_default

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:  # pragma: no cover
    TORCH_AVAILABLE = False


class LightGCN:
    """LightGCN cho bài toán dự đoán rating (bản thích nghi)."""

    def __init__(self, n_factors=32, n_layers=3, n_epochs=300, lr=0.01, reg=1e-5, seed=42):
        if not TORCH_AVAILABLE:
            raise ImportError("Cần cài PyTorch: pip install torch --index-url https://download.pytorch.org/whl/cpu")
        self.n_factors = n_factors
        self.n_layers = n_layers
        self.n_epochs = n_epochs
        self.lr = lr
        self.reg = reg
        self.seed = seed
        self.is_trained = False

    def fit(self, ratings_df):
        """Dựng đồ thị rồi train bằng full-batch gradient descent."""
        torch.manual_seed(self.seed)

        users = ratings_df["user_id"].unique()
        items = ratings_df["item_id"].unique()
        self.user_to_idx = {u: i for i, u in enumerate(users)}
        self.item_to_idx = {v: i for i, v in enumerate(items)}
        n_users, n_items = len(users), len(items)

        u_idx = torch.tensor(ratings_df["user_id"].map(self.user_to_idx).to_numpy(), dtype=torch.long)
        i_idx = torch.tensor(ratings_df["item_id"].map(self.item_to_idx).to_numpy(), dtype=torch.long)
        ratings = torch.tensor(ratings_df["rating"].to_numpy(), dtype=torch.float32)
        self.global_mean = float(ratings.mean())

        self.adj = self._build_adj(u_idx, i_idx, n_users, n_items)

        # Tham số cần học
        self.emb = torch.nn.Parameter(torch.randn(n_users + n_items, self.n_factors) * 0.1)
        self.bu = torch.nn.Parameter(torch.zeros(n_users))
        self.bi = torch.nn.Parameter(torch.zeros(n_items))
        params = [self.emb, self.bu, self.bi]
        optimizer = torch.optim.Adam(params, lr=self.lr, weight_decay=self.reg)

        print(f"Training LightGCN ({self.n_layers} layers, {self.n_factors} factors)...")
        for epoch in range(self.n_epochs):
            optimizer.zero_grad()
            final = self._propagate()
            pred = (self.global_mean + self.bu[u_idx] + self.bi[i_idx]
                    + (final[u_idx] * final[n_users + i_idx]).sum(dim=1))
            loss = torch.nn.functional.mse_loss(pred, ratings)
            loss.backward()
            optimizer.step()
            if epoch % 50 == 0 or epoch == self.n_epochs - 1:
                print(f"  epoch {epoch:>3} | train RMSE {loss.item() ** 0.5:.4f}")

        with torch.no_grad():
            self.final_emb = self._propagate().detach().numpy()
        self.bu_np, self.bi_np = self.bu.detach().numpy(), self.bi.detach().numpy()
        self.n_users = n_users
        self.is_trained = True
        print("✓ LightGCN trained")

    def _build_adj(self, u_idx, i_idx, n_users, n_items):
        """Ma trận kề chuẩn hóa Â = D^(-1/2)·A·D^(-1/2), dạng sparse."""
        n = n_users + n_items
        src = torch.cat([u_idx, n_users + i_idx])
        dst = torch.cat([n_users + i_idx, u_idx])
        deg = torch.zeros(n).index_add_(0, src, torch.ones(len(src)))
        deg_inv_sqrt = torch.where(deg > 0, deg.pow(-0.5), torch.zeros_like(deg))
        values = deg_inv_sqrt[src] * deg_inv_sqrt[dst]
        return torch.sparse_coo_tensor(torch.stack([src, dst]), values, (n, n)).coalesce()

    def _propagate(self):
        """Lan truyền K lớp rồi lấy trung bình các lớp."""
        out = [self.emb]
        emb = self.emb
        for _ in range(self.n_layers):
            emb = torch.sparse.mm(self.adj, emb)
            out.append(emb)
        return torch.stack(out).mean(dim=0)

    def predict(self, user_id, item_id):
        """Dự đoán rating (1-5). User/hotel mới → chỉ dùng μ + bias còn lại."""
        u = self.user_to_idx.get(user_id)
        i = self.item_to_idx.get(item_id)
        pred = self.global_mean
        if u is not None:
            pred += self.bu_np[u]
        if i is not None:
            pred += self.bi_np[i]
        if u is not None and i is not None:
            pred += float(np.dot(self.final_emb[u], self.final_emb[self.n_users + i]))
        return float(np.clip(pred, 1.0, 5.0))

    def predict_many(self, users, items):
        """Dự đoán cho nhiều cặp (user, item) cùng lúc — xem utils/batch.py.

        Sau khi train, embedding đã cố định nên chỉ là một phép nhân ma trận.
        """
        uin = map_default(users, self.user_to_idx, -1).astype(np.int64)
        iin = map_default(items, self.item_to_idx, -1).astype(np.int64)

        pred = np.full(len(uin), self.global_mean, dtype=float)
        ku, ki = uin >= 0, iin >= 0
        pred[ku] += self.bu_np[uin[ku]]
        pred[ki] += self.bi_np[iin[ki]]
        both = ku & ki
        if both.any():
            pred[both] += np.einsum("ij,ij->i", self.final_emb[uin[both]],
                                    self.final_emb[self.n_users + iin[both]])
        return np.clip(pred, 1.0, 5.0)

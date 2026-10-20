# Phase 6: Báo cáo và quản trị

| | |
|---|---|
| Trạng thái | ⬜ Chưa bắt đầu |
| Contract | Chưa có. Tạo từ [`_template.md`](../contracts/_template.md) khi phase bắt đầu. |

## Mục tiêu

Số liệu cho đối tác và quản lý nền tảng, công cụ quản trị hệ thống.

## Phạm vi

**Backend**

- Doanh thu, dashboard đối tác
- Doanh thu, dòng tiền, tuân thủ, giao dịch toàn nền tảng
- Admin: tài khoản, nhật ký, giao dịch, cấu hình thanh toán và AI

**Frontend web / mobile** (trang đã có UI trong `frontend/src/app`)

- `partner/dashboard`, `partner/revenue`
- `manager/dashboard`, `manager/revenue`, `manager/cashflow`, `manager/compliance`, `manager/transactions`
- `admin/*` (dashboard, users, logs, transactions, payment-settings, ai-settings)

## Definition of Done

- [ ] Số liệu dashboard khớp dữ liệu giao dịch (có test truy vấn)
- [ ] Contract đã cập nhật đúng với code, trạng thái `Integrated`

# Phase 6: Báo cáo và quản trị

| | |
|---|---|
| Trạng thái phase | ⬜ Chưa bắt đầu |
| Trạng thái API | Chưa có |
| API | Chưa có. Khi phase bắt đầu: điền file này theo [`_template.md`](./_template.md), endpoint ghi vào [api/](../api/README.md). |

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
- [ ] Các trang [api/](../api/README.md) của phase khớp với code, trạng thái API `Integrated`

# Phase 3: Vận hành tại khách sạn

| | |
|---|---|
| Trạng thái | ⬜ Chưa bắt đầu |
| Contract | Chưa có. Tạo từ [`_template.md`](../contracts/_template.md) khi phase bắt đầu. |

## Mục tiêu

Nhân viên xử lý đơn hằng ngày: check-in, check-out, yêu cầu hoàn tiền, tin nhắn và cảnh báo.

## Phạm vi

**Backend**

- Danh sách đơn theo khách sạn
- Check-in, check-out
- Yêu cầu hoàn tiền và duyệt
- Hộp thư với khách, cảnh báo, thông báo

**Frontend web / mobile** (trang đã có UI trong `frontend/src/app`)

- `staff/dashboard`, `staff/bookings`, `staff/bookings/[id]`, `staff/check-in`, `staff/check-out`
- `staff/refunds`, `staff/inbox`, `staff/alerts`
- `account/notifications`

## Ngoài phạm vi

- Marketing của nhân viên → phase 5

## Definition of Done

- [ ] Mọi chuyển trạng thái đơn có audit log
- [ ] Hoàn tiền khớp số tiền đã thanh toán (có test)
- [ ] Contract đã cập nhật đúng với code, trạng thái `Integrated`

# Phase 3: Vận hành tại khách sạn

| | |
|---|---|
| Trạng thái phase | ⬜ Chưa bắt đầu |
| Trạng thái API | Chưa có |
| API | Chưa có. Khi phase bắt đầu: điền file này theo [`_template.md`](./_template.md), endpoint ghi vào [api/](../api/README.md). |

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
- [ ] Các trang [api/](../api/README.md) của phase khớp với code, trạng thái API `Integrated`

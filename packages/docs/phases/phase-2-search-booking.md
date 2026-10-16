# Phase 2: Tìm kiếm và đặt phòng

| | |
|---|---|
| Trạng thái | ⬜ Chưa bắt đầu |
| Contract | Chưa có. Tạo từ [`_template.md`](../contracts/_template.md) khi phase bắt đầu. |

## Mục tiêu

Khách hàng tìm khách sạn, xem chi tiết, đặt và thanh toán; quản lý chuyến đi của mình.

## Phạm vi

**Backend**

- Tồn phòng và giá theo ngày
- Tìm kiếm khách sạn theo điểm đến, ngày, số khách
- Giữ phòng có hạn, tạo đơn đặt
- Thanh toán (cổng thanh toán chờ chốt), xác nhận
- Chuyến đi của tôi, hủy, đổi ngày

**Frontend web / mobile** (trang đã có UI trong `frontend/src/app`)

- `search`, `hotels/[id]`, `hotels/[id]/rooms/[roomId]`
- `booking`, `booking/payment`, `booking/confirmation`
- `account/bookings`, `account/bookings/[id]` (+ `cancel`, `change`)
- `partner/availability`, `partner/pricing`, `partner/bookings`

## Ngoài phạm vi

- Hoàn tiền xử lý bởi nhân viên → phase 3
- Mã khuyến mãi → phase 4

## Definition of Done

- [ ] Không bán vượt số phòng khi 2 người đặt cùng lúc (có test)
- [ ] Đặt phòng chạy được end-to-end trên web và mobile
- [ ] Contract đã cập nhật đúng với code, trạng thái `Integrated`

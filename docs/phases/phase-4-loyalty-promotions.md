# Phase 4: Khách hàng thân thiết, khuyến mãi, đánh giá

| | |
|---|---|
| Trạng thái phase | ⬜ Chưa bắt đầu |
| Trạng thái API | Chưa có |
| API | Chưa có. Khi phase bắt đầu: điền file này theo [`_template.md`](./_template.md), endpoint ghi vào [api/](../api/README.md). |

## Mục tiêu

Giữ chân khách: điểm thưởng, khuyến mãi, đánh giá sau lưu trú, ví, hồ sơ và sở thích.

## Phạm vi

**Backend**

- Chương trình loyalty theo khách sạn
- Khuyến mãi, mã giảm giá áp vào đặt phòng
- Đánh giá sau khi check-out
- Ví, hồ sơ, sở thích khách hàng

**Frontend web / mobile** (trang đã có UI trong `frontend/src/app`)

- `partner/loyalty`, `partner/promotions`
- `account/rewards`, `account/wallet`, `account/profile`, `account/preferences`
- `account/bookings/[id]/review`

## Definition of Done

- [ ] Giá sau khuyến mãi tính ở BE, FE chỉ hiển thị
- [ ] Các trang [api/](../api/README.md) của phase khớp với code, trạng thái API `Integrated`

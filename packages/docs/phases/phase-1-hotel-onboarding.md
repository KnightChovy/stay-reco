# Phase 1: Đối tác đưa khách sạn lên nền tảng

| | |
|---|---|
| Trạng thái | 🟡 BE xong, FE đang tích hợp |
| Contract | [contracts/phase-1-hotel-onboarding.md](../contracts/phase-1-hotel-onboarding.md) |

## Mục tiêu

Đối tác tạo khách sạn, khai báo loại phòng và phòng, gửi hồ sơ; quản lý nền tảng duyệt. Kết thúc phase: có khách sạn ACTIVE để phase 2 tìm kiếm và đặt.

## Phạm vi

**Backend**

- Khách sạn: tạo, sửa thông tin, ảnh, tiện ích
- Loại phòng, phòng
- Nhân viên của khách sạn (dùng lời mời đã có ở phase 0)
- Hồ sơ xác minh và hàng đợi duyệt
- `HotelAccessGuard` kiểm tra tenant

**Frontend web / mobile** (trang đã có UI trong `frontend/src/app`)

- `partner/hotel`, `partner/rooms`, `partner/staff`, `partner/verification`
- `manager/verifications`, `manager/partners`

## Ngoài phạm vi

- Giá theo ngày, tồn phòng (`partner/availability`, `partner/pricing`) → phase 2

## Definition of Done

- [x] E2e chứng minh đối tác A không đọc/sửa được khách sạn của đối tác B
- [x] Có seed ít nhất 3 khách sạn ACTIVE cho phase 2
- [ ] Contract đã cập nhật đúng với code, trạng thái `Integrated`

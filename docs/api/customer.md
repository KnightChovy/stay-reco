# API: Khách hàng (`CUSTOMER`)

> Màn FE: trang chủ, `search`, `hotels/[id]`, `booking/*`, `account/*`.

## Hiện có

- Đăng ký, xác thực email (OTP), đăng nhập, quên / đổi mật khẩu, phiên đăng nhập: [auth.md](./auth.md).
- Danh mục công khai `GET /amenities`, `GET /bed-types`: [partner.md](./partner.md#danh-mục-công-khai-không-cần-token) (dùng cho bộ lọc tìm kiếm).

## Đang làm (phase 2)

Tìm kiếm khách sạn theo điểm đến, ngày và số khách; giá và tồn phòng theo ngày; giữ phòng và đặt phòng; thanh toán qua SePay (VietQR); chuyến đi của tôi (xem, hủy, đổi ngày). Endpoint sẽ được ghi vào trang này khi phase 2 chốt: [phases/phase-2-search-booking.md](../phases/phase-2-search-booking.md).

# API: Nhân viên khách sạn (`HOTEL_STAFF`)

> Màn FE: `staff/*`. Nhân viên thuộc **đúng một khách sạn**, do đối tác mời ([auth.md](./auth.md): lời mời và trang `/accept-invitation`) và quản lý ([partner.md](./partner.md#nhân-viên)).

## Những gì nhân viên dùng được hiện nay

Các endpoint dưới đây được mô tả đầy đủ ở [partner.md](./partner.md); nhân viên gọi được vì có quyền *thành viên* của khách sạn.

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/me/hotels` | Trả đúng khách sạn của nhân viên, `myRole: "STAFF"` |
| GET | `/hotels/:hotelId` | Thông tin khách sạn |
| GET | `/hotels/:hotelId/room-types`, `/room-types/:id` | Loại phòng |
| GET | `/hotels/:hotelId/rooms` | Danh sách phòng (lọc, tìm, phân trang) |
| GET | `/amenities`, `/bed-types` | Danh mục công khai |

Nhân viên **không** sửa được khách sạn, phòng, loại phòng, nhân viên, và không xem được hồ sơ xác minh: các thao tác đó trả `403 FORBIDDEN`. Tài nguyên của khách sạn khác trả 404 của đúng tài nguyên đó (`HOTEL_NOT_FOUND`, `ROOM_TYPE_NOT_FOUND`…).

## Nhóm quyền

Đối tác cấp cho mỗi nhân viên một số nhóm trong 5 nhóm (`StaffPermission`): `BOOKING` (Đặt phòng), `FRONT_DESK` (Lễ tân), `CUSTOMER_CARE` (Chăm sóc khách), `REFUND` (Hoàn tiền), `MARKETING`. Các nhóm này mở khóa các chức năng vận hành của các phase sau (đặt phòng, check-in/out, hoàn tiền, inbox, marketing); các endpoint đó sẽ ghi rõ cần nhóm nào. Quyền đổi có hiệu lực từ request kế tiếp.

## Tài khoản

- Bị đối tác **vô hiệu hóa**: đăng xuất ngay, đăng nhập nhận `403 AUTH_ACCOUNT_DEACTIVATED`. Đối tác kích hoạt lại thì đăng nhập lại bình thường.
- Đổi mật khẩu, quản lý phiên đăng nhập: [auth.md](./auth.md).

# Tra cứu API theo vai trò người dùng

Mỗi endpoint được mô tả **một lần**, ở trang của vai trò dùng nó nhiều nhất; các trang khác chỉ link tới. Quy tắc chung (envelope, mã lỗi, phân trang, token) ở [../api-guide.md](../api-guide.md); quyết định nghiệp vụ và lịch sử thay đổi ở [../phases/](../phases/).

| Trang | Ai dùng | Nội dung |
|---|---|---|
| [auth.md](./auth.md) | Mọi vai trò | Đăng ký, đăng nhập, OTP, refresh, phiên đăng nhập, mật khẩu, lời mời |
| [partner.md](./partner.md) | Đối tác (`HOTEL_PARTNER`) | Danh mục, khách sạn, ảnh, loại phòng, phòng, nhân viên, hồ sơ xác minh |
| [staff.md](./staff.md) | Nhân viên khách sạn (`HOTEL_STAFF`) | Những gì nhân viên được xem; quyền theo 5 nhóm |
| [manager.md](./manager.md) | Quản lý nền tảng (`PLATFORM_MANAGER`) | Hàng đợi xác minh, duyệt, xác minh lại |
| [customer.md](./customer.md) | Khách hàng (`CUSTOMER`) | Tìm kiếm, đặt phòng (đang làm) |

Cách đọc mỗi bảng endpoint:

- Cột **Response** là nội dung của `data` trong envelope `{ success, message, data, meta? }`.
- Cột **Quyền**: *chủ* = đối tác sở hữu khách sạn; *thành viên* = chủ hoặc nhân viên được gán vào khách sạn đó. Người ngoài nhận 404 của đúng tài nguyên (không biết tài nguyên có tồn tại hay không), nhân viên thiếu quyền nhận 403.
- Tên trong ngoặc (ví dụ `createHotelSchema`, `Hotel`) là zod schema và kiểu TypeScript trong `@stayreco/shared`: dùng chúng thay vì tự định nghĩa lại.

Thêm endpoint mới: ghi vào trang của vai trò tương ứng (cùng PR với code), thêm mã lỗi mới vào [api-guide.md §4.3](../api-guide.md#43-error-codes), và ghi một dòng vào *Changelog* của phase.

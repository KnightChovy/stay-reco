# Phase 1: Đối tác đưa khách sạn lên nền tảng

| | |
|---|---|
| Trạng thái phase | 🟡 BE xong, FE đang tích hợp |
| Trạng thái API | `BE Done`: mọi endpoint đã merge vào `develop`, FE tích hợp được |
| Ngày chốt (Agreed) | 2026-10-18 |
| BE phụ trách | Khiêm, Phúc |
| FE phụ trách | |
| API | [api/partner.md](../api/partner.md), [api/staff.md](../api/staff.md), [api/manager.md](../api/manager.md) |

## Mục tiêu

Đối tác tạo khách sạn, khai báo loại phòng và phòng, gửi hồ sơ; quản lý nền tảng duyệt. Kết thúc phase: có khách sạn ACTIVE để phase 2 tìm kiếm và đặt.

## Phạm vi

**Backend**

- Khách sạn: tạo, sửa thông tin, ảnh, tiện ích, chính sách, cấu hình phòng
- Loại phòng, phòng
- Nhân viên của khách sạn (dùng lời mời đã có ở phase 0)
- Hồ sơ xác minh và hàng đợi duyệt
- `HotelAccessGuard` kiểm tra quyền theo khách sạn

**Frontend web / mobile** (trang đã có UI trong `frontend/src/app`)

- `partner/hotel`, `partner/rooms`, `partner/staff`, `partner/verification`
- `manager/verifications`, `manager/partners`

## Ngoài phạm vi

- Giá theo ngày, tồn phòng (`partner/availability`, `partner/pricing`) → phase 2

## Quyết định đã chốt

| # | Quyết định |
|---|---|
| D1 | Thêm bảng `hotel_image` và `room_type_image` (ảnh khách sạn, ảnh loại phòng). `room_image` (ảnh phòng thực tế) giữ nguyên. |
| D2 | `hotel_staff.permissions`: mảng các nhóm quyền theo SRS UC62: `BOOKING` (Đặt phòng), `FRONT_DESK` (Lễ tân), `CUSTOMER_CARE` (Chăm sóc khách), `REFUND` (Hoàn tiền), `MARKETING`. Không có nhóm "Kế toán". |
| D3 | **Giá gốc của loại phòng** = một dòng `price` có `valid_from`, `valid_to`, `day_of_week` đều trống. Luật giá theo mùa (phase 2) là các dòng `price` khác; giá một đêm = dòng cụ thể nhất. |
| D4 | **`hotel_room_config`** = cấu hình phòng của đối tác cho khách sạn: `total_rooms` là số phòng thực tế đối tác khai báo, `base_price` là giá gốc mặc định gợi ý khi tạo loại phòng mới. Không tạo được nhiều phòng thực tế hơn `total_rooms` (muốn thêm thì sửa cấu hình). Mỗi khách sạn một cấu hình (`hotel_id` unique trong DB). |
| D5 | File lưu trên **Cloudinary**, BE nhận file rồi đẩy lên. Giấy tờ xác minh lưu ở chế độ riêng tư, **chỉ chủ khách sạn và quản lý nền tảng xem được** (BE cấp link có hạn 5 phút, trả JSON vì tab mới của trình duyệt không gửi được Bearer token). |
| D6 | Duyệt **theo từng khách sạn**. Lần duyệt đầu tiên đổi `hotel_partner.status` sang `APPROVED`. |
| D7 | Một đối tác có thể có nhiều khách sạn. BE hỗ trợ đầy đủ; FE tự chọn cách hiển thị. |
| D8 | Chính sách khách sạn, thông tin pháp nhân, thông tin cơ sở và thông tin thụ hưởng lưu dạng key-value trong `hotel_properties`. Field nộp kèm hồ sơ gắn với hồ sơ đó (`verification_request_id`), nên mỗi lần nộp là một bản lưu riêng. |
| D9 | Đối tác sửa khách sạn đang `ACTIVE` **không cần duyệt lại**. Quản lý nền tảng có thể **yêu cầu xác minh lại kèm lý do** (ví dụ giấy phép hết hạn). Đình chỉ khách sạn làm cùng nhóm vi phạm (phase sau); đình chỉ **tài khoản** đối tác theo BR-15 (quản lý đề nghị, admin quyết định). |
| D10 | Tài liệu bắt buộc: giấy phép kinh doanh (`BUSINESS_LICENSE`), PCCC (`FIRE_SAFETY`), ANTT (`SECURITY_CERTIFICATE`). Chứng nhận xếp hạng (`OTHER`) tùy chọn. PDF/JPG/PNG, tối đa 10 MB mỗi file. |
| D11 | Phòng chỉ đặt và gán được khi `AVAILABLE`. `MAINTENANCE`, `CLEANING`, `OCCUPIED` = chưa sẵn sàng. "Khóa phòng" = `MAINTENANCE`, "Mở lại" = `AVAILABLE`. |
| D12 | **Thông tin thụ hưởng** (ngân hàng, số tài khoản, tên chủ tài khoản) thu trong bước Pháp nhân của hồ sơ. Số tài khoản **mã hóa AES-256-GCM khi lưu** (khóa `BENEFICIARY_ENCRYPTION_KEY`), chỉ chủ khách sạn và quản lý nền tảng xem đầy đủ ở trang chi tiết; lịch sử hồ sơ chỉ hiện 4 số cuối; hàng đợi của quản lý không có thông tin thụ hưởng. Số CCCD người đại diện cũng chỉ hiện 4 số cuối trong lịch sử (dữ liệu cá nhân, Nghị định 13/2023). |
| D13 | Wizard xác minh **4 bước** như FE: Pháp nhân, Cơ sở lưu trú, Tài liệu, Xác nhận (Report 3 màn 39 cập nhật theo). |

## Trạng thái

```
hotel_status:          (tạo) → DRAFT ──gửi hồ sơ──► PENDING_VERIFICATION ──duyệt──► ACTIVE
                                 ▲                         │
                                 └── từ chối / yêu cầu bổ sung ┘
verification_status:   PENDING → APPROVED | REJECTED | NEEDS_REVISION   (gửi lại = hồ sơ mới)
Xác minh lại (D9):     quản lý tạo hồ sơ RENEWAL ở NEEDS_REVISION kèm lý do; khách sạn vẫn ACTIVE; đối tác nộp hồ sơ RENEWAL mới
room_status (D11):     AVAILABLE ⇄ MAINTENANCE (đối tác khóa / mở); OCCUPIED, CLEANING do lễ tân (phase 3)
partner_status:        PENDING ──khách sạn đầu tiên được duyệt──► APPROVED; SUSPENDED = chỉ xem
Tài khoản nhân viên:   INVITED ──chấp nhận lời mời──► ACTIVE ⇄ DEACTIVATED (đối tác vô hiệu hóa / kích hoạt lại); INVITED ──hủy lời mời──► (xóa)
```

Khách sạn chỉ hiển thị cho khách khi `ACTIVE` (BR-01). Khi đang có hồ sơ `PENDING` thì không gửi thêm hồ sơ khác.

## Việc của FE

Tài khoản demo: [getting-started.md](../getting-started.md#tài-khoản-demo).

- Thêm **trang đăng ký đối tác** (service `registerPartner()` đã có) và luồng OTP như khách hàng.
- `partner/hotel`: form theo màn 42 (tab Thông tin chung, Hình ảnh, Chính sách) và cấu hình phòng.
- `partner/rooms`: hai tab Loại phòng / Phòng thực tế (màn 43–45), nút khóa / mở phòng.
- `partner/staff`: danh sách (gồm lời mời chưa chấp nhận), mời, hủy lời mời, vô hiệu hóa / kích hoạt lại, phân quyền 5 nhóm (bỏ "Kế toán").
- Trang **`/accept-invitation`** (link trong email mời): đặt mật khẩu qua `POST /auth/invitations/accept`.
- `partner/verification`: giữ wizard 4 bước; thêm 3 field thụ hưởng; **tách ô tải ANTT và PCCC**; tải file qua `/uploads/verification-documents`.
- Lấy tên và trạng thái khách sạn ở shell từ `GET /me/hotels` thay vì viết cố định.
- `manager/verifications`: hàng đợi và màn duyệt; SLA tự tính từ `submittedAt`; xem giấy tờ qua `GET /verification-documents/:id/file` ([api/manager.md](../api/manager.md)).
- Đăng nhập: hiện đúng thông báo cho `AUTH_ACCOUNT_DEACTIVATED` (nhân viên bị vô hiệu hóa).

## Câu hỏi còn mở

- [x] Phạm vi "tiền thật" cho thanh toán và chi trả cho đối tác: **chốt SePay** (18/10). Khách chuyển khoản thật qua VietQR, SePay báo về qua webhook. Thiết kế chi tiết ở phase 2.

## Definition of Done

- [x] E2e chứng minh đối tác A không đọc/sửa được khách sạn của đối tác B
- [x] Có seed ít nhất 3 khách sạn ACTIVE cho phase 2
- [ ] Các trang [api/](../api/README.md) của phase khớp với code, trạng thái API `Integrated`

## Changelog

| Ngày | Ai | Thay đổi |
|---|---|---|
| 2026-10-14 | | Tạo bản nháp |
| 2026-10-18 | BE | Chốt theo SRS, schema và FE hiện có: quyết định D1–D13, endpoint, kiểu dữ liệu, mã lỗi, việc của FE |
| 2026-10-19 | BE | Khách sạn, catalog, ảnh (Cloudinary), loại phòng, phòng (PR #25, #28, #29); mỗi khách sạn một cấu hình phòng; đối tác bị đình chỉ chỉ xem |
| 2026-10-20 | BE | Nhân viên: quyền, vô hiệu hóa (`DEACTIVATED`), hủy lời mời (PR #30, #31); hồ sơ xác minh, mã hóa số tài khoản, email kết quả (PR #32); che CCCD trong danh sách; dữ liệu demo; trạng thái `BE Done` |
| 2026-10-21 | BE | Tài liệu chuyển ra `docs/` ở gốc repo; endpoint tách theo vai trò ([partner](../api/partner.md), [staff](../api/staff.md), [manager](../api/manager.md)); nội dung không đổi |

# Contract phase 1: Đối tác đưa khách sạn lên nền tảng

| | |
|---|---|
| Trạng thái | `Agreed` (BE), chờ FE xác nhận |
| Phase | [phase-1-hotel-onboarding](../phases/phase-1-hotel-onboarding.md) |
| BE phụ trách | Khiêm, Phúc |
| FE phụ trách | |
| Ngày chốt (Agreed) | 2026-10-18 |

> Quy tắc chung: [api-guide.md](../api-guide.md) (envelope, mã lỗi, phân trang §5, tiền §3). URL theo feature/tài nguyên (CONVENTIONS §1).
> "Thành viên khách sạn" = đối tác sở hữu hoặc nhân viên được gán. Mọi route theo khách sạn đều kiểm tra tenant (`HotelAccessGuard`).

## 1. Quyết định đã chốt

| # | Quyết định |
|---|---|
| D1 | Thêm bảng `hotel_image` và `room_type_image` (ảnh khách sạn, ảnh loại phòng). `room_image` (ảnh phòng thực tế) giữ nguyên. |
| D2 | `hotel_staff.permissions`: mảng các nhóm quyền theo SRS UC62: `BOOKING` (Đặt phòng), `FRONT_DESK` (Lễ tân), `CUSTOMER_CARE` (Chăm sóc khách), `REFUND` (Hoàn tiền), `MARKETING`. Không có nhóm "Kế toán". |
| D3 | **Giá gốc của loại phòng** = một dòng `price` có `valid_from`, `valid_to`, `day_of_week` đều trống. Luật giá theo mùa (phase 2) là các dòng `price` khác; giá một đêm = dòng cụ thể nhất. |
| D4 | **`hotel_room_config`** = cấu hình phòng của đối tác cho khách sạn: `total_rooms` là số phòng thực tế đối tác khai báo, `base_price` là giá gốc mặc định gợi ý khi tạo loại phòng mới. Không tạo được nhiều phòng thực tế hơn `total_rooms` (muốn thêm thì sửa cấu hình). Mỗi khách sạn một cấu hình (`hotel_id` unique trong DB). |
| D5 | File lưu trên **Cloudinary**, BE nhận file rồi đẩy lên. Giấy tờ xác minh lưu ở chế độ riêng tư, **chỉ chủ khách sạn và quản lý nền tảng xem được** (BE cấp link có hạn). |
| D6 | Duyệt **theo từng khách sạn**. Lần duyệt đầu tiên đổi `hotel_partner.status` sang `APPROVED`. |
| D7 | Một đối tác có thể có nhiều khách sạn. BE hỗ trợ đầy đủ; FE tự chọn cách hiển thị. |
| D8 | Chính sách khách sạn, thông tin pháp nhân, thông tin cơ sở và thông tin thụ hưởng lưu dạng key-value trong `hotel_properties`. Field nộp kèm hồ sơ gắn với hồ sơ đó (`verification_request_id`), nên mỗi lần nộp là một bản lưu riêng. |
| D9 | Đối tác sửa khách sạn đang `ACTIVE` **không cần duyệt lại**. Quản lý nền tảng có thể **yêu cầu xác minh lại kèm lý do** (ví dụ giấy phép hết hạn). Đình chỉ khách sạn làm cùng nhóm vi phạm (phase sau); đình chỉ **tài khoản** đối tác theo BR-15 (quản lý đề nghị, admin quyết định). |
| D10 | Tài liệu bắt buộc: giấy phép kinh doanh (`BUSINESS_LICENSE`), PCCC (`FIRE_SAFETY`), ANTT (`SECURITY_CERTIFICATE`). Chứng nhận xếp hạng (`OTHER`) tùy chọn. PDF/JPG/PNG, tối đa 10 MB mỗi file. |
| D11 | Phòng chỉ đặt và gán được khi `AVAILABLE`. `MAINTENANCE`, `CLEANING`, `OCCUPIED` = chưa sẵn sàng. "Khóa phòng" = `MAINTENANCE`, "Mở lại" = `AVAILABLE`. |
| D12 | **Thông tin thụ hưởng** (ngân hàng, số tài khoản, tên chủ tài khoản) thu trong bước Pháp nhân của hồ sơ. Số tài khoản **mã hóa khi lưu**, chỉ chủ khách sạn và quản lý nền tảng xem đầy đủ; danh sách và hàng đợi chỉ hiện 4 số cuối. |
| D13 | Wizard xác minh **4 bước** như FE: Pháp nhân, Cơ sở lưu trú, Tài liệu, Xác nhận (Report 3 màn 39 cập nhật theo). |

## 2. Trạng thái

```
hotel_status:          (tạo) → DRAFT ──gửi hồ sơ──► PENDING_VERIFICATION ──duyệt──► ACTIVE
                                 ▲                         │
                                 └── từ chối / yêu cầu bổ sung ┘
verification_status:   PENDING → APPROVED | REJECTED | NEEDS_REVISION   (gửi lại = hồ sơ mới)
Xác minh lại (D9):     quản lý tạo hồ sơ RENEWAL ở NEEDS_REVISION kèm lý do; khách sạn vẫn ACTIVE; đối tác nộp hồ sơ RENEWAL mới
room_status (D11):     AVAILABLE ⇄ MAINTENANCE (đối tác khóa / mở); OCCUPIED, CLEANING do lễ tân (phase 3)
```

Khách sạn chỉ hiển thị cho khách khi `ACTIVE` (BR-01). Khi đang có hồ sơ `PENDING` thì không gửi thêm hồ sơ khác.

Đối tác bị đình chỉ (`hotel_partner.status = SUSPENDED`): vẫn xem được khách sạn của mình, nhưng mọi thao tác tạo hoặc sửa của chủ khách sạn trả `403 PARTNER_SUSPENDED`.

## 3. Endpoint

Cột Response là nội dung của `data`.

### Danh mục (công khai)

| Method | Path | Response |
|---|---|---|
| GET | `/amenities` | `Amenity[]` |
| GET | `/bed-types` | `BedType[]` |

### Khách sạn

| Method | Path | Quyền | Body | Response |
|---|---|---|---|---|
| GET | `/me/hotels` | HOTEL_PARTNER (khách sạn sở hữu), HOTEL_STAFF (khách sạn được gán) | | `HotelSummary[]` |
| POST | `/hotels` | HOTEL_PARTNER | `createHotelSchema` | `Hotel` (201), `DRAFT` |
| GET | `/hotels/:hotelId` | thành viên | | `Hotel` |
| PATCH | `/hotels/:hotelId` | chủ | `updateHotelSchema` | `Hotel` |
| PUT | `/hotels/:hotelId/amenities` | chủ | `{ amenityIds: string[] }` | `Hotel` |
| PUT | `/hotels/:hotelId/policies` | chủ | `{ policies: Record<string, string> }` | `Hotel` |
| PUT | `/hotels/:hotelId/room-config` | chủ | `{ totalRooms, basePrice }` | `Hotel` |
| POST | `/hotels/:hotelId/images` | chủ | multipart `file`, `caption?`, `isCover?` (`uploadHotelImageSchema`) | `HotelImage` (201) |
| PATCH | `/hotel-images/:id` | chủ | `{ caption?, isCover?: true, sortOrder? }` (`updateHotelImageSchema`) | `HotelImage` |
| DELETE | `/hotel-images/:id` | chủ | | 204 |

- `PATCH /hotels/:hotelId`: chỉ đổi field được gửi; gửi `null` để xóa field không bắt buộc (`description`, `latitude`, `longitude`, `starRating`, `phone`, `website`, `checkInTime`, `checkOutTime`).
- `PUT .../amenities` và `PUT .../policies` **thay toàn bộ** danh sách (key không gửi lên sẽ bị xóa). Id tiện ích không tồn tại trả `VALIDATION_ERROR` (field `amenityIds`).
- `PUT .../room-config`: `totalRooms` nhỏ hơn số phòng thực tế đang có trả `ROOM_LIMIT_REACHED`.
- `GET /amenities`: tên và nhóm (`category`) bằng tiếng Việt, `icon` là tên icon của `lucide-react` (ví dụ `wifi`, `waves`).
- **Ảnh** (luật trong `UPLOAD_RULES` của shared): JPG/PNG/WebP, tối đa 10 MB, tối đa 30 ảnh mỗi khách sạn (`IMAGE_LIMIT_REACHED`). BE đọc loại file từ nội dung, không tin tên file. Ảnh đầu tiên tự thành ảnh bìa; luôn có đúng một ảnh bìa: `isCover: true` chuyển bìa sang ảnh đó, xóa ảnh bìa thì ảnh kế tiếp (theo `sortOrder`) thành bìa. Ảnh không tồn tại hoặc không thuộc khách sạn của người gọi trả `IMAGE_NOT_FOUND`. Chưa cấu hình Cloudinary trả `503 UPLOAD_UNAVAILABLE`.
- **Giấy tờ xác minh**: PDF/JPG/PNG, tối đa 10 MB, lưu riêng tư theo từng đối tác; `fileId` chỉ dùng được trong hồ sơ của chính đối tác đã tải lên.

### Loại phòng và phòng

| Method | Path | Quyền | Body / Query | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/room-types` | thành viên | | `RoomType[]` |
| POST | `/hotels/:hotelId/room-types` | chủ | `createRoomTypeSchema` | `RoomType` (201) |
| GET | `/room-types/:id` | thành viên | | `RoomType` |
| PATCH | `/room-types/:id` | chủ | `updateRoomTypeSchema` | `RoomType` |
| DELETE | `/room-types/:id` | chủ | | 204 (`ROOM_TYPE_IN_USE` nếu còn phòng thực tế hoặc đơn đặt phòng) |
| POST | `/room-types/:id/images` | chủ | multipart `file`, `caption?` (`uploadRoomTypeImageSchema`) | `RoomTypeImage` (201) |
| PATCH | `/room-type-images/:id` | chủ | `{ caption?, sortOrder? }` (`updateRoomTypeImageSchema`) | `RoomTypeImage` |
| DELETE | `/room-type-images/:id` | chủ | | 204 |
| GET | `/hotels/:hotelId/rooms` | thành viên | `?roomTypeId=&status=&search=&sort=&page=&pageSize=` (`roomListQuerySchema`) | `Room[]` + `meta` |
| POST | `/hotels/:hotelId/rooms` | chủ | `createRoomSchema` | `Room` (201) |
| PATCH | `/rooms/:id` | chủ | `updateRoomSchema` | `Room` |
| POST | `/rooms/:id/lock` | chủ | `{ reason? }` | `Room` (`MAINTENANCE`) |
| POST | `/rooms/:id/unlock` | chủ | | `Room` (`AVAILABLE`) |

- **Loại phòng**: giá gốc lưu thành dòng `price` không có phòng, ngày, thứ (D3). `PATCH` gửi `beds` / `amenityIds` thì **thay cả danh sách**, không gửi thì giữ nguyên; `description: null` để xóa. Loại giường hoặc tiện ích không tồn tại trả `VALIDATION_ERROR` (field `beds` / `amenityIds`). Ảnh loại phòng giống ảnh khách sạn nhưng không có ảnh bìa (hiển thị theo `sortOrder`), tối đa 30 ảnh. `areaSqm` tối đa 2 chữ số thập phân. `basePrice` chỉ là `null` với loại phòng tạo ngoài API (seed, sửa tay); `PATCH basePrice` sẽ tạo lại giá gốc.
- **Phòng**: phải có cấu hình phòng trước; tổng số phòng không vượt `totalRooms` (`ROOM_LIMIT_REACHED`). Số phòng không trùng trong cùng khách sạn, không phân biệt hoa thường (`ROOM_NUMBER_TAKEN`). `roomTypeId` phải thuộc cùng khách sạn (`ROOM_TYPE_NOT_FOUND`). Trạng thái không sửa qua `PATCH`.
- **Danh sách phòng**: `search` tìm theo số phòng (tìm đúng ký tự, `%` và `_` không phải ký tự đại diện); `sort` nhận `room-number-asc` (mặc định), `room-number-desc`, `floor-asc`, `floor-desc`. Số phòng sắp theo thứ tự số tự nhiên: `9`, `101`, `1001`.
- **Khóa / mở phòng**: khóa chuyển sang `MAINTENANCE` (không khóa được phòng `OCCUPIED`); mở chỉ áp dụng cho phòng đang khóa. Cả hai trả `ROOM_NOT_LOCKABLE` khi không hợp lệ và được ghi audit log (kèm lý do khóa).

### Nhân viên (mời nhân viên dùng `POST /auth/invitations/staff` có sẵn)

| Method | Path | Quyền | Body | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/staff` | chủ (xem được cả khi đối tác bị đình chỉ) | | `StaffMember[]` (gồm cả lời mời chưa chấp nhận, `INVITED`) |
| PATCH | `/hotel-staff/:id/permissions` | chủ | `{ permissions: StaffPermission[] }` | `StaffMember` |
| POST | `/hotel-staff/:id/deactivate` | chủ | | `StaffMember` |
| POST | `/hotel-staff/:id/activate` | chủ | | `StaffMember` |

- **Quyền nhân viên**: `PATCH .../permissions` thay cả danh sách (mảng rỗng = chỉ xem); có hiệu lực từ request kế tiếp của nhân viên. Nhân viên, dù đủ 5 nhóm quyền, không quản lý được nhân viên khác.
- **Vô hiệu hóa**: `ACTIVE → DEACTIVATED` (trạng thái riêng, khác `SUSPENDED` của admin), thu hồi mọi phiên đăng nhập ngay; đăng nhập trả `403 AUTH_ACCOUNT_DEACTIVATED`. **Kích hoạt lại**: `DEACTIVATED → ACTIVE`, phiên cũ vẫn bị thu hồi. Trạng thái khác (lời mời chưa chấp nhận, bị admin đình chỉ) trả `STAFF_STATUS_CONFLICT`: đối tác không thể gỡ đình chỉ của admin. Cả ba thao tác ghi audit log.

### Hồ sơ xác minh

| Method | Path | Quyền | Body / Query | Response |
|---|---|---|---|---|
| POST | `/uploads/verification-documents` | HOTEL_PARTNER | multipart `file` | `{ fileId }` (201): file riêng tư, dùng khi nộp hồ sơ |
| POST | `/hotels/:hotelId/verification-requests` | chủ | `submitVerificationSchema` | `VerificationRequest` (201); khách sạn sang `PENDING_VERIFICATION` |
| GET | `/hotels/:hotelId/verification-requests` | chủ | | `VerificationRequest[]` (lịch sử, lý do) |
| GET | `/verification-requests` | PLATFORM_MANAGER | `?status=&search=&page=&pageSize=&sort=` | `VerificationRequestSummary[]` + `meta` |
| GET | `/verification-requests/:id` | PLATFORM_MANAGER, chủ khách sạn | | `VerificationRequest` (đầy đủ field, số tài khoản đầy đủ) |
| GET | `/verification-documents/:id/file` | PLATFORM_MANAGER, chủ khách sạn | | Chuyển hướng tới link xem file có hạn |
| POST | `/verification-requests/:id/approve` | PLATFORM_MANAGER | | `VerificationRequest` |
| POST | `/verification-requests/:id/reject` | PLATFORM_MANAGER | `{ reason }` | `VerificationRequest` |
| POST | `/verification-requests/:id/request-changes` | PLATFORM_MANAGER | `{ reason }` | `VerificationRequest` |
| POST | `/hotels/:hotelId/reverification` | PLATFORM_MANAGER | `{ reason }` | `VerificationRequest` (`RENEWAL`, `NEEDS_REVISION`) |

`submitVerificationSchema`:

```jsonc
{
  "requestType": "INITIAL",            // INITIAL | UPDATE | RENEWAL
  "legal": {                           // bước 1 (Pháp nhân)
    "legalName": "…", "taxCode": "…", "businessType": "…",
    "representativeName": "…", "representativeTitle": "…", "representativeIdNumber": "…",
    "contactPhone": "…", "notificationEmail": "…"
  },
  "beneficiary": { "bankName": "…", "accountNumber": "…", "accountHolder": "…" },
  "property": {                        // bước 2 (Cơ sở lưu trú)
    "tradeName": "…", "propertyType": "…", "starRating": 4, "physicalRooms": 36,
    "propertyManager": "…", "licensedAddress": "…", "landmark": "…",
    "frontDeskHours": "24/7", "surveyNotes": "…"
  },
  "documents": [{ "documentType": "BUSINESS_LICENSE", "fileId": "…" }],   // bước 3
  "commitment": true                   // bước 4 (cam kết thông tin chính xác)
}
```

## 4. Kiểu dữ liệu response

Kiểu TypeScript đặt trong `@stayreco/shared` (`responses/hotel.ts`). Tiền là số (tối đa 2 chữ số lẻ), ngày giờ là chuỗi ISO.

```jsonc
// HotelSummary
{ "id": "uuid", "name": "An Nhiên Riverside Hotel", "city": "Đà Nẵng", "starRating": 4,
  "status": "ACTIVE", "coverImageUrl": "https://…", "myRole": "OWNER" }        // OWNER | STAFF

// Hotel
{ "id": "uuid", "name": "…", "description": "…", "address": "…", "city": "…", "country": "Vietnam",
  "latitude": 16.06, "longitude": 108.22, "starRating": 4, "phone": "…", "email": "…", "website": null,
  "checkInTime": "14:00", "checkOutTime": "12:00", "status": "DRAFT",
  "amenities": [{ "id": "uuid", "name": "Wi-Fi", "icon": "wifi", "category": "General" }],
  "images": [{ "id": "uuid", "url": "https://…", "caption": null, "isCover": true, "sortOrder": 0 }],
  "policies": { "cancellation": "…", "children": "…" },
  "roomConfig": { "totalRooms": 36, "basePrice": 2800000 },
  "createdAt": "…" }

// RoomType
{ "id": "uuid", "hotelId": "uuid", "name": "Deluxe River View", "description": "…",
  "maxOccupancy": 2, "areaSqm": 32, "basePrice": 2800000,
  "beds": [{ "bedTypeId": "uuid", "name": "Queen", "quantity": 1 }],
  "amenities": [ … ], "images": [ … ], "roomCount": 12 }

// Room
{ "id": "uuid", "roomTypeId": "uuid", "roomNumber": "301", "floor": 3, "status": "AVAILABLE", "notes": null }

// StaffMember
{ "id": "uuid", "fullName": "…", "email": "…", "position": "Lễ tân", "status": "ACTIVE",
  "permissions": ["BOOKING", "FRONT_DESK"] }

// VerificationRequest
{ "id": "uuid", "hotelId": "uuid", "hotelName": "…", "requestType": "INITIAL", "status": "PENDING",
  "reason": null, "submittedAt": "…", "reviewedAt": null,
  "legal": { … }, "beneficiary": { "bankName": "…", "accountNumber": "…", "accountHolder": "…" },
  "property": { … },
  "documents": [{ "id": "uuid", "documentType": "FIRE_SAFETY", "uploadedAt": "…" }] }

// VerificationRequestSummary (hàng đợi): không có field chi tiết; số tài khoản chỉ hiện 4 số cuối
```

## 5. Mã lỗi mới

| `code` | HTTP | Khi nào |
|---|---|---|
| `HOTEL_NOT_FOUND` | 404 | Khách sạn không tồn tại hoặc không thuộc người gọi (đã có) |
| `PARTNER_SUSPENDED` | 403 | Đối tác bị đình chỉ: chỉ xem được, không tạo/sửa |
| `ROOM_TYPE_NOT_FOUND`, `ROOM_NOT_FOUND`, `STAFF_NOT_FOUND` | 404 | Tương tự, theo tài nguyên |
| `STAFF_STATUS_CONFLICT` | 409 | Vô hiệu hóa nhân viên không ở trạng thái `ACTIVE`, hoặc kích hoạt nhân viên không ở `DEACTIVATED` |
| `AUTH_ACCOUNT_DEACTIVATED` | 403 | Nhân viên đã bị đối tác vô hiệu hóa đăng nhập (đúng mật khẩu) |
| `ROOM_NUMBER_TAKEN` | 409 | Số phòng đã có trong khách sạn |
| `ROOM_LIMIT_REACHED` | 409 | Chưa có cấu hình phòng, hoặc vượt `total_rooms` (kể cả khi hạ `total_rooms` thấp hơn số phòng đang có) |
| `ROOM_TYPE_IN_USE` | 409 | Xóa loại phòng khi còn phòng thực tế hoặc đơn đặt phòng |
| `ROOM_NOT_LOCKABLE` | 409 | Khóa phòng đang có khách (`OCCUPIED`), hoặc mở phòng không ở trạng thái khóa |
| `VERIFICATION_PENDING` | 409 | Đã có hồ sơ đang chờ duyệt |
| `VERIFICATION_DOCUMENTS_MISSING` | 400 | Thiếu tài liệu bắt buộc (D10) |
| `VERIFICATION_ALREADY_DECIDED` | 409 | Duyệt / từ chối hồ sơ đã có kết quả |
| `UPLOAD_INVALID_FILE` | 400 | Thiếu file, sai định dạng, quá 10 MB, hoặc file hỏng (Cloudinary từ chối) |
| `UPLOAD_UNAVAILABLE` | 503 | Chưa cấu hình hoặc không kết nối được Cloudinary |
| `IMAGE_NOT_FOUND` | 404 | Ảnh không tồn tại hoặc không thuộc khách sạn người gọi quản lý |
| `IMAGE_LIMIT_REACHED` | 409 | Đã đủ 30 ảnh |

## 6. Việc của FE

- Thêm **trang đăng ký đối tác** (service `registerPartner()` đã có) và luồng OTP như khách hàng.
- `partner/hotel`: form theo màn 42 (tab Thông tin chung, Hình ảnh, Chính sách) và cấu hình phòng.
- `partner/rooms`: hai tab Loại phòng / Phòng thực tế (màn 43–45), nút khóa / mở phòng.
- `partner/staff`: danh sách, mời, vô hiệu hóa, phân quyền 5 nhóm (bỏ "Kế toán").
- `partner/verification`: giữ wizard 4 bước; thêm 3 field thụ hưởng; **tách ô tải ANTT và PCCC**; tải file qua `/uploads/verification-documents`.
- Lấy tên và trạng thái khách sạn ở shell từ `GET /me/hotels` thay vì viết cố định.
- `manager/verifications`: hàng đợi và màn duyệt; SLA tự tính từ `submittedAt`.

## 7. Câu hỏi còn mở

- [x] Phạm vi "tiền thật" cho thanh toán và chi trả cho đối tác: **chốt SePay** (18/10). Khách chuyển khoản thật qua VietQR, SePay báo về qua webhook. Chi tiết thiết kế ở contract phase 2.

## Changelog

| Ngày | Ai | Thay đổi |
|---|---|---|
| 2026-10-14 | | Tạo bản nháp |
| 2026-10-18 | BE | Chốt theo SRS, schema và FE hiện có: quyết định D1–D13, endpoint, kiểu dữ liệu, mã lỗi, việc của FE |

# Contract phase 1: Đối tác đưa khách sạn lên nền tảng

| | |
|---|---|
| Trạng thái | `BE Done`: mọi endpoint đã merge vào `develop`, FE tích hợp được |
| Phase | [phase-1-hotel-onboarding](../phases/phase-1-hotel-onboarding.md) |
| BE phụ trách | Khiêm, Phúc |
| FE phụ trách | |
| Ngày chốt (Agreed) | 2026-10-18 |

> Quy tắc chung: [api-guide.md](../api-guide.md) (envelope, mã lỗi, phân trang §5, tiền §3). URL theo feature/tài nguyên (CONVENTIONS §1).
> "Thành viên khách sạn" = đối tác sở hữu hoặc nhân viên được gán. Mọi route theo khách sạn đều kiểm tra tenant (`HotelAccessGuard`).

## 0. Bắt đầu nhanh (cho FE)

**Chạy backend ở máy**

1. `git pull` nhánh `develop`, vào `backend/`.
2. `.env`: chép từ `.env.example`. Bắt buộc có `BENEFICIARY_ENCRYPTION_KEY` (lệnh tạo ghi ngay trong `.env.example`); muốn tải ảnh thật thì điền `CLOUDINARY_*` (để trống thì API tải file trả `503 UPLOAD_UNAVAILABLE`, các API khác vẫn chạy).
3. `npm install`, `npx prisma migrate dev`, `npm run db:seed` (tạo tiện ích, loại giường, admin và **dữ liệu demo** ở mục 6), rồi `npm run dev`.
4. Base URL `http://localhost:3000/api/v1`. **Swagger** để thử từng API: `http://localhost:3000/api/docs` (bấm Authorize, dán access token).

**Quy ước gọi API** (chi tiết ở [api-guide.md](../api-guide.md))

- Gửi `Authorization: Bearer <accessToken>` cho mọi API trừ `/amenities`, `/bed-types`. Refresh token khi gặp `401 UNAUTHENTICATED` (api-guide §2.3).
- Mọi response có dạng `{ success, message, data, meta? }`; lỗi có `code`. **FE xử lý theo `code`**, không theo `message`. Bảng mã lỗi của phần này ở mục 5.
- Danh sách có phân trang trả `meta: { page, pageSize, total, totalPages }`.
- **Tải file**: `multipart/form-data`, field file tên là `file`; các field chữ đi kèm (`caption`, `isCover`) gửi dạng chuỗi (`isCover: "true"`). Ví dụ:

  ```ts
  const form = new FormData();
  form.append('file', file);            // File từ <input type="file">
  form.append('isCover', 'true');
  const { data } = await api.post(`/hotels/${hotelId}/images`, form);
  ```

**Dùng chung với BE qua `@stayreco/shared`** (validate form bằng chính schema BE dùng, kiểu response dùng cho TypeScript):

| Màn / form | Schema (body) | Kiểu response |
|---|---|---|
| Tạo / sửa khách sạn | `createHotelSchema`, `updateHotelSchema` | `Hotel`, `HotelSummary` |
| Tiện ích, chính sách, cấu hình phòng | `hotelAmenitiesSchema`, `hotelPoliciesSchema`, `roomConfigSchema` | `Hotel`, `Amenity`, `BedType` |
| Ảnh khách sạn / loại phòng | `uploadHotelImageSchema`, `updateHotelImageSchema`, `uploadRoomTypeImageSchema`, `updateRoomTypeImageSchema`; luật file `UPLOAD_RULES` | `HotelImage`, `RoomTypeImage` |
| Loại phòng, phòng | `createRoomTypeSchema`, `updateRoomTypeSchema`, `createRoomSchema`, `updateRoomSchema`, `lockRoomSchema`, `roomListQuerySchema` (`ROOM_SORTS`) | `RoomType`, `Room` |
| Nhân viên | `inviteStaffSchema`, `staffPermissionsSchema`, `acceptInvitationSchema` | `StaffMember` |
| Hồ sơ xác minh | `submitVerificationSchema`, `verificationDecisionSchema`, `verificationListQuerySchema` (`VERIFICATION_SORTS`); giấy tờ bắt buộc `REQUIRED_VERIFICATION_DOCUMENTS` | `UploadedDocument`, `VerificationRequest`, `VerificationRequestSummary`, `VerificationFileLink` |
| Hằng số | `StaffPermission`, `RoomStatus`, `HotelStatus`, `VerificationStatus`, `DocumentType`, `ErrorCode` | |

## 0.1 Luồng chính (thứ tự gọi API)

**A. Đối tác đưa khách sạn lên** (đăng nhập bằng tài khoản đối tác)

1. `GET /me/hotels` để hiện danh sách khách sạn; chưa có thì cho tạo mới.
2. `POST /hotels` → khách sạn `DRAFT`.
3. `GET /amenities`, `GET /bed-types` để dựng ô chọn; `PUT /hotels/:id/amenities`, `PUT /hotels/:id/policies`.
4. `POST /hotels/:id/images` (ảnh đầu tiên tự thành ảnh bìa; đổi bìa bằng `PATCH /hotel-images/:id { isCover: true }`).
5. `PUT /hotels/:id/room-config` (**bắt buộc trước khi tạo phòng**).
6. `POST /hotels/:id/room-types`, ảnh loại phòng `POST /room-types/:id/images`, rồi `POST /hotels/:id/rooms` cho từng phòng.
7. Wizard xác minh: với **mỗi** giấy tờ gọi `POST /uploads/verification-documents` → nhận `fileId`; bước 4 gửi `POST /hotels/:id/verification-requests` với các `fileId` đó → khách sạn `PENDING_VERIFICATION`.
8. Theo dõi kết quả: `GET /hotels/:id/verification-requests` (lịch sử, lý do). Bị từ chối / yêu cầu bổ sung thì khách sạn về `DRAFT`: sửa rồi nộp lại (tạo hồ sơ mới).

**B. Quản lý nền tảng duyệt** (tài khoản `PLATFORM_MANAGER`)

1. `GET /verification-requests?status=PENDING` (hàng đợi, cũ nhất trước).
2. `GET /verification-requests/:id` (chi tiết đầy đủ), xem từng giấy tờ bằng `GET /verification-documents/:docId/file` → mở `url`.
3. `POST .../approve`, hoặc `.../reject` / `.../request-changes` kèm `{ reason }`. Gặp `409 VERIFICATION_ALREADY_DECIDED` thì tải lại hồ sơ.
4. Khách sạn đang hoạt động cần xác minh lại: `POST /hotels/:id/reverification { reason }`.

**C. Mời và quản lý nhân viên**

1. Đối tác: `POST /auth/invitations/staff { email, fullName, hotelId, position }` → email chứa link `WEB_APP_URL/accept-invitation?token=…` (hạn 72 giờ).
2. Trang `/accept-invitation`: đọc `token` trên URL, cho đặt mật khẩu, gọi `POST /auth/invitations/accept { token, password }` → đăng nhập luôn.
3. Đối tác: `GET /hotels/:id/staff`, `PATCH /hotel-staff/:id/permissions`, `POST /hotel-staff/:id/deactivate | activate`, hủy lời mời gõ sai bằng `DELETE /hotel-staff/:id`.
4. Nhân viên đăng nhập: `GET /me/hotels` trả đúng khách sạn của mình (`myRole: "STAFF"`); chỉ xem được, không sửa khách sạn, phòng, nhân viên.

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
| D12 | **Thông tin thụ hưởng** (ngân hàng, số tài khoản, tên chủ tài khoản) thu trong bước Pháp nhân của hồ sơ. Số tài khoản **mã hóa khi lưu**, chỉ chủ khách sạn và quản lý nền tảng xem đầy đủ ở trang chi tiết; lịch sử hồ sơ chỉ hiện 4 số cuối; hàng đợi của quản lý không có thông tin thụ hưởng. |
| D13 | Wizard xác minh **4 bước** như FE: Pháp nhân, Cơ sở lưu trú, Tài liệu, Xác nhận (Report 3 màn 39 cập nhật theo). |

## 2. Trạng thái

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
| DELETE | `/hotel-staff/:id` | chủ | | 204: hủy lời mời chưa chấp nhận (chỉ khi `INVITED`) |

- **Quyền nhân viên**: `PATCH .../permissions` thay cả danh sách (mảng rỗng = chỉ xem); có hiệu lực từ request kế tiếp của nhân viên. Nhân viên, dù đủ 5 nhóm quyền, không quản lý được nhân viên khác.
- **Vô hiệu hóa**: `ACTIVE → DEACTIVATED` (trạng thái riêng, khác `SUSPENDED` của admin), thu hồi mọi phiên đăng nhập ngay; đăng nhập trả `403 AUTH_ACCOUNT_DEACTIVATED`. **Kích hoạt lại**: `DEACTIVATED → ACTIVE`, phiên cũ vẫn bị thu hồi. Trạng thái khác (lời mời chưa chấp nhận, bị admin đình chỉ) trả `STAFF_STATUS_CONFLICT`: đối tác không thể gỡ đình chỉ của admin. Cả ba thao tác ghi audit log.
- **Hủy lời mời**: chỉ khi nhân viên còn `INVITED`; xóa tài khoản mời nên link trong email hết hiệu lực (`AUTH_TOKEN_INVALID`) và email được dùng lại (ví dụ gõ sai). Tài khoản đã từng dùng thì không xóa, chỉ vô hiệu hóa (`STAFF_STATUS_CONFLICT`). Ghi audit log.

### Hồ sơ xác minh

| Method | Path | Quyền | Body / Query | Response |
|---|---|---|---|---|
| POST | `/uploads/verification-documents` | HOTEL_PARTNER | multipart `file` | `{ fileId }` (201): file riêng tư, dùng khi nộp hồ sơ |
| POST | `/hotels/:hotelId/verification-requests` | chủ | `submitVerificationSchema` | `VerificationRequest` (201); `INITIAL` thì khách sạn sang `PENDING_VERIFICATION` |
| GET | `/hotels/:hotelId/verification-requests` | chủ (xem được cả khi đối tác bị đình chỉ) | | `VerificationRequest[]` (mới nhất trước, có lý do; số tài khoản che `****1234`) |
| GET | `/verification-requests` | PLATFORM_MANAGER | `?status=&search=&sort=&page=&pageSize=` (`verificationListQuerySchema`) | `VerificationRequestSummary[]` + `meta` |
| GET | `/verification-requests/:id` | PLATFORM_MANAGER, chủ khách sạn | | `VerificationRequest` (đầy đủ field, số tài khoản đầy đủ) |
| GET | `/verification-documents/:id/file` | PLATFORM_MANAGER, chủ khách sạn | | `VerificationFileLink` `{ url, expiresAt }`: link xem file có hạn 5 phút (trả JSON, không chuyển hướng, vì tab mới của trình duyệt không gửi được Bearer token) |
| POST | `/verification-requests/:id/approve` | PLATFORM_MANAGER | | `VerificationRequest` |
| POST | `/verification-requests/:id/reject` | PLATFORM_MANAGER | `{ reason }` | `VerificationRequest` |
| POST | `/verification-requests/:id/request-changes` | PLATFORM_MANAGER | `{ reason }` | `VerificationRequest` |
| POST | `/hotels/:hotelId/reverification` | PLATFORM_MANAGER | `{ reason }` | `VerificationRequest` (`RENEWAL`, `NEEDS_REVISION`) (201) |

- **Loại hồ sơ do backend xác định**, client không gửi: khách sạn `DRAFT` → `INITIAL`; khách sạn `ACTIVE` đang có yêu cầu xác minh lại → `RENEWAL`; khách sạn `ACTIVE` khác → `UPDATE`. Khách sạn ở trạng thái khác trả `HOTEL_STATUS_CONFLICT`.
- **Nộp hồ sơ**: đủ 3 giấy tờ bắt buộc (`VERIFICATION_DOCUMENTS_MISSING`), mỗi giấy tờ là một file khác nhau (`VALIDATION_ERROR` ở `documents`); mỗi `fileId` phải do chính đối tác tải lên và đúng định dạng (sai thì `VALIDATION_ERROR` ở `documents.<i>.fileId`); đang có hồ sơ chờ duyệt thì `VERIFICATION_PENDING`. Bấm gửi hai lần cũng chỉ tạo một hồ sơ.
- **Số tài khoản thụ hưởng** mã hóa AES-256-GCM khi lưu (khóa `BENEFICIARY_ENCRYPTION_KEY`); chi tiết hồ sơ hiện đầy đủ cho chủ khách sạn và quản lý nền tảng; lịch sử chỉ hiện 4 số cuối; hàng đợi không có thông tin thụ hưởng. **Số CCCD người đại diện** (`legal.representativeIdNumber`) cũng chỉ hiện 4 số cuối trong lịch sử (dữ liệu cá nhân, Nghị định 13/2023), đầy đủ ở chi tiết.
- **Quyết định** chỉ áp dụng cho hồ sơ `PENDING` (người thứ hai nhận `VERIFICATION_ALREADY_DECIDED`). `INITIAL`: duyệt → khách sạn `ACTIVE`, đối tác `APPROVED` lần đầu (không duyệt được khi đối tác đang bị đình chỉ: `409 PARTNER_SUSPENDED`, vẫn từ chối hoặc yêu cầu bổ sung được); từ chối / yêu cầu bổ sung → khách sạn `DRAFT`. `UPDATE` / `RENEWAL` không đổi trạng thái khách sạn dù kết quả thế nào (đình chỉ khách sạn là quyết định riêng).
- **Email kết quả** (duyệt, từ chối, yêu cầu bổ sung, yêu cầu xác minh lại, kèm lý do) gửi tới `legal.notificationEmail` của hồ sơ; yêu cầu xác minh lại dùng email của hồ sơ gần nhất, không có thì email liên hệ của đối tác.
- **Hàng đợi** mặc định cũ nhất trước (`sort=submitted-asc`, hoặc `submitted-desc`); `search` tìm theo tên khách sạn.
- Nhân viên khách sạn không xem được hồ sơ (403); người ngoài nhận `VERIFICATION_NOT_FOUND`.
- **Xem giấy tờ (FE)**: gọi `GET /verification-documents/:id/file` bằng axios (có Bearer), nhận `{ url, expiresAt }`, rồi mở `url` ở tab mới hoặc dùng làm `src` của `<img>` / `<iframe>`. Link có chữ ký, không cần đăng nhập, hết hạn sau 5 phút; mỗi lần xem thì xin link mới, không lưu quá `expiresAt`. Mở tab ngay trong sự kiện click để không bị chặn popup:

  ```ts
  const tab = window.open('', '_blank');
  const { data } = await api.get(`/verification-documents/${id}/file`);
  tab!.location.href = data.data.url;
  ```

`submitVerificationSchema`:

```jsonc
{
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
  "amenities": [{ "id": "uuid", "name": "Wi-Fi miễn phí", "icon": "wifi", "category": "Chung" }],
  "images": [{ "id": "uuid", "url": "https://…", "caption": null, "isCover": true, "sortOrder": 0 }],
  "policies": { "cancellation": "…", "children": "…" },
  "roomConfig": { "totalRooms": 36, "basePrice": 2800000 },
  "createdAt": "…" }

// RoomType
{ "id": "uuid", "hotelId": "uuid", "name": "Deluxe River View", "description": "…",
  "maxOccupancy": 2, "areaSqm": 32, "basePrice": 2800000,          // null chỉ với loại phòng tạo ngoài API
  "beds": [{ "bedTypeId": "uuid", "name": "Giường Queen", "quantity": 1 }],
  "amenities": [ … ],
  "images": [{ "id": "uuid", "url": "https://…", "caption": null, "sortOrder": 0 }],   // RoomTypeImage, không có ảnh bìa
  "roomCount": 12 }

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

// VerificationRequest trong lịch sử (GET /hotels/:hotelId/verification-requests): giống trên nhưng
//   beneficiary.accountNumber = "****6789", legal.representativeIdNumber = "****6789"

// VerificationRequestSummary (hàng đợi của quản lý): chỉ các field id, hotelId, hotelName, requestType, status,
//   submittedAt, reviewedAt; không có legal / beneficiary / property / documents

// UploadedDocument (POST /uploads/verification-documents)
{ "fileId": "stayreco/verification/<partnerId>/<id>.pdf" }

// VerificationFileLink (GET /verification-documents/:id/file)
{ "url": "https://api.cloudinary.com/…&signature=…", "expiresAt": "2026-10-20T16:05:00.000Z" }
```

## 5. Mã lỗi mới

| `code` | HTTP | Khi nào |
|---|---|---|
| `HOTEL_NOT_FOUND` | 404 | Khách sạn không tồn tại hoặc không thuộc người gọi (đã có) |
| `PARTNER_SUSPENDED` | 403 / 409 | 403: đối tác bị đình chỉ chỉ xem được, không tạo/sửa. 409: quản lý duyệt hồ sơ `INITIAL` của đối tác đang bị đình chỉ |
| `ROOM_TYPE_NOT_FOUND`, `ROOM_NOT_FOUND`, `STAFF_NOT_FOUND` | 404 | Tương tự, theo tài nguyên |
| `STAFF_STATUS_CONFLICT` | 409 | Vô hiệu hóa nhân viên không ở trạng thái `ACTIVE`, kích hoạt nhân viên không ở `DEACTIVATED`, hoặc hủy lời mời đã được chấp nhận |
| `AUTH_ACCOUNT_DEACTIVATED` | 403 | Nhân viên đã bị đối tác vô hiệu hóa đăng nhập (đúng mật khẩu) |
| `ROOM_NUMBER_TAKEN` | 409 | Số phòng đã có trong khách sạn |
| `ROOM_LIMIT_REACHED` | 409 | Chưa có cấu hình phòng, hoặc vượt `total_rooms` (kể cả khi hạ `total_rooms` thấp hơn số phòng đang có) |
| `ROOM_TYPE_IN_USE` | 409 | Xóa loại phòng khi còn phòng thực tế hoặc đơn đặt phòng |
| `ROOM_NOT_LOCKABLE` | 409 | Khóa phòng đang có khách (`OCCUPIED`), hoặc mở phòng không ở trạng thái khóa |
| `VERIFICATION_PENDING` | 409 | Đã có hồ sơ đang chờ duyệt |
| `VERIFICATION_DOCUMENTS_MISSING` | 400 | Thiếu tài liệu bắt buộc (D10) |
| `VERIFICATION_ALREADY_DECIDED` | 409 | Duyệt / từ chối hồ sơ đã có kết quả |
| `VERIFICATION_NOT_FOUND` | 404 | Hồ sơ hoặc giấy tờ không tồn tại, hoặc người gọi không được xem |
| `HOTEL_STATUS_CONFLICT` | 409 | Trạng thái khách sạn không cho phép thao tác (nộp hồ sơ khi bị đình chỉ, xác minh lại khách sạn chưa hoạt động) |
| `UPLOAD_INVALID_FILE` | 400 | Thiếu file, sai định dạng, quá 10 MB, hoặc file hỏng (Cloudinary từ chối) |
| `UPLOAD_UNAVAILABLE` | 503 | Chưa cấu hình hoặc không kết nối được Cloudinary |
| `IMAGE_NOT_FOUND` | 404 | Ảnh không tồn tại hoặc không thuộc khách sạn người gọi quản lý |
| `IMAGE_LIMIT_REACHED` | 409 | Đã đủ 30 ảnh |

## 6. Việc của FE

**Dữ liệu demo** (`npm run db:seed` trong `backend/`, chạy lại nhiều lần không trùng; mật khẩu chung `Demo@123456`, đổi bằng `SEED_DEMO_PASSWORD`):

| Tài khoản | Vai trò | Dữ liệu |
|---|---|---|
| `partner.danang@stayreco.local` | Đối tác | Sơn Trà Bay Resort & Spa (ACTIVE, 3 loại phòng, 12 phòng) và Mỹ Khê Boutique Hotel (đang chờ duyệt): thử chọn nhiều khách sạn |
| `partner.hanoi@stayreco.local` | Đối tác | Hồ Gươm Heritage Hotel (ACTIVE) |
| `partner.hcm@stayreco.local` | Đối tác | Sài Gòn Riverside Grand Hotel (ACTIVE) |
| `staff.danang@stayreco.local`, `staff.hanoi@…`, `staff.hcm@…` | Nhân viên (Lễ tân, Đặt phòng) | Khách sạn ACTIVE của thành phố đó |
| `pm@stayreco.local` | Quản lý nền tảng | Hàng đợi có 1 hồ sơ PENDING (Mỹ Khê) |

Tên khách sạn và pháp nhân là hư cấu; ảnh là ảnh mẫu từ picsum.photos; giấy tờ của dữ liệu demo không có file thật trên Cloudinary (link xem file sẽ báo không tìm thấy).

**Việc cần làm:**

- Thêm **trang đăng ký đối tác** (service `registerPartner()` đã có) và luồng OTP như khách hàng.
- `partner/hotel`: form theo màn 42 (tab Thông tin chung, Hình ảnh, Chính sách) và cấu hình phòng.
- `partner/rooms`: hai tab Loại phòng / Phòng thực tế (màn 43–45), nút khóa / mở phòng.
- `partner/staff`: danh sách (gồm lời mời chưa chấp nhận), mời, hủy lời mời, vô hiệu hóa / kích hoạt lại, phân quyền 5 nhóm (bỏ "Kế toán").
- Trang **`/accept-invitation`** (link trong email mời): đặt mật khẩu qua `POST /auth/invitations/accept`.
- `partner/verification`: giữ wizard 4 bước; thêm 3 field thụ hưởng; **tách ô tải ANTT và PCCC**; tải file qua `/uploads/verification-documents`.
- Lấy tên và trạng thái khách sạn ở shell từ `GET /me/hotels` thay vì viết cố định.
- `manager/verifications`: hàng đợi và màn duyệt; SLA tự tính từ `submittedAt`; xem giấy tờ qua `GET /verification-documents/:id/file` (xem mục Hồ sơ xác minh).
- Đăng nhập: hiện đúng thông báo cho `AUTH_ACCOUNT_DEACTIVATED` (nhân viên bị vô hiệu hóa).

## 7. Câu hỏi còn mở

- [x] Phạm vi "tiền thật" cho thanh toán và chi trả cho đối tác: **chốt SePay** (18/10). Khách chuyển khoản thật qua VietQR, SePay báo về qua webhook. Chi tiết thiết kế ở contract phase 2.

## Changelog

| Ngày | Ai | Thay đổi |
|---|---|---|
| 2026-10-14 | | Tạo bản nháp |
| 2026-10-18 | BE | Chốt theo SRS, schema và FE hiện có: quyết định D1–D13, endpoint, kiểu dữ liệu, mã lỗi, việc của FE |
| 2026-10-19 | BE | Khách sạn, catalog, ảnh (Cloudinary), loại phòng, phòng (PR #25, #28, #29); mỗi khách sạn một cấu hình phòng; đối tác bị đình chỉ chỉ xem |
| 2026-10-20 | BE | Nhân viên: quyền, vô hiệu hóa (`DEACTIVATED`), hủy lời mời (PR #30, #31); hồ sơ xác minh, mã hóa số tài khoản, email kết quả (PR #32); che CCCD trong danh sách; dữ liệu demo; trạng thái `BE Done` |

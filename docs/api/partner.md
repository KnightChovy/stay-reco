# API: Đối tác khách sạn (`HOTEL_PARTNER`)

> Màn FE: `partner/*`. Quyết định nghiệp vụ (D1–D13) và lịch sử: [phases/phase-1-hotel-onboarding.md](../phases/phase-1-hotel-onboarding.md). Quy tắc chung: [api-guide.md](../api-guide.md).
> Mọi route theo khách sạn đều kiểm tra quyền theo khách sạn (`HotelAccessGuard`): *chủ* = đối tác sở hữu, *thành viên* = chủ hoặc nhân viên được gán. Một đối tác có thể có **nhiều khách sạn**.
> **Đối tác bị đình chỉ** (`partner_status = SUSPENDED`) vẫn xem được khách sạn của mình, nhưng mọi thao tác tạo hoặc sửa trả `403 PARTNER_SUSPENDED`.

## Luồng chính: đưa khách sạn lên

1. `GET /me/hotels` để hiện danh sách khách sạn; chưa có thì cho tạo mới.
2. `POST /hotels` → khách sạn `DRAFT`.
3. `GET /amenities`, `GET /bed-types` để dựng ô chọn; `PUT /hotels/:id/amenities`, `PUT /hotels/:id/policies`.
4. `POST /hotels/:id/images` (ảnh đầu tiên tự thành ảnh bìa; đổi bìa bằng `PATCH /hotel-images/:id { isCover: true }`).
5. `PUT /hotels/:id/room-config` (**bắt buộc trước khi tạo phòng**).
6. `POST /hotels/:id/room-types`, ảnh loại phòng `POST /room-types/:id/images`, rồi `POST /hotels/:id/rooms` cho từng phòng.
7. Wizard xác minh: với **mỗi** giấy tờ gọi `POST /uploads/verification-documents` → nhận `fileId`; bước 4 gửi `POST /hotels/:id/verification-requests` với các `fileId` đó → khách sạn `PENDING_VERIFICATION`.
8. Theo dõi kết quả: `GET /hotels/:id/verification-requests` (lịch sử, lý do). Bị từ chối hoặc yêu cầu bổ sung thì khách sạn về `DRAFT`: sửa rồi nộp lại (tạo hồ sơ mới). Mỗi kết quả cũng được gửi qua email.

**Tải file**: `multipart/form-data`, field file tên là `file`; field chữ đi kèm gửi dạng chuỗi (`isCover: "true"`).

```ts
const form = new FormData();
form.append('file', file);            // File từ <input type="file">
form.append('isCover', 'true');
const { data } = await api.post(`/hotels/${hotelId}/images`, form);
```

## Danh mục (công khai, không cần token)

| Method | Path | Response |
|---|---|---|
| GET | `/amenities` | `Amenity[]`: tên và nhóm (`category`) bằng tiếng Việt, `icon` là tên icon `lucide-react` (ví dụ `wifi`, `waves`) |
| GET | `/bed-types` | `BedType[]` |

## Khách sạn

| Method | Path | Quyền | Body | Response |
|---|---|---|---|---|
| GET | `/me/hotels` | đối tác (khách sạn sở hữu), nhân viên (khách sạn được gán) | | `HotelSummary[]` (`myRole`: `OWNER` / `STAFF`) |
| POST | `/hotels` | HOTEL_PARTNER | `createHotelSchema` | `Hotel` (201), `DRAFT` |
| GET | `/hotels/:hotelId` | thành viên | | `Hotel` |
| PATCH | `/hotels/:hotelId` | chủ | `updateHotelSchema` | `Hotel` |
| PUT | `/hotels/:hotelId/amenities` | chủ | `{ amenityIds: string[] }` (`hotelAmenitiesSchema`) | `Hotel` |
| PUT | `/hotels/:hotelId/policies` | chủ | `{ policies: Record<string, string> }` (`hotelPoliciesSchema`) | `Hotel` |
| PUT | `/hotels/:hotelId/room-config` | chủ | `{ totalRooms, basePrice }` (`roomConfigSchema`) | `Hotel` |
| POST | `/hotels/:hotelId/images` | chủ | multipart `file`, `caption?`, `isCover?` (`uploadHotelImageSchema`) | `HotelImage` (201) |
| PATCH | `/hotel-images/:id` | chủ | `{ caption?, isCover?: true, sortOrder? }` (`updateHotelImageSchema`) | `HotelImage` |
| DELETE | `/hotel-images/:id` | chủ | | 204 |

- `PATCH /hotels/:hotelId`: chỉ đổi field được gửi; gửi `null` để xóa field không bắt buộc (`description`, `latitude`, `longitude`, `starRating`, `phone`, `website`, `checkInTime`, `checkOutTime`). Số điện thoại tối đa 20 ký tự; website chỉ `http(s)`; `latitude` và `longitude` phải đi cùng nhau. Giờ check-in / check-out dạng `"HH:mm"`.
- `PUT .../amenities` và `PUT .../policies` **thay toàn bộ** danh sách (key không gửi lên sẽ bị xóa). Key chính sách dạng snake_case (`cancellation`, `children`). Id tiện ích không tồn tại trả `VALIDATION_ERROR` (field `amenityIds`).
- `PUT .../room-config`: mỗi khách sạn một cấu hình; `totalRooms` nhỏ hơn số phòng đang có trả `ROOM_LIMIT_REACHED`.
- **Ảnh** (luật trong `UPLOAD_RULES`): JPG/PNG/WebP, tối đa 10 MB, tối đa 30 ảnh mỗi khách sạn (`IMAGE_LIMIT_REACHED`). Loại file đọc từ nội dung, không tin tên file. Luôn có đúng một ảnh bìa: ảnh đầu tiên tự là bìa, `isCover: true` chuyển bìa sang ảnh đó, xóa ảnh bìa thì ảnh kế tiếp (theo `sortOrder`) thành bìa. Ảnh không tồn tại hoặc không thuộc khách sạn của người gọi trả `IMAGE_NOT_FOUND`. Chưa cấu hình Cloudinary trả `503 UPLOAD_UNAVAILABLE`.

## Loại phòng và phòng

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
| POST | `/rooms/:id/lock` | chủ | `{ reason? }` (`lockRoomSchema`) | `Room` (`MAINTENANCE`) |
| POST | `/rooms/:id/unlock` | chủ | | `Room` (`AVAILABLE`) |

- **Loại phòng**: giá gốc (`basePrice`) là giá mỗi đêm trước các luật giá theo mùa. `PATCH` gửi `beds` / `amenityIds` thì **thay cả danh sách**, không gửi thì giữ nguyên; `description: null` để xóa. Loại giường hoặc tiện ích không tồn tại trả `VALIDATION_ERROR` (field `beds` / `amenityIds`). `areaSqm` tối đa 2 chữ số thập phân. Ảnh loại phòng giống ảnh khách sạn nhưng không có ảnh bìa (hiển thị theo `sortOrder`), tối đa 30 ảnh. `basePrice` chỉ là `null` với loại phòng tạo ngoài API; `PATCH basePrice` tạo lại giá gốc.
- **Phòng**: phải có cấu hình phòng trước; tổng số phòng không vượt `totalRooms` (`ROOM_LIMIT_REACHED`). Số phòng không trùng trong cùng khách sạn, không phân biệt hoa thường (`ROOM_NUMBER_TAKEN`). `roomTypeId` phải thuộc cùng khách sạn (`ROOM_TYPE_NOT_FOUND`). Trạng thái không sửa qua `PATCH`.
- **Danh sách phòng**: `search` tìm đúng ký tự theo số phòng; `sort` thuộc `ROOM_SORTS`: `room-number-asc` (mặc định), `room-number-desc`, `floor-asc`, `floor-desc`. Số phòng sắp theo thứ tự số tự nhiên: `9`, `101`, `1001`.
- **Khóa / mở phòng**: chỉ phòng `AVAILABLE` mới đặt được. Khóa chuyển sang `MAINTENANCE` (không khóa được phòng `OCCUPIED`); mở chỉ áp dụng cho phòng đang khóa. Không hợp lệ trả `ROOM_NOT_LOCKABLE`. Cả hai được ghi audit log (kèm lý do khóa).

## Nhân viên

Mời nhân viên: `POST /auth/invitations/staff` ([auth.md](./auth.md)). Người được mời đặt mật khẩu ở trang `/accept-invitation`.

| Method | Path | Quyền | Body | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/staff` | chủ (xem được cả khi bị đình chỉ) | | `StaffMember[]` (gồm lời mời chưa chấp nhận, `INVITED`) |
| PATCH | `/hotel-staff/:id/permissions` | chủ | `{ permissions: StaffPermission[] }` (`staffPermissionsSchema`) | `StaffMember` |
| POST | `/hotel-staff/:id/deactivate` | chủ | | `StaffMember` |
| POST | `/hotel-staff/:id/activate` | chủ | | `StaffMember` |
| DELETE | `/hotel-staff/:id` | chủ | | 204: hủy lời mời chưa chấp nhận (chỉ khi `INVITED`) |

- **Nhóm quyền** (`StaffPermission`): `BOOKING` (Đặt phòng), `FRONT_DESK` (Lễ tân), `CUSTOMER_CARE` (Chăm sóc khách), `REFUND` (Hoàn tiền), `MARKETING`. Không có nhóm "Kế toán". `PATCH .../permissions` thay cả danh sách (mảng rỗng = chỉ xem), có hiệu lực từ request kế tiếp. Nhân viên dù đủ 5 nhóm cũng không quản lý được nhân viên khác.
- **Vô hiệu hóa**: `ACTIVE → DEACTIVATED` (khác `SUSPENDED` của admin), thu hồi mọi phiên đăng nhập ngay; nhân viên đăng nhập nhận `403 AUTH_ACCOUNT_DEACTIVATED`. **Kích hoạt lại**: `DEACTIVATED → ACTIVE`, phiên cũ vẫn bị thu hồi. Tài khoản `INVITED` hoặc bị admin đình chỉ trả `STAFF_STATUS_CONFLICT` (đối tác không gỡ được đình chỉ của admin).
- **Hủy lời mời**: chỉ khi còn `INVITED`; link trong email hết hiệu lực (`AUTH_TOKEN_INVALID`) và email dùng lại được (ví dụ gõ sai). Tài khoản đã từng dùng thì không xóa, chỉ vô hiệu hóa.

## Hồ sơ xác minh (phía đối tác)

| Method | Path | Quyền | Body | Response |
|---|---|---|---|---|
| POST | `/uploads/verification-documents` | HOTEL_PARTNER | multipart `file` | `UploadedDocument` `{ fileId }` (201): file riêng tư, dùng khi nộp hồ sơ |
| POST | `/hotels/:hotelId/verification-requests` | chủ | `submitVerificationSchema` | `VerificationRequest` (201); hồ sơ lần đầu thì khách sạn sang `PENDING_VERIFICATION` |
| GET | `/hotels/:hotelId/verification-requests` | chủ (xem được cả khi bị đình chỉ) | | `VerificationRequest[]` (mới nhất trước, có lý do; số tài khoản và CCCD che `****1234`) |
| GET | `/verification-requests/:id` | chủ khách sạn, quản lý nền tảng | | `VerificationRequest` (đầy đủ) |
| GET | `/verification-documents/:id/file` | chủ khách sạn, quản lý nền tảng | | `VerificationFileLink` `{ url, expiresAt }` |

- **Wizard 4 bước** (body `submitVerificationSchema`): bước 1 Pháp nhân (`legal` và 3 field thụ hưởng `beneficiary`), bước 2 Cơ sở lưu trú (`property`), bước 3 Tài liệu (`documents`), bước 4 Xác nhận (`commitment: true`). **Không** gửi loại hồ sơ: backend tự xác định (`DRAFT` → `INITIAL`; khách sạn đang hoạt động có yêu cầu xác minh lại → `RENEWAL`; còn lại → `UPDATE`).
- **Giấy tờ**: bắt buộc giấy phép kinh doanh, PCCC, ANTT (`REQUIRED_VERIFICATION_DOCUMENTS`; thiếu thì `VERIFICATION_DOCUMENTS_MISSING`), giấy xếp hạng (`OTHER`) tùy chọn. PDF/JPG/PNG, tối đa 10 MB, **mỗi giấy tờ một file khác nhau**. `fileId` chỉ dùng được trong hồ sơ của chính đối tác đã tải lên (sai thì `VALIDATION_ERROR` ở `documents.<i>.fileId`).
- Đang có hồ sơ chờ duyệt thì `VERIFICATION_PENDING`; bấm gửi hai lần cũng chỉ tạo một hồ sơ. Khách sạn đang bị đình chỉ trả `HOTEL_STATUS_CONFLICT`.
- Số tài khoản thụ hưởng được mã hóa khi lưu; chi tiết hiện đầy đủ, lịch sử chỉ hiện 4 số cuối (cả số CCCD người đại diện). Nhân viên khách sạn không xem được hồ sơ (403).
- **Xem giấy tờ**: gọi `GET /verification-documents/:id/file` (có Bearer), nhận link có chữ ký hết hạn sau 5 phút, rồi mở ở tab mới hoặc dùng làm `src` của `<img>` / `<iframe>`. Mỗi lần xem thì xin link mới. Mở tab ngay trong sự kiện click để không bị chặn popup:

  ```ts
  const tab = window.open('', '_blank');
  const { data } = await api.get(`/verification-documents/${id}/file`);
  tab!.location.href = data.data.url;
  ```

```jsonc
// submitVerificationSchema
{
  "legal": {                           // bước 1 (Pháp nhân)
    "legalName": "…", "taxCode": "…", "businessType": "…",
    "representativeName": "…", "representativeTitle": "…", "representativeIdNumber": "…",
    "contactPhone": "…", "notificationEmail": "…"   // kết quả duyệt gửi về email này
  },
  "beneficiary": { "bankName": "…", "accountNumber": "…", "accountHolder": "…" },
  "property": {                        // bước 2 (Cơ sở lưu trú)
    "tradeName": "…", "propertyType": "…", "starRating": 4, "physicalRooms": 36,
    "propertyManager": "…", "licensedAddress": "…", "landmark": "…",
    "frontDeskHours": "24/7", "surveyNotes": "…"
  },
  "documents": [{ "documentType": "BUSINESS_LICENSE", "fileId": "…" }],   // bước 3
  "commitment": true                   // bước 4
}
```

## Kiểu dữ liệu

Kiểu TypeScript trong `@stayreco/shared` (`responses/hotel.ts`). Tiền là số (tối đa 2 chữ số lẻ), ngày giờ là chuỗi ISO.

```jsonc
// HotelSummary
{ "id": "uuid", "name": "Sơn Trà Bay Resort & Spa", "city": "Đà Nẵng", "starRating": 5,
  "status": "ACTIVE", "coverImageUrl": "https://…", "myRole": "OWNER" }        // OWNER | STAFF

// Hotel
{ "id": "uuid", "name": "…", "description": "…", "address": "…", "city": "…", "country": "Vietnam",
  "latitude": 16.06, "longitude": 108.22, "starRating": 4, "phone": "…", "email": "…", "website": null,
  "checkInTime": "14:00", "checkOutTime": "12:00", "status": "DRAFT",
  "amenities": [{ "id": "uuid", "name": "Wi-Fi miễn phí", "icon": "wifi", "category": "Chung" }],
  "images": [{ "id": "uuid", "url": "https://…", "caption": null, "isCover": true, "sortOrder": 0 }],
  "policies": { "cancellation": "…", "children": "…" },
  "roomConfig": { "totalRooms": 36, "basePrice": 2800000 },        // null khi chưa cấu hình
  "createdAt": "…" }

// RoomType
{ "id": "uuid", "hotelId": "uuid", "name": "Deluxe River View", "description": "…",
  "maxOccupancy": 2, "areaSqm": 32, "basePrice": 2800000,
  "beds": [{ "bedTypeId": "uuid", "name": "Giường Queen", "quantity": 1 }],
  "amenities": [ … ],
  "images": [{ "id": "uuid", "url": "https://…", "caption": null, "sortOrder": 0 }],
  "roomCount": 12 }

// Room
{ "id": "uuid", "roomTypeId": "uuid", "roomNumber": "301", "floor": 3, "status": "AVAILABLE", "notes": null }

// StaffMember
{ "id": "uuid", "fullName": "…", "email": "…", "position": "Lễ tân", "status": "ACTIVE",
  "permissions": ["BOOKING", "FRONT_DESK"] }

// VerificationRequest (chi tiết; trong lịch sử thì accountNumber và representativeIdNumber là "****6789")
{ "id": "uuid", "hotelId": "uuid", "hotelName": "…", "requestType": "INITIAL", "status": "PENDING",
  "reason": null, "submittedAt": "…", "reviewedAt": null,
  "legal": { … }, "beneficiary": { "bankName": "…", "accountNumber": "…", "accountHolder": "…" },
  "property": { … },
  "documents": [{ "id": "uuid", "documentType": "FIRE_SAFETY", "uploadedAt": "…" }] }

// UploadedDocument
{ "fileId": "stayreco/verification/<partnerId>/<id>.pdf" }

// VerificationFileLink
{ "url": "https://api.cloudinary.com/…&signature=…", "expiresAt": "2026-10-20T16:05:00.000Z" }
```

## Mã lỗi hay gặp

| Nhóm | Mã |
|---|---|
| Quyền | `HOTEL_NOT_FOUND`, `FORBIDDEN`, `PARTNER_SUSPENDED` |
| Phòng | `ROOM_TYPE_NOT_FOUND`, `ROOM_NOT_FOUND`, `ROOM_NUMBER_TAKEN`, `ROOM_LIMIT_REACHED`, `ROOM_TYPE_IN_USE`, `ROOM_NOT_LOCKABLE` |
| Nhân viên | `STAFF_NOT_FOUND`, `STAFF_STATUS_CONFLICT` |
| Xác minh | `VERIFICATION_PENDING`, `VERIFICATION_DOCUMENTS_MISSING`, `VERIFICATION_NOT_FOUND`, `HOTEL_STATUS_CONFLICT` |
| File | `UPLOAD_INVALID_FILE`, `UPLOAD_UNAVAILABLE`, `IMAGE_NOT_FOUND`, `IMAGE_LIMIT_REACHED` |

Ý nghĩa và gợi ý xử lý: [api-guide.md §4.3](../api-guide.md#43-error-codes).

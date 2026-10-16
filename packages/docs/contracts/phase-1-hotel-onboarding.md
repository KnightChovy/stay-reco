# Contract phase 1: Đối tác đưa khách sạn lên nền tảng

| | |
|---|---|
| Trạng thái | `Draft` |
| Phase | [phase-1-hotel-onboarding](../phases/phase-1-hotel-onboarding.md) |
| BE phụ trách | |
| FE phụ trách | |
| Ngày chốt (Agreed) | |

> Bản nháp đề xuất theo [CONVENTIONS §1](../../../backend/docs/CONVENTIONS.md#1-đặt-tên-url-api) (cách A, theo tài nguyên). Tên field và trạng thái là gợi ý, sửa thoải mái trước khi chuyển `Agreed`.
> Quy tắc chung: [api-guide.md](../api-guide.md).

## Schema dùng chung

Tạo `packages/shared/src/schemas/hotel.ts` (và export trong `src/index.ts`) trước khi code endpoint.

| Schema | Dùng cho |
|---|---|
| `createHotelSchema`, `updateHotelSchema` | `POST /hotels`, `PATCH /hotels/:id` |
| `createRoomTypeSchema`, `updateRoomTypeSchema` | `POST /hotels/:hotelId/room-types`, `PATCH /room-types/:id` |
| `createRoomSchema`, `updateRoomSchema` | `POST /hotels/:hotelId/rooms`, `PATCH /rooms/:id` |
| `verificationDecisionSchema` | `POST /verification-requests/:id/reject`, `/request-changes` (`{ reason }`) |
| `listQuerySchema` | `page`, `pageSize`, `sort`, `q` dùng chung cho mọi danh sách (chốt api-guide §5) |

## Endpoint

| Method | Path | Quyền | Body / Query | Response | Trạng thái |
|---|---|---|---|---|---|
| GET | `/me/hotels` | HOTEL_PARTNER, HOTEL_STAFF | | `HotelSummary[]` | Draft |
| POST | `/hotels` | HOTEL_PARTNER | `createHotelSchema` | `Hotel` (201) | Draft |
| GET | `/hotels/:id` | thành viên khách sạn | | `Hotel` | Draft |
| PATCH | `/hotels/:id` | HOTEL_PARTNER (chủ) | `updateHotelSchema` | `Hotel` | Draft |
| GET | `/hotels/:hotelId/room-types` | thành viên khách sạn | | `RoomType[]` | Draft |
| POST | `/hotels/:hotelId/room-types` | HOTEL_PARTNER (chủ) | `createRoomTypeSchema` | `RoomType` (201) | Draft |
| PATCH | `/room-types/:id` | HOTEL_PARTNER (chủ) | `updateRoomTypeSchema` | `RoomType` | Draft |
| DELETE | `/room-types/:id` | HOTEL_PARTNER (chủ) | | 204 | Draft |
| GET | `/hotels/:hotelId/rooms` | thành viên khách sạn | `?roomTypeId=` | `Room[]` | Draft |
| POST | `/hotels/:hotelId/rooms` | HOTEL_PARTNER (chủ) | `createRoomSchema` | `Room` (201) | Draft |
| PATCH | `/rooms/:id` | HOTEL_PARTNER (chủ) | `updateRoomSchema` | `Room` | Draft |
| GET | `/hotels/:hotelId/staff` | HOTEL_PARTNER (chủ) | | `StaffMember[]` | Draft |
| POST | `/hotels/:hotelId/verification-requests` | HOTEL_PARTNER (chủ) | | `VerificationRequest` (201) | Draft |
| GET | `/verification-requests` | PLATFORM_MANAGER | `?status=pending&page=` | `VerificationRequest[]` + `meta` | Draft |
| GET | `/verification-requests/:id` | PLATFORM_MANAGER, chủ khách sạn | | `VerificationRequest` | Draft |
| POST | `/verification-requests/:id/approve` | PLATFORM_MANAGER | | `VerificationRequest` | Draft |
| POST | `/verification-requests/:id/reject` | PLATFORM_MANAGER | `verificationDecisionSchema` | `VerificationRequest` | Draft |
| POST | `/verification-requests/:id/request-changes` | PLATFORM_MANAGER | `verificationDecisionSchema` | `VerificationRequest` | Draft |

"Thành viên khách sạn" = đối tác sở hữu hoặc nhân viên được gán. Mọi route `/hotels/:hotelId/...` kiểm tra tenant theo CONVENTIONS §4.

## Kiểu dữ liệu response

```jsonc
// Hotel
{
  "id": "uuid",
  "name": "Riverside Hotel",
  "status": "DRAFT",              // DRAFT | PENDING_VERIFICATION | ACTIVE | SUSPENDED (đề xuất)
  "address": "…", "city": "…",
  "starRating": 4,
  "description": "…",
  "amenities": ["wifi", "pool"],
  "images": [{ "url": "https://…", "isCover": true }],
  "createdAt": "2026-10-14T03:00:00.000Z"
}

// RoomType
{ "id": "uuid", "hotelId": "uuid", "name": "Deluxe Double", "capacity": 2, "basePrice": 1200000, "amenities": [] }

// Room
{ "id": "uuid", "roomTypeId": "uuid", "number": "301", "status": "AVAILABLE" }

// VerificationRequest
{ "id": "uuid", "hotelId": "uuid", "status": "PENDING", "reason": null, "submittedAt": "…", "decidedAt": null }
```

## Mã lỗi mới (đề xuất)

| `code` | HTTP | Khi nào | Gợi ý FE |
|---|---|---|---|
| `HOTEL_NOT_VERIFIED` | 409 | Thao tác cần khách sạn đã duyệt | Nhắc gửi hồ sơ duyệt |
| `VERIFICATION_ALREADY_DECIDED` | 409 | Duyệt/từ chối hồ sơ đã có kết quả | Tải lại hàng đợi |

## Câu hỏi còn mở

- [ ] Tiền: số nguyên VND (api-guide §3)?
- [ ] Upload ảnh: lưu ở đâu (S3/Cloudinary), FE upload thẳng bằng presigned URL hay qua BE?
- [ ] Một đối tác có nhiều khách sạn không? (ảnh hưởng `/me/hotels` và FE chọn khách sạn)
- [ ] Viết `HotelAccessGuard` dùng chung (CONVENTIONS §4) trước khi làm endpoint đầu tiên.

## Changelog

| Ngày | Ai | Thay đổi |
|---|---|---|
| 2026-10-14 | | Tạo bản nháp |

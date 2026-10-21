# API: Quản lý nền tảng (`PLATFORM_MANAGER`)

> Màn FE: `manager/*`. Tài khoản quản lý do admin mời ([auth.md](./auth.md)). Quyết định nghiệp vụ về xác minh: [phases/phase-1-hotel-onboarding.md](../phases/phase-1-hotel-onboarding.md).

## Luồng chính: duyệt khách sạn

1. `GET /verification-requests?status=PENDING` (hàng đợi, cũ nhất trước).
2. `GET /verification-requests/:id` (chi tiết đầy đủ), xem từng giấy tờ bằng `GET /verification-documents/:docId/file` → mở `url`.
3. `POST .../approve`, hoặc `.../reject` / `.../request-changes` kèm `{ reason }`. Gặp `409 VERIFICATION_ALREADY_DECIDED` thì tải lại hồ sơ.
4. Khách sạn đang hoạt động cần xác minh lại (ví dụ giấy phép hết hạn): `POST /hotels/:id/reverification { reason }`.

## Hồ sơ xác minh

| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/verification-requests` | `?status=&search=&sort=&page=&pageSize=` (`verificationListQuerySchema`) | `VerificationRequestSummary[]` + `meta` |
| GET | `/verification-requests/:id` | | `VerificationRequest` (đầy đủ, số tài khoản và CCCD đầy đủ) |
| GET | `/verification-documents/:id/file` | | `VerificationFileLink` `{ url, expiresAt }` (link có chữ ký, 5 phút; cách mở ở [partner.md](./partner.md#hồ-sơ-xác-minh-phía-đối-tác)) |
| POST | `/verification-requests/:id/approve` | | `VerificationRequest` |
| POST | `/verification-requests/:id/reject` | `{ reason }` (`verificationDecisionSchema`) | `VerificationRequest` |
| POST | `/verification-requests/:id/request-changes` | `{ reason }` | `VerificationRequest` |
| POST | `/hotels/:hotelId/reverification` | `{ reason }` | `VerificationRequest` (201): loại `RENEWAL`, trạng thái `NEEDS_REVISION` |

- **Hàng đợi**: mặc định cũ nhất trước (`sort` thuộc `VERIFICATION_SORTS`: `submitted-asc`, `submitted-desc`); `search` tìm theo tên khách sạn; lọc `status`. SLA FE tự tính từ `submittedAt`. Hàng đợi không chứa thông tin thụ hưởng.
- **Quyết định** chỉ áp dụng cho hồ sơ `PENDING`; hai quản lý bấm cùng lúc thì người sau nhận `VERIFICATION_ALREADY_DECIDED`. Từ chối và yêu cầu bổ sung bắt buộc có lý do.
- **Hồ sơ lần đầu (`INITIAL`)**: duyệt → khách sạn `ACTIVE`, đối tác chuyển `APPROVED` nếu là khách sạn đầu tiên; từ chối / yêu cầu bổ sung → khách sạn về `DRAFT`. **Không duyệt được** khi đối tác đang bị đình chỉ (`409 PARTNER_SUSPENDED`), vẫn từ chối hoặc yêu cầu bổ sung được.
- **Hồ sơ `UPDATE` / `RENEWAL`** không đổi trạng thái khách sạn, dù kết quả thế nào.
- **Xác minh lại**: chỉ cho khách sạn `ACTIVE` (khác thì `HOTEL_STATUS_CONFLICT`); đang có hồ sơ chờ hoặc đã yêu cầu xác minh lại thì `VERIFICATION_PENDING`. Khách sạn vẫn hoạt động trong lúc chờ đối tác nộp hồ sơ `RENEWAL`.
- Mỗi kết quả và mỗi yêu cầu xác minh lại đều **gửi email** cho đối tác kèm lý do (tới `legal.notificationEmail` của hồ sơ; yêu cầu xác minh lại dùng email của hồ sơ gần nhất, không có thì email liên hệ của đối tác), và được ghi audit log.
- Quyền: hàng đợi, duyệt / từ chối / yêu cầu bổ sung và yêu cầu xác minh lại chỉ dành cho `PLATFORM_MANAGER`, mọi vai trò khác (kể cả chủ khách sạn) nhận `403 FORBIDDEN`. Riêng chi tiết hồ sơ và link xem file thì chủ khách sạn cũng xem được; nhân viên của khách sạn đó nhận 403, người ngoài nhận `VERIFICATION_NOT_FOUND`.

```jsonc
// VerificationRequestSummary (hàng đợi)
{ "id": "uuid", "hotelId": "uuid", "hotelName": "Mỹ Khê Boutique Hotel", "requestType": "INITIAL",
  "status": "PENDING", "submittedAt": "…", "reviewedAt": null }
```

`VerificationRequest` (chi tiết) và `VerificationFileLink`: xem [partner.md](./partner.md#kiểu-dữ-liệu).

## Mã lỗi hay gặp

`VERIFICATION_NOT_FOUND`, `VERIFICATION_ALREADY_DECIDED`, `VERIFICATION_PENDING`, `HOTEL_NOT_FOUND`, `HOTEL_STATUS_CONFLICT`, `PARTNER_SUSPENDED`, `VALIDATION_ERROR` (thiếu lý do). Chi tiết: [api-guide.md §4.3](../api-guide.md#43-error-codes).

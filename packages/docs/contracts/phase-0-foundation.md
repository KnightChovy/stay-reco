# Contract phase 0: Nền tảng (auth, response envelope)

| | |
|---|---|
| Trạng thái | `BE Done` (FE web và mobile đang tích hợp) |
| Phase | [phase-0-foundation](../phases/phase-0-foundation.md) |
| Ngày chốt (Agreed) | 2026-10-14 (format response, mã lỗi) |

> Quy tắc chung (token web/mobile, envelope, mã lỗi, refresh): [api-guide.md](../api-guide.md) mục 2–4.

## Schema dùng chung

Toàn bộ trong `packages/shared/src/schemas/auth.ts`. Email được trim và chuyển chữ thường, field lạ bị trả `VALIDATION_ERROR`.

## Endpoint

Cột **Response** là nội dung của `data`. Cột BE/FE: ✅ xong · ⏳ đang làm · ⬜ chưa làm.

| Method | Path | Quyền | Body (schema) | Response | BE | FE web | Mobile |
|---|---|---|---|---|---|---|---|
| POST | `/auth/register/customer` | public | `{ email, password, fullName }` `registerCustomerSchema` | `AuthResult` (201) | ✅ | ⏳ | ⏳ |
| POST | `/auth/register/partner` | public | `{ email, password, fullName, companyName? }` `registerPartnerSchema` | `AuthResult` (201) | ✅ | ⏳ | ⏳ |
| POST | `/auth/login` | public | `{ email, password }` `loginSchema` | `AuthResult` | ✅ | ⏳ | ⏳ |
| POST | `/auth/refresh` | public | web: `{}` · mobile: `{ refreshToken }` `refreshSchema` | web: `{ accessToken, expiresIn }` · mobile: `{ accessToken, refreshToken, expiresIn }` | ✅ | ⏳ | ⏳ |
| POST | `/auth/logout` | đăng nhập |  | 204 | ✅ | ⏳ | ⏳ |
| POST | `/auth/logout-all` | đăng nhập |  | 204 | ✅ | ⏳ | ⏳ |
| GET | `/auth/me` | đăng nhập |  | `Account` | ✅ | ⏳ | ⏳ |
| GET | `/auth/sessions` | đăng nhập |  | `Session[]` | ✅ | ⏳ | ⏳ |
| DELETE | `/auth/sessions/:id` | đăng nhập |  | 204 | ✅ | ⏳ | ⏳ |
| POST | `/auth/verify-email` | public | `{ token }` `tokenBodySchema` | 204 | ✅ | ⏳ | ⏳ |
| POST | `/auth/resend-verification` | public | `{ email }` `emailBodySchema` | 204 (luôn 204, không cho biết email có tồn tại hay không) | ✅ | ⏳ | ⏳ |
| POST | `/auth/forgot-password` | public | `{ email }` `emailBodySchema` | 204 (luôn 204) | ✅ | ⏳ | ⏳ |
| POST | `/auth/reset-password` | public | `{ token, newPassword }` `resetPasswordSchema` | 204 | ✅ | ⏳ | ⏳ |
| POST | `/auth/change-password` | đăng nhập | `{ currentPassword, newPassword }` `changePasswordSchema` | 204 | ✅ | ⏳ | ⏳ |
| POST | `/auth/invitations/staff` | HOTEL_PARTNER | `{ email, fullName }` `inviteAccountSchema` | `{ id, email, status }` (201) | ✅ | ⏳ | ⏳ |
| POST | `/auth/invitations/platform-manager` | ADMIN | `{ email, fullName }` `inviteAccountSchema` | `{ id, email, status }` (201) | ✅ | ⏳ | ⏳ |
| POST | `/auth/invitations/accept` | public | `{ token, password }` `acceptInvitationSchema` | `AuthResult` (201) | ✅ | ⏳ | ⏳ |

## Kiểu dữ liệu response

`AuthResult` gồm `account: Account`, `accessToken: string`, `expiresIn: number`. Riêng mobile có thêm `refreshToken: string`.

```jsonc
// Account
{
  "id": "uuid",
  "email": "a@b.com",
  "phone": null,
  "role": "CUSTOMER",            // xem mục 2.6
  "status": "ACTIVE",            // ACTIVE | INVITED | SUSPENDED | DELETED
  "emailVerified": false,
  "emailVerifiedAt": null,
  "lastLoginAt": "2026-10-14T03:00:00.000Z",
  "createdAt": "2026-10-14T03:00:00.000Z",
  "profile": { "id": "uuid", "fullName": "Nguyễn Văn A" }  // field phụ thuộc role
}
```

```jsonc
// Session (GET /auth/sessions)
// TODO: bổ sung field khi FE làm trang /account/security
```

## Câu hỏi còn mở

- [ ] Đổi `/auth/sessions` thành `/me/sessions` cho khớp quy ước `/me/...`? (CONVENTIONS §1.5). FE chưa tích hợp nên đổi lúc này rẻ.
- [ ] Đăng nhập Google/Facebook (`AuthSocialActions` trên FE): có làm ở phase 0 không?

## Changelog

| Ngày | Ai | Thay đổi |
|---|---|---|
| 2026-10-14 | BE | Chốt envelope `{ success, message, data, meta? }` và bảng mã lỗi |
| 2026-10-14 | BE | Validate chuyển sang zod schema trong `@stayreco/shared`; message lỗi validate đổi câu chữ (FE vẫn dựa vào `code` và `details[].field`) |

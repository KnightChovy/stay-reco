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
| POST | `/auth/register/customer` | public | `{ email, password, fullName }` `registerCustomerSchema` | `RegisterResult` = `{ account }` (201), tài khoản `PENDING_VERIFICATION`, không trả token, gửi mã OTP 6 số | ✅ | ⏳ | ⏳ |
| POST | `/auth/register/partner` | public | `{ email, password, fullName, phone, companyName? }` `registerPartnerSchema` | `RegisterResult` = `{ account }` (201), như trên | ✅ | ⏳ | ⏳ |
| POST | `/auth/login` | public | `{ email, password }` `loginSchema` | `AuthResult` | ✅ | ⏳ | ⏳ |
| POST | `/auth/refresh` | public | web: `{}` · mobile: `{ refreshToken }` `refreshSchema` | web: `{ accessToken, expiresIn }` · mobile: `{ accessToken, refreshToken, expiresIn }` | ✅ | ⏳ | ⏳ |
| POST | `/auth/logout` | đăng nhập |  | 204 | ✅ | ⏳ | ⏳ |
| POST | `/auth/logout-all` | đăng nhập |  | 204 | ✅ | ⏳ | ⏳ |
| GET | `/auth/me` | đăng nhập |  | `Account` | ✅ | ⏳ | ⏳ |
| GET | `/auth/sessions` | đăng nhập |  | `Session[]` | ✅ | ⏳ | ⏳ |
| DELETE | `/auth/sessions/:id` | đăng nhập |  | 204 | ✅ | ⏳ | ⏳ |
| POST | `/auth/verify-email` | public | `{ email, code }` `verifyEmailSchema` | `AuthResult` (200): kích hoạt tài khoản và đăng nhập luôn | ✅ | ⏳ | ⏳ |
| POST | `/auth/resend-verification` | public | `{ email }` `emailBodySchema` | 204 (luôn 204; chỉ gửi mã mới cho tài khoản đang chờ xác thực) | ✅ | ⏳ | ⏳ |
| POST | `/auth/forgot-password` | public | `{ email }` `emailBodySchema` | 204 (luôn 204) | ✅ | ⏳ | ⏳ |
| POST | `/auth/reset-password` | public | `{ token, newPassword }` `resetPasswordSchema` | 204 | ✅ | ⏳ | ⏳ |
| POST | `/auth/change-password` | đăng nhập | `{ currentPassword, newPassword }` `changePasswordSchema` | 204 | ✅ | ⏳ | ⏳ |
| POST | `/auth/invitations/staff` | HOTEL_PARTNER | `{ email, fullName, hotelId, position }` `inviteStaffSchema` | `{ id, email, status }` (201) | ✅ | ⏳ | ⏳ |
| POST | `/auth/invitations/platform-manager` | ADMIN | `{ email, fullName }` `inviteAccountSchema` | `{ id, email, status }` (201) | ✅ | ⏳ | ⏳ |
| POST | `/auth/invitations/accept` | public | `{ token, password }` `acceptInvitationSchema` | `AuthResult` (201) | ✅ | ⏳ | ⏳ |

## Kiểu dữ liệu response

`AuthResult` gồm `account: Account`, `accessToken: string`, `expiresIn: number`. Riêng mobile có thêm `refreshToken: string`. Kiểu TypeScript (`Account`, `RegisterResult`, `AuthResult`…) lấy từ `@stayreco/shared`.

```jsonc
// Account
{
  "id": "uuid",
  "email": "a@b.com",
  "fullName": "Nguyễn Văn A",
  "phone": null,
  "avatarUrl": null,
  "role": "CUSTOMER",            // xem api-guide mục 2.6
  "status": "ACTIVE",            // PENDING_VERIFICATION | ACTIVE | INVITED | SUSPENDED | DEACTIVATED | DELETED
  "emailVerified": false,
  "emailVerifiedAt": null,
  "lastLoginAt": "2026-10-14T03:00:00.000Z",
  "createdAt": "2026-10-14T03:00:00.000Z",
  "profile": null                // HOTEL_PARTNER: { partnerName, status } · HOTEL_STAFF: { hotelId, position }
}
```

**Luồng đăng ký (theo SRS UC xác thực email):** đăng ký → nhận mã OTP 6 số qua email (hạn 10 phút, tối đa 5 lần nhập) → `POST /auth/verify-email` → tài khoản `ACTIVE` và được đăng nhập. Đăng nhập khi chưa xác thực trả `403 AUTH_EMAIL_NOT_VERIFIED`. Mã lỗi OTP: `AUTH_OTP_INVALID` (sai mã), `AUTH_OTP_EXPIRED` (hết hạn hoặc quá số lần, cần gửi lại). Quên mật khẩu vẫn dùng **link** (`/reset-password?token=`).

```jsonc
// Session (GET /auth/sessions)
// TODO: bổ sung field khi FE làm trang /account/security
```

## Câu hỏi còn mở

- [x] Đổi `/auth/sessions` thành `/me/sessions`? **Đã chốt: giữ `/auth/sessions`.**
- [ ] Đăng nhập Google/Facebook (`AuthSocialActions` trên FE): có làm ở phase 0 không?

## Changelog

| Ngày | Ai | Thay đổi |
|---|---|---|
| 2026-10-14 | BE | Chốt envelope `{ success, message, data, meta? }` và bảng mã lỗi |
| 2026-10-14 | BE | Validate chuyển sang zod schema trong `@stayreco/shared`; message lỗi validate đổi câu chữ (FE vẫn dựa vào `code` và `details[].field`) |
| 2026-10-16 | BE | Schema DB mới: `Account` có `fullName`, `avatarUrl` ở cấp ngoài, `profile` theo role; đăng ký đối tác cần `phone`; mời nhân viên cần `hotelId`, `position` |
| 2026-10-17 | BE | Xác thực email theo SRS: mã OTP 6 số thay cho link. Đăng ký trả `{ account }` (`PENDING_VERIFICATION`, không token); `verify-email` nhận `{ email, code }` và trả `AuthResult`; thêm `AUTH_EMAIL_NOT_VERIFIED`, `AUTH_OTP_INVALID`, `AUTH_OTP_EXPIRED` |

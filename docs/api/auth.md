# API: Tài khoản và đăng nhập (mọi vai trò)

> Luồng phía client (lưu token, refresh, web dùng cookie còn mobile dùng body) ở [api-guide.md §2](../api-guide.md#2-authentication). Trang này liệt kê endpoint và kiểu dữ liệu.
> Schema body ở `packages/shared/src/schemas/auth.ts`: email được trim và chuyển chữ thường; field lạ bị trả `VALIDATION_ERROR`.

## Endpoint

| Method | Path | Quyền | Body (schema) | Response |
|---|---|---|---|---|
| POST | `/auth/register/customer` | công khai | `{ email, password, fullName }` (`registerCustomerSchema`) | `RegisterResult` = `{ account }` (201): tài khoản `PENDING_VERIFICATION`, chưa có token, gửi mã OTP 6 số |
| POST | `/auth/register/partner` | công khai | `{ email, password, fullName, phone, companyName? }` (`registerPartnerSchema`) | `RegisterResult` (201), như trên |
| POST | `/auth/verify-email` | công khai | `{ email, code }` (`verifyEmailSchema`) | `AuthResult` (200): kích hoạt tài khoản và đăng nhập luôn |
| POST | `/auth/resend-verification` | công khai | `{ email }` (`emailBodySchema`) | 204 (luôn 204; chỉ gửi mã mới cho tài khoản đang chờ xác thực) |
| POST | `/auth/login` | công khai | `{ email, password }` (`loginSchema`) | `AuthResult` |
| POST | `/auth/refresh` | công khai | web: `{}` (cookie) · mobile: `{ refreshToken }` (`refreshSchema`) | web: `{ accessToken, expiresIn }` · mobile: thêm `refreshToken` |
| POST | `/auth/logout` | đăng nhập | | 204 |
| POST | `/auth/logout-all` | đăng nhập | | 204 |
| GET | `/auth/me` | đăng nhập | | `Account` |
| GET | `/auth/sessions` | đăng nhập | | `SessionInfo[]` |
| DELETE | `/auth/sessions/:id` | đăng nhập | | 204 |
| POST | `/auth/forgot-password` | công khai | `{ email }` (`emailBodySchema`) | 204 (luôn 204) |
| POST | `/auth/reset-password` | công khai | `{ token, newPassword }` (`resetPasswordSchema`) | 204 |
| POST | `/auth/change-password` | đăng nhập | `{ currentPassword, newPassword }` (`changePasswordSchema`) | 204 |
| POST | `/auth/invitations/staff` | HOTEL_PARTNER | `{ email, fullName, hotelId, position }` (`inviteStaffSchema`; khách sạn phải thuộc đối tác) | `InvitationResult` = `{ id, email, status }` (201) |
| POST | `/auth/invitations/platform-manager` | ADMIN | `{ email, fullName }` (`inviteAccountSchema`) | `InvitationResult` (201) |
| POST | `/auth/invitations/accept` | công khai | `{ token, password }` (`acceptInvitationSchema`) | `AuthResult` (201): đăng nhập luôn |

## Luồng

- **Đăng ký**: đăng ký → email chứa mã OTP 6 số (hạn 10 phút, tối đa 5 lần nhập) → màn nhập mã → `POST /auth/verify-email` → tài khoản `ACTIVE` và được đăng nhập. Đăng nhập khi chưa xác thực trả `403 AUTH_EMAIL_NOT_VERIFIED`: chuyển tới màn nhập mã. Mã sai: `AUTH_OTP_INVALID`; hết hạn hoặc quá số lần: `AUTH_OTP_EXPIRED` (cho bấm "Gửi lại mã").
- **Quên mật khẩu** dùng **link**, không dùng OTP: `POST /auth/forgot-password` → email chứa `/reset-password?token=…` (hạn 15 phút) → form mật khẩu mới → `POST /auth/reset-password`.
- **Lời mời** (nhân viên, quản lý nền tảng): email chứa `/accept-invitation?token=…` (hạn 72 giờ) → form đặt mật khẩu → `POST /auth/invitations/accept`. Đối tác hủy được lời mời chưa chấp nhận ([partner.md](./partner.md#nhân-viên)).
- **Khóa tạm**: sai mật khẩu 5 lần thì khóa 15 phút (`AUTH_ACCOUNT_LOCKED`).
- **Tài khoản bị chặn giữa chừng**: nhân viên bị khách sạn vô hiệu hóa hoặc tài khoản bị đình chỉ thì request kế tiếp nhận 401, refresh thất bại (`AUTH_REFRESH_TOKEN_INVALID`), đăng nhập lại nhận `403 AUTH_ACCOUNT_DEACTIVATED` hoặc `AUTH_ACCOUNT_SUSPENDED`.

Các trang FE cần có cho email: màn nhập OTP (ví dụ `/verify-email?email=`), `/reset-password?token=`, `/accept-invitation?token=` ([api-guide.md §2.5](../api-guide.md#25-fe-pages-for-emails)).

## Kiểu dữ liệu

`AuthResult` = `{ account: Account, accessToken, expiresIn }` (mobile có thêm `refreshToken`). Các kiểu `Account`, `RegisterResult`, `AuthResult`, `RefreshResult`, `SessionInfo`, `InvitationResult`, `PartnerProfile`, `StaffProfile` lấy từ `@stayreco/shared`.

```jsonc
// Account
{
  "id": "uuid",
  "email": "a@b.com",
  "fullName": "Nguyễn Văn A",
  "phone": null,
  "avatarUrl": null,
  "role": "CUSTOMER",            // CUSTOMER | HOTEL_PARTNER | HOTEL_STAFF | PLATFORM_MANAGER | ADMIN (api-guide §2.6)
  "status": "ACTIVE",            // PENDING_VERIFICATION | ACTIVE | INVITED | SUSPENDED | DEACTIVATED | DELETED
  "emailVerified": true,
  "emailVerifiedAt": "2026-10-14T03:00:00.000Z",
  "lastLoginAt": "2026-10-14T03:00:00.000Z",
  "createdAt": "2026-10-14T03:00:00.000Z",
  // Theo vai trò, null với CUSTOMER / ADMIN / PLATFORM_MANAGER:
  //   HOTEL_PARTNER: { "partnerName": "Hotel Co", "status": "PENDING" }
  //   HOTEL_STAFF:   { "hotelId": "uuid", "position": "Lễ tân" }
  "profile": null
}
```

## Mã lỗi hay gặp

`AUTH_INVALID_CREDENTIALS`, `AUTH_ACCOUNT_LOCKED`, `AUTH_ACCOUNT_SUSPENDED`, `AUTH_ACCOUNT_DEACTIVATED`, `AUTH_EMAIL_NOT_VERIFIED`, `AUTH_OTP_INVALID`, `AUTH_OTP_EXPIRED`, `AUTH_EMAIL_TAKEN`, `AUTH_WRONG_PASSWORD`, `AUTH_TOKEN_INVALID`, `AUTH_REFRESH_TOKEN_INVALID`, `AUTH_INVITATION_ACCEPTED`, `AUTH_SESSION_NOT_FOUND`. Ý nghĩa và cách xử lý ở [api-guide.md §4.3](../api-guide.md#43-error-codes). Chỉ refresh token khi `401` kèm `UNAUTHENTICATED`.

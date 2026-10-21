# Phase 0: Nền tảng

| | |
|---|---|
| Trạng thái phase | 🟡 BE xong, FE đang tích hợp |
| Trạng thái API | `BE Done` (FE web và mobile đang tích hợp) |
| Ngày chốt (Agreed) | 2026-10-14 (format response, mã lỗi) |
| API | [api/auth.md](../api/auth.md), quy tắc chung [api-guide.md](../api-guide.md) |

## Mục tiêu

Có khung chung để mọi phase sau chỉ việc thêm feature: đăng nhập cho 5 role, format response và mã lỗi cố định, Swagger, validate dùng chung.

## Phạm vi

**Backend**

- Auth: đăng ký khách hàng/đối tác, đăng nhập, refresh token (web cookie, mobile body), đăng xuất, quản lý phiên
- Xác thực email (OTP), quên/đặt lại mật khẩu, đổi mật khẩu, mời nhân viên và quản lý nền tảng
- Envelope `{ success, message, data, meta? }`, bảng mã lỗi, Swagger `/api/docs`
- `packages/shared` (zod schema, ErrorCode, Role) và `docs/`

**Frontend web / mobile** (trang đã có UI trong `frontend/src/app`)

- `(auth)/login`, `(auth)/register`, `(auth)/forgot-password`
- Màn nhập mã OTP sau khi đăng ký (`/verify-email`); `forgot-password` đổi sang luồng link, thêm `/reset-password` và `/accept-invitation` (api-guide §2.3, §2.5)
- `account/security` (đổi mật khẩu, phiên đăng nhập)
- axios interceptor refresh token, `AuthRouteGuard` theo role
- Mobile: màn hình đăng nhập/đăng ký, lưu refresh token bằng `expo-secure-store`

## Ngoài phạm vi

- Đăng nhập mạng xã hội (chờ chốt)
- Hồ sơ cá nhân chi tiết (`account/profile`) → phase 4

## Quyết định đã chốt

- Xác thực email bằng **mã OTP 6 số** (theo SRS); quên mật khẩu vẫn dùng **link**.
- Giữ đường dẫn `/auth/sessions` (không đổi thành `/me/sessions`).

## Câu hỏi còn mở

- [ ] Đăng nhập Google/Facebook (`AuthSocialActions` trên FE): có làm không, làm ở phase nào?

## Definition of Done

- [ ] BE: e2e auth pass (đã có `test/auth.e2e-spec.ts`)
- [ ] FE web và mobile đăng nhập/đăng ký/refresh với API thật, bỏ mock
- [ ] [api/auth.md](../api/auth.md) khớp với code, trạng thái API `Integrated`

## Changelog

| Ngày | Ai | Thay đổi |
|---|---|---|
| 2026-10-14 | BE | Chốt envelope `{ success, message, data, meta? }` và bảng mã lỗi |
| 2026-10-14 | BE | Validate chuyển sang zod schema trong `@stayreco/shared`; message lỗi validate đổi câu chữ (FE vẫn dựa vào `code` và `details[].field`) |
| 2026-10-16 | BE | Schema DB mới: `Account` có `fullName`, `avatarUrl` ở cấp ngoài, `profile` theo role; đăng ký đối tác cần `phone`; mời nhân viên cần `hotelId`, `position` |
| 2026-10-17 | BE | Xác thực email theo SRS: mã OTP 6 số thay cho link. Đăng ký trả `{ account }` (`PENDING_VERIFICATION`, không token); `verify-email` nhận `{ email, code }` và trả `AuthResult`; thêm `AUTH_EMAIL_NOT_VERIFIED`, `AUTH_OTP_INVALID`, `AUTH_OTP_EXPIRED` |
| 2026-10-20 | BE | Thêm trạng thái tài khoản `DEACTIVATED` và mã `AUTH_ACCOUNT_DEACTIVATED` (nhân viên bị đối tác vô hiệu hóa) |
| 2026-10-21 | BE | Tài liệu chuyển từ `packages/docs/` ra `docs/` ở gốc repo; endpoint chuyển sang [api/auth.md](../api/auth.md) |

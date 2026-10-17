# Phase 0: Nền tảng

| | |
|---|---|
| Trạng thái | 🟡 Đang làm |
| Contract | [contracts/phase-0-foundation.md](../contracts/phase-0-foundation.md) |

## Mục tiêu

Có khung chung để mọi phase sau chỉ việc thêm feature: đăng nhập cho 5 role, format response và mã lỗi cố định, Swagger, validate dùng chung.

## Phạm vi

**Backend**

- Auth: đăng ký khách hàng/đối tác, đăng nhập, refresh token (web cookie, mobile body), đăng xuất, quản lý phiên
- Xác thực email, quên/đặt lại mật khẩu, đổi mật khẩu, mời nhân viên và quản lý nền tảng
- Envelope `{ success, message, data, meta? }`, bảng mã lỗi, Swagger `/api/docs`
- `packages/shared` (zod schema, ErrorCode, Role) và `packages/docs`

**Frontend web / mobile** (trang đã có UI trong `frontend/src/app`)

- `(auth)/login`, `(auth)/register`, `(auth)/forgot-password`
- Màn nhập mã OTP sau khi đăng ký (`/verify-email`); `forgot-password` đổi sang luồng link, thêm `/reset-password` và `/accept-invitation` (api-guide §2.3, §2.5)
- `account/security` (đổi mật khẩu, phiên đăng nhập)
- axios interceptor refresh token, `AuthRouteGuard` theo role
- Mobile: màn hình đăng nhập/đăng ký, lưu refresh token bằng `expo-secure-store`

## Ngoài phạm vi

- Đăng nhập mạng xã hội (chờ chốt)
- Hồ sơ cá nhân chi tiết (`account/profile`) → phase 4

## Definition of Done

- [ ] BE: e2e auth pass (đã có `test/auth.e2e-spec.ts`)
- [ ] FE web và mobile đăng nhập/đăng ký/refresh với API thật, bỏ mock
- [ ] Contract đã cập nhật đúng với code, trạng thái `Integrated`

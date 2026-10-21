# Phase 0: Foundation

| | |
|---|---|
| Phase status | 🟡 BE done, FE integrating |
| API status | `BE Done` (FE web and mobile integrating) |
| Agreed on | 2026-10-14 (response format, error codes) |
| API | [api/auth.md](../api/auth.md), general rules [api-guide.md](../api-guide.md) |

## Goal

A shared base so later phases only add features: sign-in for the 5 roles, a fixed response format and error codes, Swagger, shared validation.

## Scope

**Backend**

- Auth: customer/partner sign-up, sign-in, refresh token (cookie on web, body on mobile), sign-out, session management
- Email verification (OTP), forgot/reset password, change password, staff and platform manager invitations
- Envelope `{ success, message, data, meta? }`, error code table, Swagger `/api/docs`
- `packages/shared` (zod schemas, ErrorCode, Role) and `docs/`

**Frontend web / mobile** (pages already have UI in `frontend/src/app`)

- `(auth)/login`, `(auth)/register`, `(auth)/forgot-password`
- OTP screen after sign-up (`/verify-email`); `forgot-password` moves to the link flow, add `/reset-password` and `/accept-invitation` (api-guide §2.3, §2.5)
- `account/security` (change password, sessions)
- axios interceptor for token refresh, `AuthRouteGuard` by role
- Mobile: sign-in/sign-up screens, refresh token stored with `expo-secure-store`

## Out of scope

- Social sign-in (pending decision)
- Detailed profile (`account/profile`) → phase 4

## Agreed decisions

- Email verification uses a **6-digit OTP** (per the SRS); forgot password still uses a **link**.
- Keep the `/auth/sessions` path (not `/me/sessions`).

## Open questions

- [ ] Google/Facebook sign-in (`AuthSocialActions` on the FE): do we build it, and in which phase?

## Definition of Done

- [ ] BE: auth e2e tests pass (`test/auth.e2e-spec.ts` exists)
- [ ] FE web and mobile sign in / sign up / refresh against the real API, mocks removed
- [ ] [api/auth.md](../api/auth.md) matches the code, API status `Integrated`

## Changelog

| Date | Who | Change |
|---|---|---|
| 2026-10-14 | BE | Agreed on the envelope `{ success, message, data, meta? }` and the error code table |
| 2026-10-14 | BE | Validation moved to zod schemas in `@stayreco/shared`; validation messages reworded (FE still relies on `code` and `details[].field`) |
| 2026-10-16 | BE | New DB schema: `Account` has `fullName`, `avatarUrl` at the top level and a role-specific `profile`; partner sign-up needs `phone`; staff invitations need `hotelId`, `position` |
| 2026-10-17 | BE | Email verification per the SRS: a 6-digit OTP instead of a link. Sign-up returns `{ account }` (`PENDING_VERIFICATION`, no tokens); `verify-email` takes `{ email, code }` and returns `AuthResult`; added `AUTH_EMAIL_NOT_VERIFIED`, `AUTH_OTP_INVALID`, `AUTH_OTP_EXPIRED` |
| 2026-10-20 | BE | Added the `DEACTIVATED` account status and `AUTH_ACCOUNT_DEACTIVATED` (staff deactivated by the partner) |
| 2026-10-21 | BE | Docs moved from `packages/docs/` to `docs/` at the repo root; endpoints moved to [api/auth.md](../api/auth.md) |
| 2026-10-21 | BE | Docs translated to English |

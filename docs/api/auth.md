# API: Accounts and sign-in (every role)

> Client-side flow (storing tokens, refresh, cookies on web vs. body on mobile) is in [api-guide.md §2](../api-guide.md#2-authentication). This page lists the endpoints and data types.
> Body schemas are in `packages/shared/src/schemas/auth.ts`: emails are trimmed and lower-cased; unknown fields return `VALIDATION_ERROR`.

## Endpoints

| Method | Path | Access | Body (schema) | Response |
|---|---|---|---|---|
| POST | `/auth/register/customer` | public | `{ email, password, fullName }` (`registerCustomerSchema`) | `RegisterResult` = `{ account }` (201): account is `PENDING_VERIFICATION`, no tokens yet, a 6-digit OTP is emailed |
| POST | `/auth/register/partner` | public | `{ email, password, fullName, phone, companyName? }` (`registerPartnerSchema`) | `RegisterResult` (201), as above |
| POST | `/auth/verify-email` | public | `{ email, code }` (`verifyEmailSchema`) | `AuthResult` (200): activates the account and signs in |
| POST | `/auth/resend-verification` | public | `{ email }` (`emailBodySchema`) | 204 (always 204; a new code is sent only to accounts waiting for verification) |
| POST | `/auth/login` | public | `{ email, password }` (`loginSchema`) | `AuthResult` |
| POST | `/auth/refresh` | public | web: `{}` (cookie) · mobile: `{ refreshToken }` (`refreshSchema`) | web: `{ accessToken, expiresIn }` · mobile: also `refreshToken` |
| POST | `/auth/logout` | signed in | | 204 |
| POST | `/auth/logout-all` | signed in | | 204 |
| GET | `/auth/me` | signed in | | `Account` |
| GET | `/auth/sessions` | signed in | | `SessionInfo[]` |
| DELETE | `/auth/sessions/:id` | signed in | | 204 |
| POST | `/auth/forgot-password` | public | `{ email }` (`emailBodySchema`) | 204 (always 204) |
| POST | `/auth/reset-password` | public | `{ token, newPassword }` (`resetPasswordSchema`) | 204 |
| POST | `/auth/change-password` | signed in | `{ currentPassword, newPassword }` (`changePasswordSchema`) | 204 |
| POST | `/auth/invitations/staff` | HOTEL_PARTNER | `{ email, fullName, hotelId, position }` (`inviteStaffSchema`; the hotel must belong to the partner) | `InvitationResult` = `{ id, email, status }` (201) |
| POST | `/auth/invitations/platform-manager` | ADMIN | `{ email, fullName }` (`inviteAccountSchema`) | `InvitationResult` (201) |
| POST | `/auth/invitations/accept` | public | `{ token, password }` (`acceptInvitationSchema`) | `AuthResult` (201): signs in |

## Flows

- **Sign-up**: register → an email with a 6-digit OTP (valid 10 minutes, at most 5 attempts) → code screen → `POST /auth/verify-email` → the account is `ACTIVE` and signed in. Signing in before verifying returns `403 AUTH_EMAIL_NOT_VERIFIED`: send the user to the code screen. Wrong code: `AUTH_OTP_INVALID`; expired or too many attempts: `AUTH_OTP_EXPIRED` (offer "Resend code").
- **Forgot password** uses a **link**, not an OTP: `POST /auth/forgot-password` → an email with `/reset-password?token=…` (valid 15 minutes) → new-password form → `POST /auth/reset-password`.
- **Invitations** (staff, platform managers): an email with `/accept-invitation?token=…` (valid 72 hours) → set-password form → `POST /auth/invitations/accept`. Partners can cancel an invitation that has not been accepted yet ([partner.md](./partner.md#staff)).
- **Temporary lock**: 5 wrong passwords lock the account for 15 minutes (`AUTH_ACCOUNT_LOCKED`).
- **Blocked while signed in**: when a hotel deactivates a staff member or an account is suspended, the next request gets 401, the refresh fails (`AUTH_REFRESH_TOKEN_INVALID`), and signing in again returns `403 AUTH_ACCOUNT_DEACTIVATED` or `AUTH_ACCOUNT_SUSPENDED`.

FE pages needed for the emails: the OTP screen (for example `/verify-email?email=`), `/reset-password?token=`, `/accept-invitation?token=` ([api-guide.md §2.5](../api-guide.md#25-fe-pages-for-emails)).

## Types

`AuthResult` = `{ account: Account, accessToken, expiresIn }` (mobile also gets `refreshToken`). The types `Account`, `RegisterResult`, `AuthResult`, `RefreshResult`, `SessionInfo`, `InvitationResult`, `PartnerProfile`, `StaffProfile` come from `@stayreco/shared`.

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
  // Role-specific, null for CUSTOMER / ADMIN / PLATFORM_MANAGER:
  //   HOTEL_PARTNER: { "partnerName": "Hotel Co", "status": "PENDING" }
  //   HOTEL_STAFF:   { "hotelId": "uuid", "position": "Lễ tân" }
  "profile": null
}
```

## Common error codes

`AUTH_INVALID_CREDENTIALS`, `AUTH_ACCOUNT_LOCKED`, `AUTH_ACCOUNT_SUSPENDED`, `AUTH_ACCOUNT_DEACTIVATED`, `AUTH_EMAIL_NOT_VERIFIED`, `AUTH_OTP_INVALID`, `AUTH_OTP_EXPIRED`, `AUTH_EMAIL_TAKEN`, `AUTH_WRONG_PASSWORD`, `AUTH_TOKEN_INVALID`, `AUTH_REFRESH_TOKEN_INVALID`, `AUTH_INVITATION_ACCEPTED`, `AUTH_SESSION_NOT_FOUND`. Meanings and handling: [api-guide.md §4.3](../api-guide.md#43-error-codes). Refresh the token only on `401` with `UNAUTHENTICATED`.

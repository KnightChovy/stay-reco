# StayReco API Guide (for the web and mobile clients)

> Describes the backend's current behavior. Items marked `TODO(meeting)` are proposals that will be decided in the team meeting; don't build against them until this document is updated.
> URL naming rules: see [CONVENTIONS.md](./CONVENTIONS.md#1-api-url-naming).

## 1. General

| | |
|---|---|
| Base URL (dev) | `http://localhost:3000/api/v1` |
| Base URL (staging) | `TODO(meeting)` |
| Health check | `GET /health` returns `{ "success": true, "message": "OK", "data": { "status": "ok" } }` |
| Format | JSON, `Content-Type: application/json` |
| CORS (dev) | Allows `http://localhost:3001` (`CORS_ORIGINS` variable), with credentials (cookies) |
| IDs | UUID strings |
| Field names | camelCase |

Web client: set `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1`.

## 2. Authentication

### 2.1 Tokens

- **Access token**: JWT, valid for **15 minutes** (`expiresIn` is in seconds). Send it with every request that requires sign-in:
  `Authorization: Bearer <accessToken>`
- **Refresh token**: random string, valid for 30 days, **rotated on every refresh**. Reusing an old refresh token revokes the whole session and the user must sign in again.
- After logout or account suspension, the access token is **rejected immediately**, without waiting for the 15 minutes to expire.

### 2.2 Web vs. mobile

| | Web (Next.js) | Mobile (Expo) |
|---|---|---|
| Required header | `X-Client-Type: web` on login, register, refresh and accept-invitation | Do not send this header |
| Receiving the refresh token | In the **httpOnly cookie** `refresh_token` (path `/api/v1/auth`). JavaScript cannot read it, which is intended. | In the **body** (`refreshToken`). Store it with `expo-secure-store`, not AsyncStorage. |
| Calling refresh | `POST /auth/refresh` with an empty body `{}`; axios needs `withCredentials: true` | `POST /auth/refresh` with body `{ "refreshToken": "..." }` |
| Storing the access token | In memory (Zustand), **not** in localStorage | In memory, or secure-store if needed |

### 2.3 Recommended client flow

**Sign-up (customer and partner):**

1. `POST /auth/register/customer` (or `/register/partner`) returns `{ account }` with `status: "PENDING_VERIFICATION"` and **no tokens**. The backend emails a 6-digit code (valid 10 minutes).
2. Show the **OTP screen** (6 inputs) for that email. "Resend code" calls `POST /auth/resend-verification`; the previous code stops working.
3. `POST /auth/verify-email { email, code }`:
   - correct: the account becomes `ACTIVE` and the response is an `AuthResult`, the same as login. Treat it as a successful login.
   - `AUTH_OTP_INVALID`: wrong code, let the user retry.
   - `AUTH_OTP_EXPIRED`: expired or 5 attempts used, ask the user to resend the code.
4. If a pending user tries to log in, login answers **403 `AUTH_EMAIL_NOT_VERIFIED`**: go to the OTP screen for that email.

**Signed-in requests:**

1. On successful login (or verify-email), keep `accessToken` and `account`; mobile also keeps `refreshToken`.
2. Call APIs with the `Authorization` header.
3. On **401 with `code: "UNAUTHENTICATED"`**: call `/auth/refresh` **once** (queue pending requests; never refresh in parallel), then retry the original request. Other 401 errors must not trigger a refresh (see section 4.3).
4. If refresh also returns 401: clear the signed-in state and redirect to `/login?next=...`.
5. An account deactivated by the hotel (staff) or suspended while signed in follows the same path: the next request is 401, the refresh fails with `AUTH_REFRESH_TOKEN_INVALID`, and signing in again returns **403 `AUTH_ACCOUNT_DEACTIVATED`** or **`AUTH_ACCOUNT_SUSPENDED`**. Show that message on the login page instead of a generic sign-in error.

### 2.4 Auth endpoints

The Response column describes the content of the `data` field (see section 4.1).

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| POST | `/auth/register/customer` | public | `{ email, password, fullName }` | `RegisterResult` = `{ account }`, no tokens (201) |
| POST | `/auth/register/partner` | public | `{ email, password, fullName, phone, companyName? }` | `RegisterResult` = `{ account }`, no tokens (201) |
| POST | `/auth/login` | public | `{ email, password }` | `AuthResult` |
| POST | `/auth/refresh` | public | web: `{}` · mobile: `{ refreshToken }` | web: `{ accessToken, expiresIn }` · mobile: `{ accessToken, refreshToken, expiresIn }` |
| POST | `/auth/logout` | signed in | | 204 |
| POST | `/auth/logout-all` | signed in | | 204 |
| GET | `/auth/me` | signed in | | `Account` |
| GET | `/auth/sessions` | signed in | | `Session[]` |
| DELETE | `/auth/sessions/:id` | signed in | | 204 |
| POST | `/auth/verify-email` | public | `{ email, code }` (`code` = 6 digits) | `AuthResult` (200), account activated and signed in |
| POST | `/auth/resend-verification` | public | `{ email }` | 204 (always 204; mails a new code only to pending accounts) |
| POST | `/auth/forgot-password` | public | `{ email }` | 204 (always 204) |
| POST | `/auth/reset-password` | public | `{ token, newPassword }` | 204 |
| POST | `/auth/change-password` | signed in | `{ currentPassword, newPassword }` | 204 |
| POST | `/auth/invitations/staff` | HOTEL_PARTNER | `{ email, fullName, hotelId, position }` (the hotel must belong to the partner) | `{ id, email, status }` (201) |
| POST | `/auth/invitations/platform-manager` | ADMIN | `{ email, fullName }` | `{ id, email, status }` (201) |
| POST | `/auth/invitations/accept` | public | `{ token, password }` | `AuthResult` (201) |

`AuthResult` contains `account: Account`, `accessToken: string` and `expiresIn: number`. Mobile also receives `refreshToken: string`.

TypeScript types for these responses come from `@stayreco/shared` (`Account`, `RegisterResult`, `AuthResult`, `RefreshResult`, `SessionInfo`, `InvitationResult`, `PartnerProfile`, `StaffProfile`). Import them instead of redefining them. The backend fails to compile if `Account` drifts from what it actually returns.

```jsonc
// Account
{
  "id": "uuid",
  "email": "a@b.com",
  "fullName": "Nguyen Van A",
  "phone": null,
  "avatarUrl": null,
  "role": "CUSTOMER",            // see section 2.6
  "status": "ACTIVE",            // PENDING_VERIFICATION | ACTIVE | INVITED | SUSPENDED | DEACTIVATED | DELETED
  "emailVerified": false,
  "emailVerifiedAt": null,
  "lastLoginAt": "2026-10-14T03:00:00.000Z",
  "createdAt": "2026-10-14T03:00:00.000Z",
  // Role-specific data, null for CUSTOMER / ADMIN / PLATFORM_MANAGER:
  //   HOTEL_PARTNER: { "partnerName": "Hotel Co", "status": "PENDING" }
  //   HOTEL_STAFF:   { "hotelId": "uuid", "position": "Receptionist" }
  "profile": null
}
```

### 2.5 FE pages for emails

Email verification uses a **6-digit code**; password reset and invitations use a **link** `WEB_APP_URL/<path>?token=...`:

| FE page | API call |
|---|---|
| OTP screen after sign-up (e.g. `/verify-email?email=`) | User types the code, then `POST /auth/verify-email { email, code }` |
| `/reset-password?token=` | New-password form, then `POST /auth/reset-password` |
| `/accept-invitation?token=` | Set-password form, then `POST /auth/invitations/accept` |

The forgot-password flow is **link-based** (not OTP): `POST /auth/forgot-password { email }`, show "check your email", and the email link opens `/reset-password?token=`.

### 2.6 Roles

| Backend (`role`) | FE route prefix |
|---|---|
| `CUSTOMER` | `/account` |
| `HOTEL_PARTNER` | `/partner` |
| `HOTEL_STAFF` | `/staff` |
| `PLATFORM_MANAGER` | `/manager` |
| `ADMIN` | `/admin` |

Role checks in the FE only drive navigation. The backend always re-checks permissions.

## 3. Data rules

- **Password**: 8–128 characters, with at least one letter and one digit. The FE should apply the same rule to report errors early (MSG08).
- **Email**: the backend trims it and converts it to lowercase.
- **Unknown fields** in the body return **400**. Send only the fields listed above; for example, customer registration does **not** accept `phone`.
- **Dates and times**: the API accepts and returns ISO 8601 strings in UTC (`2026-10-14T03:00:00.000Z`). The FE displays them in `Asia/Ho_Chi_Minh` as `dd/mm/yyyy`. Dates without a time (check-in, check-out) use `YYYY-MM-DD`.
- **Money**: VND amounts as JSON numbers with at most 2 decimals (`2250000`, `185185.05`); the FE formats them as `2.250.000 ₫`. Percentages are JSON numbers (`15`, `12.5`). All prices, discounts, fees and refunds are calculated by the backend; the FE displays them and never recomputes them. Rules: [CONVENTIONS.md §4](./CONVENTIONS.md#4-money).

## 4. Response format (decided)

Based on the `APIResponse` type the FE drafted (`frontend/src/types/response.type.ts`), extended with `meta` for lists and `code`/`details` for errors. Every endpoint uses this format, except **204** responses (no body).

### 4.1 Success

```jsonc
// Single object
{ "success": true, "message": "OK", "data": { ... } }

// Paginated list
{
  "success": true,
  "message": "OK",
  "data": [ ... ],
  "meta": { "page": 1, "pageSize": 10, "total": 57, "totalPages": 6 }
}
```

The **Response** column of the endpoint tables (section 2.4) describes the content of `data`.

Suggested FE types:

```ts
export interface APIResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface APIError {
  success: false;
  message: string;
  code: ErrorCode | string;
  details?: { field: string; message: string }[];
}
```

There is no `status` field in the body; the HTTP status is already available as `error.response.status`.

### 4.2 Errors

```jsonc
// Business error
{ "success": false, "message": "Invalid email or password", "code": "AUTH_INVALID_CREDENTIALS" }

// Validation error (400): details lists each field; nested fields are written as "a.b"
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "email", "message": "Invalid email address" },
    { "field": "password", "message": "Too small: expected string to have >=8 characters" }
  ]
}
```

- **The FE decides behavior by `code`**, never by `message`. `message` is English text for developers and logs, and its wording may change at any time.
- A published `code` is never renamed. When a new code is needed, the backend adds it and updates the table below.
- Errors without a specific code get a generic code derived from the HTTP status.

### 4.3 Error codes

| `code` | HTTP | When | FE suggestion (SRS) |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid body or query, or unknown fields | Show `details` under each input (MSG02–MSG04, MSG08) |
| `BAD_REQUEST` | 400 | Other 400 errors | Generic message |
| `UNAUTHENTICATED` | 401 | Missing, invalid or expired access token, or revoked session | **Refresh** (section 2.3) |
| `FORBIDDEN` | 403 | Signed in but not allowed | MSG25 |
| `NOT_FOUND` | 404 | Resource or route not found | 404 page |
| `CONFLICT` | 409 | Other data conflicts | Generic message |
| `TOO_MANY_REQUESTS` | 429 | Rate limited (login 5/min, emails 3 per 15 min) | "Please try again later" |
| `INTERNAL_ERROR` | 500 | Server error | Generic message, no details |
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email or password (including unknown email) | MSG05. **Do not** refresh. |
| `AUTH_ACCOUNT_LOCKED` | 403 | 5 wrong passwords; locked for 15 minutes | "Too many failed attempts…" |
| `AUTH_ACCOUNT_SUSPENDED` | 403 | Account suspended | MSG06 |
| `AUTH_ACCOUNT_DEACTIVATED` | 403 | Login of a staff account turned off by the hotel partner (correct password) | "Your account was deactivated by the hotel" |
| `AUTH_ACCOUNT_INACTIVE` | 403 | Password reset for an inactive account | MSG06 |
| `AUTH_EMAIL_NOT_VERIFIED` | 403 | Login with the correct password before the email code was entered | Go to the OTP screen for that email |
| `AUTH_OTP_INVALID` | 400 | Wrong email code (also returned for unknown emails) | "Incorrect code", let the user retry |
| `AUTH_OTP_EXPIRED` | 400 | Email code expired, already used, or 5 attempts used | "The code has expired", offer "Resend code" |
| `AUTH_EMAIL_TAKEN` | 409 | Email already registered | MSG07 under the email input |
| `AUTH_WRONG_PASSWORD` | 401 | Wrong current password when changing password | Error under the current-password input. **Do not** refresh. |
| `AUTH_TOKEN_INVALID` | 400 | Password-reset or invitation link is invalid, expired or already used | "This link is invalid or has expired" |
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | Refresh token missing, invalid, expired or reused | Clear the signed-in state and go to `/login` |
| `AUTH_INVITATION_ACCEPTED` | 409 | Invitation already accepted | Go to sign-in |
| `AUTH_SESSION_NOT_FOUND` | 404 | Revoking a session that doesn't exist | Reload the session list |
| `HOTEL_NOT_FOUND` | 404 | Hotel doesn't exist or doesn't belong to the caller (not distinguished) | "Hotel not found" |
| `PARTNER_SUSPENDED` | 403 | The partner is suspended: hotels stay readable, but creating or changing anything is refused | Show the suspension notice; hide edit actions |
| `ROOM_TYPE_NOT_FOUND` | 404 | Room type doesn't exist or belongs to another hotel | Reload the room type list |
| `ROOM_NOT_FOUND` | 404 | Room doesn't exist or belongs to another hotel | Reload the room list |
| `STAFF_NOT_FOUND` | 404 | Staff member doesn't exist or works at another hotel | Reload the staff list |
| `STAFF_STATUS_CONFLICT` | 409 | Deactivating a staff member who is not ACTIVE (pending invitation, suspended), or activating one who is not DEACTIVATED | Reload the staff list |
| `ROOM_NUMBER_TAKEN` | 409 | Room number already used in this hotel | Error under the room number input |
| `ROOM_LIMIT_REACHED` | 409 | No room configuration yet, or more rooms than its declared total (also when lowering the total below existing rooms) | "Room limit reached", link to room configuration |
| `ROOM_TYPE_IN_USE` | 409 | Deleting a room type that still has rooms or bookings | "Remove its rooms first" |
| `ROOM_NOT_LOCKABLE` | 409 | Locking a room that has a guest (`OCCUPIED`), or unlocking a room that is not locked | "The room is occupied" / reload the room |
| `VERIFICATION_PENDING` | 409 | A verification request is already waiting for review | Show the pending request |
| `VERIFICATION_DOCUMENTS_MISSING` | 400 | A required document is missing (business license, fire safety, security certificate) | Highlight the missing documents |
| `VERIFICATION_ALREADY_DECIDED` | 409 | Reviewing a request that already has a decision | Reload the request |
| `UPLOAD_INVALID_FILE` | 400 | File missing, of a type not allowed (images: JPG/PNG/WebP; documents: PDF/JPG/PNG) or larger than 10 MB, or a damaged file the storage refused | Error under the upload field |
| `UPLOAD_UNAVAILABLE` | 503 | File storage not configured or unreachable | "Upload is temporarily unavailable" |
| `IMAGE_NOT_FOUND` | 404 | Image doesn't exist or belongs to a hotel the caller doesn't manage | Reload the image list |
| `IMAGE_LIMIT_REACHED` | 409 | The hotel already has 30 images | "Delete an image before adding more" |

Important: **refresh only when `status === 401` and `code === 'UNAUTHENTICATED'`.** Refreshing on the other 401 errors (`AUTH_INVALID_CREDENTIALS`, `AUTH_WRONG_PASSWORD`, `AUTH_REFRESH_TOKEN_INVALID`) causes infinite loops or unexpected sign-outs.

## 5. Lists: pagination, filtering, sorting

Decided to match what the FE already uses (`TablePagination`, `Pagination`, `AppFilter`, the sort select on the search page):

| Parameter | Example | Rule |
|---|---|---|
| `page` | `?page=2` | 1-based. Default 1. |
| `pageSize` | `?pageSize=20` | Default 10 (SRS 5.2), max 100. |
| `sort` | `?sort=price-asc` | One named option per request: `<field>-asc` / `<field>-desc`, or a special option such as `relevant` or `rating`. Each list endpoint documents the options it accepts (Swagger); unknown values return `VALIDATION_ERROR`. |
| `search` | `?search=riverside` | Free-text search box (`SearchFilter`). |
| filters | `?status=pending` | Named after the filter `key` in `AppFilter` (`status`, `type`, ...), camelCase. |
| multi-select filter | `?status=pending&status=paid` | Repeat the key. With axios, set `paramsSerializer: { indexes: null }`; the default `status[]=` form is not accepted. |
| date-range filter | `?from=2026-10-01&to=2026-10-31` | `YYYY-MM-DD`, both inclusive. If an endpoint has several date ranges, prefix them: `checkInFrom`, `checkInTo`. |

The response `meta` (`page`, `pageSize`, `total`, `totalPages`) maps directly to the props of `TablePagination` / `Pagination`.

## 6. Generated API docs (Swagger)

- Swagger UI: `http://localhost:3000/api/docs`. OpenAPI spec as JSON: `http://localhost:3000/api/docs-json` (import into Postman or generate FE types from it).
- Enabled only when `NODE_ENV !== 'production'`.
- To try authenticated endpoints: call `/auth/login`, copy `accessToken`, click **Authorize** and paste it. Swagger keeps the token across page reloads.
- Swagger is the primary source for endpoints and DTOs. This file keeps only the overall flows and shared rules.
- Response bodies **don't have schemas** in Swagger yet; they will be added together with the first list API.

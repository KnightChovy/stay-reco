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

1. On successful login, keep `accessToken` and `account`; mobile also keeps `refreshToken`.
2. Call APIs with the `Authorization` header.
3. On **401 with `code: "UNAUTHENTICATED"`**: call `/auth/refresh` **once** (queue pending requests; never refresh in parallel), then retry the original request. Other 401 errors must not trigger a refresh (see section 4.3).
4. If refresh also returns 401: clear the signed-in state and redirect to `/login?next=...`.

### 2.4 Auth endpoints

The Response column describes the content of the `data` field (see section 4.1).

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| POST | `/auth/register/customer` | public | `{ email, password, fullName }` | `AuthResult` (201) |
| POST | `/auth/register/partner` | public | `{ email, password, fullName, phone, companyName? }` | `AuthResult` (201) |
| POST | `/auth/login` | public | `{ email, password }` | `AuthResult` |
| POST | `/auth/refresh` | public | web: `{}` · mobile: `{ refreshToken }` | web: `{ accessToken, expiresIn }` · mobile: `{ accessToken, refreshToken, expiresIn }` |
| POST | `/auth/logout` | signed in | | 204 |
| POST | `/auth/logout-all` | signed in | | 204 |
| GET | `/auth/me` | signed in | | `Account` |
| GET | `/auth/sessions` | signed in | | `Session[]` |
| DELETE | `/auth/sessions/:id` | signed in | | 204 |
| POST | `/auth/verify-email` | public | `{ token }` | 204 |
| POST | `/auth/resend-verification` | public | `{ email }` | 204 (always 204; never reveals whether the email exists) |
| POST | `/auth/forgot-password` | public | `{ email }` | 204 (always 204) |
| POST | `/auth/reset-password` | public | `{ token, newPassword }` | 204 |
| POST | `/auth/change-password` | signed in | `{ currentPassword, newPassword }` | 204 |
| POST | `/auth/invitations/staff` | HOTEL_PARTNER | `{ email, fullName, hotelId, position }` (the hotel must belong to the partner) | `{ id, email, status }` (201) |
| POST | `/auth/invitations/platform-manager` | ADMIN | `{ email, fullName }` | `{ id, email, status }` (201) |
| POST | `/auth/invitations/accept` | public | `{ token, password }` | `AuthResult` (201) |

`AuthResult` contains `account: Account`, `accessToken: string` and `expiresIn: number`. Mobile also receives `refreshToken: string`.

TypeScript types for these responses come from `@stayreco/shared` (`Account`, `AuthResult`, `RefreshResult`, `SessionInfo`, `InvitationResult`, `PartnerProfile`, `StaffProfile`). Import them instead of redefining them. The backend fails to compile if `Account` drifts from what it actually returns.

```jsonc
// Account
{
  "id": "uuid",
  "email": "a@b.com",
  "fullName": "Nguyen Van A",
  "phone": null,
  "avatarUrl": null,
  "role": "CUSTOMER",            // see section 2.6
  "status": "ACTIVE",            // ACTIVE | INVITED | SUSPENDED | DELETED
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

### 2.5 FE pages linked from emails

The backend sends emails containing `WEB_APP_URL/<path>?token=...`. The FE needs these 3 pages; each reads `token` from the URL and calls the matching API:

| FE page | API call |
|---|---|
| `/verify-email?token=` | `POST /auth/verify-email` |
| `/reset-password?token=` | New-password form, then `POST /auth/reset-password` |
| `/accept-invitation?token=` | Set-password form, then `POST /auth/invitations/accept` |

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
| `AUTH_ACCOUNT_INACTIVE` | 403 | Password reset for an inactive account | MSG06 |
| `AUTH_EMAIL_TAKEN` | 409 | Email already registered | MSG07 under the email input |
| `AUTH_WRONG_PASSWORD` | 401 | Wrong current password when changing password | Error under the current-password input. **Do not** refresh. |
| `AUTH_TOKEN_INVALID` | 400 | Email-verification, password-reset or invitation link is invalid, expired or already used | "This link is invalid or has expired" |
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | Refresh token missing, invalid, expired or reused | Clear the signed-in state and go to `/login` |
| `AUTH_INVITATION_ACCEPTED` | 409 | Invitation already accepted | Go to sign-in |
| `AUTH_SESSION_NOT_FOUND` | 404 | Revoking a session that doesn't exist | Reload the session list |
| `HOTEL_NOT_FOUND` | 404 | Hotel doesn't exist or doesn't belong to the caller (not distinguished) | "Hotel not found" |

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

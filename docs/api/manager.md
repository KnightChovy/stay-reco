# API: Platform manager (`PLATFORM_MANAGER`)

> FE screens: `manager/*`. Manager accounts are invited by an admin ([auth.md](./auth.md)). Business decisions on verification: [phases/phase-1-hotel-onboarding.md](../phases/phase-1-hotel-onboarding.md).

## Main flow: verifying a hotel

1. `GET /verification-requests?status=PENDING` (the queue, oldest first).
2. `GET /verification-requests/:id` (full detail); view each document with `GET /verification-documents/:docId/file` → open `url`.
3. `POST .../approve`, or `.../reject` / `.../request-changes` with `{ reason }`. On `409 VERIFICATION_ALREADY_DECIDED`, reload the request.
4. An active hotel that needs to be verified again (for example an expired license): `POST /hotels/:id/reverification { reason }`.

## Verification requests

| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/verification-requests` | `?status=&search=&sort=&page=&pageSize=` (`verificationListQuerySchema`) | `VerificationRequestSummary[]` + `meta` |
| GET | `/verification-requests/:id` | | `VerificationRequest` (full, account and ID card numbers unmasked) |
| GET | `/verification-documents/:id/file` | | `VerificationFileLink` `{ url, expiresAt }` (signed link, 5 minutes; how to open it: [partner.md](./partner.md#verification-requests-partner-side)) |
| POST | `/verification-requests/:id/approve` | | `VerificationRequest` |
| POST | `/verification-requests/:id/reject` | `{ reason }` (`verificationDecisionSchema`) | `VerificationRequest` |
| POST | `/verification-requests/:id/request-changes` | `{ reason }` | `VerificationRequest` |
| POST | `/hotels/:hotelId/reverification` | `{ reason }` | `VerificationRequest` (201): type `RENEWAL`, status `NEEDS_REVISION` |

- **Queue**: oldest first by default (`sort` is one of `VERIFICATION_SORTS`: `submitted-asc`, `submitted-desc`); `search` matches the hotel name; filter by `status`. The FE computes the SLA from `submittedAt`. The queue has no beneficiary data.
- **Decisions** only apply to `PENDING` requests; when two managers decide at the same time, the second gets `VERIFICATION_ALREADY_DECIDED`. Reject and request-changes require a reason.
- **First request (`INITIAL`)**: approve → the hotel is `ACTIVE`, and the partner becomes `APPROVED` if it is their first hotel; reject / request-changes → the hotel goes back to `DRAFT`. It **cannot be approved** while the partner is suspended (`409 PARTNER_SUSPENDED`); reject and request-changes still work.
- **`UPDATE` / `RENEWAL` requests** never change the hotel status, whatever the result.
- **Re-verification**: only for `ACTIVE` hotels (otherwise `HOTEL_STATUS_CONFLICT`); a pending request or an earlier re-verification request returns `VERIFICATION_PENDING`. The hotel stays active while the partner prepares the `RENEWAL` request.
- Every decision and every re-verification request **emails** the partner with the reason (to the request's `legal.notificationEmail`; re-verification uses the latest request's email, or the partner's contact email if there is none), and is written to the audit log.
- Access: the queue, approve / reject / request-changes and re-verification are for `PLATFORM_MANAGER` only; every other role (hotel owner included) gets `403 FORBIDDEN`. The request detail and the file link are also open to the hotel owner; staff of that hotel get 403, outsiders get `VERIFICATION_NOT_FOUND`.

```jsonc
// VerificationRequestSummary (queue)
{ "id": "uuid", "hotelId": "uuid", "hotelName": "Mỹ Khê Boutique Hotel", "requestType": "INITIAL",
  "status": "PENDING", "submittedAt": "…", "reviewedAt": null }
```

`VerificationRequest` (detail) and `VerificationFileLink`: see [partner.md](./partner.md#types).

## Common error codes

`VERIFICATION_NOT_FOUND`, `VERIFICATION_ALREADY_DECIDED`, `VERIFICATION_PENDING`, `HOTEL_NOT_FOUND`, `HOTEL_STATUS_CONFLICT`, `PARTNER_SUSPENDED`, `VALIDATION_ERROR` (missing reason). Details: [api-guide.md §4.3](../api-guide.md#43-error-codes).

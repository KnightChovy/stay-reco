# API: Admin (`ADMIN`)

Status: `BE Done`. FE screens: `admin/*`. Decisions M8–M10 in [phases/phase-6-reporting-admin.md](../phases/phase-6-reporting-admin.md). Inviting a platform manager is already built: `POST /auth/invitations/platform-manager` ([auth.md](./auth.md)). System AI settings (UC81) belong to the AI phase.

Every route on this page is for `ADMIN` only; every other role gets `403 FORBIDDEN`. Lists follow [api-guide.md §5](../api-guide.md#5-lists-pagination-filtering-sorting); periods follow the manager's figures ([manager.md](./manager.md#platform-figures)): `from`/`to` together or not at all, default the last 30 days.

## Dashboard

| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/admin/stats` | `?from=&to=` | `AdminOverview` |

UC77, SRS 3.16.1. Each block links to its list.

```jsonc
{ "period": { "from": "…", "to": "…", "days": 30 }, "generatedAt": "…",
  "accounts": [ { "role": "CUSTOMER", "total": 18420, "active": 18200, "suspended": 3, "invited": 0,
                  "new": { "value": 812, "previous": 760, "deltaPercent": 6.8 } } ],   // one per role
  "suspensionRequests": { "pending": 1, "oldestRequestedAt": "…" },
  "payments": {
    "unmatchedTransfers": 2,       // SePay transfers that confirmed nothing, in the period
    "lateTransfers": 1,            // for a booking no longer waiting for payment
    "refundsPending": 4 },         // invoices REFUND_PENDING now
  "securityEvents": [ { "id": "uuid", "action": "ACCOUNT_LOCKED", "severity": "WARNING", "at": "…",
                        "actor": { "id": "uuid", "fullName": "…", "role": "CUSTOMER" }, "ip": "…" } ] }   // the 10 latest WARNING or CRITICAL
```

## Users

| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/admin/users` | `?search=&role=&status=&sort=&page=&pageSize=` (`adminUserListQuerySchema`) | `AdminUserSummary[]` + `meta` |
| GET | `/admin/users/:id` | | `AdminUser` |
| POST | `/admin/users/:id/suspend` | `{ reason }` | `AdminUser` |
| POST | `/admin/users/:id/activate` | `{ reason }` | `AdminUser` |

UC82, SRS 3.16.2–3.16.3, decision M9.

- **List**: `search` matches the name or email; `role` and `status` may be repeated; `sort`: `created-desc` (default), `created-asc`, `name-asc`. `organization` is the partner's company for a partner, the hotel for a staff member, `null` otherwise.
- **Detail**: the summary, the role's details (partner: status, commission rate, hotels; staff: hotel, position, permissions), the number of signed-in devices, the 50 latest audit events done by or about the account, and for a partner its suspension requests.
- **Suspend** (lock the account): `ACTIVE` or `INVITED` → `SUSPENDED`, every session revoked at once; the person cannot sign in (`AUTH_ACCOUNT_SUSPENDED`) and is emailed with the reason. Not for an admin account, the admin's own included (`403 FORBIDDEN`).
- **Activate**: `SUSPENDED` → `ACTIVE` (an invited person who never set a password goes back to `INVITED`), emailed. Staff turned off by their hotel (`DEACTIVATED`) are the partner's to turn back on.
- Any other status: `409 ACCOUNT_STATUS_CONFLICT`. Unknown account: `404 USER_NOT_FOUND`. Both actions need a reason (1–500 characters) and are written to the audit log (`ACCOUNT_SUSPENDED`, `ACCOUNT_ACTIVATED`).

```jsonc
// AdminUserSummary
{ "id": "uuid", "fullName": "…", "email": "…", "role": "HOTEL_PARTNER", "status": "ACTIVE",
  "organization": "Công ty An Nhiên", "createdAt": "…", "lastSignInAt": "…" }    // null if never

// AdminUser = summary +
{ "phone": "…", "avatarUrl": null, "activeSessions": 2,
  "partner": { "status": "APPROVED", "commissionRate": 8, "hotels": [ { "id": "uuid", "name": "…", "status": "ACTIVE" } ] },
  "staff": null,                                       // { hotel, position, permissions } for staff
  "suspensionRequests": [ { "id": "uuid", "status": "PENDING", … } ],
  "timeline": [ { "id": "uuid", "action": "LOGIN_SUCCESS", "severity": "INFO", "at": "…",
                  "actor": { "id": "uuid", "fullName": "…", "role": "HOTEL_PARTNER" }, "entity": null,
                  "details": null, "ip": "…" } ] }   // AuditLogEntry, see System logs
```

## Partners

| Method | Path | Body | Response |
|---|---|---|---|
| PATCH | `/admin/partners/:partnerId/commission-rate` | `{ rate }` (8–15, at most 2 decimals) | `AdminUser` |
| POST | `/admin/partners/:partnerId/reinstate` | `{ reason }` | `AdminUser` |

- **Commission rate** (BR-13): applies to bookings made from now on; existing bookings keep the rate fixed when they were made. Written to the audit log with the old and new rates (`COMMISSION_RATE_CHANGED`).
- **Reinstate**: a suspended partner (`hotel_partner.status = SUSPENDED`) goes back to `APPROVED`; its active hotels are listed and bookable again; emailed with the reason (`PARTNER_REINSTATED`). A partner that is not suspended: `409 PARTNER_STATUS_CONFLICT`. Unknown: `404 PARTNER_NOT_FOUND`.

## Suspension requests

| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/admin/suspension-requests` | `?status=&page=&pageSize=` | `SuspensionRequest[]` + `meta` |
| POST | `/admin/suspension-requests/:id/approve` | `{ reason }` | `SuspensionRequest` |
| POST | `/admin/suspension-requests/:id/reject` | `{ reason }` | `SuspensionRequest` |

UC83, BR-15, decisions M8–M9. A request is sent by a platform manager from a compliance case ([manager.md](./manager.md#compliance-cases)).

- **List**: `PENDING` by default, oldest first; `status` may be repeated, and decided requests come newest first. A request is the `SUSPENSION_REQUESTED` event of a case, decided by the next `SUSPENSION_APPROVED` / `SUSPENSION_REJECTED` event of that case (no table, M8).
- Two admins deciding the same request at once: one succeeds, the other gets `409 SUSPENSION_STATUS_CONFLICT`.
- **Approve**: the partner becomes `SUSPENDED` (its hotels leave the search and take no new bookings; bookings already made are served; the owner can read but not change anything; pending withdrawals stay for the manager). The partner and the manager who asked are notified.
- **Reject**: the partner is not changed; the manager is notified with the reason.
- Only a `PENDING` request can be decided (`409 SUSPENSION_STATUS_CONFLICT`); unknown id: `404 SUSPENSION_REQUEST_NOT_FOUND`.

```jsonc
// SuspensionRequest
{ "id": "uuid", "status": "PENDING",                 // PENDING | APPROVED | REJECTED
  "partner": { "id": "uuid", "name": "…", "status": "APPROVED" },
  "case": { "id": "uuid", "type": "FAKE_LISTING", "severity": "HIGH" },
  "reason": "…", "requestedBy": { "id": "uuid", "fullName": "…" }, "requestedAt": "…",
  "decidedBy": null, "decidedAt": null, "decisionReason": null }
```

## System logs

| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/admin/audit-logs` | `?from=&to=&actorId=&role=&action=&severity=&entityType=&entityId=&page=&pageSize=` | `AuditLogEntry[]` + `meta` |

UC80, SRS 3.16.7, 3.16.9. Read-only: nothing can be changed or deleted.

- Newest first. `action`, `severity` and `role` may be repeated. `from`/`to` default to the last 7 days, 92 days at most.
- **Severity** is derived from the action by the list `AUDIT_SEVERITY` in `@stayreco/shared`: `CRITICAL` for `REFRESH_TOKEN_REUSE`, `ACCOUNT_SUSPENDED`, `SUSPENSION_APPROVED`; `WARNING` for `LOGIN_FAILED`, `ACCOUNT_LOCKED`, `SEPAY_TRANSFER_UNMATCHED`, `SEPAY_TRANSFER_LATE`, `REFUND_REJECTED`, `PAYOUT_REJECTED`, `VERIFICATION_REJECTED`, `SUSPENSION_REQUESTED`, `PAYOUT_ACCOUNT_VIEWED`; `INFO` for every other action.
- `details` is the recorded data of the event; account numbers and ID card numbers in it are masked.
- New `LOGIN_FAILED` events include `email`, `code`, `reason` and `userAgent` (nullable). Reasons distinguish `EMAIL_NOT_FOUND`, `INCORRECT_PASSWORD`, `PASSWORD_NOT_SET`, `ACCOUNT_TEMPORARILY_LOCKED` (with `lockedUntil`), `ACCOUNT_SUSPENDED`, `ACCOUNT_DEACTIVATED`, `EMAIL_NOT_VERIFIED`, and `ACCOUNT_NOT_ACTIVE` (with `status`). `ACCOUNT_LOCKED` includes `FAILED_LOGIN_LIMIT_REACHED`, `failedLoginCount` and `lockedUntil`. These details are admin-only; public sign-in responses remain unchanged and never include these diagnostic reasons. Older rows are not backfilled because their original cause is unknown. Passwords, hashes and tokens are never recorded.

```jsonc
// AuditLogEntry
{ "id": "uuid", "at": "…", "action": "PAYOUT_PAID", "severity": "INFO",
  "actor": { "id": "uuid", "fullName": "…", "role": "PLATFORM_MANAGER" },   // null for the system (jobs, webhooks)
  "entity": { "type": "wallet_transaction", "id": "uuid" },                  // or null
  "details": { "bankReference": "FT2631600123" }, "ip": "…" }
```

## Transactions

| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/admin/transactions` | `?from=&to=&status=&method=&search=&mismatch=&page=&pageSize=` | `AdminTransaction[]` + `meta` |
| GET | `/admin/transactions/:invoiceId` | | `AdminTransactionDetail` |
| GET | `/admin/transactions/unmatched` | `?from=&to=&page=&pageSize=` | `UnmatchedTransfer[]` + `meta` |
| GET | `/admin/transactions/export` | same query as the list | `.xlsx` file (api-guide §4) |

UC79, SRS 3.16.5–3.16.6. A transaction is the payment of a booking and its refunds: one invoice ([money-rules.md §5.1](../money-rules.md#51-model-lecturer-feedback)).

- **List**: period on the invoice's creation; `status` is the invoice's payment status (repeatable), `method` the payment method; `search` matches the booking code or the SePay transaction id; `mismatch=true` keeps the invoices whose confirmed amount differs from the expected one. Newest first.
- **List**: period default the last 30 days, at most 366; `paidAt` is `null` while unpaid; `refunded` sums the refunds credited to the customer wallet.
- **Detail**: the booking (code, hotel, customer, status), the expected amount (`invoice.totalAmount`) and the amount the payment confirmation reported (from the `BOOKING_CONFIRMED` event: the SePay transfer, or the customer wallet), with `mismatch` when they differ; the event history of the booking (details masked like the logs); and every wallet movement of the booking in every wallet (hotel, customer, platform), oldest first. Unknown invoice: `404 NOT_FOUND`.
- Route order: `transactions/unmatched` and `transactions/export` are matched before `transactions/:invoiceId`.
- **Unmatched transfers**: the SePay transfers that confirmed nothing (no or unknown code, wrong amount, other account) or came for a booking no longer waiting, with amount, transfer content, SePay id and reason, to be refunded by hand.
- There is **no status check with SePay** (M10): the detail shows what the webhook reported.
- **Export**: the same filters, every row (at most 10,000), file `StayReco_giao-dich_<from>_<to>.xlsx`.
- **Payment settings**: `webhookUrl` is built from the address the API was called on (`X-Forwarded-Proto` honoured); `lastWebhookAt` is the latest SePay notification (a confirmed transfer, or one kept for manual handling), never a wallet payment. The self-test: `ACCOUNT_CONFIGURED` fails on the demo account `0000000000`, `WEBHOOK_KEY_SET` on a missing key, `WEBHOOK_RECEIVED` when nothing came in the last 7 days.

```jsonc
// AdminTransaction
{ "invoiceId": "uuid", "booking": { "id": "uuid", "code": "SR-261024-0081" },
  "hotel": { "id": "uuid", "name": "…" }, "method": "SEPAY", "status": "PAID",
  "expectedAmount": 12400000, "confirmedAmount": 12400000, "refunded": 0,
  "gatewayTransactionId": "…", "paidAt": "…", "createdAt": "…", "mismatch": false }
```

## Payment settings

| Method | Path | Response |
|---|---|---|
| GET | `/admin/payment-settings` | `PaymentSettings` |
| POST | `/admin/payment-settings/test` | `PaymentSettingsCheck` |

UC78, SRS 3.16.4, decision M10: **read-only**. The values are server environment settings; changing them means changing the environment and restarting the API.

```jsonc
// PaymentSettings
{ "provider": "SEPAY",
  "bank": { "code": "MBBank", "name": "MB Bank" }, "accountNumber": "****6789", "accountName": "STAYRECO",
  "webhookUrl": "https://api.…/api/v1/payments/sepay/webhook", "webhookKeySet": true,
  "lastWebhookAt": "…",                                   // null if none was ever received
  "paymentHoldMinutes": 15, "walletHoldDays": 1, "defaultCommissionRate": 8 }

// PaymentSettingsCheck: each check passes or says why not
{ "checks": [
    { "name": "ACCOUNT_CONFIGURED", "ok": true, "message": null },     // not the demo account
    { "name": "WEBHOOK_KEY_SET", "ok": true, "message": null },
    { "name": "WEBHOOK_RECEIVED", "ok": false, "message": "No webhook in the last 7 days" } ] }
```

## Common error codes

| Group | Codes |
|---|---|
| Users, partners | `USER_NOT_FOUND`, `ACCOUNT_STATUS_CONFLICT`, `PARTNER_NOT_FOUND`, `PARTNER_STATUS_CONFLICT` |
| Suspension requests | `SUSPENSION_REQUEST_NOT_FOUND`, `SUSPENSION_STATUS_CONFLICT` |
| Every route | `VALIDATION_ERROR` (missing reason, bad period, rate outside 8–15), `FORBIDDEN` |

Details: [api-guide.md §4.3](../api-guide.md#43-error-codes).

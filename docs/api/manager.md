# API: Platform manager (`PLATFORM_MANAGER`)

> FE screens: `manager/*`. Manager accounts are invited by an admin ([auth.md](./auth.md)). Business decisions on verification: [phases/phase-1-hotel-onboarding.md](../phases/phase-1-hotel-onboarding.md); on withdrawals, platform figures and compliance: [phases/phase-6-reporting-admin.md](../phases/phase-6-reporting-admin.md) (decisions M1–M10). Flagged reviews and photos: [reviews.md](./reviews.md#the-managers-queue).

Every route on this page is for `PLATFORM_MANAGER` only; every other role gets `403 FORBIDDEN`, except where a row says otherwise.

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

## Withdrawals

The withdrawal queue (UC74, SRS 3.15.5, BR-22, decisions M1–M3). Status: `BE Done`. The partner side and the `Payout` type are in [partner.md](./partner.md#withdrawals).

| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/payouts` | `?status=&hotelId=&search=&page=&pageSize=` (`managerPayoutListQuerySchema`) | `ManagerPayout[]` + `meta` |
| GET | `/payouts/:id` | | `ManagerPayout` with the full account number |
| POST | `/payouts/:id/paid` | `{ bankReference }` (`payoutPaidSchema`, 1–50 characters) | `ManagerPayout` |
| POST | `/payouts/:id/reject` | `{ reason }` (`payoutRejectSchema`, 1–500 characters) | `ManagerPayout` |

- **Queue**: `PENDING` by default, **oldest first**, so the 2-working-day limit is met; `status` may be repeated; `search` matches the hotel or partner name; other statuses are listed newest first. Accounts are masked in the list.
- **Detail**: the full account number to transfer to; each opening is written to the audit log (`PAYOUT_ACCOUNT_VIEWED`, M3).
- **Paid**: transfer the money from the bank's app first, then send the reference of that transfer. The reserved amount leaves the hotel wallet.
- **Reject**: a reason, sent to the partner; the amount goes back to the hotel's available balance.
- Only `PENDING` withdrawals can be decided: otherwise, or when another manager or the partner (cancel) acted first, `409 PAYOUT_STATUS_CONFLICT`; reload the withdrawal. Unknown id: `404 PAYOUT_NOT_FOUND`.
- The partner is notified in the app and by email; the decision is written to the audit log with the manager.

```jsonc
// ManagerPayout = Payout (partner.md) + the partner
{ …Payout, "partner": { "id": "uuid", "name": "Công ty An Nhiên", "status": "APPROVED" },
  "beneficiary": { "bankName": "Vietcombank", "accountNumber": "0071000123456", "accountHolder": "CONG TY AN NHIEN" },  // full in the detail only
  "decidedBy": { "id": "uuid", "fullName": "…" } }    // null while PENDING or when the partner cancelled
```

## Platform figures

Manager dashboard (UC69, 3.14.1), platform revenue (UC75, 3.15.1), revenue of one hotel (3.15.2), commissions (3.15.3), cash flow (3.15.4) and their export (UC76). Decisions M4–M7. Status: `BE Done` for every row except `stats/overview`, which comes with the manager's operations (*Draft*).

| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/platform/stats/overview` | `?from=&to=` | `PlatformOverview` |
| GET | `/platform/stats/revenue` | `?from=&to=&granularity=` | `PlatformRevenue` |
| GET | `/platform/stats/revenue/hotels` | `?from=&to=&region=&search=&sort=&page=&pageSize=` | `HotelRevenueRow[]` + `meta` |
| GET | `/platform/hotels/:hotelId/revenue` | `?from=&to=` | `HotelRevenueDetail` |
| GET | `/platform/hotels/:hotelId/wallet/transactions` | as the partner's (`walletTransactionListQuerySchema`) | `WalletTransaction[]` + `meta` |
| GET | `/platform/commissions` | `?from=&to=&hotelId=&status=&search=&page=&pageSize=` | `CommissionRow[]` + `meta` |
| GET | `/platform/cashflow` | `?from=&to=` | `PlatformCashflow` |
| GET | `/platform/stats/export` | `?report=revenue\|commissions\|cashflow&from=&to=` | `.xlsx` file (api-guide §4) |

Common rules, as in the partner dashboard ([partner-dashboard.md §2](./partner-dashboard.md#2-common-rules)): `from`/`to` together or not at all, default the last 30 days up to today, 366 days at most; day boundaries in Asia/Ho_Chi_Minh; a comparison with the same number of days just before; figures as `Metric` (`value`, `previous`, `deltaPercent` or `deltaPoints`); every response has `generatedAt`.

**Definitions**

| Figure | Definition |
|---|---|
| GMV | Sum of `invoice.totalAmount` of the bookings **paid** in the period (`paidAt`), cancelled later included (M5) |
| Discounts, points | The promotion or voucher discount and the value of the points used, of the same bookings (M4) |
| Refunds | Refunds approved in the period (`REFUND` movements credited to customer wallets) |
| Commission | Commission charged in the period: the platform wallet's `COMMISSION` credits (check-out or no-show, BR-13) |
| Platform revenue | Commission minus the platform wallet's debits in the period (money-rules §5.3) |
| Bookings | Bookings paid in the period |
| Cancellation rate | Of the bookings paid in the period, the share cancelled since (1 decimal) |
| Region | From the hotel's city (M7): `NORTH`, `CENTRAL`, `SOUTH`, `OTHER` |

**`PlatformOverview`** (dashboard): `partners` (active, new in the period), `hotels` (active, new), `customers` (total, new), `bookings`, `gmv`, `commission` as `Metric`s; and the **action queue** counts with the age of the oldest item, each block linking to its list:

```jsonc
{ "period": { "from": "2026-10-14", "to": "2026-11-12", "days": 30 }, "generatedAt": "…",
  "partners": { "active": 248, "new": { "value": 12, "previous": 9, "deltaPercent": 33.3 } },
  "hotels":   { "active": 301, "new": { … } },
  "customers": { "total": 18420, "new": { … } },
  "bookings": { … }, "gmv": { … }, "commission": { … },
  "queue": {
    "verifications":   { "pending": 12, "oldestSubmittedAt": "…" },
    "payouts":         { "pending": 5, "amount": 84000000, "overdue": 1, "oldestRequestedAt": "…" },
    "contentReports":  { "open": 7, "oldestCreatedAt": "…" },
    "complianceCases": { "open": 3, "critical": 1 },
    "suspensionRequests": { "pending": 1 } } }
```

**`PlatformRevenue`**: `totals` (`gmv`, `discounts`, `pointsUsed`, `refunds`, `commission`, `platformDebits`, `platformRevenue`, `bookings` as `Metric`s), `granularity`, `series` (continuous buckets of `day`, `week` or `month` with `periodStart`, `days`, `gmv`, `commission`, `bookings`; default granularity and bucket limits as the partner's `series`), `byRegion` (every region in the order `NORTH`, `CENTRAL`, `SOUTH`, `OTHER`, with `gmv`, `commission`, `bookings` as `Metric`s and `hotels`, the active hotels of the region now). Discounts are the `BOOKING_DISCOUNT_APPLIED` amount of each booking; points are the rest of the invoice's `discountAmount`.

**`HotelRevenueRow`** (drill-down table): every hotel past the draft stage: `hotel` (`id`, `name`, `city`, `region`), `partner` (`id`, `name`), `bookings`, `gmv`, `commission`, `refunds`, `cancellationRate` (`null` without bookings). `sort`: `gmv-desc` (default), `commission-desc`, `bookings-desc`, `cancellationRate-desc`, `name-asc`; ties by name. `search` ignores Vietnamese marks (`nhien` finds "An Nhiên").

**`HotelRevenueDetail`** (one hotel, drafts included; unknown id → `404 HOTEL_NOT_FOUND`): `hotel` (+ `status`), `partner` (`id`, `name`, `status`, `commissionRate`), `bookings`, `gmv`, `commission`, `refunds` as `Metric`s, `cancellationRate` as `RateMetric`, `wallet` (`available`, `pending`, `reserved` now, or `null`), `payouts` (`paidCount`, `paidAmount` in the period; `pendingCount`, `pendingAmount` now). The movements come from `…/wallet/transactions`, the same ledger the owner sees.

**`CommissionRow`**: one per booking that is or will be charged: `booking` (`id`, `code`), `hotel`, `checkOutDate`, `total` (`invoice.totalAmount`), `rate` (fixed at booking), `amount` (charged, or expected = total × rate rounded half up), `status` (`CHARGED` at check-out or no-show, `EXPECTED` for a confirmed or checked-in stay), `chargedAt`. Period on the check-out date; `status` filter; `search` matches the booking code. No refund adjustment (M6).

**`PlatformCashflow`** (reconciliation, 3.15.4):

```jsonc
{ "period": { … }, "generatedAt": "…",
  "received": { "sepay": 920000000, "transfers": 412, "wallet": 18000000 },   // wallet = paid from customer wallets: no new money
  "split": {                       // where the SePay money of the bookings paid in the period is now
    "refunded": 41000000,          // to customer wallets
    "commission": 52000000,        // charged so far
    "hotelSettled": 610000000,     // settled to the hotels (part of it may be withdrawn since)
    "hotelPending": 217000000,     // still held (stays not over, or within the holding period)
    "difference": 0 },             // received.sepay − the four parts; not 0 → highlighted
  "unmatched": { "count": 2, "amount": 3500000 },  // SePay transfers that confirmed nothing or came late (to refund by hand)
  "payoutsPaid": { "count": 18, "amount": 1240000000 },
  "reconciliation": {              // now, all time (money-rules §5.3)
    "bankExpected": 2150000000,    // SePay received − payouts paid
    "walletTotal": 2150000000,     // every wallet: available + pending + reserved
    "difference": 0 } }
```

**Export**: one workbook per `report` with the figures of the matching endpoint and its rows (hotels for `revenue`, bookings for `commissions`, the split and the unmatched transfers for `cashflow`), formatted like the partner export ([partner-dashboard.md §4.8](./partner-dashboard.md#48-get-hotelshotelidstatsexport)).

## Hotels

*(Draft)* Partners list (UC71, 3.14.4): every hotel past the draft stage, one row per hotel (BR-21).

| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/platform/hotels` | `?search=&status=&region=&partnerStatus=&from=&to=&sort=&page=&pageSize=` | `PlatformHotelRow[]` + `meta` |

```jsonc
// PlatformHotelRow
{ "id": "uuid", "name": "An Nhiên Riverside", "city": "Đà Nẵng", "region": "CENTRAL", "status": "ACTIVE",
  "partner": { "id": "uuid", "name": "Công ty An Nhiên", "status": "APPROVED" },
  "rooms": 86, "verifiedAt": "…",
  "bookings": 124, "cancellationRate": 6.5, "gmv": 412000000,       // in the period (default 30 days)
  "rating": { "average": 4.4, "count": 58 },                          // all visible reviews; null average without reviews
  "openCases": 0 }
```

- `search` matches the hotel or partner name; `status` (`PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`, `INACTIVE`) and `partnerStatus` may be repeated.
- `sort`: `bookings-desc` (default), `cancellationRate-desc`, `rating-asc` (weakest first, hotels without reviews last), `gmv-desc`, `name-asc`.
- Re-verification of an active hotel is the existing `POST /hotels/:hotelId/reverification`.

## Compliance cases

*(Draft)* Policy violations and suspension requests (UC72, UC73, 3.14.5, BR-15, decision M8).

| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/policy-violations` | `?status=&severity=&partnerId=&page=&pageSize=` | `PolicyViolationSummary[]` + `meta` |
| POST | `/policy-violations` | `createViolationSchema` | `PolicyViolation` (201) |
| GET | `/policy-violations/:id` | | `PolicyViolation` |
| PATCH | `/policy-violations/:id` | `{ status?, severity?, note }` (`updateViolationSchema`) | `PolicyViolation` |
| POST | `/policy-violations/evidence` | `multipart/form-data`, field `file` | `{ fileId }` (201) |
| GET | `/policy-violations/:id/evidence/:fileIndex` | | `{ url, expiresAt }` (signed link, 5 minutes) |
| POST | `/policy-violations/:id/suspension-request` | `{ reason }` | `PolicyViolation` (201) |

- **Open a case**: `{ partnerId, hotelId?, type, severity, description, evidence? }`. `type` is one of `FRAUD`, `FAKE_LISTING`, `GUEST_SAFETY`, `LICENSE_EXPIRED`, `PAYMENT_ABUSE`, `REVIEW_MANIPULATION`, `OTHER`; `hotelId` must be a hotel of that partner; `evidence` is up to 5 `fileId`s uploaded first through `…/evidence` (PDF, JPG, PNG, 10 MB, stored privately like verification documents).
- **List**: `OPEN` and `INVESTIGATING` by default, the most severe first, then the oldest.
- **Update**: `status` follows `OPEN → INVESTIGATING → RESOLVED | DISMISSED` (`OPEN` may go straight to `RESOLVED` or `DISMISSED`); a closed case cannot change (`409 VIOLATION_STATUS_CONFLICT`). `note` is required and kept in the case's timeline.
- **Suspension request**: only for an `OPEN` or `INVESTIGATING` case of a partner that is not suspended, with a reason; one pending request per partner (`409 SUSPENSION_REQUEST_PENDING`). The admin decides ([admin.md](./admin.md#suspension-requests)); the manager cannot suspend (BR-15).
- Unknown case: `404 VIOLATION_NOT_FOUND`.

```jsonc
// PolicyViolation (detail; the summary has no timeline and no evidence)
{ "id": "uuid", "partner": { "id": "uuid", "name": "…", "status": "APPROVED" },
  "hotel": { "id": "uuid", "name": "…" },            // or null
  "type": "FAKE_LISTING", "severity": "HIGH", "status": "INVESTIGATING",
  "description": "…", "evidence": [ { "index": 0, "fileName": "anh-chup.png" } ],
  "openedBy": { "id": "uuid", "fullName": "…" }, "createdAt": "…", "resolvedAt": null,
  "suspensionRequest": { "id": "uuid", "status": "PENDING", "reason": "…", "requestedAt": "…",
                         "decidedAt": null, "decisionReason": null },     // the latest, or null
  "timeline": [ { "action": "VIOLATION_OPENED", "at": "…", "by": { "fullName": "…" }, "note": null } ] }
```

## Common error codes

| Group | Codes |
|---|---|
| Verification | `VERIFICATION_NOT_FOUND`, `VERIFICATION_ALREADY_DECIDED`, `VERIFICATION_PENDING`, `HOTEL_NOT_FOUND`, `HOTEL_STATUS_CONFLICT`, `PARTNER_SUSPENDED` |
| Withdrawals | `PAYOUT_NOT_FOUND`, `PAYOUT_STATUS_CONFLICT` |
| Compliance (Draft) | `VIOLATION_NOT_FOUND`, `VIOLATION_STATUS_CONFLICT`, `SUSPENSION_REQUEST_PENDING`, `PARTNER_NOT_FOUND`, `UPLOAD_INVALID_FILE` |
| Every route | `VALIDATION_ERROR` (missing reason, bad period), `FORBIDDEN` |

Details: [api-guide.md §4.3](../api-guide.md#43-error-codes).

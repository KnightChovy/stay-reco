# Phase 6: Reporting and administration

| | |
|---|---|
| Phase status | 🟡 BE done (decisions M1–M10), FE integrating |
| API status | `BE Done` for every endpoint of the phase (system AI settings belong to the AI phase); FE integrating |
| Agreed on | 2026-11-12 (decisions M1–M10) |
| BE owners | Khiêm |
| FE owners | |
| API | [api/partner.md](../api/partner.md#withdrawals) (withdrawals, partner side), [api/partner-dashboard.md](../api/partner-dashboard.md) (dashboard, `GET /me/hotels/stats`), [api/manager.md](../api/manager.md) (withdrawal queue, platform figures, hotels, compliance), [api/admin.md](../api/admin.md) (users, suspensions, logs, transactions, payment settings) |

> Rules for every API: [api-guide.md](../api-guide.md). Money rules (payouts, reconciliation): [money-rules.md](../money-rules.md), kept in sync with this file.

> **Partner dashboard built early** (decided 2026-10-28, decision PD8 in [api/partner-dashboard.md](../api/partner-dashboard.md#7-decisions-2026-10-28)): the first release (action items, today, KPIs, chart, occupancy forecast) was built before the hotel operations phase from the booking data that already existed.

## Goal

Partners take their money out and see all their hotels together. Platform managers follow the platform's money and its hotels, pay out withdrawals and handle policy violations. Admins manage accounts, decide suspensions and read the logs and transactions of the system.

## Scope

**Backend**

| Part | SRS | State |
|---|---|---|
| Dashboard first release: action items, today, KPIs, chart, occupancy forecast | UC56, 3.11.2 | built, FE wired |
| Breakdown by room type, source, status, payment method; Excel export | UC56 | built |
| Hotel wallet history and payout account | UC58, 3.13.4 | built |
| Withdrawals: request, cancel, manager queue, paid or rejected (M1–M3) | UC59, UC74, 3.13.5, 3.15.5, BR-22 | built |
| Every hotel of a partner, `GET /me/hotels/stats` | BR-21, 3.11.2 | built |
| Platform revenue, revenue of one hotel, commissions, cash flow, Excel export (M4–M7) | UC75, UC76, 3.15.1–3.15.4, BR-13 | built |
| Manager dashboard, hotels list, compliance cases and suspension requests (M8) | UC69, UC71–UC73, 3.14.1, 3.14.4, 3.14.5, BR-15 | built |
| Admin dashboard, users, account suspension, suspension decisions, commission rate, logs (M9) | UC77, UC80, UC82, UC83, 3.16.1–3.16.3, 3.16.7, BR-13, BR-15 | built |
| Admin transactions, payment settings (M10) | UC78, UC79, 3.16.4–3.16.6 | built |

Order of the pull requests: this contract → withdrawals → `GET /me/hotels/stats` → platform money → manager operations → admin.

**Frontend web / mobile** (pages already have UI in `frontend/src/app`, sample data for now)

- `partner/revenue` (withdraw), `partner/dashboard` (all hotels)
- `manager/dashboard`, `manager/partners`, `manager/compliance`, `manager/revenue`, `manager/cashflow`, `manager/transactions` (commissions), a withdrawals screen
- `admin/dashboard`, `admin/users`, `admin/transactions`, `admin/logs`, `admin/payment-settings`

## Out of scope

- **System AI settings** (UC81, 3.16.8): with the AI phase, by its owner; `ai_config` belongs to it.
- **Content reports on reviews** (flagged reviews and photos): built with reviews ([api/reviews.md](../api/reviews.md#reporting-r11)); the manager dashboard only counts the open ones.
- **Withdrawing the customer wallet** to a bank account: customers have no bank details in the schema; it needs a decision on storing them (see *Open questions*).
- **Editing the payment gateway and the holding period from a screen** (M10): they stay env settings.
- **Checking a transaction with SePay** (3.16.6): needs a SePay API token; the transaction detail shows what the webhook reported.
- Automatic bank transfers: a manager pays a withdrawal from the bank's own app and records the reference.

## Agreed decisions

| # | Decision |
|---|---|
| M1 | **Withdrawals without a new table or enum** (approved 2026-11-03, lecturer's remark: a withdrawal is a state of a payment). A request is a `PAYOUT` wallet transaction on the hotel wallet; its id is the withdrawal id. Request: available −X, reserved +X. Paid: reserved −X (the money left the platform's bank account). Rejected or cancelled: reserved −X, available +X with an `ADJUSTMENT` +X. The state (`PENDING`, `PAID`, `REJECTED`, `CANCELLED`) is the latest of the audit events `PAYOUT_REQUESTED`, `PAYOUT_PAID`, `PAYOUT_REJECTED`, `PAYOUT_CANCELLED`. The manager transfers the money from the bank's app, then records the bank reference. *Overdue* = still pending 2 working days (Monday–Friday, Vietnam time, public holidays not counted) after the request; it is a flag on the queue and the dashboard, nothing happens by itself. |
| M2 | At most the available balance, more than 0, whole dong; one pending request per hotel; only to the beneficiary account of the hotel's latest approved verification request (BR-22, BR-26). The request keeps the id of that verification request, not the account number, so the number stays encrypted. The owner may cancel a pending request. A suspended partner cannot request a withdrawal (`PARTNER_SUSPENDED`); pending ones stay for the manager. Staff never see withdrawals. |
| M3 | The manager's queue shows the account masked (`****6789`); the withdrawal detail shows the full number, needed to transfer, and each opening writes `PAYOUT_ACCOUNT_VIEWED` to the audit log. |
| M4 | **Who pays for discounts.** A hotel's own promotions and vouchers are paid by the hotel (the hotel is credited the total after the discount, as today). The platform-wide loyalty points are paid by the platform: the platform wallet will make up the value of the points to the hotel. The change belongs to the loyalty flow and is built with its owner; until then the hotel is credited the total after points, and the platform reports show GMV, discounts and points as separate figures so either way stays visible. |
| M5 | **GMV** = what customers paid (`invoice.totalAmount`) for the bookings paid in the period, cancelled later included. **Platform revenue** = the platform wallet's commission credits minus its debits in the period (money-rules §5.3). Commission is counted when it is charged (check-out or no-show). |
| M6 | Commissions have **no refund adjustment**: commission is charged only at check-out or no-show, and refunds happen only before check-in (money-rules §5.4). The commissions list shows, per booking, the rate fixed at booking and the amount charged, or the amount expected while the stay is not over. Deviation from SRS 3.15.3. |
| M7 | **Regions** (Miền Bắc, Miền Trung, Miền Nam) come from the hotel's `city` through a fixed list in `@stayreco/shared` (the provinces and centrally run cities, under their current and former names, and the usual tourist towns such as Đà Lạt, Nha Trang, Phú Quốc), matched without Vietnamese marks; no column. A city not in the list counts as *Khác*. |
| M8 | **Compliance cases** use `policy_violation` (severity `LOW`–`CRITICAL`, status `OPEN` → `INVESTIGATING` → `RESOLVED` / `DISMISSED`). The hotel concerned, the evidence files (at most 5, stored privately like verification documents) and every change are kept in the case's audit events. A manager sends a **suspension request** for an open case (BR-15): an audit event `SUSPENSION_REQUESTED` on the case; the admin approves or rejects it with a reason (`SUSPENSION_APPROVED` / `SUSPENSION_REJECTED`). No new table or enum. One pending request per partner. Content reports on reviews stay a separate queue. |
| M9 | Two different actions. **Suspending a partner** (approving a suspension request) sets `hotel_partner.status = SUSPENDED`, with the effects already built: its hotels leave the search and take no new bookings, existing bookings are served, the owner can read but not change anything. The admin can reinstate the partner with a reason. **Locking an account** (admin, any role except admins) sets `user_account.status = SUSPENDED` and signs it out of every device: the person cannot sign in (`AUTH_ACCOUNT_SUSPENDED`). Both need a reason, are emailed and written to the audit log. |
| M10 | **Payment settings are read-only**: the SePay bank account, account name, webhook address, whether the webhook key is set, the time of the last webhook, the holding period and the default commission rate, with secrets masked, plus a self-test. Editing them from a screen would mean storing the gateway secrets in the database (a new table): not done, they stay in the server's environment. Deviation from SRS 3.16.4 and UC78. |

Also agreed: the admin sets each partner's commission rate (8–15%, BR-13), which applies to bookings made afterwards; the default rate for new partners stays `DEFAULT_COMMISSION_RATE`. Audit log severity (`INFO`, `WARNING`, `CRITICAL`) is derived from the action by a fixed list in `@stayreco/shared`, not stored.

## States

```
Withdrawal (latest PAYOUT_* audit event): PENDING → PAID | REJECTED | CANCELLED
Suspension request (latest SUSPENSION_* event of a case): PENDING → APPROVED | REJECTED
policy_violation.status: OPEN → INVESTIGATING → RESOLVED | DISMISSED   (OPEN → RESOLVED | DISMISSED directly too)
hotel_partner.status: APPROVED → SUSPENDED (suspension request approved) → APPROVED (reinstated)
user_account.status: ACTIVE → SUSPENDED (locked by the admin) → ACTIVE (unlocked)
```

New audit actions: `PAYOUT_REQUESTED`, `PAYOUT_ACCOUNT_VIEWED`, `PAYOUT_PAID`, `PAYOUT_REJECTED`, `PAYOUT_CANCELLED`, `VIOLATION_OPENED`, `VIOLATION_UPDATED`, `SUSPENSION_REQUESTED`, `SUSPENSION_APPROVED`, `SUSPENSION_REJECTED`, `PARTNER_REINSTATED`, `ACCOUNT_SUSPENDED`, `ACCOUNT_ACTIVATED`, `COMMISSION_RATE_CHANGED`.

New error codes (added to `packages/shared/src/errors.ts` and [api-guide.md §4.3](../api-guide.md#43-error-codes) with the code that returns them): `PAYOUT_NOT_FOUND`, `PAYOUT_PENDING`, `PAYOUT_EXCEEDS_BALANCE`, `BENEFICIARY_MISSING`, `PAYOUT_STATUS_CONFLICT`, `VIOLATION_NOT_FOUND`, `VIOLATION_STATUS_CONFLICT`, `SUSPENSION_REQUEST_NOT_FOUND`, `SUSPENSION_REQUEST_PENDING`, `SUSPENSION_STATUS_CONFLICT`, `PARTNER_NOT_FOUND`, `PARTNER_STATUS_CONFLICT`, `USER_NOT_FOUND`, `ACCOUNT_STATUS_CONFLICT`.

## Adding endpoints

- Body/query schemas go in `packages/shared/src/schemas/<feature>.ts` (`payout.ts`, `platform-stats.ts`, `compliance.ts`, `admin.ts`), response types in `src/responses/`, each with the pull request that builds the endpoint.
- Endpoints, response types, call flows: the `api/<role>.md` page; the *(Draft)* mark is removed when the endpoint is built.
- Figures are aggregated in SQL, never by loading bookings into memory; day boundaries in Asia/Ho_Chi_Minh, as in the partner dashboard.

## FE tasks

- Partner: "Rút tiền" on the revenue page (amount, masked beneficiary, history of requests); the portfolio table on the dashboard for partners with 2 or more hotels.
- Manager: replace the sample data of the dashboard, partners, compliance, revenue, cash flow and transactions screens; add the withdrawals queue with the "Đã chuyển khoản" (bank reference) and "Từ chối" (reason) actions.
- Admin: users list and detail (lock, unlock, invitations already built), suspension requests, logs, transactions, payment settings.

## Open questions

- [ ] M4: the platform making up loyalty points to the hotel, built in the loyalty flow by its owner.
- [ ] Withdrawing the customer wallet (money-rules §9): needs the customer's bank details, which the schema does not have.
- [ ] Verification SLA: the FE computes it from `submittedAt`; the manager dashboard sends the oldest pending date, not an overdue count, until a target is agreed.

## Definition of Done

- [ ] Dashboard figures match the transaction data (with query tests)
- [x] Withdrawals: two simultaneous requests of a hotel leave one; the wallet's available, pending and reserved balances are checked after every step; reconciliation (money-rules §5.3) holds in the tests
- [ ] The phase's [api/](../api/README.md) pages match the code, API status `Integrated`
- [ ] List of deviations from the SRS sent for the report (M6, M10, and the platform-wide loyalty programme against BR-06)

## Changelog

| Date | Who | Change |
|---|---|---|
| 2026-10-28 | BE | Partner dashboard contract revised from FE's draft (decisions PD1–PD8) and scheduled before the hotel operations phase |
| 2026-11-03 | BE | Hotel wallet history and payout account for the owner |
| 2026-11-06 | BE | Dashboard breakdown by room type, booking source, status and payment method |
| 2026-11-09 | BE | Dashboard Excel export; state table of the phase added |
| 2026-11-12 | BE | Rest of the phase planned: decisions M1–M10, contract of withdrawals, platform figures, compliance and administration (`Draft`) |
| 2026-11-12 | BE | Withdrawals built (M1–M3): `GET`/`POST /hotels/:hotelId/payouts`, `…/:payoutId/cancel`, `GET /payouts`, `GET /payouts/:id`, `POST /payouts/:id/paid`, `POST /payouts/:id/reject`; no schema change; error codes `PAYOUT_*` and `BENEFICIARY_MISSING`; e2e covers concurrent requests and decisions, balances and reconciliation |
| 2026-11-12 | BE | A rejected or cancelled withdrawal's `ADJUSTMENT` left out of the dashboard's net received |
| 2026-11-12 | BE | `GET /me/hotels/stats` built: every hotel of the partner with its own overview figures and action items, totals with occupancy from the summed room nights |
| 2026-11-12 | BE | Platform money built (M4–M7): `GET /platform/stats/revenue`, `…/revenue/hotels`, `/platform/hotels/:hotelId/revenue`, `…/wallet/transactions`, `/platform/commissions`, `/platform/cashflow`, `/platform/stats/export`; regions from the city (`regionOf` in shared); e2e against a hand-computed ledger, reconciliation included |
| 2026-11-12 | BE | Manager operations built (M8): `GET /platform/stats/overview` (with the action queue: verifications, withdrawals and overdue ones, content reports, cases, suspension requests), `GET /platform/hotels`, compliance cases `/policy-violations` (list, open with private evidence, detail, update, evidence link, suspension request); no schema change, the case's hotel, evidence, notes and requests are its audit events; error codes `VIOLATION_*`, `SUSPENSION_REQUEST_PENDING`, `PARTNER_NOT_FOUND` |
| 2026-11-12 | BE | Admin accounts and logs built (M9): `GET /admin/stats`, `GET /admin/users`, `GET /admin/users/:id`, `POST …/suspend`, `POST …/activate`, `PATCH /admin/partners/:partnerId/commission-rate`, `POST …/reinstate`, `GET /admin/suspension-requests`, `POST …/approve`, `POST …/reject`, `GET /admin/audit-logs` (severity from `AUDIT_SEVERITY` in shared, numbers masked); audit actions `ACCOUNT_SUSPENDED`, `ACCOUNT_ACTIVATED`, `PARTNER_REINSTATED`, `COMMISSION_RATE_CHANGED`, `SUSPENSION_APPROVED`, `SUSPENSION_REJECTED`; error codes `USER_NOT_FOUND`, `ACCOUNT_STATUS_CONFLICT`, `PARTNER_STATUS_CONFLICT`, `SUSPENSION_REQUEST_NOT_FOUND`, `SUSPENSION_STATUS_CONFLICT` |
| 2026-11-12 | BE | Admin transactions and payment settings built (M10): `GET /admin/transactions` (confirmed amount from `BOOKING_CONFIRMED`, refunds, mismatch filter), `…/unmatched`, `…/export`, `…/:invoiceId` (booking history and every wallet movement), `GET /admin/payment-settings` (read-only, masked), `POST /admin/payment-settings/test`; every endpoint of the phase is now `BE Done` |

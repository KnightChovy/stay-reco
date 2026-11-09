# Phase 6: Reporting and administration

| | |
|---|---|
| Phase status | 🟡 Partner dashboard and hotel revenue built early; the rest not started |
| API status | Partner dashboard and hotel wallet history: `BE Done` (FE wired the first dashboard release) · the rest: none yet |
| API | [api/partner-dashboard.md](../api/partner-dashboard.md). For the rest, when the phase starts: fill in this file from [`_template.md`](./_template.md) and write the endpoints in [api/](../api/README.md). |

> **Partner dashboard built early** (decided 2026-10-28, decision PD8 in [api/partner-dashboard.md](../api/partner-dashboard.md#7-decisions-2026-10-28)): the first release (action items, today, KPIs, chart, occupancy forecast) is built before the hotel operations phase from the booking data that already exists. Figures that need check-in / check-out or reviews are `0` until those phases exist. Its breakdown and multi-hotel views, the partner revenue screen and everything else below stay in this phase.

**State on 2026-11-09:**

| Part | State |
|---|---|
| Dashboard first release: action items, today, KPIs, chart, occupancy forecast | built, FE wired |
| Breakdown by room type, source, status, payment method (§4.6) | built |
| Excel export of a period (§4.8) | built |
| Hotel wallet history and payout account (`partner/revenue`) | built |
| Every hotel of a partner, `GET /me/hotels/stats` (§4.7) | not started |
| Partner withdrawals (BR-22): no new table or enum, a `PAYOUT` ledger row with a reserved balance and audit events (approved 2026-11-03) | not started |
| Manager: dashboard, revenue, cash flow, compliance, transactions | not started |
| Admin: users, logs, transactions, payment settings, holding period (today `WALLET_HOLD_DAYS`, O7) | not started |
| Admin AI settings | owner to agree with the AI phase |

## Goal

Figures for partners and platform managers, and system administration tools.

## Scope

**Backend**

- Revenue, partner dashboard
- Platform-wide revenue, cash flow, compliance, transactions
- Admin: accounts, logs, transactions, payment and AI settings

**Frontend web / mobile** (pages already have UI in `frontend/src/app`)

- `partner/dashboard`, `partner/revenue`
- `manager/dashboard`, `manager/revenue`, `manager/cashflow`, `manager/compliance`, `manager/transactions`
- `admin/*` (dashboard, users, logs, transactions, payment-settings, ai-settings)

## Definition of Done

- [ ] Dashboard figures match the transaction data (with query tests)
- [ ] The phase's [api/](../api/README.md) pages match the code, API status `Integrated`

## Changelog

| Date | Who | Change |
|---|---|---|
| 2026-10-28 | BE | Partner dashboard contract revised from FE's draft (decisions PD1–PD8) and scheduled before the hotel operations phase |
| 2026-11-03 | BE | Hotel wallet history and payout account for the owner |
| 2026-11-06 | BE | Dashboard breakdown by room type, booking source, status and payment method |
| 2026-11-09 | BE | Dashboard Excel export; state table of the phase added |

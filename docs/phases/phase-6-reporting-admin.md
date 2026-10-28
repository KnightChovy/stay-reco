# Phase 6: Reporting and administration

| | |
|---|---|
| Phase status | ⬜ Not started (partner dashboard started early, see below) |
| API status | Partner dashboard: `Draft` · the rest: none yet |
| API | [api/partner-dashboard.md](../api/partner-dashboard.md). For the rest, when the phase starts: fill in this file from [`_template.md`](./_template.md) and write the endpoints in [api/](../api/README.md). |

> **Partner dashboard built early** (decided 2026-10-28, decision PD8 in [api/partner-dashboard.md](../api/partner-dashboard.md#7-decisions-2026-10-28)): the first release (action items, today, KPIs, chart, occupancy forecast) is built before the hotel operations phase from the booking data that already exists. Figures that need check-in / check-out or reviews are `0` until those phases exist. Its breakdown and multi-hotel views, the partner revenue screen and everything else below stay in this phase.

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

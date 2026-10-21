# Phase 6: Reporting and administration

| | |
|---|---|
| Phase status | ⬜ Not started |
| API status | None yet |
| API | None yet. When the phase starts: fill in this file from [`_template.md`](./_template.md) and write the endpoints in [api/](../api/README.md). |

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

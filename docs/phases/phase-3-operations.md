# Phase 3: Hotel operations

| | |
|---|---|
| Phase status | ⬜ Not started |
| API status | None yet |
| API | None yet. When the phase starts: fill in this file from [`_template.md`](./_template.md) and write the endpoints in [api/](../api/README.md). |

## Goal

Staff handle daily bookings: check-in, check-out, refund requests, messages and alerts.

## Scope

**Backend**

- Bookings list per hotel
- Check-in, check-out
- Refund requests and approval
- Inbox with customers, alerts, notifications

**Frontend web / mobile** (pages already have UI in `frontend/src/app`)

- `staff/dashboard`, `staff/bookings`, `staff/bookings/[id]`, `staff/check-in`, `staff/check-out`
- `staff/refunds`, `staff/inbox`, `staff/alerts`
- `account/notifications`

## Out of scope

- Staff marketing → phase 5

## Definition of Done

- [ ] Every booking status change has an audit log entry
- [ ] Refunds match the amount paid (with a test)
- [ ] The phase's [api/](../api/README.md) pages match the code, API status `Integrated`

# Phase 2: Search and booking

| | |
|---|---|
| Phase status | ⬜ Not started |
| API status | None yet |
| API | None yet. When the phase starts: fill in this file from [`_template.md`](./_template.md) and write the endpoints in [api/](../api/README.md). |

## Goal

Customers search for hotels, view details, book and pay, and manage their trips.

## Scope

**Backend**

- Daily availability and prices
- Hotel search by destination, dates and guests
- Time-limited holds, booking creation
- Payment with SePay (VietQR, SePay notifies us by webhook), confirmation
- My trips, cancel, change dates

**Frontend web / mobile** (pages already have UI in `frontend/src/app`)

- `search`, `hotels/[id]`, `hotels/[id]/rooms/[roomId]`
- `booking`, `booking/payment`, `booking/confirmation`
- `account/bookings`, `account/bookings/[id]` (+ `cancel`, `change`)
- `partner/availability`, `partner/pricing`, `partner/bookings`

## Out of scope

- Refunds handled by staff → phase 3
- Promo codes → phase 4

## Definition of Done

- [ ] No overbooking when 2 people book at the same time (with a test)
- [ ] Booking works end to end on web and mobile
- [ ] The phase's [api/](../api/README.md) pages match the code, API status `Integrated`

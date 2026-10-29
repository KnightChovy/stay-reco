# Phase 3: Hotel operations

| | |
|---|---|
| Phase status | 🟡 In progress |
| API status | `Draft` |
| Agreed on | |
| BE owners | Khiêm, Phúc |
| FE owners | |
| API | [api/staff.md](../api/staff.md#front-desk-phase-3) (check-in, check-out, no-show, rooms, change requests), [api/customer.md](../api/customer.md#change-requests-phase-3) (change requests, notifications), [api/partner-dashboard.md](../api/partner-dashboard.md) (new action items) |

> Rules for every API: [api-guide.md](../api-guide.md). Money rules (commission, settlement, no-show): [money-rules.md](../money-rules.md), kept in sync with this file.

## Goal

Staff run the stay: they check guests in and out, mark no-shows, get rooms cleaned, and handle requests to change booking details. Each completed stay pays the platform its commission, and the hotel's money becomes available after a holding period. Customers and staff get in-app notifications.

## Scope

**Backend**

- Booking lookup by code or voucher QR, room options, check-in with room assignment (UC36–UC38, BR-10)
- Check-out, early check-out, room cleaned (UC39)
- No-show, by staff and automatically
- Commission at check-out / no-show into the platform wallet (BR-13), settlement from pending to available after the holding period (BR-22)
- Change requests: the customer asks to change guest details, staff accept or reject (UC25, UC43)
- In-app notifications next to the booking emails (`account/notifications`)
- An audit log entry for every booking status change
- Dashboard: action items `OVERDUE_CHECKOUTS`, `CHANGE_REQUESTS_PENDING`; today's check-in / check-out figures become real

Already built with bookings: the hotel's bookings list (UC26, UC57) and refund requests and decisions (UC29, UC34).

**Frontend web / mobile** (pages already have UI in `frontend/src/app`)

- `staff/dashboard`, `staff/bookings`, `staff/bookings/[id]`, `staff/check-in`, `staff/check-out`, `staff/refunds`
- `account/bookings/[id]/change`, `account/notifications`

## Out of scope

- Inbox with customers and taking over AI conversations (UC40, UC41) → with the AI assistant ([phase 5](./phase-5-ai-marketing.md), O14)
- Alerts and the alert detection job (UC42, SRS 3.8.5) → later; negative reviews need reviews ([phase 4](./phase-4-loyalty-promotions.md)) (O13)
- Deposits, extra charges (minibar…), ID card scanning shown in the FE prototype → handled at the front desk outside StayReco (O10)
- Loyalty points at check-out (BR-11) and reviews after the stay (BR-12) → phase 4
- Staff marketing → phase 5
- The holding period set by an admin screen → phase 6 (until then an env variable, O7)

## Agreed decisions

| # | Decision |
|---|---|
| O1 | Bookings stay **confirmed automatically** when SePay reports the payment (as on Booking.com / Traveloka). Staff do not confirm or reject new bookings: a paid booking already holds its rooms, so a rejection could only hurt the customer. SRS UC27 "Duyệt đơn đặt phòng" becomes viewing new bookings. |
| O2 | Check-in is possible from the check-in date (early arrival on that day included) until the day before the check-out date, in Asia/Ho_Chi_Minh. It is refused while a refund request is waiting (`REFUND_PENDING`): the hotel decides the refund first. |
| O3 | The rooms held at booking are assigned by default. Staff may pick other rooms of the **same room type** that are `AVAILABLE` and free for every remaining night; the booking's calendar rows move to those rooms (BR-10: never another room type). A booking of N rooms is checked in with N rooms. Assigned rooms become `OCCUPIED`. |
| O4 | No-show: staff mark it from the day after the check-in date. A job also turns a booking still `CONFIRMED` at the hotel's check-out time (12:00 when not set) on the check-out date into `NO_SHOW`. Nights from today on are released. Not while a refund request is waiting. |
| O5 | A no-show keeps the money with the hotel (BR-20: no refund) and pays the platform commission like a completed stay. |
| O6 | Commission is recorded at check-out or no-show: booking total × `booking.commission_rate` (the rate fixed at booking), rounded half up to whole dong, as a pair of wallet transactions: hotel wallet pending −commission, platform wallet available +commission. Keys `commission:<bookingId>:hotel` and `commission:<bookingId>:platform`. |
| O7 | Holding period (BR-22): **1 day** after check-out or no-show, from env `WALLET_HOLD_DAYS` (default 1) until an admin setting exists. An hourly job settles due bookings. A cancelled booking that left the hotel money (no refund, or the fee of a partial refund) is settled `WALLET_HOLD_DAYS` after the cancellation, with no commission (decided 2026-10-29). |
| O8 | Settlement moves the hotel's net amount of the booking (payment − commission − refund) from pending to available as a pair of `SETTLEMENT` wallet transactions on the hotel wallet (new value of `wallet_txn_type`), keys `settlement:<bookingId>:pending` and `settlement:<bookingId>:available`. |
| O9 | Early check-out releases the nights from today on, with no refund (BR-09: paid in full). Late check-out is allowed; the dashboard shows it as `OVERDUE_CHECKOUTS`. There is no automatic check-out. |
| O10 | Deposits, extra charges and ID scanning are not recorded in StayReco; the check-out screen shows the amount paid and refunds only. |
| O11 | Change requests (UC25, UC43) are stored in `audit_log` like cancel requests (no new table): at most one waiting request per booking, only while it is `CONFIRMED`. Staff with `BOOKING` or the owner accept it (the booking is updated) or reject it with a reason sent to the customer. Fields: guest name, contact phone, arrival time, special requests (never dates, room type or guests, BR-09). |
| O12 | In-app notifications: every booking, refund and change-request email also creates a `notification` row for the same person, with a link to the screen it concerns. |
| O13 | Alerts (UC42) are postponed: they need a new table and, for negative reviews, reviews. |
| O14 | The inbox (UC40, UC41) is built with the AI assistant, by its owner. |
| O15 | Every booking status change writes an `audit_log` entry: `BOOKING_CONFIRMED` (payment), `BOOKING_EXPIRED`, `BOOKING_CHECKED_IN`, `BOOKING_CHECKED_OUT`, `BOOKING_NO_SHOW`, and the cancellation events that already exist. They feed the booking timeline. |

Access: check-in, check-out, no-show and room cleaned need `FRONT_DESK`; change requests need `BOOKING`; the owner can do all of them (not while suspended, except reads).

## Schema changes (to approve before the migration)

| Table | Change |
|---|---|
| enum `wallet_txn_type` | + `SETTLEMENT` (O8) |
| `notification` | + `link` varchar(500) null: the app path the notification opens (`/account/bookings/<id>`, `/staff/bookings/<id>`…) (O12) |

No other table changes: check-in rooms live in `room_calendars`, events and change requests in `audit_log`, money in `wallet_transaction`.

## States

```
booking_status:  PENDING ──paid──► CONFIRMED ──check-in──► CHECKED_IN ──check-out──► COMPLETED
                    │                 │  └──no-show (staff from the next day, or job at check-out time)──► NO_SHOW
                    └──expired──► EXPIRED  └──refund 0, or refund approved──► CANCELLED
room_status:     AVAILABLE ──check-in──► OCCUPIED ──check-out──► CLEANING ──cleaned──► AVAILABLE
                 AVAILABLE / CLEANING ──lock──► MAINTENANCE ──unlock──► AVAILABLE
room_calendars:  BOOKED rows move to the assigned rooms at check-in; nights from today on are deleted at early check-out and no-show
hotel wallet:    payment → pending; check-out / no-show: pending −commission (platform +commission);
                 after WALLET_HOLD_DAYS: pending −net, available +net (SETTLEMENT);
                 cancelled with a fee kept: the same, WALLET_HOLD_DAYS after the cancellation, no commission
```

## Limits (locked for this phase)

| Item | Limit |
|---|---|
| Check-in | from the check-in date to the day before the check-out date |
| No-show by staff | from the day after the check-in date |
| Automatic no-show | the hotel's check-out time on the check-out date (12:00 when not set), job every 5 minutes |
| Holding period | `WALLET_HOLD_DAYS`, default 1 day after check-out / no-show / a cancellation that left a fee; settlement job every hour |
| Change request | guest name ≤ 100, contact phone ≤ 20, special requests ≤ 500, reject reason ≤ 500; one waiting request per booking |
| Notifications | list page size 1–100 (default 10) |

## Adding endpoints

- Body/query schemas in `packages/shared/src/schemas/booking.ts` (front desk, change requests) and `notification.ts`; response types in `responses/booking.ts` and `responses/notification.ts`, before the code.
- New error codes: `packages/shared/src/errors.ts`, the error catalog and [api-guide.md §4.3](../api-guide.md#43-error-codes).

## FE tasks

- Check-in: scan the voucher QR (or type the code), open the booking through `bookings/lookup`, show `room-options`, confirm with the chosen rooms. Drop the deposit and ID-scan blocks of the prototype (O10).
- Check-out: summary of the amount paid and refunds, confirm. Drop minibar / extra charges / deposit (O10).
- Rooms: "Dọn xong" on `CLEANING` rooms.
- Booking detail (staff): no-show button from the day after check-in; change request with accept / reject.
- Customer: change request form (only guest name, phone, arrival time, special requests); notifications page and unread badge.
- `staff/bookings/[id]`: no confirm / reject buttons for new bookings (O1).

## Open questions

- [ ]

## Definition of Done

- [ ] Every booking status change has an audit log entry
- [ ] Refunds match the amount paid (with a test) — built with bookings; commission and settlement amounts match the booking total too
- [ ] Check-in cannot assign a room of another type or a room taken on a remaining night (e2e)
- [ ] Commission and settlement are written once even when the job and a request race (e2e)
- [ ] The phase's [api/](../api/README.md) pages match the code, API status `Integrated`

## Changelog

| Date | Who | Change |
|---|---|---|
| 2026-10-29 | BE | Draft: decisions O1–O15, schema changes, endpoints for check-in / check-out / no-show / rooms, change requests, notifications |
| 2026-10-29 | BE | Built check-in, check-out, room cleaned, commission and settlement; O7: the fee a hotel keeps from a cancellation is settled after the holding period too; room options follow the check-in conditions |

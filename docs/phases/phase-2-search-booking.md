# Phase 2: Search and booking

| | |
|---|---|
| Phase status | 🟡 In progress |
| API status | `Draft` |
| Agreed on | |
| BE owners | Khiêm, Phúc |
| FE owners | |
| API | [api/customer.md](../api/customer.md), [api/partner.md](../api/partner.md#pricing-rules-draft-phase-2) (pricing, availability, cancellation policy, bookings, refunds), [api/staff.md](../api/staff.md#coming-in-phase-2-draft) |

> Rules for every API: [api-guide.md](../api-guide.md). Money rules in full (prices, holds, SePay, wallets, cancellation, refunds): [money-rules.md](../money-rules.md), kept in sync with this file.

## Goal

Customers find a hotel, see real prices and availability, book, pay by bank transfer through SePay, and manage or cancel their trips. Partners price their rooms, manage what is on sale, set their cancellation policy, and decide refunds.

## Scope

**Backend**

- Pricing rules (base, seasonal, early-bird, last-minute) and the nightly price engine (UC64)
- Availability calendar: rooms on sale per room type and day (UC63)
- Cancellation policy per hotel, fixed on each booking (BR-07)
- Public search and hotel / room type pages with prices for the stay (UC10–UC12, UC19)
- Booking with a 15-minute hold, the expiry job, no overbooking (UC18, UC20, BR-02, BR-03)
- SePay payment: VietQR, webhook, confirmation email, hotel wallet (UC22, BR-04, BR-22)
- My trips, booking detail, cancellation with refund request, e-voucher QR (UC23, UC24, UC28, UC29)
- Partner view of the hotel's bookings and refund decisions (UC57, slide 08)

**Frontend web / mobile** (pages already have UI in `frontend/src/app`)

- `search`, `hotels/[id]`, `hotels/[id]/rooms/[roomId]`
- `booking`, `booking/payment`, `booking/confirmation`
- `account/bookings`, `account/bookings/[id]`, `account/bookings/[id]/cancel`
- `partner/pricing`, `partner/availability`, `partner/bookings`, partner hotel settings (cancellation policy)

## Out of scope

- Promo codes, vouchers, loyalty points (BR-06, BR-11) → phase 4; the booking form leaves the code field disabled
- Paying with the customer wallet, withdrawing it → phase 4
- Changing guest details on a booking (UC25, with staff acceptance UC43) → phase 3; `account/bookings/[id]/change` must drop date / room changes (BR-09)
- Confirming, check-in, check-out, no-show, commission entries, moving pending balance to available → phase 3
- Partner withdrawals (BR-22) → phase 6

## Agreed decisions

| # | Decision |
|---|---|
| P1 | A hold reserves concrete physical rooms in `room_calendars` (`HELD`, `hold_expires_at`). The unique `(room_id, date)` constraint makes double booking impossible. Staff may still assign another room of the same type at check-in (BR-10). |
| P2 | Rooms taken off sale are `room_calendars` rows in `BLOCKED`; no extra table. |
| P3 | Pricing rules extend the `price` table. One rule per night: the active matching rule with the highest priority, ties to the newest; no stacking (SRS 3.12.1). Days before check-in are counted in Asia/Ho_Chi_Minh. |
| P4 | One cancellation policy per hotel: free-cancellation days N (0–30, or none) and a fee percent (0–100). The deadline is the hotel's check-in time (14:00 by default), N days before the check-in date. It is fixed on the booking with the commission rate. |
| P5 | One booking holds 1–8 rooms of **one** room type. |
| P6 | The booking code is `invoice.invoice_number`, `SR-YYMMDD-XXXX`, and is the transfer content. |
| P7 | SePay: a transfer confirms a booking only with the booking code in its content **and** the exact amount. Duplicate webhooks are ignored through the `wallet_transaction` idempotency key `sepay:<SePay transaction id>`. Unmatched or late transfers go to `audit_log` for manual handling. `invoice.vnpay_txn_ref` holds the SePay transaction id (column reused, not renamed). |
| P8 | Money model (lecturer feedback): no payment or refund-request tables. Payment state = `invoice.payment_status`; every money movement = one `wallet_transaction`; the hotel's share goes to the hotel wallet's pending balance (BR-22). |
| P9 | Search ignores Vietnamese accents (`unaccent` extension). |
| P10 | Emails: booking confirmed, booking cancelled, refund approved or rejected. |
| P11 | Cancellation follows slide "08. Cancellation And Refund", not the SRS staff-approves version: refund 0 → cancelled at once; refund > 0 → invoice `REFUND_PENDING`, booking keeps its rooms; staff with `REFUND` forward it with a note; **the partner approves** (booking `CANCELLED`, rooms released, hotel wallet −refund, customer wallet +refund) **or rejects** (invoice back to `PAID`, booking stays); undecided at check-in time → approved automatically. Refund idempotency key: `refund:<bookingId>` (one suffix per wallet row). |
| P12 | Hold expired after 15 minutes: booking `EXPIRED`, invoice `FAILED`, rooms released. |
| P13 | Public hotel and room type pages are `GET /hotels/:hotelId/listing` and `GET /room-types/:id/listing`, because `GET /hotels/:hotelId` and `GET /room-types/:id` already serve partners and staff (phase 1) and published URLs are not changed. Search is `GET /hotels` (CONVENTIONS §1.4). |

## Schema changes (one migration, approved 2026-10-22)

| Table | Change |
|---|---|
| `booking` | `guest_name` varchar(100), `contact_phone` varchar(20), `arrival_time` time null, `free_cancel_until` timestamptz null, `cancel_fee_percent` Decimal(5,2), `commission_rate` Decimal(5,2) |
| `price` | `rule_type` (`BASE`, `SEASON`, `EARLY_BIRD`, `LAST_MINUTE`), `adjustment_type` (`SET_PRICE`, `AMOUNT`, `PERCENT`), `adjustment_value` Decimal(14,2), `min_days_before`, `max_days_before`, `priority`; `price_per_night` becomes nullable (BASE only). Existing base rows become `BASE`. |
| enums | `booking_status` + `EXPIRED`; `payment_status` + `REFUND_PENDING`; new `price_rule_type`, `price_adjustment_type` |
| extension | `unaccent` |

The cancellation policy is stored in `hotel_properties` (keys `cancellation_free_days`, `cancellation_fee_percent`), and the cancel reason in `audit_log`: no column for either.

## States

```
booking_status:  (POST /bookings) → PENDING ──SePay match──► CONFIRMED ──check-in (phase 3)──► CHECKED_IN ──► COMPLETED
                                       │                          │
                                       └──hold expired──► EXPIRED  └──refund 0, or refund approved──► CANCELLED
payment_status:  UNPAID ──paid──► PAID ──cancel with refund──► REFUND_PENDING ──approved──► REFUNDED | PARTIALLY_REFUNDED
                   │                                               └──rejected──► PAID
                   └──hold expired──► FAILED
room_calendars:  (free) ──hold──► HELD ──paid──► BOOKED ──cancel approved──► (free)
                                    └──expired──► (free)          partner close / reopen: (free) ⇄ BLOCKED
```

## SePay integration (backend only)

- Payment details shown to the customer come from env: bank, account number, account name (`SEPAY_*`). The QR image is a VietQR image URL with the amount and the booking code filled in.
- SePay calls `POST /payments/sepay/webhook` for every incoming transfer, authenticated with the API key configured in SePay (header checked by the backend; wrong key → 401, no processing). The handler matches the booking code in the transfer content and the amount, then confirms the booking in one transaction (invoice `PAID`, `BOOKING_PAYMENT` wallet row, `room_calendars` `HELD` → `BOOKED`) and answers success so SePay does not retry.
- Payload field names, the authentication header and the expected answer follow SePay's webhook documentation; they are checked against it when the endpoint is built.
- Local development needs a public URL for the webhook (ngrok).

## Limits (locked for this phase)

| Item | Limit |
|---|---|
| Stay | 1–30 nights; check-in from today (Asia/Ho_Chi_Minh) to 365 days ahead |
| Rooms per booking | 1–8, one room type |
| Guests | 1–30, at most rooms × `maxOccupancy` |
| Hold | 15 minutes; expiry job every minute |
| Pricing rule | priority 0–100; `PERCENT` −90 to +300; `SEASON` range ≤ 366 days; early-bird 1–365 days; last-minute 0–30 days |
| Availability view / update | ≤ 62 days per request |
| Cancellation policy | free days 0–30 or none; fee 0–100% |
| Text | guest name ≤ 100, special requests ≤ 500, cancel / reject reason ≤ 500, forward note ≤ 500 |

## Adding endpoints

- Body/query schemas go in `packages/shared/src/schemas/booking.ts` and `pricing.ts`, response schemas in `packages/shared/src/responses/booking.ts`, added before the code so FE can work in parallel.
- New error codes: `packages/shared/src/errors.ts`, the error catalog (`backend/src/common/swagger/error-catalog.ts`) and [api-guide.md §4.3](../api-guide.md#43-error-codes).

## FE tasks

- Search page and filters on `GET /hotels`; result cards show `fromTotal` for the whole stay.
- Hotel and room type pages on the `listing` endpoints; reload offers when dates change; "sold out" when `offer.available` is 0.
- Booking form: guest name, phone, arrival window (hourly), special requests; send `expectedTotal`; handle `ROOM_SOLD_OUT` (MSG12) and `BOOKING_PRICE_CHANGED` (MSG13).
- Payment page: VietQR image, bank details, exact transfer content, countdown to `expiresAt`; poll `GET /bookings/:id`; no "I have paid" button.
- Voucher page: render `qrToken` as a QR code.
- My trips tabs, booking detail with timeline, cancel screen from `cancellation-quote` with a required reason.
- `account/bookings/[id]/change`: remove date / room / guest changes (BR-09).
- Partner: pricing rules list, drawer and price preview; availability grid; cancellation policy form; bookings list; refund approve / reject.

## Open questions

- [ ] Default cancellation policy for hotels that have not set one (proposed: free until 1 day before, then 100%).
- [ ] May a suspended partner still approve refunds (proposed: yes, money goes back to the customer) and reject them (proposed: no)?
- [ ] Hotel wallet on payment: credit the full amount and take the commission at check-out, or credit the amount net of commission (BR-22 says "the hotel's share")? Only affects phase 3.
- [ ] FE review of the `listing` URLs (P13).

## Definition of Done

- [ ] No overbooking when 2 people book the last room at the same time (e2e test)
- [ ] Price engine unit tests: overlapping rules, priority, weekday, early-bird / last-minute boundaries, rounding
- [ ] SePay webhook tests: match, duplicate, wrong amount, unknown code, late after expiry, wrong API key
- [ ] Refund flow tests: zero refund, approve, reject, auto-approve at check-in, wallet rows idempotent
- [ ] Booking works end to end on web and mobile with a real transfer
- [ ] The phase's [api/](../api/README.md) pages match the code, API status `Integrated`

## Changelog

| Date | Who | Change |
|---|---|---|
| 2026-10-23 | BE | Draft API: search, listings, bookings, SePay payment, my trips, cancellation and refunds, pricing rules, availability, cancellation policy; decisions P1–P13, schema changes, limits |

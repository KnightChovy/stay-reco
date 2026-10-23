# Phase 2: Search and booking

| | |
|---|---|
| Phase status | 🟡 In progress |
| API status | `Agreed` |
| Agreed on | 2026-10-23 |
| BE owners | Khiêm, Phúc |
| FE owners | |
| API | [api/customer.md](../api/customer.md), [api/partner.md](../api/partner.md#pricing-rules-phase-2) (pricing, availability, cancellation policy, bookings, refunds), [api/staff.md](../api/staff.md#coming-in-phase-2) |

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
| P11 | Cancellation follows slide "08. Cancellation And Refund", not the SRS staff-approves version: refund 0 → cancelled at once; refund > 0 → invoice `REFUND_PENDING`, booking keeps its rooms; staff with `REFUND` forward it with a note; **the partner approves** (booking `CANCELLED`, rooms released, hotel wallet −refund, customer wallet +refund) **or rejects** (invoice back to `PAID`, booking stays); a request made before the check-in time and still undecided at that time → approved automatically; a request made after it waits for the partner. Refund idempotency key: `refund:<bookingId>` (one suffix per wallet row). |
| P12 | Hold expired after 15 minutes: booking `EXPIRED`, invoice `FAILED`, rooms released. |
| P13 | Public hotel and room type pages are `GET /hotels/:hotelId/listing` and `GET /room-types/:id/listing`, because `GET /hotels/:hotelId` and `GET /room-types/:id` already serve partners and staff (phase 1) and published URLs are not changed. Search is `GET /hotels` (CONVENTIONS §1.4). |
| P14 | Default cancellation policy until the partner sets one: free until the check-in time 1 day before check-in, then a 100% fee. |
| P15 | A suspended partner can still **approve** a refund (the money goes back to the customer) but cannot **reject** one (`403 PARTNER_SUSPENDED`). |
| P16 | On payment the hotel wallet's pending balance gets the **full** amount; the commission is taken at check-out (phase 3). A **platform wallet** (`wallet.owner_type = PLATFORM`, exactly one) holds StayReco's revenue: commission moves as a pair (hotel −, platform +). Hotel and customer wallets are created on their first movement. A dev-only endpoint simulates a matching transfer: on only with `PAYMENT_SIMULATOR=true`, never when `NODE_ENV=production`. |

## Schema changes (one migration, approved 2026-10-22)

| Table | Change |
|---|---|
| `booking` | `guest_name` varchar(100), `contact_phone` varchar(20), `arrival_time` time null, `free_cancel_until` timestamptz null, `cancel_fee_percent` Decimal(5,2), `commission_rate` Decimal(5,2) |
| `price` | `rule_type` (`BASE`, `SEASON`, `EARLY_BIRD`, `LAST_MINUTE`), `adjustment_type` (`SET_PRICE`, `AMOUNT`, `PERCENT`), `adjustment_value` Decimal(14,2), `min_days_before`, `max_days_before`, `priority`; `price_per_night` becomes nullable (BASE only). Existing base rows become `BASE`. |
| enums | `booking_status` + `EXPIRED`; `payment_status` + `REFUND_PENDING`; new `price_rule_type`, `price_adjustment_type` |
| extension | `unaccent` |
| `wallet` (third migration, approved 2026-10-23) | `owner_type` enum (`CUSTOMER`, `HOTEL`, `PLATFORM`) with CHECK `wallet_owner_shape`; one platform wallet with the fixed id `00000000-0000-0000-0000-000000000001` (CHECK `wallet_single_platform`), inserted by migration `20261023123347_platform_wallet`. |
| `booking` (second migration, approved 2026-10-23) | `num_rooms` int 1–8 and `nightly_prices` jsonb (`[{ date, price }]` per room), both fixed at booking time: the `room_calendars` rows that would otherwise give them are deleted when the nights are released. Migration `20261023105156_booking_rooms_and_nightly_prices`; existing bookings get 1 room and `[]`. |

Applied in migration `20261023085907_booking_pricing_rules`. Existing rows are filled before the new columns become required: prices without room, dates or weekday become `BASE`, other prices become `SEASON` rules that set the price; existing bookings take the booker's name and phone, a 100% fee with no free period, and the partner's current commission. Two CHECK constraints guard the data: `price_rule_shape` (a `BASE` row has a nightly price and no adjustment, any other rule has an adjustment) and `booking_terms_range` (both percentages between 0 and 100).

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

- Payment details shown to the customer come from env: `SEPAY_BANK_CODE` (bank short name used by SePay), `SEPAY_BANK_NAME`, `SEPAY_ACCOUNT_NUMBER`, `SEPAY_ACCOUNT_NAME`, with demo defaults until deploy. The QR image is `https://qr.sepay.vn/img?acc=&bank=&amount=&des=` with the amount and the booking code filled in.
- SePay calls `POST /payments/sepay/webhook` for every incoming transfer, authenticated with the API key configured in SePay (header checked by the backend; wrong key → 401, no processing). The handler matches the booking code in the transfer content and the amount, then confirms the booking in one transaction (invoice `PAID`, `BOOKING_PAYMENT` wallet row, `room_calendars` `HELD` → `BOOKED`) and answers success so SePay does not retry.
- Payload field names, the authentication header and the expected answer follow SePay's webhook documentation; they are checked against it when the endpoint is built.
- Local development needs a public URL for the webhook (ngrok).

## Limits (locked for this phase)

| Item | Limit |
|---|---|
| Stay | 1–30 nights; check-in from today (Asia/Ho_Chi_Minh) to 365 days ahead |
| Rooms per booking | 1–8, one room type |
| Guests | 1–30, at least one per room, at most rooms × `maxOccupancy` |
| Search | destination ≤ 100 characters; at most 20 amenity filters |
| Hold | 15 minutes; expiry job every minute |
| Pricing rule | name ≤ 100 characters; priority 0–100; `PERCENT` −90 to +300; `SEASON` range ≤ 366 days; early-bird 1–365 days; last-minute 0–30 days |
| Availability view / update | ≤ 62 days per request; at most 500 rooms on sale per day |
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

- [x] Hotel wallet on payment: the full amount, commission at check-out; revenue in a platform wallet (P16, decided 2026-10-23).

## Definition of Done

- [x] No overbooking when 2 people book the last room at the same time (e2e test)
- [x] Price engine unit tests: overlapping rules, priority, weekday, early-bird / last-minute boundaries, rounding
- [ ] SePay webhook tests: match, duplicate, wrong amount, unknown code, late after expiry, wrong API key
- [x] Refund flow tests: zero refund, approve, reject, auto-approval only for requests made before check-in time, wallet rows idempotent
- [ ] Booking works end to end on web and mobile with a real transfer
- [ ] The phase's [api/](../api/README.md) pages match the code, API status `Integrated`

## Changelog

| Date | Who | Change |
|---|---|---|
| 2026-10-24 | BE | Hotel side built: bookings list (refund queue), forward with a note, approve (hotel pending → customer available), reject with `refundRejection`, automatic approval at the check-in time |
| 2026-10-24 | BE | Customer cancellation built: quote and cancel; zero refund cancels at once, otherwise invoice `REFUND_PENDING`; reason, fee and refund fixed in `audit_log` |
| 2026-10-24 | BE | My trips and the signed e-voucher built (`VOUCHER_SIGNING_SECRET`, no new column); no-shows listed under `completed` |
| 2026-10-23 | BE | Payment confirmation (booking `CONFIRMED`, invoice `PAID`, nights `BOOKED`, hotel wallet credited, idempotent) and the dev payment simulator built; platform wallet added (P16) |
| 2026-10-23 | BE | Bookings with the 15-minute hold, the booking page and the expiry job built; `booking.num_rooms` and `booking.nightly_prices` added (approved by the user) |
| 2026-10-23 | BE | Search and public hotel / room type pages built (accent-insensitive destination, offers per room type) |
| 2026-10-23 | BE | Availability calendar and cancellation policy built; `onSale` in the availability update means the rooms left to sell, as in the list (decided with the user) |
| 2026-10-23 | BE | Pricing rules and price preview built; schema migration applied (backfill and CHECK constraints noted under "Schema changes") |
| 2026-10-23 | BE | Limits table completed: one guest per room at least, search filters, rooms on sale per day, rule name |
| 2026-10-23 | BE | API `Agreed`; shared schemas for pricing rules, availability, cancellation policy, search, listings and bookings |
| 2026-10-23 | BE | Decided: auto-approval only for refund requests made before the check-in time (P11), default cancellation policy (P14), suspended partners approve but do not reject refunds (P15), `listing` URLs kept (P13) |
| 2026-10-23 | BE | Draft API: search, listings, bookings, SePay payment, my trips, cancellation and refunds, pricing rules, availability, cancellation policy; decisions P1–P13, schema changes, limits |

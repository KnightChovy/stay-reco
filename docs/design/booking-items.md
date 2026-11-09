# Bookings with several room types

Status: **backend built** (2026-11-09); web and mobile still send and read the one-room-type fields kept for the transition (§4).

Today a booking holds rooms of **one** room type: `booking.room_type_id`, `num_rooms` (1–8) and `nightly_prices`. A guest who wants 2 Deluxe and 1 Suite at the same hotel has to make two bookings, scan two QR codes and cancel them one by one. This came up at Review 2 (multi-room and group bookings).

This document moves the room lines of a booking into a new table, `booking_item`. It is the standard reservation model (one reservation, several room lines). Payment, invoice and wallet stay as they are.

## 1. Decisions

| # | Decision |
|---|---|
| BI1 | A booking has 1–5 **items**, each a different room type of the **same hotel**. Bookings at several hotels stay separate bookings. |
| BI2 | At most 8 rooms per booking in total (the current `BOOKING_LIMITS.maxRooms`), at most 5 items. Same dates for every item. |
| BI3 | The booking is cancelled, refunded, checked in, marked no-show and checked out **as a whole**, like today. Cancelling one item (partial refund) is out of scope; it can be added later without another schema change. |
| BI4 | One invoice, one booking code, one SePay transfer per booking, as today. No money table, column or enum changes; `booking_item.subtotal` is a figure fixed at booking time like `nightly_prices`, not a ledger. |
| BI5 | Built after the stats export (PR #104) is merged and once web, mobile and AI owners have agreed to this document. During a transition the API accepts and returns the old single-room-type fields as well (§4), so develop keeps working while the clients switch. |

## 2. Schema

### New table `booking_item`

| Column | Type | Notes |
|---|---|---|
| `booking_item_id` | uuid PK | `gen_random_uuid()` |
| `booking_id` | uuid FK → `booking` | `ON DELETE CASCADE` |
| `room_type_id` | uuid FK → `room_type` | kept even after the nights are released, so the line never loses its type |
| `num_rooms` | int | ≥ 1 |
| `nightly_prices` | jsonb | `[{ date, price }]` per room, fixed at booking time (BR-09), moved from `booking` |
| `subtotal` | decimal(14,2) | `sum(nightly_prices) × num_rooms` |

Constraints and indexes: `UNIQUE (booking_id, room_type_id)` (one line per type), `INDEX (room_type_id)` for the per-room-type figures.

### `booking`

- **Add** `hotel_id` uuid FK → `hotel`, not null. Today every hotel-scoped read reaches the hotel through `booking.roomType.hotelId` (48 places); with several room types the hotel has to be on the booking. Indexes `(hotel_id, check_in_date)` and `(hotel_id, created_at)` replace `(room_type_id, check_in_date)` and `(room_type_id, created_at)`.
- **Move** `room_type_id`, `num_rooms`, `nightly_prices` to `booking_item`.
- Keep `total_amount` (= sum of the item subtotals, minus discounts once promotions exist), `num_guests` and every other column.

### Unchanged

`room_calendars` (one row per room and night, `booking_id`; the room gives the room type, so the item), `invoice` (1:1 with the booking), `wallet_transaction`, `review`, `ai_function_call`, `recommendation`.

### Migration (one Prisma migration)

1. Create `booking_item`; add `booking.hotel_id` nullable.
2. Backfill: `hotel_id` from the room type; one item per existing booking from `room_type_id`, `num_rooms`, `nightly_prices`, `subtotal = total_amount`.
3. Set `hotel_id` not null, create the new indexes, drop the three moved columns and the old indexes.

Staging data migrates with it; the seed creates items. `docs/db/stayreco_schema.sql` and the ERD are updated in the same change.

## 3. Limits and validation

Added to `BOOKING_LIMITS`: `maxItems: 5`. Checked on `POST /bookings`:

- 1–5 items, no room type twice;
- every room type sellable and of the same bookable hotel, otherwise `ROOM_TYPE_NOT_FOUND` (as today for one type);
- total rooms ≤ 8; guests ≥ total rooms (one guest per room) and ≤ `sum(rooms × max_occupancy)` over the items; guests ≤ 30;
- dates and nights as today (shared by all items).

## 4. API

### `POST /bookings`

```jsonc
{
  "items": [
    { "roomTypeId": "…", "rooms": 2 },
    { "roomTypeId": "…", "rooms": 1 }
  ],
  "checkIn": "2026-12-20", "checkOut": "2026-12-23", "guests": 5,
  "guestName": "…", "contactPhone": "…", "arrivalTime": "14:00", "specialRequests": "…",
  "expectedTotal": 9300000
}
```

- `expectedTotal` = sum over the items of `offer.total × rooms`, the totals the hotel page already shows per room type. A different backend total still answers `BOOKING_PRICE_CHANGED` with the new total.
- Not enough rooms for an item: `ROOM_SOLD_OUT` with `details: [{ field: "items.1.rooms", message: "…" }]`, so the client can say which room type ran out. Nothing is held then (all or nothing).
- **Transition:** the old body `{ roomTypeId, rooms, … }` is still accepted and read as one item, until web and mobile send `items`.

### `Booking` and `BookingSummary`

```jsonc
{
  "hotel": { "id": "…", "name": "…", "city": "…", "coverImageUrl": "…" },
  "items": [
    { "roomType": { "id": "…", "name": "Deluxe" }, "rooms": 2, "subtotal": 6000000,
      "nightlyPrices": [{ "date": "2026-12-20", "price": 1000000 }] }
  ],
  "rooms": 3,                     // total over the items
  "assignedRooms": [{ "id": "…", "roomNumber": "201", "roomTypeId": "…" }]
}
```

- **Transition:** `roomType` (the first item) and `nightlyPrices` (the first item's) stay as deprecated fields, so the current screens keep working; they are removed once web and mobile read `items`.
- `BookingVoucher`: `roomTypeName` becomes `items: [{ roomTypeName, rooms }]` (with the same transition).
- Hotel booking lists and the front desk lookup return the same `items`.

### Front desk

- `GET /bookings/:id/room-options` returns the held and free rooms **per item** (rooms of that room type only).
- Check-in takes the chosen rooms as today; the backend checks that each item gets exactly `rooms` rooms of its own type. Moving a guest to another room stays within the item's room type (no upgrades in this change).
- No-show and check-out stay per booking.

## 5. Behaviour of each flow

| Flow | Change |
|---|---|
| Create and hold | One price engine call for all the room types; the room type locks are taken **in id order** (two bookings with the same types cannot deadlock); holds expire per room type as today; `pickRooms` per item; one invoice; all or nothing. |
| Hold expiry | Per booking, unchanged. |
| SePay payment | Unchanged: one code, one amount; the hotel wallet from `booking.hotel_id`. |
| Cancellation and refund | Whole booking (BI3): every item's room type locked in id order, every night released. Fee and refund on the booking total, money rules unchanged. |
| Change requests | Unchanged: guest details only. |
| Check-in, no-show, check-out, late check-out fee | Per booking; rooms checked per item (§4). |
| Commission and settlement | On the booking total, unchanged; hotel from `booking.hotel_id`. |
| Hotel access, lists, action items | Through `booking.hotel_id` instead of the room type: simpler queries. |
| Dashboard and export | Per room type: sold nights and revenue from the items' `nightly_prices × num_rooms`; totals unchanged. Bookings sheet: "Loại phòng" lists `2× Deluxe, 1× Suite`, "Số phòng" the total. |
| Emails, voucher | List every item. |
| Reviews | Per booking and hotel, unchanged. |
| AI (owner: AI team) | `recommendation_id` and `ai_function_call.booking_id` unchanged. One option the AI proposes is still one booking, which can now hold several room types; the customer still confirms and pays. |
| Promotions and vouchers (owner: loyalty team) | Discount on the booking total (money-rules §2.1), unchanged. |

## 6. Work and owners

| Part | Owner | What |
|---|---|---|
| Schema, migration, seed | backend | §2 |
| Shared package | backend | `createBookingSchema.items`, response schemas, `BOOKING_LIMITS.maxItems` |
| Booking, front desk, payments, stats, export, mails | backend | §5; every e2e suite that creates bookings |
| API docs | backend | `customer.md`, `staff.md`, `partner.md`, `partner-dashboard.md`, `money-rules.md` §2.1 (total = sum of the items) |
| Web | web | room type picker with quantities on the hotel page, booking page, My trips, partner and staff booking detail, front desk room choice per item |
| Mobile | mobile | booking screen, staff booking detail |
| AI and loyalty | AI / loyalty | check §5 rows; nothing to change unless they read `booking.room_type_id` |
| Report | team | ERD (new `booking_item`), class and sequence diagrams of booking and check-in, SRS limits |

Estimate for the backend: 4–6 days with tests, then the deprecated fields are removed in a short follow-up once the clients have switched.

## 7. Out of scope

Cancelling or changing one item, different dates per item, several hotels in one booking, group bookings with a guest list per room, upgrades at the front desk.

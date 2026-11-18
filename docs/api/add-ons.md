# Hotel add-ons

Services a hotel sells on top of the room: airport pick-up, breakfast, spa, minibar… A booking can carry them in two ways:

| Line | Who adds it | When | Paid | In `totalAmount` | Commission | On cancellation |
|---|---|---|---|---|---|---|
| `PREPAID` | The customer, on `POST /bookings` | With the booking | In the SePay transfer (or the wallet) with the rooms | Yes | Yes, at the booking's rate | Refunded in full: the fee is on the rooms only |
| `FRONT_DESK` | Front desk staff | While the stay is paid and not checked out | At the desk, at check-out | No | No | Nothing was paid |

Promotions, vouchers and points come off the **rooms only**; add-ons are never discounted. A line copies the add-on's name and price, so editing the catalogue never changes a booking. `timing` (`BEFORE_STAY`, `DURING_STAY`, `AFTER_STAY`) is a label for the screens; it does not limit when an add-on can be booked.

## Endpoints

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/add-ons` | member | | `HotelAddOn[]`, active first, then by name |
| POST | `/hotels/:hotelId/add-ons` | owner | `createAddOnSchema` | `HotelAddOn` (201) |
| PATCH | `/add-ons/:id` | owner | `updateAddOnSchema` | `HotelAddOn` |
| GET | `/hotels/:hotelId/listing` | public | | `hotel.addOns`: the **active** add-ons |
| POST | `/bookings/discount-quote` | customer | `+ addOns?` | `+ addOnsTotal`; `expectedTotal` includes it |
| POST | `/bookings` | customer | `+ addOns?` (`addOnLinesSchema`) | `Booking` |
| POST | `/bookings/:id/add-ons` | owner, staff with `FRONT_DESK` | `addBookingAddOnSchema` | `Booking` |
| DELETE | `/bookings/:id/add-ons/:lineId` | owner, staff with `FRONT_DESK` | | `Booking` |

```jsonc
// createAddOnSchema
{ "name": "Đón sân bay",          // 1-200
  "description": "Xe 4 chỗ",      // optional, max 1000
  "price": 300000,                // one unit, dong
  "timing": "BEFORE_STAY",        // BEFORE_STAY | DURING_STAY | AFTER_STAY
  "prebookable": true }           // default true; false: only staff can add it, paid at the desk
// updateAddOnSchema: any of the above, description may be null, plus "isActive": false to take it off sale

// addOns on POST /bookings and the discount quote: each add-on once, at most 10
[ { "addOnId": "uuid", "quantity": 2 } ]   // quantity 1-20, default 1

// HotelAddOn
{ "id": "uuid", "name": "Đón sân bay", "description": null, "price": 300000, "timing": "BEFORE_STAY",
  "prebookable": true, "isActive": true, "createdAt": "…" }

// BookingAddOn, in Booking.addOns (oldest first)
{ "id": "uuid", "addOnId": "uuid", "name": "Đón sân bay", "timing": "BEFORE_STAY",
  "unitPrice": 300000, "quantity": 1, "amount": 300000, "payment": "PREPAID", "createdAt": "…" }
```

## Rules

- A customer can only book an add-on that belongs to the hotel, is active and is `prebookable`; anything else answers `ADD_ON_NOT_FOUND` (404) on `addOns.<i>.addOnId`, and nothing is held.
- `expectedTotal` = rooms − discount − points + add-ons. Send what the discount quote returns, with the same `addOns`.
- `Booking.invoice`: `subtotal` is rooms + prepaid add-ons, `addOnsTotal` the prepaid part, `total` what was charged, `frontDeskDue` what the desk collects.
- Front desk: any active add-on (prebookable or not), on a booking that is `CONFIRMED` and `PAID`, or `CHECKED_IN`; otherwise `BOOKING_STATUS_CONFLICT`. Only `FRONT_DESK` lines can be removed; another line id answers `ADD_ON_NOT_FOUND`. The timeline shows `ADD_ON_ADDED` / `ADD_ON_REMOVED`.
- Check-out quote: `addOnsDue` is what to collect at the desk, besides `lateFee`.
- Cancellation: fee = fee percent × (paid − prepaid add-ons); the add-ons come back whole ([money-rules §7.1](../money-rules.md#71-formula)).

## FE tasks

- **Partner**: an add-ons page under the hotel: list, create, edit, take off sale.
- **Booking form**: show `hotel.addOns` where `prebookable`, with a quantity; send `addOns` to the quote and to `POST /bookings`.
- **Booking page** (customer and staff): `addOns` and the `invoice` lines.
- **Front desk**: add or remove a service on a paid or checked-in booking; show `addOnsDue` on the check-out screen.

# API: Customer (`CUSTOMER`)

> FE screens: home page, `search`, `hotels/[id]`, `hotels/[id]/rooms/[roomId]`, `booking/*`, `account/bookings/*`.
> **Status: Agreed** (phase 2, being built). Business rules behind these endpoints (prices, holds, payment, cancellation, refunds): [money-rules.md](../money-rules.md) and [phases/phase-2-search-booking.md](../phases/phase-2-search-booking.md).

## Available now

- Sign-up, email verification (OTP), sign-in, forgot / change password, sessions: [auth.md](./auth.md).
- Public catalog `GET /amenities`, `GET /bed-types`: [partner.md](./partner.md#catalog-public-no-token) (for the search filters).
- Search `GET /hotels` and the hotel / room type pages `GET /hotels/:hotelId/listing`, `GET /room-types/:id/listing` (below).

## Main flow: from search to voucher

1. `GET /hotels?destination=&checkIn=&checkOut=&guests=&rooms=` → result cards with the total price of the stay.
2. `GET /hotels/:hotelId/listing?checkIn=&checkOut=&guests=&rooms=` → hotel page with the room types still available and their prices.
3. `GET /room-types/:id/listing?…` → room type page (optional).
4. Customer signs in if needed, fills the booking form, then `POST /bookings` → the rooms are **held for 15 minutes** and the booking is `PENDING` with its payment details.
5. Payment page shows the VietQR code from `payment`; the customer transfers with a banking app. Poll `GET /bookings/:id` every 3–5 s until `status` leaves `PENDING`.
6. `CONFIRMED` → voucher page `GET /bookings/:id/voucher`. `EXPIRED` → show "hold expired" and offer to search again.

Stay parameters used by several endpoints (`stayQuerySchema`):

| Param | Rule |
|---|---|
| `checkIn`, `checkOut` | `YYYY-MM-DD`. `checkIn` from today (Asia/Ho_Chi_Minh) up to 365 days ahead; `checkOut` after `checkIn`; 1 to 30 nights |
| `guests` | 1 to 30, at least one per room, and at most `rooms` × the room type's `maxOccupancy` |
| `rooms` | 1 to 8, default 1. One booking holds several rooms of **one** room type |

## Search and hotel pages (public, no token)

| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/hotels` | stay params + `destination`, `priceMin`, `priceMax`, `starRating` (repeatable), `amenityIds` (repeatable), `freeCancellation`, `sort`, `page`, `pageSize` (`hotelSearchQuerySchema`) | `HotelSearchResult[]` + `meta` |
| GET | `/hotels/:hotelId/listing` | stay params, all optional | `HotelListing` |
| GET | `/room-types/:id/listing` | stay params, all optional | `RoomTypeListing` |

- **Only bookable hotels appear**: `ACTIVE` hotels of partners that are not suspended (BR-01). Any other hotel returns `404 HOTEL_NOT_FOUND`, even if it exists.
- **Search** lists only hotels with at least one room type that fits the guests and has enough rooms free on **every night** (BR-02). `destination` (at most 100 characters) matches the city, hotel name or address, ignoring case and Vietnamese accents ("da nang" finds "Đà Nẵng"). `priceMin` / `priceMax` filter on the total of the stay; `amenityIds` takes at most 20 ids. `freeCancellation=true` keeps hotels whose policy has a free-cancellation period. `sort` is one of `HOTEL_SORTS`: `recommended` (default: star rating, then price), `price-asc`, `price-desc`, `star-desc`. Guest ratings arrive with reviews (phase 4); until then `rating` is `null`.
- **Listing without dates** returns the hotel and its room types without prices (`offer: null`). With dates, each room type carries an `offer`: rooms still available, the price of each night and the total for the requested rooms, and the cancellation terms the booking would get. A room type that is full or too small for the guests comes back with `offer.available: 0` or `fitsGuests: false` (show "sold out"), not left out.
- Prices are final prices (VAT and service fee included, BR-05), computed by the backend from the partner's pricing rules.
- `checkIn` in the past or more than 365 days ahead (Vietnam time) answers `400 VALIDATION_ERROR` on `checkIn`.
- `amenityIds` keeps hotels that have **all** the given hotel amenities. `freeCancellation=false` (or omitted) does not filter. Until reviews exist, `recommended` orders like `star-desc` (stars, then the cheapest).
- `freeCancellationUntil` is `null` when the policy has no free period **or** the deadline has already passed for this stay (e.g. check-in tomorrow with 3 free days): the booking would get no free cancellation. `freeCancellation` in search results follows the same rule for the cheapest offer.
- Room types without a base price are not sold and do not appear.

## Bookings

| Method | Path | Access | Body / Query | Response |
|---|---|---|---|---|
| POST | `/bookings` | CUSTOMER | `createBookingSchema` | `Booking` (201), `PENDING`, with `payment` |
| GET | `/bookings/:id` | the customer who booked; the hotel owner; staff with `BOOKING` or `REFUND` | | `Booking` |
| GET | `/me/bookings` | CUSTOMER | `?tab=&search=&page=&pageSize=` (`myBookingsQuerySchema`) | `BookingSummary[]` + `meta` |
| GET | `/bookings/:id/cancellation-quote` | the customer who booked | | `CancellationQuote` |
| POST | `/bookings/:id/cancel` | the customer who booked | `{ reason }` (`cancelBookingSchema`) | `Booking` |
| GET | `/bookings/:id/voucher` | the customer who booked | | `BookingVoucher` |

**Create a booking** (`createBookingSchema`):

```jsonc
{
  "roomTypeId": "uuid",
  "checkIn": "2026-11-20", "checkOut": "2026-11-22", "guests": 2, "rooms": 1,
  "guestName": "Nguyễn Văn A",          // required, max 100; prefilled with the account name
  "contactPhone": "0905123456",          // required, same rule as hotel phones (max 20)
  "arrivalTime": "14:00",                // optional "HH:mm", start of the 1-hour arrival window
  "specialRequests": "Phòng tầng cao",   // optional, max 500
  "expectedTotal": 3600000               // the total the customer saw
}
```

- The backend checks availability again and prices the stay again (UC19). Not enough rooms → `409 ROOM_SOLD_OUT` (MSG12). A total different from `expectedTotal` → `409 BOOKING_PRICE_CHANGED` with the new total in `details` (MSG13); show it and send the request again with the new `expectedTotal` once the customer agrees.
- On success the rooms are held for **15 minutes** (BR-03), the booking is `PENDING`, its invoice is `UNPAID`, and the booking code (`SR-YYMMDD-XXXX`) is the transfer content. The price, the cancellation terms and the commission rate are fixed on the booking from now on (BR-07, BR-09).
- Two customers booking the last room at the same time: one gets the hold, the other `ROOM_SOLD_OUT`.
- A hold not paid in time: the booking becomes `EXPIRED`, its invoice `FAILED`, and the rooms are released (a job runs every minute).

**Payment (SePay).** While the booking is `PENDING`, `Booking.payment` holds what the payment page shows:

```jsonc
"payment": {
  "method": "SEPAY",
  "bankName": "MB Bank", "accountNumber": "…", "accountName": "STAYRECO",
  "amount": 3600000,
  "transferContent": "SR-261022-0842",   // must be copied exactly
  "qrImageUrl": "https://…",              // VietQR image with amount and content filled in
  "expiresAt": "2026-10-22T10:15:00.000Z"
}
```

The booking becomes `CONFIRMED` only when SePay reports a transfer with this content and **exactly** this amount (BR-04); there is no "I have paid" button. The confirmation email and the voucher follow. A transfer that matches no booking, or arrives after the hold expired, is logged for manual handling and refunded (see the rules document).

**My trips** (`GET /me/bookings`). `tab` is one of `upcoming` (default: `PENDING` and `CONFIRMED` not checked in yet), `staying` (`CHECKED_IN`), `completed`, `cancelled` (`CANCELLED` and `EXPIRED`). `search` matches the booking code. Newest first.

**Cancel** (UC28, slide "08. Cancellation And Refund"):

1. `GET /bookings/:id/cancellation-quote` shows the free-cancellation deadline, the fee and the refund before the customer confirms (MSG11).
2. `POST /bookings/:id/cancel { reason }` (reason required, max 500):
   - refund 0 (past the deadline with a 100% fee) → the booking is `CANCELLED` at once and the rooms are released;
   - refund > 0 → a refund request: the invoice becomes `REFUND_PENDING`, the booking **stays** `CONFIRMED` and keeps its rooms until the hotel decides ([partner.md](./partner.md#refund-requests-phase-2)). Approved → `CANCELLED`, refund credited to the customer's wallet. Rejected → the booking stays, with the reason. A request made before the check-in time and still undecided at that time is approved automatically; one made after the check-in time waits for the hotel.
3. Only a `CONFIRMED` booking without a pending refund can be cancelled. A `CHECKED_IN` booking returns `409 CANCELLATION_NOT_ALLOWED` (BR-09); any other status, or a refund already pending, returns `409 BOOKING_STATUS_CONFLICT`.

Changing dates, room type or guests is not offered: cancel and book again (BR-09). Changing the guest name, phone, arrival time or special requests comes in phase 3 (UC25).

**Voucher** (UC23): booking code, hotel, room type, dates, guests, amount paid, and `qrToken`, a token signed by the server (not the bare booking code) that the FE renders as a QR code. Only for `CONFIRMED` / `CHECKED_IN` bookings; a cancelled booking returns `409 BOOKING_STATUS_CONFLICT` (show "no longer valid").

## Types

```jsonc
// HotelSearchResult
{ "id": "uuid", "name": "Sơn Trà Bay Resort & Spa", "city": "Đà Nẵng", "address": "…",
  "starRating": 5, "coverImageUrl": "https://…", "latitude": 16.1, "longitude": 108.27,
  "rating": null,                         // phase 4
  "nights": 2, "fromTotal": 5600000,      // cheapest total for the stay and the requested rooms
  "freeCancellation": true }

// HotelListing
{ "hotel": { "id": "uuid", "name": "…", "description": "…", "address": "…", "city": "…", "country": "Vietnam",
             "latitude": 16.1, "longitude": 108.27, "starRating": 5, "phone": "…", "website": null,
             "checkInTime": "14:00", "checkOutTime": "12:00",
             "amenities": [ … ], "images": [ … ], "policies": { "cancellation": "…" },
             "cancellationPolicy": { "freeCancellationDays": 3, "feePercent": 50 } },
  "roomTypes": [ RoomTypeListing ] }

// RoomTypeListing
{ "roomType": { "id": "uuid", "name": "Deluxe River View", "description": "…", "maxOccupancy": 2,
                "areaSqm": 32, "beds": [ … ], "amenities": [ … ], "images": [ … ] },
  "offer": {                               // null without dates
    "available": 3,                        // rooms of this type free on every night
    "fitsGuests": true,
    "nightlyPrices": [ { "date": "2026-11-20", "price": 1800000 }, { "date": "2026-11-21", "price": 1800000 } ],
    "perRoomTotal": 3600000, "total": 3600000,   // total = perRoomTotal × rooms
    "freeCancellationUntil": "2026-11-17T07:00:00.000Z",   // null = no free cancellation
    "cancellationFeePercent": 50 } }

// BookingSummary
{ "id": "uuid", "code": "SR-261022-0842", "status": "CONFIRMED", "paymentStatus": "PAID",
  "hotel": { "id": "uuid", "name": "…", "city": "…", "coverImageUrl": "https://…" },
  "roomType": { "id": "uuid", "name": "…" },
  "checkIn": "2026-11-20", "checkOut": "2026-11-22", "nights": 2, "rooms": 1, "guests": 2,
  "totalAmount": 3600000, "createdAt": "…" }

// Booking = BookingSummary +
{ "guestName": "…", "contactPhone": "…", "arrivalTime": "14:00", "specialRequests": null,
  "nightlyPrices": [ { "date": "2026-11-20", "price": 1800000 } ],   // prices fixed at booking time
  "cancellation": { "freeUntil": "…", "feePercent": 50 },
  "holdExpiresAt": null,                  // set while PENDING
  "paidAt": "…",
  "payment": null,                        // set while PENDING, see above
  "refund": null,                         // { "status": "REFUND_PENDING" | "REFUNDED" | …, "amount": 1800000 }
  "cancelReason": null, "cancelledAt": null,
  "timeline": [ { "at": "…", "event": "CREATED" }, { "at": "…", "event": "PAID" } ] }

// CancellationQuote
{ "freeUntil": "…", "feePercent": 50, "paid": 3600000, "fee": 1800000, "refund": 1800000,
  "needsApproval": true }                 // false when refund = 0 (cancelled at once)

// BookingVoucher
{ "code": "SR-261022-0842", "hotelName": "…", "roomTypeName": "…", "checkIn": "…", "checkOut": "…",
  "rooms": 1, "guests": 2, "guestName": "…", "amountPaid": 3600000, "qrToken": "…" }
```

`status`: `PENDING` (held, waiting for payment) · `CONFIRMED` · `CHECKED_IN` · `COMPLETED` · `CANCELLED` · `EXPIRED` · `NO_SHOW`. `paymentStatus` (the invoice): `UNPAID` · `PAID` · `REFUND_PENDING` · `PARTIALLY_REFUNDED` · `REFUNDED` · `FAILED`.

## Common error codes

`HOTEL_NOT_FOUND`, `ROOM_TYPE_NOT_FOUND`, `ROOM_SOLD_OUT`, `BOOKING_PRICE_CHANGED`, `BOOKING_NOT_FOUND`, `BOOKING_STATUS_CONFLICT`, `CANCELLATION_NOT_ALLOWED`, `VALIDATION_ERROR` (dates, guests, rooms). Meanings: [api-guide.md §4.3](../api-guide.md#43-error-codes).

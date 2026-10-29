# API: Hotel staff (`HOTEL_STAFF`)

> FE screens: `staff/*`. A staff member belongs to **exactly one hotel**, invited by the partner ([auth.md](./auth.md): invitations and the `/accept-invitation` page) and managed by the partner ([partner.md](./partner.md#staff)).

## What staff can use today

These endpoints are described in full in [partner.md](./partner.md); staff can call them because they are *members* of the hotel.

| Method | Path | Notes |
|---|---|---|
| GET | `/me/hotels` | Returns the staff member's hotel, `myRole: "STAFF"` |
| GET | `/hotels/:hotelId` | Hotel details |
| GET | `/hotels/:hotelId/room-types`, `/room-types/:id` | Room types |
| GET | `/hotels/:hotelId/rooms` | Room list (filter, search, pagination) |
| GET | `/amenities`, `/bed-types` | Public catalog |

Staff **cannot** edit the hotel, rooms, room types or staff, and cannot read verification requests: those return `403 FORBIDDEN`. Resources of another hotel return the 404 of that resource (`HOTEL_NOT_FOUND`, `ROOM_TYPE_NOT_FOUND`…).

## Bookings and refunds (phase 2)

Described in [partner.md](./partner.md); staff access depends on their permission groups.

| Method | Path | Staff access |
|---|---|---|
| GET | `/hotels/:hotelId/pricing-rules`, `/room-types/:id/price-preview` | any staff member (read-only) |
| GET | `/hotels/:hotelId/availability` | any staff member (read-only) |
| GET | `/hotels/:hotelId/bookings`, `/bookings/:id` | `BOOKING`, `REFUND` or `FRONT_DESK` |
| POST | `/bookings/:id/forward-refund` | `REFUND`: check a refund request against the policy and forward it to the partner with a note |

The partner approves or rejects refunds (slide "08. Cancellation And Refund"). New bookings are confirmed automatically when they are paid: staff do not confirm or reject them (phase 3, decision O1).

## Front desk (phase 3)

*(Draft)* Decisions O2–O9 in [phase-3-operations.md](../phases/phase-3-operations.md). The owner can do everything below too (not while suspended).

| Method | Path | Access | Body / query | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/bookings/lookup` | `FRONT_DESK` or `BOOKING` | `?code=SR-…` or `?qrToken=…` (`bookingLookupQuerySchema`) | `Booking` |
| GET | `/bookings/:id/room-options` | `FRONT_DESK` | | `RoomOptions` |
| POST | `/bookings/:id/check-in` | `FRONT_DESK` | `{ roomIds? }` (`checkInSchema`) | `Booking` |
| POST | `/bookings/:id/check-out` | `FRONT_DESK` | | `Booking` |
| POST | `/bookings/:id/no-show` | `FRONT_DESK` | | `Booking` |
| POST | `/rooms/:id/clean` | `FRONT_DESK` | | `Room` |

- **Lookup** (UC37): the code typed at the desk (dashes optional) or the token read from the voucher QR. The QR token is checked against the server signature; a bad token returns `400 VOUCHER_INVALID` (MSG20). A booking of another hotel returns `404 BOOKING_NOT_FOUND`. Any status is returned; the screen decides what it allows.
- **Room options** (UC38): only a `CONFIRMED` booking. `held` = the rooms the booking holds on the remaining nights, with their status; `available` = other rooms of the same room type that are `AVAILABLE` and free on every remaining night (from today, or from the check-in date if it is ahead, to the night before check-out).
- **Check-in** (UC36): only a `CONFIRMED` booking whose invoice is `PAID`, from the check-in date until the day before the check-out date (otherwise `409 CHECK_IN_NOT_OPEN`). A waiting refund request returns `409 REFUND_DECISION_PENDING`: the owner decides it first. `roomIds` (exactly `rooms` ids, all different; another count returns `400 VALIDATION_ERROR`) picks the rooms; without it the held rooms are used, unless they change during the stay (the booking then needs `roomIds`, `409 ROOM_NOT_ASSIGNABLE`). Nights already past stay where they were (late check-in). Every chosen room must be of the booked room type, `AVAILABLE` and free on the remaining nights, otherwise `409 ROOM_NOT_ASSIGNABLE` (BR-10). The booking becomes `CHECKED_IN`, its remaining nights move to the chosen rooms, the rooms become `OCCUPIED`, and `Booking.assignedRooms` lists them.
- **Check-out** (UC39): only `CHECKED_IN`. The booking becomes `COMPLETED` and its rooms `CLEANING`. Leaving before the check-out date releases the nights from today on, without refund (O9). The commission is recorded now and the hotel's money becomes available after the holding period ([money-rules.md](../money-rules.md)).
- **No-show**: only `CONFIRMED`, from the day after the check-in date (otherwise `409 NO_SHOW_NOT_ALLOWED`), not while a refund request is waiting (`409 REFUND_DECISION_PENDING`). The booking becomes `NO_SHOW`, the nights from today on are released, the hotel keeps the money and the commission is recorded. A job does the same for bookings still `CONFIRMED` at the hotel's check-out time on the check-out date.
- **Room cleaned**: `CLEANING` → `AVAILABLE`; another status returns `409 ROOM_STATUS_CONFLICT`.
- Wrong status for an action: `409 BOOKING_STATUS_CONFLICT`. Staff without the group: `403 FORBIDDEN`.

## Change requests (phase 3)

*(Draft)* UC43, decision O11. The customer side is in [customer.md](./customer.md#change-requests-phase-3).

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| POST | `/bookings/:id/accept-change` | `BOOKING`, owner | | `Booking` |
| POST | `/bookings/:id/reject-change` | `BOOKING`, owner | `{ reason }` (`rejectChangeSchema`) | `Booking` |

- Accept applies the requested values to the booking; reject keeps it as it was and sends `reason` to the customer. Both email and notify the customer.
- No waiting request: `409 CHANGE_REQUEST_STATUS_CONFLICT`. Waiting requests are counted by the dashboard action item `CHANGE_REQUESTS_PENDING` and filtered with `GET /hotels/:hotelId/bookings?changeRequest=PENDING`.

## Permission groups

The partner gives each staff member some of the 5 groups (`StaffPermission`): `BOOKING`, `FRONT_DESK`, `CUSTOMER_CARE`, `REFUND`, `MARKETING`. They unlock the operational features: `BOOKING` the bookings list and change requests, `FRONT_DESK` check-in, check-out, no-show and cleaned rooms, `REFUND` refund requests; `CUSTOMER_CARE` (inbox) and `MARKETING` come with the AI assistant. A change applies from the next request.

## Account

- **Deactivated** by the partner: signed out at once, sign-in returns `403 AUTH_ACCOUNT_DEACTIVATED`. Once the partner activates the account again, signing in works as usual.
- Changing the password and managing sessions: [auth.md](./auth.md).

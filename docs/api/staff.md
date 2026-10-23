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

## Coming in phase 2

Described in [partner.md](./partner.md); staff access depends on their permission groups.

| Method | Path | Staff access |
|---|---|---|
| GET | `/hotels/:hotelId/pricing-rules`, `/room-types/:id/price-preview` | any staff member (read-only) |
| GET | `/hotels/:hotelId/availability` | any staff member (read-only) |
| GET | `/hotels/:hotelId/bookings`, `/bookings/:id` | `BOOKING` or `REFUND` |
| POST | `/bookings/:id/forward-refund` | `REFUND`: check a refund request against the policy and forward it to the partner with a note |

The partner approves or rejects refunds (slide "08. Cancellation And Refund"). Processing bookings (confirm, check-in, check-out) comes in phase 3.

## Permission groups

The partner gives each staff member some of the 5 groups (`StaffPermission`): `BOOKING`, `FRONT_DESK`, `CUSTOMER_CARE`, `REFUND`, `MARKETING`. They unlock the operational features of later phases (bookings, check-in/out, refunds, inbox, marketing); those endpoints will state which group they need. A change applies from the next request.

## Account

- **Deactivated** by the partner: signed out at once, sign-in returns `403 AUTH_ACCOUNT_DEACTIVATED`. Once the partner activates the account again, signing in works as usual.
- Changing the password and managing sessions: [auth.md](./auth.md).

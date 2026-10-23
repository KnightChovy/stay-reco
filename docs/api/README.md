# API reference by user role

Each endpoint is described **once**, on the page of the role that uses it most; other pages link to it. Rules for every API (envelope, error codes, pagination, tokens) are in [../api-guide.md](../api-guide.md); business decisions and change history are in [../phases/](../phases/).

| Page | Used by | Content |
|---|---|---|
| [auth.md](./auth.md) | Every role | Sign-up, sign-in, OTP, refresh, sessions, passwords, invitations |
| [partner.md](./partner.md) | Partner (`HOTEL_PARTNER`) | Catalog, hotels, images, room types, rooms, staff, verification requests |
| [staff.md](./staff.md) | Hotel staff (`HOTEL_STAFF`) | What staff can read; the 5 permission groups |
| [manager.md](./manager.md) | Platform manager (`PLATFORM_MANAGER`) | Verification queue, decisions, re-verification |
| [customer.md](./customer.md) | Customer (`CUSTOMER`) | Search, booking (in progress) |

How to read each endpoint table:

- The **Response** column is the content of `data` in the envelope `{ success, message, data, meta? }`.
- **Access**: *owner* = the partner who owns the hotel; *member* = the owner or a staff member assigned to that hotel. Outsiders get the 404 of the resource itself (they cannot tell whether it exists); staff without the right get 403.
- Names in parentheses (for example `createHotelSchema`, `Hotel`) are zod schemas and TypeScript types from `@stayreco/shared`: use them instead of redefining them.

Adding an endpoint: write it on the matching role page (in the same PR as the code), add new error codes to [api-guide.md §4.3](../api-guide.md#43-error-codes), and add a row to the phase *Changelog*.

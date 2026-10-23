# Phase 1: Partners list their hotels

| | |
|---|---|
| Phase status | 🟡 BE done, FE integrating |
| API status | `BE Done`: every endpoint is merged into `develop`, FE can integrate |
| Agreed on | 2026-10-18 |
| BE owners | Khiêm, Phúc |
| FE owners | |
| API | [api/partner.md](../api/partner.md), [api/staff.md](../api/staff.md), [api/manager.md](../api/manager.md) |

## Goal

Partners create a hotel, set up room types and rooms, and submit a verification request; platform managers verify it. At the end of the phase there are ACTIVE hotels for phase 2 to search and book.

## Scope

**Backend**

- Hotels: create, edit details, images, amenities, policies, room config
- Room types, rooms
- Hotel staff (using the invitations from phase 0)
- Verification requests and the review queue
- `HotelAccessGuard` checks access per hotel

**Frontend web / mobile** (pages already have UI in `frontend/src/app`)

- `partner/hotel`, `partner/rooms`, `partner/staff`, `partner/verification`
- `manager/verifications`, `manager/partners`

## Out of scope

- Daily prices and availability (`partner/availability`, `partner/pricing`) → phase 2

## Agreed decisions

| # | Decision |
|---|---|
| D1 | Add the `hotel_image` and `room_type_image` tables (hotel images, room type images). `room_image` (images of a physical room) stays as is. |
| D2 | `hotel_staff.permissions`: an array of permission groups per SRS UC62: `BOOKING`, `FRONT_DESK`, `CUSTOMER_CARE`, `REFUND`, `MARKETING`. There is no "Accounting" group. |
| D3 | **A room type's base price** = a `price` row whose `valid_from`, `valid_to` and `day_of_week` are all empty. Seasonal price rules (phase 2) are other `price` rows; the nightly price is the most specific row. |
| D4 | **`hotel_room_config`** = the partner's room setup for a hotel: `total_rooms` is the number of physical rooms the partner declares, `base_price` is the default base price suggested for new room types. No more physical rooms than `total_rooms` can be created (raise it in the config to add more). One config per hotel (`hotel_id` unique in the DB). |
| D5 | Files are stored on **Cloudinary**; the BE receives the file and uploads it. Verification documents are private, **readable only by the hotel owner and platform managers** (the BE issues a link valid for 5 minutes, returned as JSON because a new browser tab cannot send the Bearer token). |
| D6 | Verification is **per hotel**. The first approval sets `hotel_partner.status` to `APPROVED`. |
| D7 | A partner can have several hotels. The BE supports it fully; the FE decides how to show it. |
| D8 | Hotel policies, legal entity details, property details and beneficiary details are stored as key-value rows in `hotel_properties`. Fields submitted with a request are tied to it (`verification_request_id`), so each submission is its own record. |
| D9 | Partners editing an `ACTIVE` hotel **do not need re-approval**. Platform managers can **ask for re-verification with a reason** (for example an expired license). Suspending a hotel comes with the violations feature (later phase); suspending a partner **account** follows BR-15 (the manager proposes, the admin decides). |
| D10 | Required documents: business license (`BUSINESS_LICENSE`), fire safety certificate (`FIRE_SAFETY`), security certificate (`SECURITY_CERTIFICATE`). The rating certificate (`OTHER`) is optional. PDF/JPG/PNG, at most 10 MB per file. |
| D11 | Rooms can only be booked and assigned while `AVAILABLE`. `MAINTENANCE`, `CLEANING`, `OCCUPIED` = not ready. "Lock room" = `MAINTENANCE`, "Unlock" = `AVAILABLE`. |
| D12 | **Beneficiary details** (bank, account number, account holder) are collected in the Legal entity step of the request. The account number is **encrypted at rest with AES-256-GCM** (key `BENEFICIARY_ENCRYPTION_KEY`); only the hotel owner and platform managers see it in full on the detail page; the request history shows only the last 4 digits; the manager queue has no beneficiary data. The representative's ID card number is also shown with only the last 4 digits in the history (personal data, Decree 13/2023). |
| D13 | The verification wizard has **4 steps**, as on the FE: Legal entity, Property, Documents, Confirmation (Report 3 screen 39 updated to match). |

## States

```
hotel_status:          (create) → DRAFT ──submit request──► PENDING_VERIFICATION ──approve──► ACTIVE
                                    ▲                              │
                                    └──── reject / request changes ┘
verification_status:   PENDING → APPROVED | REJECTED | NEEDS_REVISION   (resubmitting = a new request)
Re-verification (D9):  the manager creates a RENEWAL request in NEEDS_REVISION with a reason; the hotel stays ACTIVE; the partner submits a new RENEWAL request
room_status (D11):     AVAILABLE ⇄ MAINTENANCE (partner locks / unlocks); OCCUPIED, CLEANING set by the front desk (phase 3)
partner_status:        PENDING ──first hotel approved──► APPROVED; SUSPENDED = read-only
Staff account:         INVITED ──accepts the invitation──► ACTIVE ⇄ DEACTIVATED (partner deactivates / activates); INVITED ──invitation cancelled──► (deleted)
```

Hotels are visible to customers only while `ACTIVE` (BR-01). While a request is `PENDING`, no other request can be submitted.

## FE tasks

Demo accounts: [getting-started.md](../getting-started.md#demo-accounts).

- Add the **partner sign-up page** (the `registerPartner()` service exists) and the same OTP flow as customers.
- `partner/hotel`: form per screen 42 (General, Images, Policies tabs) and the room config.
- `partner/rooms`: two tabs, Room types / Physical rooms (screens 43–45), lock / unlock buttons.
- `partner/staff`: list (including pending invitations), invite, cancel invitation, deactivate / activate, assign the 5 permission groups (drop "Accounting").
- The **`/accept-invitation`** page (link in the invitation email): set the password with `POST /auth/invitations/accept`.
- `partner/verification`: keep the 4-step wizard; add the 3 beneficiary fields; **separate upload slots for the security and fire safety certificates**; upload files through `/uploads/verification-documents`.
- Take the hotel name and status in the shell from `GET /me/hotels` instead of hard-coding them.
- `manager/verifications`: the queue and the review screen; compute the SLA from `submittedAt`; view documents with `GET /verification-documents/:id/file` ([api/manager.md](../api/manager.md)).
- Sign-in: show the right message for `AUTH_ACCOUNT_DEACTIVATED` (deactivated staff).

## Open questions

- [x] Scope of "real money" for payments and partner payouts: **SePay agreed** (2026-10-18). Customers pay by real bank transfer through VietQR, SePay notifies us by webhook. Detailed design in phase 2.

## Definition of Done

- [x] E2e tests prove partner A cannot read or edit partner B's hotels
- [x] Seed data with at least 3 ACTIVE hotels for phase 2
- [ ] The phase's [api/](../api/README.md) pages match the code, API status `Integrated`

## Changelog

| Date | Who | Change |
|---|---|---|
| 2026-10-14 | | Created the draft |
| 2026-10-18 | BE | Agreed per the SRS, the schema and the existing FE: decisions D1–D13, endpoints, data types, error codes, FE tasks |
| 2026-10-19 | BE | Hotels, catalog, images (Cloudinary), room types, rooms (PR #25, #28, #29); one room config per hotel; suspended partners are read-only |
| 2026-10-20 | BE | Staff: permissions, deactivation (`DEACTIVATED`), invitation cancel (PR #30, #31); verification requests, account number encryption, result emails (PR #32); ID card numbers masked in lists; demo data; API status `BE Done` |
| 2026-10-21 | BE | Docs moved to `docs/` at the repo root; endpoints split by role ([partner](../api/partner.md), [staff](../api/staff.md), [manager](../api/manager.md)); content unchanged |
| 2026-10-21 | BE | Docs translated to English |

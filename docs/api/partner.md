# API: Hotel partner (`HOTEL_PARTNER`)

> FE screens: `partner/*`. Business decisions (D1–D13) and history: [phases/phase-1-hotel-onboarding.md](../phases/phase-1-hotel-onboarding.md). Rules for every API: [api-guide.md](../api-guide.md).
> Every hotel-scoped route checks access per hotel (`HotelAccessGuard`): *owner* = the owning partner, *member* = the owner or an assigned staff member. A partner can have **several hotels**.
> **Suspended partners** (`partner_status = SUSPENDED`) can still read their hotels, but every create or update returns `403 PARTNER_SUSPENDED`.

## Main flow: listing a hotel

1. `GET /me/hotels` to show the hotel list; if empty, offer to create one.
2. `POST /hotels` → the hotel is `DRAFT`.
3. `GET /amenities`, `GET /bed-types` to build the pickers; `PUT /hotels/:id/amenities`, `PUT /hotels/:id/policies`.
4. `POST /hotels/:id/images` (the first image becomes the cover; change it with `PATCH /hotel-images/:id { isCover: true }`).
5. `PUT /hotels/:id/room-config` (**required before creating rooms**).
6. `POST /hotels/:id/room-types`, room type images with `POST /room-types/:id/images`, then `POST /hotels/:id/rooms` for each room.
7. Verification wizard: for **each** document call `POST /uploads/verification-documents` → get a `fileId`; step 4 sends `POST /hotels/:id/verification-requests` with those `fileId`s → the hotel is `PENDING_VERIFICATION`.
8. Follow the result: `GET /hotels/:id/verification-requests` (history, reasons). When rejected or asked for changes the hotel goes back to `DRAFT`: edit it and submit again (a new request). Every result is also emailed.

**File uploads**: `multipart/form-data`, the file field is named `file`; text fields sent with it are strings (`isCover: "true"`).

```ts
const form = new FormData();
form.append('file', file);            // File from <input type="file">
form.append('isCover', 'true');
const { data } = await api.post(`/hotels/${hotelId}/images`, form);
```

## Catalog (public, no token)

| Method | Path | Response |
|---|---|---|
| GET | `/amenities` | `Amenity[]`: name and group (`category`) in Vietnamese, `icon` is a `lucide-react` icon name (for example `wifi`, `waves`) |
| GET | `/bed-types` | `BedType[]` |

## Hotels

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| GET | `/me/hotels` | partner (owned hotels), staff (assigned hotel) | | `HotelSummary[]` (`myRole`: `OWNER` / `STAFF`) |
| POST | `/hotels` | HOTEL_PARTNER | `createHotelSchema` | `Hotel` (201), `DRAFT` |
| GET | `/hotels/:hotelId` | member | | `Hotel` |
| PATCH | `/hotels/:hotelId` | owner | `updateHotelSchema` | `Hotel` |
| PUT | `/hotels/:hotelId/amenities` | owner | `{ amenityIds: string[] }` (`hotelAmenitiesSchema`) | `Hotel` |
| PUT | `/hotels/:hotelId/policies` | owner | `{ policies: Record<string, string> }` (`hotelPoliciesSchema`) | `Hotel` |
| PUT | `/hotels/:hotelId/room-config` | owner | `{ totalRooms, basePrice }` (`roomConfigSchema`) | `Hotel` |
| POST | `/hotels/:hotelId/images` | owner | multipart `file`, `caption?`, `isCover?` (`uploadHotelImageSchema`) | `HotelImage` (201) |
| PATCH | `/hotel-images/:id` | owner | `{ caption?, isCover?: true, sortOrder? }` (`updateHotelImageSchema`) | `HotelImage` |
| DELETE | `/hotel-images/:id` | owner | | 204 |

- `PATCH /hotels/:hotelId`: only the fields sent change; send `null` to clear an optional field (`description`, `latitude`, `longitude`, `starRating`, `phone`, `website`, `checkInTime`, `checkOutTime`). Phone numbers are at most 20 characters; websites must be `http(s)`; `latitude` and `longitude` go together. Check-in / check-out times are `"HH:mm"`.
- `PUT .../amenities` and `PUT .../policies` **replace the whole list** (keys not sent are removed). Policy keys are snake_case (`cancellation`, `children`). Unknown amenity ids return `VALIDATION_ERROR` (field `amenityIds`).
- `PUT .../room-config`: one config per hotel; a `totalRooms` below the current room count returns `ROOM_LIMIT_REACHED`.
- **Images** (rules in `UPLOAD_RULES`): JPG/PNG/WebP, at most 10 MB, at most 30 images per hotel (`IMAGE_LIMIT_REACHED`). The file type is read from the content, not the file name. There is always exactly one cover: the first image becomes the cover, `isCover: true` moves the cover to that image, and deleting the cover promotes the next image (by `sortOrder`). An image that does not exist or is not in one of the caller's hotels returns `IMAGE_NOT_FOUND`. Without a Cloudinary config uploads return `503 UPLOAD_UNAVAILABLE`.

## Room types and rooms

| Method | Path | Access | Body / Query | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/room-types` | member | | `RoomType[]` |
| POST | `/hotels/:hotelId/room-types` | owner | `createRoomTypeSchema` | `RoomType` (201) |
| GET | `/room-types/:id` | member | | `RoomType` |
| PATCH | `/room-types/:id` | owner | `updateRoomTypeSchema` | `RoomType` |
| DELETE | `/room-types/:id` | owner | | 204 (`ROOM_TYPE_IN_USE` while it still has rooms or bookings) |
| POST | `/room-types/:id/images` | owner | multipart `file`, `caption?` (`uploadRoomTypeImageSchema`) | `RoomTypeImage` (201) |
| PATCH | `/room-type-images/:id` | owner | `{ caption?, sortOrder? }` (`updateRoomTypeImageSchema`) | `RoomTypeImage` |
| DELETE | `/room-type-images/:id` | owner | | 204 |
| GET | `/hotels/:hotelId/rooms` | member | `?roomTypeId=&status=&search=&sort=&page=&pageSize=` (`roomListQuerySchema`) | `Room[]` + `meta` |
| POST | `/hotels/:hotelId/rooms` | owner | `createRoomSchema` | `Room` (201) |
| PATCH | `/rooms/:id` | owner | `updateRoomSchema` | `Room` |
| POST | `/rooms/:id/lock` | owner | `{ reason? }` (`lockRoomSchema`) | `Room` (`MAINTENANCE`) |
| POST | `/rooms/:id/unlock` | owner | | `Room` (`AVAILABLE`) |

- **Room types**: `basePrice` is the nightly price before seasonal price rules. In `PATCH`, sending `beds` / `amenityIds` **replaces the whole list**, leaving them out keeps them; `description: null` clears it. Unknown bed types or amenities return `VALIDATION_ERROR` (field `beds` / `amenityIds`). `areaSqm` has at most 2 decimals. Room type images work like hotel images but have no cover (shown by `sortOrder`), at most 30 images. `basePrice` is `null` only for room types created outside the API; `PATCH basePrice` recreates the base price.
- **Rooms**: the room config must exist first; the room count cannot exceed `totalRooms` (`ROOM_LIMIT_REACHED`). Room numbers are unique within a hotel, case-insensitive (`ROOM_NUMBER_TAKEN`). `roomTypeId` must belong to the same hotel (`ROOM_TYPE_NOT_FOUND`). The status cannot be changed with `PATCH`.
- **Room list**: `search` matches the room number literally; `sort` is one of `ROOM_SORTS`: `room-number-asc` (default), `room-number-desc`, `floor-asc`, `floor-desc`. Room numbers sort in natural number order: `9`, `101`, `1001`.
- **Lock / unlock**: only `AVAILABLE` rooms can be booked. Locking sets `MAINTENANCE` (an `OCCUPIED` room cannot be locked); unlocking only applies to a locked room. Invalid cases return `ROOM_NOT_LOCKABLE`. Both are written to the audit log (with the lock reason).

## Staff

Invite staff with `POST /auth/invitations/staff` ([auth.md](./auth.md)). The invited person sets a password on the `/accept-invitation` page.

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/staff` | owner (also while suspended) | | `StaffMember[]` (includes pending invitations, `INVITED`) |
| PATCH | `/hotel-staff/:id/permissions` | owner | `{ permissions: StaffPermission[] }` (`staffPermissionsSchema`) | `StaffMember` |
| POST | `/hotel-staff/:id/deactivate` | owner | | `StaffMember` |
| POST | `/hotel-staff/:id/activate` | owner | | `StaffMember` |
| DELETE | `/hotel-staff/:id` | owner | | 204: cancels a pending invitation (only while `INVITED`) |

- **Permission groups** (`StaffPermission`): `BOOKING`, `FRONT_DESK`, `CUSTOMER_CARE`, `REFUND`, `MARKETING`. There is no "Accounting" group. `PATCH .../permissions` replaces the whole list (an empty array = read-only) and applies from the staff member's next request. Staff cannot manage other staff, even with all 5 groups.
- **Deactivate**: `ACTIVE → DEACTIVATED` (different from an admin `SUSPENDED`) and revokes every session at once; the staff member's sign-in returns `403 AUTH_ACCOUNT_DEACTIVATED`. **Activate**: `DEACTIVATED → ACTIVE`; old sessions stay revoked. `INVITED` accounts or accounts suspended by an admin return `STAFF_STATUS_CONFLICT` (a partner cannot lift an admin suspension).
- **Cancel an invitation**: only while `INVITED`; the email link stops working (`AUTH_TOKEN_INVALID`) and the email can be invited again (for example after a typo). An account that has been used is never deleted, only deactivated.

## Verification requests (partner side)

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| POST | `/uploads/verification-documents` | HOTEL_PARTNER | multipart `file` | `UploadedDocument` `{ fileId }` (201): a private file, used when submitting |
| POST | `/hotels/:hotelId/verification-requests` | owner | `submitVerificationSchema` | `VerificationRequest` (201); a first request moves the hotel to `PENDING_VERIFICATION` |
| GET | `/hotels/:hotelId/verification-requests` | owner (also while suspended) | | `VerificationRequest[]` (newest first, with reasons; account and ID card numbers masked `****1234`) |
| GET | `/verification-requests/:id` | hotel owner, platform manager | | `VerificationRequest` (full) |
| GET | `/verification-documents/:id/file` | hotel owner, platform manager | | `VerificationFileLink` `{ url, expiresAt }` |

- **4-step wizard** (body `submitVerificationSchema`): step 1 Legal entity (`legal` and the 3 `beneficiary` fields), step 2 Property (`property`), step 3 Documents (`documents`), step 4 Confirmation (`commitment: true`). Do **not** send the request type: the backend derives it (`DRAFT` → `INITIAL`; an active hotel asked to re-verify → `RENEWAL`; otherwise `UPDATE`).
- **Documents**: business license, fire safety and security certificates are required (`REQUIRED_VERIFICATION_DOCUMENTS`; missing ones return `VERIFICATION_DOCUMENTS_MISSING`), the rating certificate (`OTHER`) is optional. PDF/JPG/PNG, at most 10 MB, **a different file for each document**. A `fileId` can only be used in requests of the partner who uploaded it (otherwise `VALIDATION_ERROR` at `documents.<i>.fileId`).
- A request already waiting returns `VERIFICATION_PENDING`; clicking submit twice still creates one request. A suspended hotel returns `HOTEL_STATUS_CONFLICT`.
- The beneficiary account number is encrypted at rest; the detail shows it in full, the history shows only the last 4 digits (as for the representative's ID card number). Hotel staff cannot read requests (403).
- **Viewing a document**: call `GET /verification-documents/:id/file` (with the Bearer token), get a signed link valid for 5 minutes, then open it in a new tab or use it as the `src` of an `<img>` / `<iframe>`. Ask for a new link each time. Open the tab inside the click handler so the popup is not blocked:

  ```ts
  const tab = window.open('', '_blank');
  const { data } = await api.get(`/verification-documents/${id}/file`);
  tab!.location.href = data.data.url;
  ```

```jsonc
// submitVerificationSchema
{
  "legal": {                           // step 1 (Legal entity)
    "legalName": "…", "taxCode": "…", "businessType": "…",
    "representativeName": "…", "representativeTitle": "…", "representativeIdNumber": "…",
    "contactPhone": "…", "notificationEmail": "…"   // results are emailed here
  },
  "beneficiary": { "bankName": "…", "accountNumber": "…", "accountHolder": "…" },
  "property": {                        // step 2 (Property)
    "tradeName": "…", "propertyType": "…", "starRating": 4, "physicalRooms": 36,
    "propertyManager": "…", "licensedAddress": "…", "landmark": "…",
    "frontDeskHours": "24/7", "surveyNotes": "…"
  },
  "documents": [{ "documentType": "BUSINESS_LICENSE", "fileId": "…" }],   // step 3
  "commitment": true                   // step 4
}
```

## Pricing rules (phase 2)

A room type's **base price** stays where it is (`basePrice` on the room type, D3). Pricing rules adjust it for some nights or some booking dates (UC64, SRS 3.12.1). Full rules and examples: [money-rules.md §2](../money-rules.md#2-room-prices).

| Method | Path | Access | Body / Query | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/pricing-rules` | member | `?roomTypeId=` | `PricingRule[]` (priority high to low) |
| POST | `/hotels/:hotelId/pricing-rules` | owner | `createPricingRuleSchema` | `PricingRule` (201) |
| PATCH | `/pricing-rules/:id` | owner | `updatePricingRuleSchema` | `PricingRule` |
| DELETE | `/pricing-rules/:id` | owner | | 204 |
| GET | `/room-types/:id/price-preview` | member | `?date=YYYY-MM-DD&bookedOn=YYYY-MM-DD` (`bookedOn` defaults to today) | `PricePreview` |

```jsonc
// createPricingRuleSchema
{ "roomTypeId": "uuid", "name": "Tết 2027",            // name max 100
  "ruleType": "SEASON",                                 // SEASON | EARLY_BIRD | LAST_MINUTE
  "adjustmentType": "PERCENT",                          // SET_PRICE | AMOUNT | PERCENT
  "adjustmentValue": 15,                                // SET_PRICE: new nightly price (> 0); AMOUNT: ± VND; PERCENT: −90 to +300
  "validFrom": "2027-02-01", "validTo": "2027-02-10",   // nights covered; optional for EARLY_BIRD / LAST_MINUTE
  "dayOfWeek": null,                                    // MON…SUN, or null for every day
  "minDaysBefore": null,                                // EARLY_BIRD: booked at least N days (1–365) before check-in
  "maxDaysBefore": null,                                // LAST_MINUTE: booked at most N days (0–30) before check-in
  "priority": 10,                                       // 0–100, higher wins
  "isActive": true }
```

- Per night only **one** rule applies: the active rule with the highest priority that matches the night (dates, weekday) and how early the booking is made; ties go to the newest rule. No stacking. Days before check-in are counted in Asia/Ho_Chi_Minh.
- `SEASON` needs `validFrom` and `validTo` (at most 366 days apart); `EARLY_BIRD` needs `minDaysBefore`; `LAST_MINUTE` needs `maxDaysBefore`. A rule whose result would be ≤ 0 at the current base price is refused (`VALIDATION_ERROR` on `adjustmentValue`); if the base price is lowered later, such a rule is skipped for the night instead of applied. Nightly prices round half up to whole dong (bank transfers have no decimals), base prices included.
- Changes apply to new bookings only; booked prices never change (BR-09).
- `PATCH` validates the rule as a whole after the change, so switching `ruleType` reports the fields the new type needs. A rule of another hotel, or the base price row, answers `PRICING_RULE_NOT_FOUND`; a `roomTypeId` of another hotel answers `ROOM_TYPE_NOT_FOUND`.
- The preview treats `date` as the check-in date, so the days before check-in are `date − bookedOn`.

```jsonc
// PricingRule = createPricingRuleSchema + { "id": "uuid", "createdAt": "…" }
// PricePreview
{ "date": "2027-02-06", "bookedOn": "2026-10-22", "basePrice": 2000000,
  "rule": { "id": "uuid", "name": "Tết 2027" },          // null when the base price applies
  "price": 2300000 }
```

## Availability calendar (phase 2)

UC63, SRS 3.11.7: rooms on sale per room type and day.

| Method | Path | Access | Body / Query | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/availability` | member | `?from=&to=&roomTypeId=` (at most 62 days) | `AvailabilityDay[]` |
| PATCH | `/hotels/:hotelId/availability` | owner | `updateAvailabilitySchema` | `AvailabilityDay[]` for the changed range |

```jsonc
// AvailabilityDay (one per room type and date)
{ "roomTypeId": "uuid", "date": "2026-11-20",
  "totalRooms": 12,        // physical rooms of the type not locked (MAINTENANCE)
  "booked": 5, "held": 1,  // nights sold, nights held for unpaid bookings
  "closed": 2,             // rooms taken off sale by the partner
  "onSale": 4 }            // totalRooms − booked − held − closed

// updateAvailabilitySchema
{ "roomTypeId": "uuid", "from": "2026-11-20", "to": "2026-11-25",   // at most 62 days
  "onSale": 6 }            // rooms to keep on sale each day (0–500); 0 closes the dates
```

- `onSale` in the body means the same as `onSale` in the list: the rooms left to sell after bookings and holds. The backend closes or reopens free rooms to reach it on every day of the range; booked and held nights are never touched. Example: 10 rooms, 3 booked, 1 held → `onSale: 4` closes 2 rooms, `0` closes the 6 free ones.
- If some day has fewer rooms left than `onSale`, nothing changes: `409 AVAILABILITY_BELOW_BOOKED`, with one `details` entry per such day (`{ "field": "onSale", "message": "2026-11-21: at most 3 rooms can be on sale" }`).
- A `roomTypeId` of another hotel answers `ROOM_TYPE_NOT_FOUND`. Bookings, cancellations and holds update the calendar on their own; a hold still counts as `held` until the expiry job releases it, at most a minute after it expires.

## Cancellation policy (phase 2)

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| PATCH | `/hotels/:hotelId/cancellation-policy` | owner | `{ freeCancellationDays, feePercent }` (`cancellationPolicySchema`) | `Hotel` |

- `freeCancellationDays`: 0–30, or `null` for no free-cancellation period. Guests cancel for free until the hotel's check-in time (14:00 when not set), N days before the check-in date. `feePercent`: 0–100, charged on the amount paid after the deadline. "Non-refundable" = `null` + 100.
- `Hotel` gains `cancellationPolicy: { freeCancellationDays, feePercent }`. Until the partner sets it, the default applies: `{ freeCancellationDays: 1, feePercent: 100 }` (free until the check-in time the day before, then non-refundable). The free-text `policies.cancellation` stays for display.
- The policy is fixed on each booking when it is made (BR-07): changing it never affects existing bookings.

## Bookings of a hotel (phase 2)

UC57: the partner sees the bookings of the selected hotel, read-only.

| Method | Path | Access | Query | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/bookings` | owner (also while suspended); staff with `BOOKING` or `REFUND` | `?status=&paymentStatus=&checkInFrom=&checkInTo=&search=&sort=&page=&pageSize=` (`hotelBookingsQuerySchema`) | `BookingSummary[]` + `meta` |
| GET | `/bookings/:id` | owner; staff with `BOOKING` or `REFUND`; the customer who booked | | `Booking` ([customer.md](./customer.md#types)) |

- `search` matches the booking code or the guest name. `sort`: `check-in-asc` (default), `check-in-desc`, `created-desc`.

## Refund requests (phase 2)

Slide "08. Cancellation And Refund": when a customer cancels a paid booking with money to refund, the invoice becomes `REFUND_PENDING` and the booking keeps its rooms until the hotel decides.

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/bookings?paymentStatus=REFUND_PENDING` | owner; staff with `REFUND` | | the refund queue |
| POST | `/bookings/:id/forward-refund` | staff with `REFUND` | `{ note }` | `Booking` |
| POST | `/bookings/:id/approve-refund` | owner | | `Booking` |
| POST | `/bookings/:id/reject-refund` | owner | `{ reason }` | `Booking` |

- **Staff** check the request against the fixed policy and forward it with a note (written to the audit log; the partner is notified). Forwarding is optional: the owner can decide at any time.
- **Approve**: the booking becomes `CANCELLED`, its nights are released, the refund (amount paid − cancellation fee) moves from the hotel wallet to the customer's wallet, the invoice becomes `REFUNDED` or `PARTIALLY_REFUNDED`, and the customer is emailed.
- **Reject**: only for the reasons in BR-20 (already refunded or duplicate, booking status no longer allows it, suspected fraud with evidence); `reason` required. The invoice goes back to `PAID`, the booking stays `CONFIRMED`, and the customer is emailed the reason.
- A request made **before** the hotel's check-in time on the check-in date and still undecided at that time is approved automatically; a request made after it waits for the partner.
- Deciding a booking that is not `REFUND_PENDING` returns `409 REFUND_STATUS_CONFLICT`. A suspended partner can still approve (money goes back to the customer) but not reject.

## Types

TypeScript types are in `@stayreco/shared` (`responses/hotel.ts`). Money is a number (at most 2 decimals), dates are ISO strings.

```jsonc
// HotelSummary
{ "id": "uuid", "name": "Sơn Trà Bay Resort & Spa", "city": "Đà Nẵng", "starRating": 5,
  "status": "ACTIVE", "coverImageUrl": "https://…", "myRole": "OWNER" }        // OWNER | STAFF

// Hotel
{ "id": "uuid", "name": "…", "description": "…", "address": "…", "city": "…", "country": "Vietnam",
  "latitude": 16.06, "longitude": 108.22, "starRating": 4, "phone": "…", "email": "…", "website": null,
  "checkInTime": "14:00", "checkOutTime": "12:00", "status": "DRAFT",
  "amenities": [{ "id": "uuid", "name": "Wi-Fi miễn phí", "icon": "wifi", "category": "Chung" }],
  "images": [{ "id": "uuid", "url": "https://…", "caption": null, "isCover": true, "sortOrder": 0 }],
  "policies": { "cancellation": "…", "children": "…" },
  "roomConfig": { "totalRooms": 36, "basePrice": 2800000 },        // null until configured
  "createdAt": "…" }

// RoomType
{ "id": "uuid", "hotelId": "uuid", "name": "Deluxe River View", "description": "…",
  "maxOccupancy": 2, "areaSqm": 32, "basePrice": 2800000,
  "beds": [{ "bedTypeId": "uuid", "name": "Giường Queen", "quantity": 1 }],
  "amenities": [ … ],
  "images": [{ "id": "uuid", "url": "https://…", "caption": null, "sortOrder": 0 }],
  "roomCount": 12 }

// Room
{ "id": "uuid", "roomTypeId": "uuid", "roomNumber": "301", "floor": 3, "status": "AVAILABLE", "notes": null }

// StaffMember
{ "id": "uuid", "fullName": "…", "email": "…", "position": "Lễ tân", "status": "ACTIVE",
  "permissions": ["BOOKING", "FRONT_DESK"] }

// VerificationRequest (detail; in the history accountNumber and representativeIdNumber are "****6789")
{ "id": "uuid", "hotelId": "uuid", "hotelName": "…", "requestType": "INITIAL", "status": "PENDING",
  "reason": null, "submittedAt": "…", "reviewedAt": null,
  "legal": { … }, "beneficiary": { "bankName": "…", "accountNumber": "…", "accountHolder": "…" },
  "property": { … },
  "documents": [{ "id": "uuid", "documentType": "FIRE_SAFETY", "uploadedAt": "…" }] }

// UploadedDocument
{ "fileId": "stayreco/verification/<partnerId>/<id>.pdf" }

// VerificationFileLink
{ "url": "https://api.cloudinary.com/…&signature=…", "expiresAt": "2026-10-20T16:05:00.000Z" }
```

## Common error codes

| Group | Codes |
|---|---|
| Access | `HOTEL_NOT_FOUND`, `FORBIDDEN`, `PARTNER_SUSPENDED` |
| Rooms | `ROOM_TYPE_NOT_FOUND`, `ROOM_NOT_FOUND`, `ROOM_NUMBER_TAKEN`, `ROOM_LIMIT_REACHED`, `ROOM_TYPE_IN_USE`, `ROOM_NOT_LOCKABLE` |
| Staff | `STAFF_NOT_FOUND`, `STAFF_STATUS_CONFLICT` |
| Verification | `VERIFICATION_PENDING`, `VERIFICATION_DOCUMENTS_MISSING`, `VERIFICATION_NOT_FOUND`, `HOTEL_STATUS_CONFLICT` |
| Files | `UPLOAD_INVALID_FILE`, `UPLOAD_UNAVAILABLE`, `IMAGE_NOT_FOUND`, `IMAGE_LIMIT_REACHED` |
| Pricing, availability | `PRICING_RULE_NOT_FOUND`, `AVAILABILITY_BELOW_BOOKED` |
| Bookings, refunds | `BOOKING_NOT_FOUND`, `REFUND_STATUS_CONFLICT` |

Meanings and handling: [api-guide.md §4.3](../api-guide.md#43-error-codes).

# Promotions, vouchers and discounts (phase 4)

How money comes off a stay before it is paid (BR-06). Decisions are in [phase-4-loyalty-promotions.md](../phases/phase-4-loyalty-promotions.md); the amounts themselves follow [money-rules.md §2.1](../money-rules.md). Rules for every API: [../api-guide.md](../api-guide.md).

Status: `BE Done` — merged into `develop`, FE can integrate.

## The two kinds of discount

| | **Promotion** (campaign) | **Voucher** (personal code) |
|---|---|---|
| Who gets it | Everyone booking that hotel | The one customer it was issued to |
| How it is used | Applies by itself, nothing typed | The customer types the code |
| Belongs to | One hotel, or the whole platform (`hotelId: null`) | A campaign, plus one customer |
| Limits | `minBookingAmount`, `maxUses`, `validFrom`/`validTo`, `isActive` | its campaign's limits, plus `maxDiscount` and `expiresAt` |

**A booking takes one or the other, never both** ([money-rules.md §2.1](../money-rules.md): "promotion **or** voucher discount"). When both could apply, the backend uses whichever saves more, so typing a code can never leave a customer worse off. A tie goes to the code, so a personal voucher is the one spent.

**A campaign that has issued vouchers stops applying automatically.** Once a hotel hands out personal codes under a campaign it is addressing chosen customers; applying it to everyone as well would make those codes pointless.

Loyalty points are a third, separate subtraction and come with their own branch.

## Endpoints

| Method | Path | Access | Body / Query | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/promotions` | member | `?active=&page=&pageSize=` | `Promotion[]` + `meta` |
| POST | `/hotels/:hotelId/promotions` | owner | `createPromotionSchema` | `Promotion` (201) |
| PATCH | `/promotions/:id` | owner | `updatePromotionSchema` | `Promotion` |
| DELETE | `/promotions/:id` | owner | | `Promotion` |
| POST | `/promotions/:id/vouchers` | owner | `issueVouchersSchema` | `Voucher[]` (201) |
| GET | `/me/vouchers` | customer | `?active=&page=&pageSize=` | `Voucher[]` + `meta` |
| POST | `/bookings/discount-quote` | customer | `discountQuoteSchema` | `DiscountQuote` (200) |
| POST | `/bookings` | customer | `createBookingSchema` + `code` | `Booking` (201) |

`DELETE /promotions/:id` switches the campaign off (`isActive: false`). A campaign is **never deleted**: bookings point at it, and the discounts already given have to stay readable.

## Booking with a discount

1. The customer picks a stay. The FE calls `POST /bookings/discount-quote` with the stay and, if one was typed, the `code`.
2. The quote answers `subtotal`, the single `discount` that applies, and `expectedTotal`.
3. The FE sends `POST /bookings` with that **`expectedTotal`** and the same `code`. The backend prices the stay again and refuses with `409 BOOKING_PRICE_CHANGED` if the result differs — the same check phase 2 already did, now over the discounted total.

```jsonc
// POST /bookings/discount-quote
{ "roomTypeId": "…", "checkIn": "2026-11-20", "checkOut": "2026-11-22",
  "rooms": 1, "code": "KHUYENMAI1" }     // code optional

// → DiscountQuote
{ "subtotal": 2000000,
  "discount": { "kind": "VOUCHER", "promotionId": "…", "voucherId": "…",
                "name": "Giảm 30% cuối năm", "code": "KHUYENMAI1",
                "amount": 600000 },
  "expectedTotal": 1400000 }             // send this to POST /bookings
```

The quote **holds nothing and spends nothing**. The code is only spent when the booking is created.

A code that cannot be used answers an error rather than quietly falling back to a campaign: a customer who typed a code should be told why it did not work instead of watching the total stay the same.

## When a code comes back

A voucher is marked used when the booking is created, and the campaign's `currentUses` goes up. It is given back, and the counter lowered, wherever the stay never happens:

- the 15-minute hold expired unpaid (the booking became `EXPIRED`);
- the customer cancelled and there was nothing to refund;
- the hotel approved a refund and the booking became `CANCELLED`.

Releasing also clears `voucherId` from that booking, because the column is unique and a dead booking holding the code would stop the customer spending it again. What the booking was charged stays on its invoice (`subtotal`, `discountAmount`) and in the audit log.

## Types

```jsonc
// Promotion
{ "id": "…", "hotelId": "…",             // null = a platform-wide campaign
  "name": "Giảm 10% tháng 11", "description": null,
  "discountType": "PERCENTAGE",          // or FIXED_AMOUNT
  "discountValue": 10,                   // percent, or dong
  "minBookingAmount": null,              // the stay total must reach this
  "maxUses": 100, "currentUses": 12,
  "validFrom": "2026-11-01", "validTo": "2026-11-30",
  "isActive": true,
  "usable": true,                        // computed: on, in date, uses left
  "createdAt": "…" }

// Voucher
{ "id": "…", "code": "KHUYENMAI1", "promotionId": "…",
  "promotionName": "Giảm 30% cuối năm", "hotelId": "…",
  "discountType": "PERCENTAGE", "discountValue": 30,
  "maxDiscount": 500000,                 // caps a percentage, in dong; null = uncapped
  "minBookingAmount": null,
  "usedAt": null, "expiresAt": "…",
  "usable": true,                        // not spent, not expired, campaign still running
  "createdAt": "…" }
```

Codes are 10 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — no lowercase, and no `0`/`O` or `1`/`I`, so a code can be read out over the phone. Codes are matched case-insensitively.

## Amounts

Everything follows [money-rules.md](../money-rules.md): a percentage is taken of the stay subtotal and then capped by `maxDiscount`; a discount never exceeds the subtotal, so a stay can reach 0 but never goes below it; amounts are rounded half up to **whole dong** (BR-29) so SePay can match the transfer exactly. The backend computes all of it — the FE only displays what it is told.

A `PERCENTAGE` over 100 is refused when the campaign is saved (`400 VALIDATION_ERROR`).

## Common error codes

| Code | Status | When |
|---|---|---|
| `VOUCHER_NOT_FOUND` | 404 | Unknown code, or one belonging to another customer |
| `VOUCHER_ALREADY_USED` | 409 | Already spent on another booking |
| `VOUCHER_EXPIRED` | 409 | Past its expiry, or its campaign stopped running |
| `VOUCHER_NOT_APPLICABLE` | 409 | Another hotel, or the stay is below the minimum |
| `PROMOTION_NOT_FOUND` | 404 | Unknown campaign, or one of another hotel |
| `PROMOTION_NOT_ACTIVE` | 409 | Issuing codes under a campaign that is off, out of date or out of uses |
| `BOOKING_PRICE_CHANGED` | 409 | `expectedTotal` no longer matches, including when a discount ran out between the quote and the booking |

Someone else's code answers `VOUCHER_NOT_FOUND`, not `FORBIDDEN`, so codes cannot be probed.

## Still open

- **Loyalty points** as a third subtraction (BR-11) — its own branch.
- A campaign has no column saying "code only"; having vouchers is what marks it today. A `requiresCode` boolean would be clearer and needs a migration.
- Platform-wide campaigns (`hotelId: null`) are read and applied, but no endpoint creates one yet; that belongs with the admin screens of [phase 6](../phases/phase-6-reporting-admin.md).

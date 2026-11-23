# Loyalty points (phase 4)

Points earned on a stay, spent on the next one (BR-11). Decisions are in [phase-4-loyalty-promotions.md](../phases/phase-4-loyalty-promotions.md); the amounts follow [money-rules.md §2.1](../money-rules.md). Rules for every API: [../api-guide.md](../api-guide.md).

Status: `BE Done` — merged into `develop`, FE can integrate.

## One balance, not one per hotel

There is a **single platform-wide programme**, `StayMiles`, seeded with `hotel_id` null. A customer keeps one balance wherever they stay, the way Booking.com Genius and Traveloka work.

The schema used to require `loyalty_program.hotel_id`, which meant a separate balance at every hotel: a guest who stays once at each ends up with scraps that never add up to anything. The column is now nullable: `null` is the platform programme, and a row with a hotel holds that hotel's **own rules** (below).

Seeded rates: **1 point per 1,000 ₫ spent**, and **1 point is worth 100 ₫** when spent. A 2,000,000 ₫ stay earns 2,000 points, worth 200,000 ₫ off a later stay — roughly a tenth comes back.

## A hotel's own rules (L8–L11)

The registration form has the hotel partner manage *"the hotel's loyalty points and voucher program, including configuring point-earning rules … and setting redemption conditions"*. A hotel does this **on top of** StayMiles, without a balance of its own: every point still lands in the customer's one balance.

| Rule | What the owner sets | Bounds |
|---|---|---|
| Earning (L9) | `pointsPerCurrency`: the rate for stays at this hotel | The platform rate, **1×** for now. A higher rate (up to 3× was decided) opens once the hotel giving the extra points also pays for them ([money-rules.md §9](../money-rules.md)); until then the hotel where they are spent would carry the cost |
| Taking points (L10) | `acceptsPoints` | `false` refuses points at this hotel |
| Share of a stay (L10) | `maxRedeemPercent`: the most points may pay, as a share of the stay **after the discount** | 1–100, at most 2 decimals |
| Switch | `isActive` | `false` goes back to the platform rules and keeps the saved values |

- The **value of a point** stays the platform's (100 ₫ seeded) at every hotel: the points are one currency.
- A hotel that never saved anything, or switched its rules off, uses the platform rules: platform rate, points taken, up to 100 %.
- Earning uses the hotel's rate **at check-out**. The rate is kept inside the bounds there too, so a later change of the platform rate, or a rate saved under wider bounds, is never paid out above them.
- Who pays for the points is [money-rules.md §9](../money-rules.md) (decision M4, L11).

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/loyalty-program` | owner (read-only while suspended) | | `HotelLoyaltyProgram` |
| PUT | `/hotels/:hotelId/loyalty-program` | owner | `{ isActive, pointsPerCurrency, acceptsPoints, maxRedeemPercent }`, all required | `HotelLoyaltyProgram` |

```jsonc
// PUT /hotels/:hotelId/loyalty-program
{ "isActive": true, "pointsPerCurrency": 0.001, "acceptsPoints": true, "maxRedeemPercent": 30 }

// → HotelLoyaltyProgram
{ "custom": true,              // false until the hotel saves its rules
  "appliesNow": true,          // switched on, and StayMiles is running
  "isActive": true,
  "pointsPerCurrency": 0.001,  // 1 point per 1,000 ₫
  "earnMultiplier": 1,         // pointsPerCurrency / the platform rate
  "acceptsPoints": true,
  "maxRedeemPercent": 30,
  "platform": { "name": "StayMiles", "isActive": true, "pointsPerCurrency": 0.001, "pointValue": 100 },
  "limits": { "minPointsPerCurrency": 0.001, "maxPointsPerCurrency": 0.001, // 1× for now
              "minRedeemPercent": 1, "maxRedeemPercent": 100 } }
```

A rate outside the bounds is `400 VALIDATION_ERROR` with the detail `{ "field": "pointsPerCurrency", "message": "must be 0.001, the platform rate" }` (`"from … to …"` once the range opens). Every save is written to the audit log as `LOYALTY_PROGRAM_UPDATED`, with the rules before and after. Staff get `403`; anyone outside the hotel gets `404 HOTEL_NOT_FOUND`.

## Where points sit in the price

[money-rules.md §2.1](../money-rules.md):

```
final price = nightly prices
            − promotion OR voucher      (one of them, never both)
            − value of the points spent  ← this page
```

Points are a **separate, third** subtraction: they stack on top of a discount. A stay can reach 0 ₫ but never goes below, and points beyond what the stay owes stay on the balance instead of being burnt.

## Endpoints

| Method | Path | Access | Body / Query | Response |
|---|---|---|---|---|
| GET | `/me/loyalty` | customer | | `LoyaltyAccount` |
| GET | `/me/loyalty/entries` | customer | `?page=&pageSize=` | `LoyaltyEntry[]` + `meta` |
| POST | `/bookings/discount-quote` | customer | `+ pointsToUse` | `DiscountQuote` (now with `points`) |
| POST | `/bookings` | customer | `+ pointsToUse` | `Booking` (201) |

The account is **opened on first read**, so a customer who has never earned anything sees a balance of 0 rather than an error.

## Earning

Points are credited at **check-out**, on what the booking was **actually paid** (`invoice.totalAmount`), not on its list price. A customer earns on money spent, so a discount lowers the points too. The rate is the hotel's own when it has switched its rules on.

Earning rounds **down**: 1,999 ₫ earns 1 point, not 2.

A no-show earns nothing — the guest never stayed.

## Spending

1. The FE asks `POST /bookings/discount-quote` with `pointsToUse`.
2. The answer carries a `points` block: the balance, the most that could be used on this stay, what the asked-for points come to after capping, and the dong they take off.
3. The FE sends `POST /bookings` with the same `pointsToUse` and the `expectedTotal` it was given.

```jsonc
// POST /bookings/discount-quote
{ "roomTypeId": "…", "checkIn": "2026-11-20", "checkOut": "2026-11-22",
  "rooms": 1, "code": "KHUYENMAI1", "pointsToUse": 5000 }

// → DiscountQuote
{ "subtotal": 2000000,
  "discount": { "kind": "VOUCHER", "code": "KHUYENMAI1", "amount": 600000, … },
  "points": { "programId": "…",
              "pointsBalance": 5000,
              "maxPointsUsable": 5000,   // capped by balance and by what the stay owes
              "pointsUsed": 5000,
              "amount": 500000,
              "acceptsPoints": true,     // the hotel's rule (L10)
              "maxRedeemPercent": 100 }, // share of the stay after the discount points may pay
  "expectedTotal": 900000 }              // 2,000,000 − 600,000 − 500,000
```

`maxPointsUsable` is never more than the balance, nor more than the hotel's share (`maxRedeemPercent`, rounded down to whole dong) of what the stay still owes after the discount. Asking to spend more points than the stay needs is not an error: only the needed ones are taken, and the rest stay on the balance. Asking for more than the **balance** is `409 LOYALTY_POINTS_INSUFFICIENT`.

At a hotel that does not take points, the quote still carries `points` with `acceptsPoints: false` and `maxPointsUsable: 0`, so the FE can say why; sending any `pointsToUse` there is `409 LOYALTY_POINTS_NOT_ACCEPTED`.

Points are spent inside the booking's transaction, like the discount, so two bookings racing for the same points cannot both win; the loser gets `409 BOOKING_PRICE_CHANGED`.

## When points come back

Spent points are credited again wherever the stay never happens — the same three places a discount is released:

- the 15-minute hold expired unpaid;
- the customer cancelled with nothing to refund;
- the hotel approved a refund.

The refund is guarded by its own entry, so a second release cannot credit the points twice.

## Tiers

`tier` comes from `lifetimePoints`, which rises on every earn and is **never lowered by spending** — using your points cannot drop you a tier.

| Tier | Lifetime points |
|---|---|
| `MEMBER` | 0 |
| `SILVER` | 10,000 |
| `GOLD` | 30,000 |
| `PLATINUM` | 100,000 |

Thresholds are constants in the backend for now; making them configurable is an open question. Tiers carry no benefit yet — they are a label the rewards screen shows.

## History

`GET /me/loyalty/entries` reads the movements back from the **audit log**, keyed by the loyalty account. There is no table of point transactions, the same way cancellation reasons and fees live in the audit log rather than a table of their own ([money-rules.md §7.1](../money-rules.md)).

```jsonc
// LoyaltyEntry
{ "at": "2026-11-09T10:00:00.000Z",
  "kind": "EARNED",            // EARNED | SPENT | REFUNDED
  "points": 2000,              // negative when spent
  "bookingId": "…",
  "hotelName": "An Nhiên Riverside Hotel" }
```

## Types

```jsonc
// LoyaltyAccount
{ "programId": "…", "programName": "StayMiles",
  "pointsBalance": 2450,
  "lifetimePoints": 2450,
  "tier": "MEMBER",
  "nextTier": { "tier": "SILVER", "pointsNeeded": 7550 },  // null at PLATINUM
  "pointValue": 100,
  "balanceValue": 245000,      // the balance in dong
  "joinedAt": "…" }
```

## Common error codes

| Code | Status | When |
|---|---|---|
| `LOYALTY_PROGRAM_NOT_FOUND` | 404 | No programme is running (the seed never created it) |
| `LOYALTY_POINTS_INSUFFICIENT` | 409 | More points asked for than the customer holds |
| `LOYALTY_POINTS_NOT_ACCEPTED` | 409 | Points sent for a stay at a hotel that does not take them (L10) |
| `BOOKING_PRICE_CHANGED` | 409 | `expectedTotal` no longer matches, including when the points ran out between the quote and the booking |

On `POST /bookings/discount-quote` a missing programme is **not** an error: `points` comes back `null` and the FE hides the section.

## Still open

- Tier thresholds are constants; the team may want them configurable, together with the platform earn and spend rates (a hotel can already set its own earning rate and redemption conditions).
- The partner screen for the hotel rules is not built yet; the contract is above.
- Tiers carry no benefit yet (no extra discount, no earn multiplier).
- Points never expire. The rewards screen draws an expiry date; giving points one needs a column and a job.

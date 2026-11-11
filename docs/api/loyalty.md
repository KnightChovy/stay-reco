# Loyalty points (phase 4)

Points earned on a stay, spent on the next one (BR-11). Decisions are in [phase-4-loyalty-promotions.md](../phases/phase-4-loyalty-promotions.md); the amounts follow [money-rules.md §2.1](../money-rules.md). Rules for every API: [../api-guide.md](../api-guide.md).

Status: `BE Done` — merged into `develop`, FE can integrate.

## One balance, not one per hotel

There is a **single platform-wide programme**, `StayMiles`, seeded with `hotel_id` null. A customer keeps one balance wherever they stay, the way Booking.com Genius and Traveloka work.

The schema used to require `loyalty_program.hotel_id`, which meant a separate balance at every hotel: a guest who stays once at each ends up with scraps that never add up to anything. The column is now nullable, so a hotel can still run its own programme alongside the platform one if that is ever wanted.

Seeded rates: **1 point per 1,000 ₫ spent**, and **1 point is worth 100 ₫** when spent. A 2,000,000 ₫ stay earns 2,000 points, worth 200,000 ₫ off a later stay — roughly a tenth comes back.

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

Points are credited at **check-out**, on what the booking was **actually paid** (`invoice.totalAmount`), not on its list price. A customer earns on money spent, so a discount lowers the points too.

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
              "amount": 500000 },
  "expectedTotal": 900000 }              // 2,000,000 − 600,000 − 500,000
```

`maxPointsUsable` is never more than the balance, nor more than the stay still owes after the discount. Asking to spend more points than the stay needs is not an error: only the needed ones are taken, and the rest stay on the balance. Asking for more than the **balance** is `409 LOYALTY_POINTS_INSUFFICIENT`.

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
| `BOOKING_PRICE_CHANGED` | 409 | `expectedTotal` no longer matches, including when the points ran out between the quote and the booking |

On `POST /bookings/discount-quote` a missing programme is **not** an error: `points` comes back `null` and the FE hides the section.

## Still open

- Tier thresholds are constants; the team may want them configurable, together with the earn and spend rates.
- Tiers carry no benefit yet (no extra discount, no earn multiplier).
- Points never expire. The rewards screen draws an expiry date; giving points one needs a column and a job.

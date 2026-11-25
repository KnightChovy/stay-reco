# Customer wallet and preferences (phase 4)

The money a customer holds on StayReco, and the preferences they save. Decisions are in [phase-4-loyalty-promotions.md](../phases/phase-4-loyalty-promotions.md); the money model is [money-rules.md §5](../money-rules.md). Rules for every API: [../api-guide.md](../api-guide.md).

Status: `BE Done` — merged into `develop`, FE can integrate.

## Where the money comes from

A customer wallet is filled by **refunds** only. When a hotel approves a cancellation refund, the money moves from the hotel wallet's pending balance to the customer wallet's available balance ([money-rules.md §7.2](../money-rules.md)) — it is not transferred back to a bank account.

There is no top-up: a customer cannot put money in. So the balance is whatever past cancellations left behind.

The wallet is created on its first movement, so a customer who has never been refunded reads a balance of 0, not a 404.

## Paying with it is all or nothing

**Decision W1.** The balance either covers the **whole** booking, or the booking is paid by transfer. There is no part payment.

The reason is the SePay flow: a transfer is matched against the booking code **and exactly its amount** ([money-rules.md §4](../money-rules.md)). Part payment would make that amount depend on a balance held at booking time, which brings three failures that are easy to hit and hard to recover from — one balance paying two bookings opened in two tabs, a hold expiring without the held money being returned, and a transfer landing after the booking is already gone.

Since the wallet is only ever filled by refunds, and a refund is usually most of a previous booking, a balance normally covers a whole new booking anyway. Part payment can be revisited if customers turn out to be blocked by a small shortfall.

## What does *not* change

The hotel is credited **exactly as a transfer would credit it**: the full booking amount into its **pending** balance (BR-22). Commission at check-out, settlement after the holding period and refunds all work on a wallet-paid booking unchanged.

Only where the money came from differs, and the invoice records that as `paymentMethod: "WALLET"`.

## Endpoints

| Method | Path | Access | Body / Query | Response |
|---|---|---|---|---|
| GET | `/me/wallet` | customer | | `CustomerWallet` |
| GET | `/me/wallet/transactions` | customer | `?type=&from=&to=&page=&pageSize=` | `WalletTransaction[]` + `meta` |
| POST | `/bookings/:id/pay-with-wallet` | the customer who booked | | 204 |
| GET | `/me/preferences` | customer | | `Preferences` |
| PUT | `/me/preferences` | customer | `updatePreferencesSchema` | `Preferences` |

The transaction list uses the same `WalletTransaction` shape and the same filters as the hotel wallet ([partner.md](./partner.md#wallet)): `type` may be repeated, `from` / `to` are Vietnam dates and both inclusive.

## Paying a booking

```
POST /bookings/:id/pay-with-wallet   →  204, nothing to read back
```

The booking is confirmed at once: no transfer, no 15-minute wait, and the confirmation email goes out as usual. The nights stop being held and become booked.

| Answer | When |
|---|---|
| `204` | Paid; reload the booking to show it confirmed |
| `409 WALLET_INSUFFICIENT` | The balance does not cover the booking; `details` carries `balance` and `total` so the screen can show the shortfall and offer a transfer |
| `409 BOOKING_STATUS_CONFLICT` | The booking is not waiting for payment any more (already paid, expired, cancelled) |
| `404 BOOKING_NOT_FOUND` | Not the caller's booking |

Nothing moves on a refusal: the balance and the booking are left exactly as they were.

Two payments racing cannot both spend the same money — the debit is conditional on the balance still covering the booking, inside the same transaction that confirms it.

```jsonc
// CustomerWallet
{ "balanceAvailable": 2000000,   // what a booking can be paid from
  "balancePending": 0,           // always 0 for a customer today
  "currency": "VND",
  "updatedAt": "…" }             // null for a wallet that has never moved
```

## Preferences

Free-form key-value pairs stored in `customer_preference`, for the screens that ask and for the recommender of [phase 5](../phases/phase-5-ai-marketing.md) to read. **The backend does not interpret the keys**: the FE and the recommender agree on their names, so a new preference needs no migration and no backend change.

```jsonc
// PUT /me/preferences
{ "preferences": { "city": "Đà Nẵng", "budget": "2000000", "beds": null } }

// → Preferences (the whole set afterwards)
{ "preferences": { "city": "Đà Nẵng", "budget": "2000000" } }
```

A `PUT` writes the keys it is given, **removes** the ones set to `null`, and **leaves the rest alone**, so a screen can save the one field it owns without reading the others first. At most 100 keys per call; a key is at most 100 characters and a value 2,000. An empty set is `400 VALIDATION_ERROR`.

## Common error codes

| Code | Status | When |
|---|---|---|
| `WALLET_INSUFFICIENT` | 409 | The balance does not cover the whole booking |
| `BOOKING_STATUS_CONFLICT` | 409 | The booking is no longer waiting for payment |
| `BOOKING_NOT_FOUND` | 404 | The booking doesn't exist or belongs to someone else |

## Not built

**Withdrawing the wallet to a bank account.** It needs somewhere to keep the customer's bank details, a request with a status, and a platform manager to mark it paid — the same machinery partner withdrawals need, which [money-rules.md §9](../money-rules.md) puts in [phase 6](../phases/phase-6-reporting-admin.md). Building a second, parallel flow now would be thrown away when phase 6 unifies them, so customer withdrawals should be built there alongside partner payouts.

Until then the balance can be spent on a stay but not taken out, which is worth saying on the wallet screen.

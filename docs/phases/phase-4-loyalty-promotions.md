# Phase 4: Loyalty, promotions, reviews

| | |
|---|---|
| Phase status | 🟡 Promotions, vouchers and loyalty built; the customer wallet not started |
| API status | Promotions, vouchers and loyalty: `BE Done` (merged into `develop`, FE can integrate) · the wallet: none yet |
| Agreed on | Discounts: 2026-11-09 (P1–P8). Loyalty: 2026-11-10 (L1–L7). Wallet: 2026-11-10 (W1) |
| BE owners | Phúc |
| FE owners | |
| API | [api/promotions.md](../api/promotions.md), [api/loyalty.md](../api/loyalty.md). When the wallet starts: write its endpoints in [api/](../api/README.md) |

> Rules for every API: [api-guide.md](../api-guide.md). Money rules (final price, discounts, wallet): [money-rules.md](../money-rules.md), kept in sync with this file.

## Goal

Keep customers coming back: pay less next time with discount codes and points, rate the stay they just had, and spend the money sitting in their wallet.

## Scope

**Backend**

- **Promotions and vouchers** (BR-06): campaigns a hotel runs, personal codes handed to customers, the discount applied when booking. ✅ built
- **Reviews** after check-out (BR-12) — on its own branch
- **Loyalty** (BR-11): one platform-wide programme, points earned at check-out, points spent on a later stay. ✅ built
- **Customer wallet**: balance and history, paying a booking from the wallet, withdrawing ([money-rules.md §9](../money-rules.md))
- **Preferences**: the key-value preferences the recommender of [phase 5](./phase-5-ai-marketing.md) reads

**Frontend web / mobile** (pages already have UI in `frontend/src/app`)

- `partner/promotions`, the discount code field on the booking form (phase 2 left it disabled)
- `account/bookings/[id]/review`, hotel page review section
- `account/rewards`: the balance, tier and history come from `GET /me/loyalty` and `/me/loyalty/entries`; the points field on the booking form sends `pointsToUse`
- `account/wallet`, `account/preferences`

## Out of scope

- The partner withdrawing from the hotel wallet (BR-22) and the admin setting the holding period → phase 6
- Creating platform-wide campaigns (`hotelId: null`): the backend reads and applies them, but the screen that creates one belongs with the admin screens of phase 6
- `account/profile` → already built outside this phase

## Agreed decisions

### Promotions and vouchers (P1–P8, decided 2026-11-09)

| # | Decision |
|---|---|
| P1 | A booking takes a promotion **or** a voucher, **never both**. [money-rules.md §2.1](../money-rules.md) says "promotion or voucher discount", so this was already decided; the code follows it. Loyalty points stay a separate, third subtraction. |
| P2 | When both could apply, the backend uses **whichever saves more**, so typing a code can never leave a customer worse off. A tie goes to the code, so a personal voucher is the one spent. |
| P3 | A `Promotion` is a **campaign**: it applies by itself, with nothing typed. A `Voucher` is **one customer's personal code** under a campaign, with its own `maxDiscount` and `expiresAt`. The schema already said this: `Promotion` has no `code` column, `Voucher` has `code @unique` and a `customerId`. |
| P4 | A campaign that has **issued vouchers stops applying automatically**. Once a hotel hands out personal codes it is addressing chosen customers; applying the same campaign to everyone would make those codes pointless. Until the schema has a `requiresCode` column, "has vouchers" is what marks a campaign as code-only. |
| P5 | A code that cannot be used answers **its own error**, never a silent fallback to a campaign. A customer who typed a code should be told why it did not work instead of watching the total stay the same. Someone else's code answers `VOUCHER_NOT_FOUND`, not `FORBIDDEN`, so codes cannot be probed. |
| P6 | The discount is **taken inside the booking's transaction** under conditional updates, so two bookings racing for one code, or for a campaign's last use, cannot both win. The loser gets `BOOKING_PRICE_CHANGED` rather than quietly paying more than it agreed to. |
| P7 | A code is **given back** wherever the stay never happens: a hold that expired unpaid, a cancellation with nothing to refund, and an approved refund. Releasing also clears `voucher_id` from that booking, because the column is unique and a dead booking holding the code would block the customer forever. What was charged stays on the invoice and in the audit log. |
| P8 | A campaign is **never deleted**, only switched off, and an edit never rewrites `currentUses`: bookings point at the campaign, and lowering `maxUses` below the uses already made stops it rather than rewriting history. |

### Loyalty (L1–L7, decided 2026-11-10)

| # | Decision |
|---|---|
| L1 | **One platform-wide programme**, not one per hotel. `loyalty_program.hotel_id` becomes nullable and `null` is the platform programme, exactly as `promotion.hotel_id` already works. The schema required a hotel, which gave a customer a separate balance at every hotel: a guest who stays once at each ends up with scraps that never add up to anything, and the programme stops doing the one job it has. A hotel may still run its own alongside it. |
| L2 | Seeded as **StayMiles**: 1 point per 1,000 ₫ spent, a point worth 100 ₫ when spent, so about a tenth of a stay comes back on the next one. Both rates live on the programme row, so they can be changed without a deploy. |
| L3 | Points are earned at **check-out**, on what the booking was **actually paid**, not its list price: a customer earns on money spent, so a discount lowers the points too. Earning rounds **down**. A no-show earns nothing. |
| L4 | Points are the **third subtraction** of the price (money-rules §2.1) and **stack** on top of a promotion or voucher, unlike those two which exclude each other. They are capped at what the stay still owes, so a stay can reach 0 ₫ but never below, and points beyond that stay on the balance rather than being burnt. |
| L5 | Spending runs **inside the booking's transaction** and lowers the balance conditionally, like the discount (P6), so two bookings racing for the same points cannot both win. Points come back wherever the stay never happens, guarded by their own entry so a second release cannot credit them twice. |
| L6 | **Tiers come from `lifetime_points`**, a new column that rises on every earn and never falls, so spending points cannot drop a customer a tier. MEMBER 0, SILVER 10k, GOLD 30k, PLATINUM 100k, as constants for now. Tiers carry no benefit yet; they are a label the rewards screen shows. |
| L7 | Point movements are written to the **audit log**, keyed by the loyalty account, instead of a table of their own — the same approach [money-rules.md §7.1](../money-rules.md) takes for cancellation reasons and fees. |

### Customer wallet (W1, decided 2026-11-10)

| # | Decision |
|---|---|
| W1 | Paying from the wallet is **all or nothing**: a booking is paid entirely from the balance, or entirely by transfer. Paying part of one would mean SePay matching an amount that depends on a balance held at booking time, which brings the risk of one balance paying two bookings at once, of the hold expiring without the money being returned, and of a transfer landing after the booking is gone. Since the wallet is only ever filled by refunds, a balance is usually large enough to cover a whole booking anyway. Part payment can be revisited if customers turn out to be blocked by a small shortfall. |

### Reviews

Built on its own branch; decisions R1–R9 are recorded there.

## States

```
promotion.is_active: true ⇄ false (switched off by the hotel; never deleted)
voucher.used_at: null → set when a booking takes it → back to null if that booking never becomes a stay
booking.promotion_id / voucher_id: set at creation, cleared when the discount is released

loyalty_account.points_balance: +earned at check-out, -spent at booking, +back if the stay never happens
loyalty_account.lifetime_points: only ever rises; the tier is read from it
loyalty_tier: MEMBER -> SILVER (10k) -> GOLD (30k) -> PLATINUM (100k)
```

## Adding endpoints

- Body/query schemas go in `packages/shared/src/schemas/<feature>.ts`, added **before** the code so FE can work in parallel.
- Endpoints, response types, call flows: the `api/` page.
- New error codes: `packages/shared/src/errors.ts` **and** the table in [api-guide.md §4.3](../api-guide.md#43-error-codes).

## FE tasks

- Re-enable the discount code field on the booking form, disabled since phase 2.
- Call `POST /bookings/discount-quote` when the customer applies a code, and send the `expectedTotal` it answers to `POST /bookings`, with the same `code`. Never compute a discounted price in the FE.
- Show the reason a code failed from the error code; the backend never fails silently.
- `partner/promotions`: campaign CRUD and issuing codes. Switching a campaign off is `DELETE`, which sets `isActive: false` rather than removing it.

## Open questions

- [ ] A `requiresCode` column on `promotion`, to replace the "has vouchers" rule of P4 (migration).
- [ ] Who creates platform-wide campaigns, and from which screen (phase 6).
- [ ] Tier thresholds, the earn rate and the point value are fixed in code or in the seed; a screen to change them belongs with the admin screens of phase 6.
- [ ] Tiers carry no benefit yet (no extra discount, no earn multiplier).
- [ ] Points never expire. The rewards screen draws an expiry date; giving points one needs a column and a job.

## Definition of Done

- [x] Discounted prices are calculated by the BE; the FE only displays them
- [x] Loyalty points subtracted from the final price as the third term of money-rules §2.1
- [ ] The phase's [api/](../api/README.md) pages match the code, API status `Integrated`

## Changelog

| Date | Who | Change |
|---|---|---|
| 2026-11-09 | Phúc | Promotions and vouchers built (P1–P8): campaign CRUD, issuing personal codes, the discount quote, the discount applied and released on `POST /bookings`. Six new error codes, the `DiscountType` enum, and [api/promotions.md](../api/promotions.md). money-rules §2.1 updated |
| 2026-11-10 | Phúc | Loyalty built (L1–L7): the programme made platform-wide with a migration, points earned at check-out, spent as the third subtraction, given back when a stay never happens, tiers from lifetime points, history off the audit log. Two new error codes, the `LoyaltyTier` enum, and [api/loyalty.md](../api/loyalty.md). Wallet decision W1 recorded, not built |

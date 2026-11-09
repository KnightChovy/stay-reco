# Phase 4: Loyalty, promotions, reviews

| | |
|---|---|
| Phase status | 🟡 Promotions and vouchers built; loyalty and the customer wallet not started |
| API status | Promotions and vouchers: `BE Done` (merged into `develop`, FE can integrate) · the rest: none yet |
| Agreed on | Discounts: 2026-11-09 (decisions P1–P8). Loyalty and wallet: not agreed yet |
| BE owners | Phúc |
| FE owners | |
| API | [api/promotions.md](../api/promotions.md). When the other parts start: write their endpoints in [api/](../api/README.md) |

> Rules for every API: [api-guide.md](../api-guide.md). Money rules (final price, discounts, wallet): [money-rules.md](../money-rules.md), kept in sync with this file.

## Goal

Keep customers coming back: pay less next time with discount codes and points, rate the stay they just had, and spend the money sitting in their wallet.

## Scope

**Backend**

- **Promotions and vouchers** (BR-06): campaigns a hotel runs, personal codes handed to customers, the discount applied when booking. ✅ built
- **Reviews** after check-out (BR-12) — on its own branch
- **Loyalty** per hotel (BR-11): the hotel's programme, points earned at check-out, points spent as a discount
- **Customer wallet**: balance and history, paying a booking from the wallet, withdrawing ([money-rules.md §9](../money-rules.md))
- **Preferences**: the key-value preferences the recommender of [phase 5](./phase-5-ai-marketing.md) reads

**Frontend web / mobile** (pages already have UI in `frontend/src/app`)

- `partner/promotions`, the discount code field on the booking form (phase 2 left it disabled)
- `account/bookings/[id]/review`, hotel page review section
- `partner/loyalty`, `account/rewards`, `account/wallet`, `account/preferences`

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

### Reviews

Built on its own branch; decisions R1–R9 are recorded there.

### Loyalty and wallet

Not agreed yet. The open questions below have to be answered first; two of them change the schema.

## States

```
promotion.is_active: true ⇄ false (switched off by the hotel; never deleted)
voucher.used_at: null → set when a booking takes it → back to null if that booking never becomes a stay
booking.promotion_id / voucher_id: set at creation, cleared when the discount is released
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

- [ ] **Loyalty: per hotel or platform-wide?** The schema says per hotel (`loyalty_program.hotel_id` is required), the FE prototype draws one platform-wide "Ví điểm StayMiles" with tiers. The two cannot both be true; taking the FE route means a migration.
- [ ] **How much is a point worth** when spent, and is it earned on the total or on the amount after discounts?
- [ ] **Paying from the wallet**: part of a booking with the rest by transfer, or all-or-nothing? This touches the SePay flow, where the transferred amount must match the booking exactly.
- [ ] A `requiresCode` column on `promotion`, to replace the "has vouchers" rule of P4 (migration).
- [ ] Who creates platform-wide campaigns, and from which screen (phase 6).

## Definition of Done

- [x] Discounted prices are calculated by the BE; the FE only displays them
- [ ] Loyalty points subtracted from the final price as the third term of money-rules §2.1
- [ ] The phase's [api/](../api/README.md) pages match the code, API status `Integrated`

## Changelog

| Date | Who | Change |
|---|---|---|
| 2026-11-09 | Phúc | Promotions and vouchers built (P1–P8): campaign CRUD, issuing personal codes, the discount quote, the discount applied and released on `POST /bookings`. Six new error codes, the `DiscountType` enum, and [api/promotions.md](../api/promotions.md). money-rules §2.1 updated |

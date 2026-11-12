# Phase 4: Loyalty, promotions, reviews

|              |                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase status | 🟡 Backend done; customer web FE integrated on `feat/phase-4-frontend` (not merged yet); partner FE not connected |
| API status   | `BE Done` for every part: merged into `develop`, FE can integrate |
| Agreed on    | Reviews and discounts: 2026-11-09 (R1–R9, P1–P8). Loyalty and wallet: 2026-11-10 (L1–L7, W1–W3) |
| BE owners    | Phúc                                                                                                                                                    |
| FE owners    | Web customer screens: branch `feat/phase-4-frontend` |
| API          | [api/reviews.md](../api/reviews.md), [api/promotions.md](../api/promotions.md), [api/loyalty.md](../api/loyalty.md), [api/customer-wallet.md](../api/customer-wallet.md) |

> Rules for every API: [api-guide.md](../api-guide.md). Money rules (final price, discounts, wallet): [money-rules.md](../money-rules.md), kept in sync with this file.

## Goal

Keep customers coming back: rate the stay they just had, pay less next time with points and discount codes, and spend the money sitting in their wallet.

## Scope

**Backend**

- **Promotions and vouchers** (BR-06): campaigns a hotel runs, personal codes handed to customers, the discount applied when booking. ✅ built
- **Reviews** after check-out (BR-12): rating criteria, writing and editing, a hotel's reviews and rating figures, photos, reporting, and a platform manager's moderation queue. ✅ built
- **Loyalty** (BR-11): one platform-wide programme, points earned at check-out, points spent on a later stay. ✅ built
- **Customer wallet**: balance, movements and paying a whole booking from it. ✅ built; withdrawing moves to phase 6 (W3)
- **Preferences**: the key-value preferences the recommender of [phase 5](./phase-5-ai-marketing.md) reads. ✅ built

**Frontend web / mobile** (pages already have UI in `frontend/src/app`)

- `account/bookings/[id]/review`, hotel page review section
- `account/rewards`: the balance, tier and history come from `GET /me/loyalty` and `/me/loyalty/entries`; the points field on the booking form sends `pointsToUse`
- `account/wallet`: balance and movements from `GET /me/wallet` and `/me/wallet/transactions`; "pay from wallet" calls `POST /bookings/:id/pay-with-wallet`. Say the balance cannot be withdrawn yet (W3)
- `account/preferences`: `GET` / `PUT /me/preferences`; send only the keys the screen owns, `null` to remove one

## Out of scope

- The partner withdrawing from the hotel wallet (BR-22) and the admin setting the holding period → phase 6 ([money-rules.md §9](../money-rules.md))
- Alerts on negative reviews (UC42, decision O13 of [phase 3](./phase-3-operations.md)) → now unblocked by reviews, but built later
- A hotel's written reply to a review → drawn in the FE prototype, not built; see R9
- Automatic screening of uploads (NSFW, AI-generated) → see R14; the Cloudinary add-on is the obvious next step
- `account/profile` → already built outside this phase (every account edits its profile and avatar)

## Agreed decisions

### Reviews (R1–R14; R1–R9 decided 2026-11-09, R10–R14 on 2026-11-12)

| # | Decision |
|---|---|
| R1 | A review belongs to a **booking**, not to a hotel: only the customer whose stay reached `COMPLETED` can write one, and `review.booking_id` is unique, so **one review per stay**. A guest who stays twice writes two reviews. |
| R2 | The review window is **`REVIEW_WINDOW_DAYS` after check-out**, 30 by default, from an env setting until the admin screen of phase 6 can hold it (as `WALLET_HOLD_DAYS` does, decision O7). Writing or editing after it returns `REVIEW_WINDOW_CLOSED`. |
| R3 | The guest scores a fixed set of **weighted criteria** (`rating_criterion`), seeded to the five the review screen shows. The **overall rating is computed by the backend** as their weighted average and is never sent by the client: a review whose stars disagree with its criteria would mean nothing. |
| R4 | **Every criterion must be scored exactly once.** A partial review is refused (`REVIEW_NOT_ALLOWED`), because choosing which criteria to score is choosing what your own overall rating weighs. |
| R5 | A review is **visible as soon as it is written**; there is no moderation queue. The hotel may **hide** it (`is_visible`), which takes it out of the public list and the rating figures. The author still sees their hidden review in `GET /me/reviews`. |
| R6 | The author may **edit** their review while the window is open. Sending `subRatings` replaces all of them and recomputes the overall rating. Writing, editing and a visibility change are all written to the audit log. |
| R7 | Reviewers are shown as **"Nguyễn Văn A."**, not by their full name: reviews are public and the name is personal data (as on Booking.com and Traveloka). |
| R8 | Each sub-rating is also upserted into **`user_item_rating`**, the user-item matrix the recommender reads in phase 5. That table keeps one score per (customer, hotel, criterion), so a repeat stay updates the earlier score instead of adding a row. |
| R9 | **A hotel's written reply to a review is not built.** The FE prototype draws one, but `review` has no reply field, so it needs a table and a migration. Review photos, which R9 originally deferred alongside it, are built: see R10–R12. |
| R10 | **Photos**: at most 5 per review, 10MB each, JPEG/PNG/WebP, sides between 1:1 and 4:3. Tripadvisor's rules, with the ratio measured on the **longer** side so a portrait photo from a phone passes — Tripadvisor accepts landscape only because its layout is, and phones shoot portrait. Added and removed for exactly as long as the review text can be edited. |
| R11 | **Anyone signed in may flag** a review, or one of its photos, and a platform manager works the queue oldest first. Reporting changes nothing on its own. A unique key, not a check, stops the same person flagging the same thing twice; Postgres treats NULLs as distinct, so a partial index covers reports against a whole review. |
| R12 | **A hotel can no longer hide a review of itself.** `PATCH /reviews/:id/visibility` answers only to a platform manager; a hotel reports a review like anybody else. A hotel free to hide what it dislikes hides every bad review, which is why Tripadvisor does not let one. This **changes R5** and is a breaking change for any FE calling that endpoint as the owner. |
| R13 | A manager **hides** a flagged photo rather than deleting it: a decision has to keep the evidence it was made on. A hidden photo never reaches a reader. The author deleting their own photo still removes the file. |
| R14 | **No automatic filter.** Booking.com screens uploads with machine learning in seconds; StayReco has no such pipeline, so content is live until somebody flags it. Detecting AI-generated photos is not attempted: independent 2026 tests put detectors at 18–31% against recent generators, so it would flag more real guest photos than generated ones. `AI_GENERATED` is a reason a **person** picks, which is how Tripadvisor enforces its own ban. |

### Promotions and vouchers (P1–P8, decided 2026-11-09)

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | A booking takes a promotion **or** a voucher, **never both**. [money-rules.md §2.1](../money-rules.md) says "promotion or voucher discount", so this was already decided; the code follows it. Loyalty points stay a separate, third subtraction.                                                                                                                         |
| P2  | When both could apply, the backend uses **whichever saves more**, so typing a code can never leave a customer worse off. A tie goes to the code, so a personal voucher is the one spent.                                                                                                                                                                                  |
| P3  | A `Promotion` is a **campaign**: it applies by itself, with nothing typed. A `Voucher` is **one customer's personal code** under a campaign, with its own `maxDiscount` and `expiresAt`. The schema already said this: `Promotion` has no `code` column, `Voucher` has `code @unique` and a `customerId`.                                                                 |
| P4  | A campaign that has **issued vouchers stops applying automatically**. Once a hotel hands out personal codes it is addressing chosen customers; applying the same campaign to everyone would make those codes pointless. Until the schema has a `requiresCode` column, "has vouchers" is what marks a campaign as code-only.                                               |
| P5  | A code that cannot be used answers **its own error**, never a silent fallback to a campaign. A customer who typed a code should be told why it did not work instead of watching the total stay the same. Someone else's code answers `VOUCHER_NOT_FOUND`, not `FORBIDDEN`, so codes cannot be probed.                                                                     |
| P6  | The discount is **taken inside the booking's transaction** under conditional updates, so two bookings racing for one code, or for a campaign's last use, cannot both win. The loser gets `BOOKING_PRICE_CHANGED` rather than quietly paying more than it agreed to.                                                                                                       |
| P7  | A code is **given back** wherever the stay never happens: a hold that expired unpaid, a cancellation with nothing to refund, and an approved refund. Releasing also clears `voucher_id` from that booking, because the column is unique and a dead booking holding the code would block the customer forever. What was charged stays on the invoice and in the audit log. |
| P8  | A campaign is **never deleted**, only switched off, and an edit never rewrites `currentUses`: bookings point at the campaign, and lowering `maxUses` below the uses already made stops it rather than rewriting history.                                                                                                                                                  |

### Loyalty (L1–L7, decided 2026-11-10)

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | **One platform-wide programme**, not one per hotel. `loyalty_program.hotel_id` becomes nullable and `null` is the platform programme, exactly as `promotion.hotel_id` already works. The schema required a hotel, which gave a customer a separate balance at every hotel: a guest who stays once at each ends up with scraps that never add up to anything, and the programme stops doing the one job it has. A hotel may still run its own alongside it. |
| L2  | Seeded as **StayMiles**: 1 point per 1,000 ₫ spent, a point worth 100 ₫ when spent, so about a tenth of a stay comes back on the next one. Both rates live on the programme row, so they can be changed without a deploy.                                                                                                                                                                                                                                  |
| L3  | Points are earned at **check-out**, on what the booking was **actually paid**, not its list price: a customer earns on money spent, so a discount lowers the points too. Earning rounds **down**. A no-show earns nothing.                                                                                                                                                                                                                                 |
| L4  | Points are the **third subtraction** of the price (money-rules §2.1) and **stack** on top of a promotion or voucher, unlike those two which exclude each other. They are capped at what the stay still owes, so a stay can reach 0 ₫ but never below, and points beyond that stay on the balance rather than being burnt.                                                                                                                                  |
| L5  | Spending runs **inside the booking's transaction** and lowers the balance conditionally, like the discount (P6), so two bookings racing for the same points cannot both win. Points come back wherever the stay never happens, guarded by their own entry so a second release cannot credit them twice.                                                                                                                                                    |
| L6  | **Tiers come from `lifetime_points`**, a new column that rises on every earn and never falls, so spending points cannot drop a customer a tier. MEMBER 0, SILVER 10k, GOLD 30k, PLATINUM 100k, as constants for now. Tiers carry no benefit yet; they are a label the rewards screen shows.                                                                                                                                                                |
| L7  | Point movements are written to the **audit log**, keyed by the loyalty account, instead of a table of their own — the same approach [money-rules.md §7.1](../money-rules.md) takes for cancellation reasons and fees.                                                                                                                                                                                                                                      |

### Customer wallet (W1–W3, decided 2026-11-10)

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | Paying from the wallet is **all or nothing**: a booking is paid entirely from the balance, or entirely by transfer. Paying part of one would mean SePay matching an amount that depends on a balance held at booking time, which brings the risk of one balance paying two bookings at once, of the hold expiring without the money being returned, and of a transfer landing after the booking is gone. Since the wallet is only ever filled by refunds, a balance is usually large enough to cover a whole booking anyway. Part payment can be revisited if customers turn out to be blocked by a small shortfall. |
| W2 | A wallet payment changes **where the money came from, not the money model**: the hotel is still credited the full amount into its **pending** balance exactly as a transfer would (BR-22), so commission, settlement and refunds work on a wallet-paid booking unchanged. The invoice records the source as `WALLET`. |
| W3 | **Withdrawing** the customer wallet to a bank account is **not built** and moves to [phase 6](./phase-6-reporting-admin.md). It needs somewhere to keep the customer's bank details, a request with a status and a platform manager to mark it paid — the same machinery partner withdrawals need (BR-22), which [money-rules.md §9](../money-rules.md) already puts in phase 6. Building a second, parallel flow now would be thrown away when phase 6 unifies them. Until then the balance can be spent on a stay but not taken out, which the wallet screen should say. |

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

- Review screen: load `GET /rating-criteria` and render one slider per criterion; the overall rating is **not** an input, it comes back from the API.
- Show the "Write a review" button from `GET /bookings/:id/review-eligibility` rather than re-implementing the rules.
- Hotel page: the review list and `GET /hotels/:hotelId/rating-summary` (average, star distribution, per-criterion averages).
- The photo upload is live: `POST /reviews/:id/images` (multipart, field `file`), `DELETE /review-images/:id`. Show the rules before the picker — 5 photos, 10MB, JPEG/PNG/WebP, 1:1 to 4:3 either way up.
- Add the flag under every review (`POST /reviews/:id/reports`), for every signed-in role. The partner portal needs it too: a hotel reports a review, it can no longer hide one (R12).
- The "hotel replies within 24h" line still has no API behind it; hide it until R9 is decided.

## Open questions

- [ ] **Loyalty: per hotel or platform-wide?** The schema says per hotel (`loyalty_program.hotel_id` is required), the FE prototype draws one platform-wide "Ví điểm StayMiles" with tiers. The two cannot both be true; taking the FE route means a migration.
- [ ] **How much is a point worth** when spent, and is it earned on the total or on the amount after discounts?
- [ ] **Paying from the wallet**: part of a booking with the rest by transfer, or all-or-nothing? This touches the SePay flow, where the transferred amount must match the booking exactly.
- [ ] Automatic NSFW screening on upload through the Cloudinary add-on already in use (~$0.001 an image).
- [ ] A hotel's written reply to a review (R9): a field on `review` or its own table, and whether a reply can be edited.
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

| Date       | Who  | Change                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-09 | Phúc | Promotions and vouchers built (P1–P8): campaign CRUD, issuing personal codes, the discount quote, the discount applied and released on `POST /bookings`. Six new error codes, the `DiscountType` enum, and [api/promotions.md](../api/promotions.md). money-rules §2.1 updated                                                                                  |
| 2026-11-10 | Phúc | Loyalty built (L1–L7): the programme made platform-wide with a migration, points earned at check-out, spent as the third subtraction, given back when a stay never happens, tiers from lifetime points, history off the audit log. Two new error codes, the `LoyaltyTier` enum, and [api/loyalty.md](../api/loyalty.md). Wallet decision W1 recorded, not built |
| 2026-11-11 | Phúc | The four branches merged into `develop`. The stay subtotal now adds up every room type of a booking (PR #109), so the discount and the points come off that sum; a booking points at its hotel rather than one room type, which the review, loyalty and wallet queries follow |
| 2026-11-11 | FE | Web customer integration on `feat/phase-4-frontend`: `/account/rewards`, `/account/wallet`, `/account/preferences`, `/account/bookings/[id]/review`, the hotel page reviews, discount code and points on `/booking`, pay with wallet on `/booking/payment`. Partner screens (promotions, review moderation) are not connected yet |
| 2026-11-12 | Phúc | Review photos and content reports built (R10–R14): 5 photos a review with Tripadvisor's shape rules, the flag under every review for every role, and a platform manager's queue. Hiding a review moves from the hotel to a platform manager, which changes R5 and breaks that endpoint for FE callers using owner access |

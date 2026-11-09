# Phase 4: Loyalty, promotions, reviews

| | |
|---|---|
| Phase status | 🟡 Reviews BE done; loyalty, promotions and the customer wallet not started |
| API status | Reviews: `BE Done` (merged into `develop`, FE can integrate) · the rest: none yet |
| Agreed on | Reviews: 2026-11-09 (decisions R1–R9). Loyalty, promotions and wallet: not agreed yet |
| BE owners | Phúc |
| FE owners | |
| API | [api/reviews.md](../api/reviews.md). When the other parts start: write their endpoints in [api/](../api/README.md) |

> Rules for every API: [api-guide.md](../api-guide.md). Money rules (final price, discounts, wallet): [money-rules.md](../money-rules.md), kept in sync with this file.

## Goal

Keep customers coming back: rate the stay they just had, pay less next time with points and discount codes, and spend the money sitting in their wallet.

## Scope

**Backend**

- **Reviews** after check-out (BR-12): rating criteria, writing and editing a review, a hotel's reviews and rating figures, hiding a review. ✅ built
- **Loyalty** per hotel (BR-11): the hotel's programme, points earned at check-out, points spent as a discount when booking
- **Promotions and vouchers** (BR-06): the hotel's campaigns, a discount code checked and applied while booking
- **Customer wallet**: balance and history, paying a booking from the wallet, withdrawing ([money-rules.md §9](../money-rules.md))
- **Preferences**: the key-value preferences the recommender of [phase 5](./phase-5-ai-marketing.md) reads

**Frontend web / mobile** (pages already have UI in `frontend/src/app`)

- `account/bookings/[id]/review`, hotel page review section
- `partner/loyalty`, `partner/promotions`
- `account/rewards`, `account/wallet`, `account/preferences`

## Out of scope

- The partner withdrawing from the hotel wallet (BR-22) and the admin setting the holding period → phase 6 ([money-rules.md §9](../money-rules.md))
- Alerts on negative reviews (UC42, decision O13 of [phase 3](./phase-3-operations.md)) → now unblocked by reviews, but built later
- Review photos and a hotel's written reply → drawn in the FE prototype, not built; see R8 and R9
- `account/profile` → already built outside this phase (every account edits its profile and avatar)

## Agreed decisions

### Reviews (R1–R9, decided 2026-11-09)

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
| R9 | **Review photos and a hotel's reply are not built.** The FE prototype draws both, but `review` has no image relation and no reply field, so both need a new table and a migration. Deferred rather than guessed at; see the open questions. |

### Loyalty, promotions, wallet

Not agreed yet. The open questions below have to be answered before the code is written, because three of them change the schema.

## States

```
booking.status: … → COMPLETED        → the stay can be reviewed, for REVIEW_WINDOW_DAYS
review.is_visible: true (at writing) ⇄ false (hidden by the hotel)
```

## Adding endpoints

- Body/query schemas go in `packages/shared/src/schemas/<feature>.ts`, added **before** the code so FE can work in parallel.
- Endpoints, response types, call flows: the `api/` page.
- New error codes: `packages/shared/src/errors.ts` **and** the table in [api-guide.md §4.3](../api-guide.md#43-error-codes).

## FE tasks

- Review screen: load `GET /rating-criteria` and render one slider per criterion; the overall rating is **not** an input, it comes back from the API.
- Show the "Write a review" button from `GET /bookings/:id/review-eligibility` rather than re-implementing the rules.
- Hotel page: the review list and `GET /hotels/:hotelId/rating-summary` (average, star distribution, per-criterion averages).
- The photo upload and the "hotel replies within 24h" line in the prototype have no API behind them; hide them until R9 is decided.

## Open questions

Three of these change the schema, so they are worth settling before the code is written.

- [ ] **Loyalty: per hotel or platform-wide?** The schema says per hotel (`loyalty_program.hotel_id` is required), the FE prototype draws one platform-wide "Ví điểm StayMiles" with tiers. The two cannot both be true. Taking the FE route means a migration.
- [ ] **How much is a point worth** when it is spent, and is it earned on the total or on the amount after discounts?
- [ ] **Do a promotion and a voucher stack**, or does a booking take only one discount? (Pricing rules already answer this for themselves: one rule only, never stacked — [money-rules.md §2.3](../money-rules.md).)
- [ ] **Paying from the wallet**: part of a booking with the rest by transfer, or all-or-nothing? This touches the SePay flow, where the transferred amount must match the booking exactly.
- [ ] **Review photos** (R9): a `review_image` table plus Cloudinary, like the hotel images.
- [ ] **A hotel's reply to a review** (R9): a field on `review` or its own table, and whether a reply can be edited.

## Definition of Done

- [x] Reviews: one per completed stay, the overall rating computed by the BE, never by the client
- [ ] Discounted prices are calculated by the BE; the FE only displays them
- [ ] The phase's [api/](../api/README.md) pages match the code, API status `Integrated`

## Changelog

| Date | Who | Change |
|---|---|---|
| 2026-11-09 | Phúc | Reviews built (R1–R9): rating criteria, writing, editing, a hotel's reviews and rating figures, hiding a review. Five new error codes, `REVIEW_WINDOW_DAYS`, the five seeded criteria, and [api/reviews.md](../api/reviews.md). Photos and hotel replies deferred |

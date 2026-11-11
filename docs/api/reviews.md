# Reviews (phase 4)

Post-stay reviews, BR-12. A guest who completed a stay rates the hotel on a fixed set of criteria and writes a comment; everyone reads those reviews on the hotel page. Decisions are in [phase-4-loyalty-promotions.md](../phases/phase-4-loyalty-promotions.md); the rules for every API (envelope, error codes, pagination) are in [../api-guide.md](../api-guide.md).

Status: `BE Done` — merged into `develop`, FE can integrate.

## How a review works

1. The guest checks out, so the booking becomes `COMPLETED`. From that moment the booking can be reviewed, for `REVIEW_WINDOW_DAYS` (30 by default, an env setting until the admin screen of [phase 6](../phases/phase-6-reporting-admin.md) can hold it).
2. The review screen loads `GET /rating-criteria` and shows one slider per criterion.
3. The guest scores **every** criterion and writes the comment. `POST /bookings/:id/reviews`.
4. The backend computes the overall rating as the weighted average of those scores. **The client never sends an overall rating**: a review whose text and stars disagree would be meaningless, so the number always follows the criteria that were filled in.
5. The review appears on the hotel page at once. The hotel may hide it; a hidden review leaves the public list and the rating figures, but its author still sees it.

One review per booking (`booking_id` is unique). A guest who stays twice writes two reviews.

## Endpoints

| Method | Path | Access | Body / Query | Response |
|---|---|---|---|---|
| GET | `/rating-criteria` | public | | `RatingCriterion[]` |
| GET | `/hotels/:hotelId/reviews` | public | `?sort=&minRating=&page=&pageSize=` (`reviewListQuerySchema`) | `Review[]` + `meta` |
| GET | `/hotels/:hotelId/rating-summary` | public | | `RatingSummary` |
| GET | `/bookings/:id/review-eligibility` | the customer who booked | | `ReviewEligibility` |
| POST | `/bookings/:id/reviews` | the customer who booked | `createReviewSchema` | `Review` (201) |
| GET | `/me/reviews` | customer | `?sort=&minRating=&page=&pageSize=` | `Review[]` + `meta` |
| PATCH | `/reviews/:id` | the author | `updateReviewSchema` | `Review` |
| PATCH | `/reviews/:id/visibility` | member of the reviewed hotel | `{ isVisible }` | `Review` |

### Writing a review

```jsonc
{ "title": "Phòng sạch, nhân viên dễ thương",   // optional, max 255
  "content": "Vị trí ngay bờ sông, đi bộ ra chợ đêm 5 phút...",  // 10-5000 characters
  "subRatings": [                                // every criterion, exactly once
    { "criterionId": "…", "score": 5 },          // 1.0-5.0, at most one decimal
    { "criterionId": "…", "score": 4.5 }
  ] }
```

- Every criterion of `GET /rating-criteria` must appear exactly once. A missing, repeated or unknown criterion is refused rather than guessed: a partial review would let the guest choose what their own overall rating weighs. Missing or repeated → `409 REVIEW_NOT_ALLOWED`; unknown id → `404 RATING_CRITERION_NOT_FOUND`.
- The stay must be `COMPLETED`. Any other status → `409 REVIEW_NOT_ALLOWED`. Someone else's booking → `404 BOOKING_NOT_FOUND` (an outsider cannot tell whether it exists).
- A second review of the same booking → `409 REVIEW_ALREADY_EXISTS`. After the window → `409 REVIEW_WINDOW_CLOSED`.

### Editing

`PATCH /reviews/:id` takes any subset of the same fields and works only for the author, only while the window is open (otherwise `409 REVIEW_WINDOW_CLOSED`). Sending `subRatings` replaces **all** of them and recomputes the overall rating, so send the whole set, not the changed ones.

### Hiding a review

`PATCH /reviews/:id/visibility { "isVisible": false }`, for the owner or staff of the reviewed hotel. A review of another hotel answers `404 REVIEW_NOT_FOUND`. Hiding takes the review out of `GET /hotels/:hotelId/reviews` and out of `RatingSummary`; `GET /me/reviews` still shows it to its author, with `isVisible: false`.

### Showing the "Write a review" button

`GET /bookings/:id/review-eligibility` answers in one call, so the FE does not re-implement the rules:

```jsonc
{ "canReview": false,
  "reason": "REVIEW_ALREADY_EXISTS",   // null when it can; otherwise the error code it would return
  "reviewId": "…",                     // the review already written, when there is one
  "closesAt": "2026-12-09T00:00:00.000Z" }  // end of the window; null when the stay is not completed
```

## Types

```jsonc
// RatingCriterion — heaviest first, the order the review screen shows them in
{ "id": "…", "name": "Vệ sinh & Tiện nghi phòng",
  "description": "Phòng sạch sẽ, trang thiết bị hoạt động tốt",
  "weight": 0.25 }                     // the weights of all criteria add up to 1

// Review
{ "id": "…", "bookingId": "…", "hotelId": "…",
  "authorName": "Nguyễn Văn A.",       // shortened; the full name is never public
  "overallRating": 4.6,                // weighted average, one decimal
  "title": "Phòng sạch, nhân viên dễ thương",
  "content": "…",
  "subRatings": [ { "criterionId": "…", "name": "Vị trí", "score": 5 } ],  // by criterion name
  "isVisible": true,
  "stayedAt": "2026-11-09",            // check-out date of the reviewed stay
  "createdAt": "…", "updatedAt": "…" }

// RatingSummary — the figures of a hotel page, over its visible reviews only
{ "average": 4.6,                      // 0 when the hotel has no review
  "count": 128,
  "distribution": [ { "star": 1, "count": 2 }, … { "star": 5, "count": 70 } ],
  "criteria": [ { "criterionId": "…", "name": "Vị trí", "average": 4.8 } ] }
```

`sort` is `newest` (default), `oldest`, `rating-desc` or `rating-asc`. `minRating` keeps reviews at or above that overall score, for a "4+ stars" filter.

An overall rating of 4.4 counts as **4** in `distribution`; only 5.0 lands in the top bucket.

## Notes for later phases

- Each sub-rating is also written to `user_item_rating`, the user-item matrix the recommender reads in [phase 5](../phases/phase-5-ai-marketing.md). That table holds one score per (customer, hotel, criterion), so a repeat stay at the same hotel updates the earlier score instead of adding a row.
- Alerts on negative reviews (UC42, decision O13 of [phase 3](../phases/phase-3-operations.md)) were waiting for this page and can now be built.
- Not built yet: review photos and a hotel's written reply, both drawn in the FE prototype. Both need new tables; see the open decisions in [phase-4-loyalty-promotions.md](../phases/phase-4-loyalty-promotions.md).

## Common error codes

| Code | Status | When |
|---|---|---|
| `REVIEW_NOT_FOUND` | 404 | The review doesn't exist, or belongs to another customer or hotel |
| `REVIEW_NOT_ALLOWED` | 409 | The stay is not `COMPLETED`, or not every criterion was scored exactly once |
| `REVIEW_ALREADY_EXISTS` | 409 | The booking already has a review |
| `REVIEW_WINDOW_CLOSED` | 409 | More than `REVIEW_WINDOW_DAYS` since check-out |
| `RATING_CRITERION_NOT_FOUND` | 404 | A sub-rating names a criterion that does not exist |
| `BOOKING_NOT_FOUND` | 404 | The booking doesn't exist or belongs to someone else |

The full list is in [../api-guide.md §4.3](../api-guide.md#43-error-codes).

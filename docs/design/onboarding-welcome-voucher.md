# First-login preferences and the welcome voucher

Status: **agreed and backend built** (2026-11-22). Endpoints: [api/onboarding.md](../api/onboarding.md). Web and mobile screens to do.

The supervisor's suggestion: when a customer signs in for the first time, show them hotels, places and views to pick from, keep what they pick as their preferences, and give them a voucher for doing it. The picks give the recommender something to work with for a customer who has no bookings and no reviews yet: the cold-start user of the paper.

Nothing here adds a table. One new kind of campaign, the platform's own, which until now could exist in the schema (`promotion.hotel_id` null) but which no endpoint created and nothing paid for.

## 1. Decisions

| # | Decision |
|---|---|
| W1 | **Who is asked:** every customer who has neither finished nor skipped it, the first time they sign in after this ships. Existing customers are asked too. The data is small, and being asked once costs them a click. "Done" is a preference (`onboardingStatus`), so no column is needed. |
| W2 | **What they pick**, all optional, **at least 3 picks in total** to finish: <br>• destinations (the cities of the bookable hotels); <br>• hotels they like, from a list of up to 12 bookable hotels with a photo and a price "from"; <br>• views (a new catalog category, W8); <br>• travel styles and room amenities, the same lists as `/account/preferences`; <br>• a budget per night. |
| W3 | **Stored in `customer_preference`, under the keys `/account/preferences` already uses** (`favouriteCity`, `travelStyles`, `roomAmenities`, `budgetPerNight`). Four keys are new: `likedHotels`, `preferredViews`, `onboardingStatus` (`COMPLETED` or `SKIPPED`) and `onboardingAt`. Lists are comma-separated, as the page already writes them. The customer can change everything later on that page. |
| W4 | **The welcome voucher** is one personal code under the platform's **WELCOME** campaign: `hotel_id` null, `requires_code` true, with a fixed id like the platform wallet. It is issued when the customer **finishes** onboarding, not when they skip it; finishing later from the account page still earns it. **Once per customer, ever**, checked under a lock on the account. |
| W5 | **Default terms** (all set in the environment): **5 %** of the rooms, at most **200 000 ₫**, on a stay of at least **500 000 ₫**, valid **30 days**. The percentage is refused at start-up above 8 % (W6). |
| W6 | **A platform campaign takes off at most 8 % of the room subtotal**, which is the lowest commission rate (BR-13). This applies to a percentage and to a fixed amount alike. Platform campaigns are always code-only. |
| W7 | **The platform pays for it, out of its commission.** At check-out or no-show the commission is the rate × (total + platform discount) − platform discount. The hotel nets exactly what it would have without the voucher, and because of W6 the platform never goes below 0 on a booking. A cancelled stay pays no commission, so nobody pays anything, and the code goes back to the customer as today. The commission the platform screens forecast for a stay not yet checked out uses the same formula. The platform discount is computed again from the voucher's terms and the booking's room subtotal; both are fixed at booking time, so no column is needed. |
| W8 | **Views** become a catalog category, **Tầm nhìn**: Hướng biển, Hướng sông, Hướng núi, Hướng phố, Hướng vườn, Hướng hồ bơi. Partners attach them to room types through the existing room-type amenities. They are seeded, not migrated. |
| W9 | **The customer is told** in an in-app notification with the code and its expiry, and the onboarding answer returns the voucher, so the screen can show it at once. No email. |
| W10 | **The recommender** reads the picks as the paper's knowledge-based pre-filter and boost: destination, budget and views filter or lift hotels; it does not change the scoring model. Whether liked hotels also feed the content component is Phúc's call, because that departs from the paper. |
| W11 | **Hotels are picked last, from hotels that fit the earlier answers** (2026-11-25). Offered first, out of the 12 best reviewed hotels anywhere, the hotel step contradicted the rest: customers tick hotels by photo, not by style, and a customer who chose "Nghỉ dưỡng" ticked two homestays, which then outweighed the style for the recommender. The screen now asks destinations, then taste, then hotels, and `GET /me/onboarding/hotels` offers only hotels in the cities picked that fit the style picked, ranked by the amenities and views picked. `options.hotels` stays for older apps. |

## 2. API

| Method | Path | Who | Body | Answer |
|---|---|---|---|---|
| GET | `/me/onboarding` | customer | | `{ status, options, voucher }` |
| POST | `/me/onboarding` | customer | `{ cities?, hotelIds?, viewIds?, travelStyles?, roomAmenities?, budgetPerNight? }` | `{ status: 'COMPLETED', voucher }` (200) |
| POST | `/me/onboarding/skip` | customer | | `{ status: 'SKIPPED' }` |

- `status` is `NEW`, `SKIPPED` or `COMPLETED`. The frontend shows the screen on `NEW`, and offers it again from the account page on `SKIPPED`.
- `options`: `destinations[]` (`city`, number of hotels, a cover photo), `hotels[]` (up to 12, as search results), `views[]` (catalog amenities of **Tầm nhìn**). Travel styles and room amenities stay the frontend's own lists, as on `/account/preferences`.
- `voucher` is the welcome code once issued, otherwise null. It uses the same shape as `GET /me/vouchers`.
- Errors:
  - `400 VALIDATION_ERROR`: fewer than 3 picks, an unknown city, hotel or view, or `budgetPerNight` not a positive whole amount.
  - `409 ONBOARDING_ALREADY_COMPLETED`: posting again after finishing. To change the picks, use `PUT /me/preferences`.

## 3. Money rules (money-rules §2.1 and §5.4)

- A platform-wide discount is at most 8 % of the room subtotal and is paid out of the platform's commission: commission = round(rate × (total + platform discount)) − platform discount.
- Example: rooms 2 000 000 ₫, commission 10 %, welcome voucher 5 % (100 000 ₫).
  - The guest pays 1 900 000 ₫.
  - The commission is 200 000 − 100 000 = 100 000 ₫.
  - The hotel nets 1 800 000 ₫, the same as without the voucher.
- A hotel's own campaigns and vouchers are unchanged: the hotel pays for them (M4).

## 4. Out of scope

- An admin screen to change the WELCOME terms: they live in the environment.
- Other platform campaigns: holidays, returning guests. W6 and W7 already cover them when someone builds them.
- Abuse through many accounts. An account needs a verified email to sign in, and each account gets one code. At capstone scale that is accepted.

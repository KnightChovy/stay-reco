# First-login preferences and the welcome voucher

> Rules for every API: [api-guide.md](../api-guide.md). Design and decisions W1–W10: [design/onboarding-welcome-voucher.md](../design/onboarding-welcome-voucher.md). Money: [money-rules.md §2.1, §5.4](../money-rules.md).

When a customer signs in, the frontend asks `GET /me/onboarding`. On `NEW` it shows a screen to pick destinations, then travel styles, room amenities, views and a budget, and last the hotels that fit those answers. Finishing saves the picks as the customer's preferences and gives them a **welcome voucher** from the platform; skipping saves only that they skipped.

```
NEW ──skip──→ SKIPPED ──finish──→ COMPLETED
 └──────────────finish───────────────┘
```

## Endpoints

| Method | Path | Who | Body | Answer |
|---|---|---|---|---|
| GET | `/me/onboarding` | customer | | `Onboarding` |
| GET | `/me/onboarding/hotels` | customer | `?cities=&travelStyles=&roomAmenities=&viewIds=&budgetPerNight=` (`onboardingHotelsQuerySchema`, lists repeated) | `OnboardingHotelSuggestion[]` |
| POST | `/me/onboarding` | customer | `completeOnboardingSchema` | `Onboarding` (200) |
| POST | `/me/onboarding/skip` | customer | | `Onboarding` (200) |

```jsonc
// GET /me/onboarding
{
  "status": "NEW",                       // NEW | SKIPPED | COMPLETED
  "options": {                           // null once COMPLETED
    "destinations": [ { "city": "Đà Nẵng", "hotels": 4, "imageUrl": "https://…" } ],
    "hotels": [ { "id": "…", "name": "An Nhiên Riverside", "city": "Đà Nẵng", "starRating": 4,
                  "imageUrl": "https://…", "rating": 4.6, "reviewCount": 12 } ],   // kept for older apps; the screen uses /hotels
    "views": [ { "id": "…", "name": "Hướng biển", "icon": "waves", "category": "Tầm nhìn" } ]
  },
  "voucher": null                        // the welcome code once issued, shaped as in GET /me/vouchers
}

// GET /me/onboarding/hotels?cities=Đà Nẵng&travelStyles=resort&roomAmenities=pool&budgetPerNight=2000000
[ { "id": "…", "name": "Sơn Trà Resort & Spa", "city": "Đà Nẵng", "starRating": 4, "imageUrl": "https://…",
    "rating": 4.1, "reviewCount": 118,
    "matches": ["Nghỉ dưỡng & thư giãn", "Hồ bơi"],   // what of the answers it fits, for the card
    "pricePerNightFrom": 2600000, "overBudget": false } ]   // up to 12, best fit first

// POST /me/onboarding  (every list optional, at least 3 picks in total; a budget counts as one)
{ "cities": ["Đà Nẵng"], "hotelIds": ["…"], "viewIds": ["…"],
  "travelStyles": ["resort"], "roomAmenities": ["pool", "breakfast"], "budgetPerNight": 2000000 }
```

## What the frontend needs to know

- **When to show it.** After sign-in, on `status: "NEW"` only. A customer with no answer saved who has already completed a stay (an account from before onboarding) reads `SKIPPED`, not `NEW`: the screen is for newcomers, and the account page still offers it. Offer it again from the account page on `SKIPPED`; finishing it then still earns the code. On `COMPLETED` the picks are edited on `/account/preferences` (`PUT /me/preferences`).
- **The order of the screen: destinations, then taste, then hotels.** Hotels come last so a customer cannot pick one that contradicts what they just said (a resort lover ticking three homestays, decision W11). The hotel step asks `GET /me/onboarding/hotels` with the answers given so far; when the customer goes back and changes one, drop the hotels they had ticked, since those were offered for the old answers.
- **Hotels that fit the answers** (`GET /me/onboarding/hotels`):
  - Only bookable hotels in the cities picked; every city when none was picked.
  - A hotel fits a travel style when its name, description, amenities and room types use at least two of that style's phrases **and** that style is one of its strongest. A business hotel that mentions the beach once is not a resort. The phrases are the recommender's own vocabulary (`STYLE_WORDS` in `recommender/reco_pipeline.py`), kept in `backend/src/modules/onboarding/onboarding-taste.ts`: change both together.
  - With a style chosen, only hotels of a chosen style are offered. With no style, a room amenity or view picked decides; with nothing picked, every hotel is offered.
  - Ranked by fit: style phrases matched, then each amenity and view picked that the hotel has, then rating, reviews and name. `matches` lists them in words for the card.
  - A hotel whose cheapest night is more than 20% over `budgetPerNight` comes last with `overBudget: true` (the recommender's `BUDGET_SLACK`).
  - At most 12. An empty list means nothing fits: say so and let the customer finish without a hotel.
- **What is offered.** Destinations, hotels and views come from `options`: only bookable hotels and their cities, and the catalog amenities of the **Tầm nhìn** category. Sending anything else is `400 VALIDATION_ERROR`, with `details[].field` such as `cities.0`. Travel styles and room amenities are the frontend's own lists, the same ids `/account/preferences` uses (`resort`, `pool`, …); lowercase letters, digits and hyphens.
- **Where the picks go** (`customer_preference`, comma-separated lists as `/account/preferences` writes them):

  | Key | From | Note |
  |---|---|---|
  | `favouriteCity` | `cities[0]` | the single city `/account/preferences` shows |
  | `preferredCities` | `cities` | all of them |
  | `likedHotels` | `hotelIds` | |
  | `preferredViews` | `viewIds` | amenity ids |
  | `travelStyles`, `roomAmenities` | as sent | same keys as `/account/preferences` |
  | `budgetPerNight` | `budgetPerNight` | whole dong, like that page's budget |
  | `onboardingStatus`, `onboardingAt` | | `COMPLETED` / `SKIPPED`, and when |

  A list left out leaves its key as it was.
- **The welcome voucher** is in the answer of `POST /me/onboarding`, so the screen can show the code at once. It also appears in `GET /me/vouchers` and in an in-app notification linking to `/account/rewards`.
  - Defaults: **5 %** of the rooms, at most **200,000 ₫**, on a stay of at least **500,000 ₫**, valid **30 days**, at every hotel.
  - The customer types it at checkout like any code. `hotelId: null` on it means "any hotel".
  - **One per customer, ever.** A second `POST /me/onboarding` answers `409 ONBOARDING_ALREADY_COMPLETED`.
- **Who pays.** The platform pays, out of its commission (money-rules §2.1, §5.4): the hotel nets exactly what it would have without the code. Nothing changes for the hotel's screens.

## Errors

| Code | HTTP | When |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Fewer than 3 picks; a city, hotel or view that was not offered; a list with duplicates or more than 20 items; on `/hotels`, a style or amenity id that is not lowercase letters, digits and hyphens, or a view id that is not a UUID |
| `ONBOARDING_ALREADY_COMPLETED` | 409 | Finishing or skipping after it was completed |

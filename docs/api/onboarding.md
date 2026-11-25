# First-login preferences and the welcome voucher

> Rules for every API: [api-guide.md](../api-guide.md). Design and decisions W1–W10: [design/onboarding-welcome-voucher.md](../design/onboarding-welcome-voucher.md). Money: [money-rules.md §2.1, §5.4](../money-rules.md).

When a customer signs in, the frontend asks `GET /me/onboarding`. On `NEW` it shows a screen to pick destinations, hotels, views, travel styles, room amenities and a budget. Finishing saves the picks as the customer's preferences and gives them a **welcome voucher** from the platform; skipping saves only that they skipped.

```
NEW ──skip──→ SKIPPED ──finish──→ COMPLETED
 └──────────────finish───────────────┘
```

## Endpoints

| Method | Path | Who | Body | Answer |
|---|---|---|---|---|
| GET | `/me/onboarding` | customer | | `Onboarding` |
| POST | `/me/onboarding` | customer | `completeOnboardingSchema` | `Onboarding` (200) |
| POST | `/me/onboarding/skip` | customer | | `Onboarding` (200) |

```jsonc
// GET /me/onboarding
{
  "status": "NEW",                       // NEW | SKIPPED | COMPLETED
  "options": {                           // null once COMPLETED
    "destinations": [ { "city": "Đà Nẵng", "hotels": 4, "imageUrl": "https://…" } ],
    "hotels": [ { "id": "…", "name": "An Nhiên Riverside", "city": "Đà Nẵng", "starRating": 4,
                  "imageUrl": "https://…", "rating": 4.6, "reviewCount": 12 } ],   // up to 12, best reviewed first
    "views": [ { "id": "…", "name": "Hướng biển", "icon": "waves", "category": "Tầm nhìn" } ]
  },
  "voucher": null                        // the welcome code once issued, shaped as in GET /me/vouchers
}

// POST /me/onboarding  (every list optional, at least 3 picks in total; a budget counts as one)
{ "cities": ["Đà Nẵng"], "hotelIds": ["…"], "viewIds": ["…"],
  "travelStyles": ["resort"], "roomAmenities": ["pool", "breakfast"], "budgetPerNight": 2000000 }
```

## What the frontend needs to know

- **When to show it.** After sign-in, on `status: "NEW"` only. Offer it again from the account page on `SKIPPED`; finishing it then still earns the code. On `COMPLETED` the picks are edited on `/account/preferences` (`PUT /me/preferences`).
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
| `VALIDATION_ERROR` | 400 | Fewer than 3 picks; a city, hotel or view that was not offered; a list with duplicates or more than 20 items |
| `ONBOARDING_ALREADY_COMPLETED` | 409 | Finishing or skipping after it was completed |

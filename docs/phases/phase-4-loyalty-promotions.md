# Phase 4: Loyalty, promotions, reviews

| | |
|---|---|
| Phase status | ⬜ Not started |
| API status | None yet |
| API | None yet. When the phase starts: fill in this file from [`_template.md`](./_template.md) and write the endpoints in [api/](../api/README.md). |

## Goal

Keep customers coming back: reward points, promotions, post-stay reviews, wallet, profile and preferences.

## Scope

**Backend**

- Loyalty programs per hotel
- Promotions and discount codes applied to bookings
- Reviews after check-out
- Customer wallet, profile, preferences

**Frontend web / mobile** (pages already have UI in `frontend/src/app`)

- `partner/loyalty`, `partner/promotions`
- `account/rewards`, `account/wallet`, `account/profile`, `account/preferences`
- `account/bookings/[id]/review`

## Definition of Done

- [ ] Discounted prices are calculated by the BE; the FE only displays them
- [ ] The phase's [api/](../api/README.md) pages match the code, API status `Integrated`

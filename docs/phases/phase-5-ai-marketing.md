# Phase 5: AI recommendations and marketing

| | |
|---|---|
| Phase status | 🟡 Brand voice and the AI cost cap built; everything else not started |
| API status | Brand voice and budget: `BE Done` · the rest: none yet |
| Agreed on | Marketing: 2026-11-12 (M1–M6). Recommendations: not agreed yet |
| BE owners | Phúc |
| FE owners | |
| API | [api/marketing.md](../api/marketing.md). As the other parts start: write their endpoints in [api/](../api/README.md) |

> Rules for every API: [api-guide.md](../api-guide.md).

## Goal

AI hotel recommendations, a conversational assistant, and marketing content tools for hotels.

## Scope

**Backend — marketing**

- **Brand voice** per partner, worked out from posts the hotel already publishes. ✅ built
- **Cost cap and usage log** for every model call (Definition of Done). ✅ built
- **Content generation**: drafts written in that voice, with an approval step
- **Scheduling**: a calendar of what goes out when
- **Publishing** to Facebook / Instagram / TikTok, and the metrics that come back

**Backend — recommendations**

- pgvector, hotel embeddings (CONVENTIONS §3.7)
- Personalised recommendations, the conversational assistant
- Blog

**Frontend web / mobile** (pages already have UI in `frontend/src/app`)

- `partner/ai-brand`, `staff/marketing/*` (content, calendar, analytics)
- `(landing-page)/recommendations`, `(landing-page)/assistant`, `blog`, `FloatingAiButton`

## Out of scope

- Screening uploads with a model (R14 of [phase 4](./phase-4-loyalty-promotions.md)) → that is content moderation, not marketing
- Detecting AI-generated images → see R14; 2026 detectors are not accurate enough to act on

## Agreed decisions

### Marketing (M1–M6, decided 2026-11-12)

| # | Decision |
|---|---|
| M1 | The brand voice is **learned from the hotel's own posts**, not filled in on a form. The owner pastes 2–5 posts they are happy with and the model describes the voice it finds; that description goes into every later prompt. Asking an owner to describe their own tone rarely works — few can, and fewer do it consistently. This is also what Jasper and the hospitality platforms settled on. |
| M2 | The voice lives in **`ai_config`**, the key-value table the schema already had, keyed to the **partner** rather than the hotel, so a chain shares one voice. A new field needs no migration. A hotel with no voice still works: the writer falls back to a plain, warm brief. |
| M3 | **Every model call goes through one service.** It checks the hotel's remaining budget before the call and writes an `ai_usage` row after it. Enforcing both in one place is what makes "every call is logged" true a year from now, when a feature nobody has written yet also needs the model. |
| M4 | **The cap is per hotel per calendar month**, in US dollars (`AI_MONTHLY_BUDGET_USD`, default $5). Prices are written down in the code, not fetched: a cap has to be computable without a network call. An unknown model is charged the most expensive rate we know, because an unpriced model that costs nothing would quietly disable the cap. The check is not transactional — two simultaneous calls can overshoot by one, which is cheaper than holding a lock for the length of a model call. |
| M5 | **No API key means the feature is off, not that the server fails to start.** The marketing endpoints answer `503 AI_UNAVAILABLE`, the shape the Cloudinary settings already use. A deployment without a key still runs everything else. |
| M6 | **Publishing is built last, and manual scheduling ships before it.** Posting to Facebook, Instagram and TikTok needs their app review — Meta also wants business verification — which can take weeks or be refused outright. That is a schedule risk, not a technical one, so the review is requested in parallel while the parts that depend on nobody are built. If review does not land, generate → approve → schedule → copy out by hand is still a usable product. |

### Recommendations

Not agreed yet.

## States

```
ai_config: one row per brand-voice field, per partner
ai_usage:  one row per model call; the month's rows summed give the spend

marketing_content.status: DRAFT → PENDING_APPROVAL → APPROVED → SCHEDULED → PUBLISHED
                                                   ↘ REJECTED
content_schedule.status:  SCHEDULED → PUBLISHED | FAILED | CANCELLED
```

## The build order

| # | Part | Waits on |
|---|---|---|
| 1 | Brand voice, cost cap ✅ | nobody |
| 2 | Content generation + approval | nobody |
| 3 | Calendar, manual scheduling | nobody |
| 4 | OAuth + publishing | ⚠️ Meta / TikTok app review |
| 5 | Metrics | ⚠️ same review |

## What to copy from Postiz

[gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) (AGPL-3.0) solves the publishing half on the same stack — NestJS, PostgreSQL, Prisma — across 37 platforms. Worth copying when part 4 starts:

- **One interface, one file per platform.** Every provider implements `generateAuthUrl`, `authenticate`, `refreshToken`, `post`, `maxLength`, `checkValidity`, and optionally `analytics`. `SocialAccount` already matches that shape.
- **`checkValidity()` runs on the backend before the call goes out.** Limits differ per platform and generated text overruns them easily; catching it client-side is not enough.
- **Asynchronous posting needs a state between "sent" and "published".** TikTok accepts a video and processes it later. Postiz's interface warns that a status check must report `completed` once finalisation succeeded, "not `ready` again. This prevents a retry from duplicating a post." Our `ScheduleStatus` has no such state, so **part 4 needs a migration** adding one.
- Postiz runs its jobs on Temporal; `PeriodicJob` in this repo is enough at our size.

Where we should **not** copy it: Postiz asks the user what to write. A hotel booking system already knows what is worth writing about — rooms free this weekend, a promotion running, a new five-star review, the amenities the hotel sells. Suggesting the subject is the part worth building ourselves.

## FE tasks

- `partner/ai-brand`: a paste box for 2–5 posts → `POST /hotels/:hotelId/brand-voice/learn`, then show the voice it found and let the owner edit it. `forbiddenWords` is the field most often written by hand.
- Show the month's spend from `GET /hotels/:hotelId/ai-budget` next to any generate button, and handle `AI_BUDGET_EXCEEDED` by saying when it resets.
- Hide the AI features when the endpoints answer `503 AI_UNAVAILABLE`, rather than showing a broken button.

## Open questions

- [ ] Who approves content a staff member wrote — the owner, or staff holding the `MARKETING` permission?
- [ ] Should generated content be labelled as AI-written where guests see it?
- [ ] All three platforms, or Facebook only to start?
- [ ] Is $5 a hotel a month the right cap, and should a partner be able to raise it?
- [ ] `social_account.access_token` is plain text. The repo encrypts partner bank details with `field-cipher.ts`; the same should apply before any token is stored.

## Definition of Done

- [x] Model call costs are capped and every call is logged
- [ ] The phase's [api/](../api/README.md) pages match the code, API status `Integrated`

## Changelog

| Date | Who | Change |
|---|---|---|
| 2026-11-12 | Phúc | Brand voice and the AI cost cap built (M1–M6): voice learned from the hotel's own posts, `ai_usage` logging every call, a monthly dollar cap per hotel, and the writer switched off cleanly when no API key is set. Three new error codes and [api/marketing.md](../api/marketing.md) |

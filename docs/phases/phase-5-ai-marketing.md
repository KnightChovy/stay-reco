# Phase 5: AI recommendations and marketing

| | |
|---|---|
| Phase status | 🟡 Marketing done (TikTok excluded by decision); recommendations not started |
| API status | Marketing, all 22 endpoints: `BE Done` · recommendations: none yet |
| Agreed on | Marketing: 2026-11-12 (M1–M15). Recommendations: not agreed yet |
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
- **Content generation**: drafts written in that voice, with an approval step. ✅ built
- **Scheduling**: a calendar of what goes out when. ✅ built
- **Publishing** to Facebook / Instagram, and the metrics that come back. ✅ built
- **TikTok**: deliberately not built — see M12

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

### Marketing, part two (M7–M15, decided 2026-11-12)

| # | Decision |
|---|---|
| M7 | **Staff write, the owner approves.** A staff member with `MARKETING` asks for a draft, edits and submits; only the owner approves or rejects. Generated copy is published under the hotel's name, and a hotel should not find out what went out after the fact. A rejection carries a reason, so the writer can fix it rather than guess. The text is frozen on approval: what was approved is what is posted. |
| M8 | **The system suggests the subject; it does not ask for it.** `marketing-content/ideas` reads the hotel's own figures — rooms empty in the next 7 nights, a discount running, a review of 4.5★ or better — and hands back briefs ready to generate from. This is the part a general-purpose scheduler cannot do, and it is database queries, so suggestions cost nothing and can be refreshed freely. |
| M9 | **Only approved content can be scheduled**, aimed at one connected page. One approved piece can go to several pages; the first scheduling moves it off `APPROVED`, and `SCHEDULED` is accepted as well so the second is still allowed. |
| M10 | **The writer is told what it may not invent** — prices, dates, discounts, awards, amenities — and never to promise anything about availability or refunds. Tested, so the rules cannot decay into a constant nothing reads. This is what makes pointing the writer at a hotel's live page defensible. |
| M11 | **Tokens are pasted, not obtained through OAuth.** Meta reviews an app for weeks before it may post on a page it does not administer, and the review wants a live privacy policy and a screencast. A long-lived Page token is the same credential by a slower route, so everything underneath is finished and demonstrable now and the OAuth screen is the only part left when review lands. The token is encrypted at rest with the same `FieldCipher` as a partner's bank details and has no field in any response: it can post as the hotel for months, so a leaked row is a leaked ability to post under the hotel's name. This also answers the phase-4-era open question about `social_account.access_token`. Steps: [../social-setup.md](../social-setup.md). |
| M12 | **TikTok is a class that refuses, with its reason.** Its Content Posting API takes a video and nothing else; the writer produces text, and `marketing_content` carries no video. A publisher would be a method that always fails. It exists in the registry so the failure is one clear `501` naming the cause, rather than "no publisher for TIKTOK" from inside a job — and so a hotel can still connect the account and see on the row why nothing went out. |
| M13 | **A platform refusal is recorded, not thrown, and not retried.** The caller is a timer with nobody to tell, so the row becomes `FAILED` and `failureReason` carries the platform's own words — "Session has expired" is the one thing that tells an owner what to do. No retry: a token that expired at 09:00 is still expired at 09:01, and a retry loop against Meta is how an app meets its rate limit. |
| M14 | **There is no publish-now endpoint.** Scheduling with no time means the next run of the job, within a minute, so "post now" is that button with a null `scheduledAt`. Leaving the job as the only writer is what makes a double post impossible without a lease column or a `PUBLISHING` state: a request and a timer firing in the same second would both see a `SCHEDULED` row, and the hotel's followers would see the post twice. This is the cheaper answer to the problem the Postiz notes below predicted a migration for. |
| M15 | **Metrics append rather than overwrite.** A post that gained its reach on day three is a different thing from one that got it in the first hour, and an owner deciding when to post needs to tell them apart. Refreshing is a request, not a job: insight numbers move for days, so a job would have to decide how long to keep asking about every post a hotel ever made. |

### The model: Gemini, not Claude (2026-11-12)

The writer calls **Gemini** (`gemini-3.8-flash` by default), because that is what the team codes against. Only `ai.service.ts` and the price table changed — M3's single door is what made the swap that small, which is the clearest evidence it was worth insisting on.

Three things the swap needed beyond the SDK, each now covered by a test:

- **Structured output.** Gemini takes JSON Schema, not a Zod schema, and rejects `$schema` and `additionalProperties`, both of which Zod emits. `response-schema.ts` strips them. The answer is still parsed back through the Zod schema: structured output is a strong request, not a guarantee.
- **Token counting.** `promptTokenCount` *includes* the cached part, and `thoughtsTokenCount` is billed as output but is *not* in `candidatesTokenCount`. Counting either naively gets the bill wrong in opposite directions.
- **Dated prices.** Flash doubles in price on 2027-01-01. Both halves are in the table, so nothing is recorded at half cost on the day it lands.

Thinking is off: the hard part of a caption is the voice, not the reasoning, and thinking bills at the output rate. A draft costs about **$0.0005**, so the $5 cap is roughly 9,000 drafts a month.

### Recommendations

Not agreed yet.

## States

```
ai_config: one row per brand-voice field, per partner
ai_usage:  one row per model call; the month's rows summed give the spend

marketing_content.status: DRAFT → PENDING_APPROVAL → APPROVED → SCHEDULED → PUBLISHED
                                                   ↘ REJECTED
content_schedule.status:  SCHEDULED → PUBLISHED | FAILED | CANCELLED
                          one job, every minute, is the only writer (M14)

content_metric: one row per refresh, never overwritten (M15)
```

## The build order

| # | Part | Waits on |
|---|---|---|
| 1 | Brand voice, cost cap ✅ | nobody |
| 2 | Content generation + approval ✅ | nobody |
| 3 | Calendar, manual scheduling ✅ | nobody |
| 4 | Publishing to Facebook + Instagram ✅ | nobody, once M11 made the token pasted |
| 5 | Metrics ✅ | same |
| — | The OAuth connect screen | ⚠️ Meta app review + business verification |
| — | TikTok | video on `marketing_content`, then its app audit (M12) |

Step 4 was expected to wait on app review. It did not have to: review is only needed to act on a page the app's own team does not administer, so a pasted Page token (M11) unblocked the whole second half. What is still genuinely blocked is the **OAuth screen** a third-party hotel would use, and nothing else depends on it.

## What to copy from Postiz

[gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) (AGPL-3.0) solves the publishing half on the same stack — NestJS, PostgreSQL, Prisma — across 37 platforms. Worth copying when part 4 starts:

- **One interface, one file per platform.** Every provider implements `generateAuthUrl`, `authenticate`, `refreshToken`, `post`, `maxLength`, `checkValidity`, and optionally `analytics`. `SocialAccount` already matches that shape.
- **`checkValidity()` runs on the backend before the call goes out.** Limits differ per platform and generated text overruns them easily; catching it client-side is not enough.
- **Asynchronous posting needs a state between "sent" and "published".** TikTok accepts a video and processes it later. Postiz's interface warns that a status check must report `completed` once finalisation succeeded, "not `ready` again. This prevents a retry from duplicating a post." ~~Our `ScheduleStatus` has no such state, so **part 4 needs a migration** adding one.~~ **It did not.** Facebook and Instagram both answer synchronously with the post's id, and making the job the only writer (M14) removes the duplicate-post window without a new state. TikTok is where that state becomes necessary, and TikTok is deferred (M12) — so the migration is deferred with it rather than built for nobody.
- Postiz runs its jobs on Temporal; `PeriodicJob` in this repo is enough at our size.

Where we should **not** copy it: Postiz asks the user what to write. A hotel booking system already knows what is worth writing about — rooms free this weekend, a promotion running, a new five-star review, the amenities the hotel sells. Suggesting the subject is the part worth building ourselves.

## FE tasks

- `partner/ai-brand`: a paste box for 2–5 posts → `POST /hotels/:hotelId/brand-voice/learn`, then show the voice it found and let the owner edit it. `forbiddenWords` is the field most often written by hand.
- Show the month's spend from `GET /hotels/:hotelId/ai-budget` next to any generate button, and handle `AI_BUDGET_EXCEEDED` by saying when it resets.
- Hide the AI features when the endpoints answer `503 AI_UNAVAILABLE`, rather than showing a broken button.

## Open questions

Answered:

- [x] Who approves content a staff member wrote → **the owner** (M7). Staff write and submit; the owner decides what goes out under the hotel's name.
- [x] All three platforms, or Facebook only → **Facebook and Instagram**; TikTok deliberately not built (M12).
- [x] `social_account.access_token` in plain text → **encrypted** with the same `FieldCipher` as bank details, and absent from every response (M11).

Still open:

- [ ] Should generated content be labelled as AI-written where guests see it? Nothing in the API marks it either way today.
- [ ] Is $5 a hotel a month the right cap, and should a partner be able to raise it? At $0.0005 a draft it is ~9,000 drafts, which looks generous rather than tight.
- [ ] Nothing warns an owner before a token expires. `usable` turns false and the next post fails with a clear reason, which is late but not silent.
- [ ] A post longer than a platform's limit is sent and refused, rather than caught first. Postiz's `checkValidity()` is the shape of the fix.

## Definition of Done

- [x] Model call costs are capped and every call is logged
- [x] Marketing: drafts generated in the hotel's voice, approved by the owner, scheduled, published, measured
- [x] [api/marketing.md](../api/marketing.md) matches the code; credentials documented in [../social-setup.md](../social-setup.md)
- [ ] API status `Integrated` (waiting on the frontend)
- [ ] Recommendations: not started

## Changelog

| Date | Who | Change |
|---|---|---|
| 2026-11-12 | Phúc | Pages, calendar, publishing and metrics built (M7–M15): staff write and the owner approves, ideas read out of the hotel's own figures, approved content scheduled onto connected Facebook and Instagram pages by a job that is the only writer, tokens encrypted at rest, platform refusals recorded with the platform's own words, and each metrics refresh kept as its own reading. TikTok deliberately refused with its reason. The AI writer also moved from Claude to Gemini — one file, because every call already went through one door. Eight new error codes, one migration, [../social-setup.md](../social-setup.md), and 359 e2e across 31 suites |
| 2026-11-12 | Phúc | Brand voice and the AI cost cap built (M1–M6): voice learned from the hotel's own posts, `ai_usage` logging every call, a monthly dollar cap per hotel, and the writer switched off cleanly when no API key is set. Three new error codes and [api/marketing.md](../api/marketing.md) |

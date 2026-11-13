# Phase 5: AI recommendations and marketing

| | |
|---|---|
| Phase status | 🟡 Marketing done (TikTok excluded by decision); recommendations not started |
| API status | Marketing, all 27 endpoints: `BE Done` · recommendations: none yet |
| Agreed on | Marketing: 2026-11-12 (M1–M15), 2026-11-13 (M16). Recommendations: not agreed yet |
| BE owners | Phúc |
| FE owners | Web staff marketing screens: branch `feat/phase-5-frontend` |
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

### The owner connects the page (M16, decided 2026-11-13)

| # | Decision |
|---|---|
| M16 | **Three requests, and the owner never sees a token.** `authorize` hands back a Facebook URL, the owner consents, the frontend posts the `code` back to `exchange`, and `connect` stores a token per page they picked. M11 is not retired by this: pasting needs no Meta app at all, which is what let publishing be finished before there was one, and it remains how a page is connected by hand. What changed is who the default route is for - asking a hotel owner to open Graph API Explorer and copy a credential out of a JSON response was never a product. |

Four things this had to get right, each with a test:

- **The redirect lands on the frontend, not the API.** A redirect from Facebook carries no `Authorization` header, so `GET /callback` would arrive unauthenticated and would have to trust `state` for identity as well as integrity. The page the owner lands on posts the code back inside their own session instead, which leaves `state` doing one job and doing it well: it is encrypted with the hotel id in it, so a code obtained while connecting hotel A cannot be replayed onto hotel B by an owner who holds both. That test exists because an owner with two hotels is the normal case, not an attack.
- **No table, and no token in the browser.** `state` and `connectionToken` are both encrypted with the same `FieldCipher` as the stored tokens, so the flow is stateless and the client holds two opaque strings. Decryption failing *is* the signature check. A `connectionToken` stands in for the user access token for ten minutes and is useless to anyone who cannot decrypt it.
- **Nothing is connected automatically, and nothing by halves.** An owner may administer a dozen pages; one of them is this hotel. Step three reads the pages from Facebook again rather than trusting what the browser hands back - a page the app was removed from in between is then simply absent, which is better than storing a token already revoked - and every pick is validated before anything is written.
- **Reconnecting updates the row.** A new unique index on `(hotelId, platform, accountName)` makes that the only option, because a published post's schedule row points at that account, and that record of what went out should survive the token being replaced. It also clears the epoch expiry that disconnecting sets, which is the difference between a reconnected page publishing and silently not.

**App review still gates less than it appears to.** In Development mode this flow is real for anyone holding a role in the app - Admin, Developer, Tester - on pages they administer, so a hotel can connect its own page through the product today by being invited as a Tester. Review plus **Business Verification** are what open it to hotels outside the app, and verification wants a registered legal entity: a company matter, not a code one. Leaving Development mode is the whole migration.

### The picture staff upload (M18, 2026-11-13)

| # | Decision |
|---|---|
| M18 | **Staff upload a file; they do not supply a URL.** `mediaUrl` took a hosted address because that is what Meta needs - it fetches the image itself - but nothing in the API put one there, so illustrating a post meant producing a public URL by hand first. Two endpoints now do it through the same `StorageService` as hotel and review photos. The picture may be changed in exactly the window the words may, and not a moment longer: what the owner approved is what goes out, and a picture swapped after approval would put something on the hotel's page that nobody agreed to. |

The file is deleted when it is replaced, when it is removed, and when the draft is. A `mediaUrl` typed in by hand is left alone on all three: `mediaStorageKey` is null for it, and deleting a file we did not upload would be deleting someone else's on a guess. One migration for that column.

### What the first real post taught (M17, 2026-11-13)

A draft went from Gemini through approval and the job onto a live Page on 2026-11-13 for $0.000856. Publishing worked first time. Reading the figures back did not, and the three reasons were all invisible to the test suite, because a fake publisher answers whatever it is told to:

| # | Decision |
|---|---|
| M17 | **Each figure is fetched so that a refusal costs only that figure.** Meta puts them behind three different permissions - `shares` behind none, `likes.summary` behind `pages_read_engagement`, `comments.summary` behind `pages_read_user_content` - and asking for all three at once meant one refusal returned nothing at all, on a post whose shares were readable. The combined call is still tried first, so a fully-permitted page costs one request, not three. |

Two findings worth keeping, because both are Meta contradicting itself and both cost an afternoon:

- **`comments.summary` requires a permission that cannot be granted.** `pages_read_user_content` was retired from the OAuth dialog - ask for it and the dialog answers `Invalid Scopes` - but the Graph API still demands it to read a comment count. Comments are therefore unobtainable on a Page connected today, regardless of what the app asks for.
- **`post_impressions` was retired in June 2026 across every API version**, replaced by `post_media_view`. It does not fail loudly: it answers `(#100) The value must be a valid insights metric`, which the `catch` around insights turned into a permanent, silent zero. A test with a fake publisher would never have caught it, and neither would a reviewer - the code looked right. This is the argument for publishing to a real page once before calling a feature done.

A figure we are refused is still recorded as zero, which the API documents as "check the token's scopes" rather than "nobody engaged". Distinguishing the two needs a nullable column and is open below.

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
| — | The OAuth connect flow ✅ | works in Development mode; **Business Verification** is what opens it to hotels outside the app (M16) |
| — | TikTok | video on `marketing_content`, then its app audit (M12) |

Step 4 was expected to wait on app review. It did not have to: review is only needed to act on a page the app's own team does not administer, so a pasted Page token (M11) unblocked the whole second half.

The OAuth connect flow was then built on top of it (M16) and turned out not to be blocked either - Development mode runs it for anyone holding a role in the app, so a hotel invited as a Tester connects its own page through the product. What is genuinely blocked is **Business Verification**, which needs a legal entity rather than code, and no part of the system waits on it: leaving Development mode changes nothing but a setting.

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

Every endpoint, its access level and its request schema is in [api/marketing.md](../api/marketing.md). What follows is only what the table cannot tell you.

### The screens, and who may open them

Four, all in the partner portal. There is no customer-facing marketing screen.

The routes already scaffolded in `frontend/src/app`, and what each one now has a backend for:

| Route | Who | Endpoints |
|---|---|---|
| `partner/ai-brand` | **owner** writes, member reads | `GET`/`PATCH /hotels/:id/brand-voice`, `POST .../brand-voice/learn`, `GET .../ai-budget` |
| `staff/marketing/content` | member + `MARKETING` | ideas, generate, the content list, the editor, the image, submit |
| `staff/marketing/calendar` | member + `MARKETING` | social accounts, schedule, `GET .../content-schedules` |
| `staff/marketing/analytics` | member + `MARKETING` | `GET /content-schedules/:id/metrics`, `POST .../metrics/refresh` |

Two things need a home that does not exist yet, and both are **owner-only**, so neither belongs under `staff/`:

- **Approving and rejecting** (`POST /marketing-content/:id/approve` · `reject`). A staff member with `MARKETING` writes and schedules but cannot approve their own words.
- **Connecting a page** - the three-request Facebook flow below, plus the `/social/facebook/callback` route it redirects to.

Read the role off the session rather than hiding on a 403, but expect the 403 anyway.

### One state machine drives the content screen

`DRAFT -> PENDING_APPROVAL -> APPROVED -> SCHEDULED -> PUBLISHED`, with `REJECTED` branching back to the writer. Derive every button from `status`; do not keep a parallel flag.

- **The words and the picture are editable in exactly the same window**: `DRAFT` and `REJECTED`. `PATCH`, `POST .../image` and `DELETE .../image` all answer `409 CONTENT_STATUS_CONFLICT` outside it. What the owner approved is what goes out, photograph included.
- `reject` carries a `reason`; show it at the top of the editor when `status === 'REJECTED'`, because it is the writer's only instruction.
- `DELETE /marketing-content/:id` (204) also deletes the uploaded file. Only a draft can be deleted.

### The image upload

- `POST /marketing-content/:id/image`, `multipart/form-data`, **field name `file`** (not `image`). JPEG/PNG/WebP, 10MB. Answers the whole `MarketingContent` back with the new `mediaUrl`, so render from the response rather than guessing the URL.
- Uploading again **replaces** and deletes the old file; there is no gallery and no second picture. `DELETE .../image` removes it.
- A bad file is `400 UPLOAD_INVALID_FILE` - the type is sniffed from the bytes, so a renamed `.png` is still refused. Show the rules before the picker, as the review upload does.
- `PATCH { mediaUrl }` still accepts a hand-typed URL, kept for a link the hotel already hosts. Prefer the upload; it is the only path that cleans up after itself.
- **The AI never produces a picture.** Every fresh draft has `mediaUrl: null`, and Instagram refuses a post without one (`501 SOCIAL_PLATFORM_UNSUPPORTED`), so the upload is required before an Instagram schedule, not optional.

### Connecting a Facebook page (M16) - the one flow that needs an FE page of its own

Three requests, and the owner never sees a token:

```
GET  /hotels/:id/social-accounts/facebook/authorize   -> { authorizeUrl }
     window.location = authorizeUrl                      (a real navigation, not a fetch)
     Facebook asks which pages, then redirects to META_OAUTH_REDIRECT_URI?code=&state=
POST /hotels/:id/social-accounts/facebook/exchange    { code, state }
     -> { connectionToken, pages: [{ pageId, name, instagramId, connected }] }
     the owner ticks the pages they want
POST /hotels/:id/social-accounts/facebook/connect     { connectionToken, pages: [{ pageId, instagram }] }
```

- **`META_OAUTH_REDIRECT_URI` is a frontend route**, by default `/social/facebook/callback`. It has to exist, read `code` and `state` off its own query string, and post them to the API inside the owner's session - a browser redirect carries no `Authorization` header, which is the whole reason the callback is not a backend route. The exact URI must also be on the Meta app's Valid OAuth Redirect URIs, character for character.
- **`state` and `connectionToken` are opaque and short-lived**: 15 minutes on the consent screen, 10 minutes picking pages. Pass them back untouched; on `400 SOCIAL_OAUTH_INVALID` start the flow again rather than retrying.
- `instagram: true` is only valid on a page whose `instagramId` is not null - the page list already says which. `connected: true` means that page is already stored; the tick is a reconnect, not a duplicate.
- `503 SOCIAL_OAUTH_DISABLED` means the server has no Meta app configured. Fall back to the paste form (`POST /hotels/:id/social-accounts`), which is still there for support and demos.
- `GET /hotels/:id/social-accounts` never returns a token in any field, by design. `usable: false` means the stored token has expired - prompt a reconnect instead of letting the owner schedule onto a dead page.

### The calendar and the figures

- `POST /marketing-content/:id/schedule` takes a future time; a job picks it up **within a minute** of it, so the row is not published the instant the request returns. Poll or refresh; `status` and `failureReason` on the `ContentSchedule` are what the calendar shows.
- `failureReason` carries the platform's own words. Show it verbatim - it is the only thing that distinguishes an expired token from a refused photo.
- `GET /content-schedules/:id/metrics` for likes, comments, shares and views; `POST .../metrics/refresh` to fetch them again. Two honest caveats to put in the UI rather than hide:
  - **`comments` is always 0** and cannot be fixed from here. It sits behind a permission Meta's own OAuth dialog rejects as invalid. Label it accordingly or leave it out.
  - **A refused figure is stored as `0`**, indistinguishable from a real zero. A non-zero `shares` next to zero likes points at a token permission, not a quiet post.
- `GET /hotels/:id/ai-budget` next to every generate button. A draft costs about $0.0009, so the cap is reached by looping, not by one careless click.

## Open questions

Answered:

- [x] Who approves content a staff member wrote → **the owner** (M7). Staff write and submit; the owner decides what goes out under the hotel's name.
- [x] All three platforms, or Facebook only → **Facebook and Instagram**; TikTok deliberately not built (M12).
- [x] `social_account.access_token` in plain text → **encrypted** with the same `FieldCipher` as bank details, and absent from every response (M11).

Still open:

- [ ] Should generated content be labelled as AI-written where guests see it? Nothing in the API marks it either way today.
- [ ] Is $5 a hotel a month the right cap, and should a partner be able to raise it? At $0.0005 a draft it is ~9,000 drafts, which looks generous rather than tight.
- [ ] A page the owner disconnects on Facebook's side, rather than ours, is only noticed when a post fails. Nothing polls `/debug_token`.
- [ ] Nothing warns an owner before a token expires. `usable` turns false and the next post fails with a clear reason, which is late but not silent.
- [ ] A figure Meta refuses is stored as `0`, the same as a figure that is genuinely nought. Telling them apart needs nullable columns on `content_metric`, and the UI would have to say "not available" rather than draw a zero.
- [ ] `POST /social-accounts` still inserts rather than upserts, so pasting a token for a page that is already connected adds a second row. The unique index added for M16 makes that a constraint error rather than a duplicate, but the error is not the one the caller deserves.
- [ ] The writer does not produce a picture. Gemini writes words, so every fresh draft has `mediaUrl: null` and a staff member has to attach one - which, for Instagram, is the difference between a post that can go out and one that cannot.
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
| 2026-11-13 | FE | Web staff marketing on `feat/phase-5-frontend`: `/staff/marketing/content` (ideas, AI writer, list), `/staff/marketing/content/[id]` (edit, picture, submit, schedule), `/staff/marketing/calendar`, `/staff/marketing/analytics`. Owner screens (approve, connect a page, brand voice) not connected yet |
| 2026-11-13 | Phúc | Staff upload the picture instead of supplying a URL (M18): two endpoints on the same storage as hotel photos, the file deleted when replaced, removed or the draft is, and a hand-typed URL left alone. One migration, 9 e2e |
| 2026-11-13 | Phúc | First real post, and three bugs only a real post could find (M17): `post_impressions` was retired by Meta in June 2026 and its replacement, "must be a valid insights metric", was being swallowed into a permanent zero; the three engagement counts shared one request, so one forbidden figure took the other two with it; and `comments.summary` turns out to sit behind a permission Meta's own dialog rejects as invalid. Each figure now degrades on its own. 5 unit tests |
| 2026-11-13 | Phúc | The owner-facing connect flow (M16): three endpoints, no token typed or seen, state and connection handle encrypted rather than stored, pages read from Facebook again before anything is written, reconnect updating the row a published post points at. One migration (unique page per hotel), three error codes, 22 e2e |
| 2026-11-12 | Phúc | Pages, calendar, publishing and metrics built (M7–M15): staff write and the owner approves, ideas read out of the hotel's own figures, approved content scheduled onto connected Facebook and Instagram pages by a job that is the only writer, tokens encrypted at rest, platform refusals recorded with the platform's own words, and each metrics refresh kept as its own reading. TikTok deliberately refused with its reason. The AI writer also moved from Claude to Gemini — one file, because every call already went through one door. Eight new error codes, one migration, [../social-setup.md](../social-setup.md), and 359 e2e across 31 suites |
| 2026-11-12 | Phúc | Brand voice and the AI cost cap built (M1–M6): voice learned from the hotel's own posts, `ai_usage` logging every call, a monthly dollar cap per hotel, and the writer switched off cleanly when no API key is set. Three new error codes and [api/marketing.md](../api/marketing.md) |

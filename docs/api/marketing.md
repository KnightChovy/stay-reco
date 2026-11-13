# AI marketing (phase 5)

The AI writer, the approval it goes through, the calendar it goes out on, and what it all costs. Decisions are in [phase-5-ai-marketing.md](../phases/phase-5-ai-marketing.md). Rules for every API: [../api-guide.md](../api-guide.md). Getting the platform credentials: [../social-setup.md](../social-setup.md).

Status: `BE Done` for all 27 endpoints. TikTok publishing is deliberately not built (M12).

## The shape of it

```
ideas ─→ generate ─→ [DRAFT] ─→ submit ─→ [PENDING_APPROVAL] ─→ approve ─→ [APPROVED]
                        ↑                                      ↘ reject ─→ [REJECTED]
                        └──────────── edit ───────────────────────────────────┘

[APPROVED] ─→ schedule ─→ [SCHEDULED] ─→ (the job, every minute) ─→ [PUBLISHED] ─→ metrics
                                                                 ↘ [FAILED]
                                      ↘ cancel ─→ [CANCELLED]
```

Three things are worth knowing before reading the table.

**Staff write, the owner approves.** A staff member with the `MARKETING` permission can ask for a draft, edit it and submit it. Only the **owner** approves or rejects, because what goes out goes out under the hotel's name. The text is frozen on approval, so what was approved is what is posted.

**Suggestions cost nothing.** `marketing-content/ideas` is database queries, not a model call. A booking system already knows what is worth posting about — which rooms are empty this week, which discount is running, which guest just left five stars — so staff pick an idea instead of inventing one.

**There is no "publish now".** Scheduling with no `scheduledAt` means the next run of the publisher, which is within a minute. That *is* the post-now button (M14).

## Endpoints

### The voice and the budget

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/brand-voice` | member | | `BrandVoice` |
| PATCH | `/hotels/:hotelId/brand-voice` | owner | `updateBrandVoiceSchema` | `BrandVoice` |
| POST | `/hotels/:hotelId/brand-voice/learn` | owner | `learnBrandVoiceSchema` | `BrandVoice` (200) |
| GET | `/hotels/:hotelId/ai-budget` | member | | `AiBudget` |

### Content and approval

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/marketing-content/ideas` | member + `MARKETING` | | `ContentIdea[]` |
| POST | `/hotels/:hotelId/marketing-content/generate` | member + `MARKETING` | `generateContentSchema` | `MarketingContent` (201) |
| GET | `/hotels/:hotelId/marketing-content` | member + `MARKETING` | | page of `MarketingContent` |
| GET | `/marketing-content/:id` | member | | `MarketingContent` |
| PATCH | `/marketing-content/:id` | member | `updateContentSchema` | `MarketingContent` |
| POST | `/marketing-content/:id/image` | member + `MARKETING` | `multipart/form-data`, field `file` | `MarketingContent` (201) |
| DELETE | `/marketing-content/:id/image` | member + `MARKETING` | | `MarketingContent` |
| POST | `/marketing-content/:id/submit` | member | | `MarketingContent` (200) |
| POST | `/marketing-content/:id/approve` | **owner** | | `MarketingContent` (200) |
| POST | `/marketing-content/:id/reject` | **owner** | `rejectContentSchema` | `MarketingContent` (200) |
| DELETE | `/marketing-content/:id` | member | | 204 |

### Pages, calendar and figures

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/social-accounts/facebook/authorize` | **owner** | | `FacebookAuthorize` |
| POST | `/hotels/:hotelId/social-accounts/facebook/exchange` | **owner** | `facebookExchangeSchema` | `FacebookExchange` (200) |
| POST | `/hotels/:hotelId/social-accounts/facebook/connect` | **owner** | `facebookConnectSchema` | `SocialAccount[]` (201) |
| POST | `/hotels/:hotelId/social-accounts` | **owner** | `connectSocialAccountSchema` | `SocialAccount` (201) |
| GET | `/hotels/:hotelId/social-accounts` | member + `MARKETING` | | `SocialAccount[]` |
| DELETE | `/social-accounts/:id` | **owner** | | 204 |
| POST | `/marketing-content/:id/schedule` | member | `scheduleContentSchema` | `ContentSchedule` (201) |
| GET | `/hotels/:hotelId/content-schedules` | member + `MARKETING` | | page of `ContentSchedule` |
| GET | `/content-schedules/:id` | member | | `ContentSchedule` |
| DELETE | `/content-schedules/:id` | member | | `ContentSchedule` (200) |
| GET | `/content-schedules/:id/metrics` | member | | `ContentMetric[]` |
| POST | `/content-schedules/:id/metrics/refresh` | member | | `ContentMetric` (200) |

## Why a brand voice exists

Without one, every hotel's posts read the same. A chain in Đà Nẵng and a homestay in Hội An should not sound alike.

Asking an owner to describe their own tone rarely works — few can, and fewer do it consistently. So the way in is the one the industry has settled on: **the hotel pastes 2–5 posts it is happy with, and the model describes the voice it finds in them**. That description is saved and goes into every later prompt.

The voice belongs to the **partner**, not the hotel, so a chain shares one voice across its properties.

```jsonc
// POST /hotels/:hotelId/brand-voice/learn
{ "samples": [ "Sáng nay sương còn trên sông Hàn…",   // 2 to 5 posts
                "Bữa sáng hôm nay có bánh mì nóng…" ] } // each 40 to 5000 characters

// → BrandVoice
{ "summary": "Ấm áp, xưng \"mình\", câu ngắn.",
  "audience": "Gia đình trẻ đi nghỉ cuối tuần",
  "highlights": "hướng biển, bữa sáng, gần chợ đêm",
  "forbiddenWords": null,
  "updatedAt": "…" }
```

Learning **replaces** the current voice rather than adding to it. `PATCH` writes the fields it is given, removes the ones set to `null`, and leaves the rest alone, so one screen can own one field — `forbiddenWords` is the field most often written by hand.

A hotel with no voice set up still works: the writer falls back to a plain, warm brief rather than refusing.

## What the writer is forbidden to do

Every generate call carries the same rules, and they are the reason this is safe to point at a hotel's real page:

- never invent a price, date, discount, award or amenity the brief did not give it
- never promise anything about availability or refunds
- no superlatives it cannot back up
- write as the hotel, not as an assistant describing one

A hotel's own `forbiddenWords` are added on top. Both are tested, so the rules cannot drift into a constant nothing reads.

```jsonc
// POST /hotels/:hotelId/marketing-content/generate
{ "contentType": "POST", "brief": "Cuối tuần còn phòng", "platform": "FACEBOOK" }

// → MarketingContent
{ "id": "…", "status": "DRAFT", "contentType": "POST",
  "title": "Cuối tuần bên sông Hàn",
  "body": "Mình còn vài phòng hướng biển cho cuối tuần này…",
  "authorName": "Nguyễn Thị B", "rejectedReason": null, "createdAt": "…" }
```

`platform` shapes the length and tone — a TikTok caption is not written like a blog post. `rejectedReason` is read back from the audit log, so the writer sees why rather than guessing.

## Ideas come from the hotel's own figures

```jsonc
// GET /hotels/:hotelId/marketing-content/ideas
[ { "kind": "FREE_ROOMS",   "brief": "Còn 6 phòng trống trong 7 ngày tới…",
    "detail": "6/20 phòng chưa có khách từ 2026-11-12 trong 7 đêm" },
  { "kind": "PROMOTION",    "brief": "Giới thiệu chương trình \"Giảm 10% cuối năm\"…",
    "detail": "Chạy tới 2026-12-31" },
  { "kind": "GREAT_REVIEW", "brief": "Cảm ơn khách vừa để lại đánh giá tốt…",
    "detail": "5★ — \"Phòng sạch, nhân viên thân thiện…\"" } ]
```

Each `brief` can be sent straight back to the generate endpoint. An idea whose figure is not there is simply absent: a hotel with every room booked gets no `FREE_ROOMS` idea.

## Connecting a page

Two routes in, one encrypted row out. An owner is sent down the first; the second is for us.

### Through Facebook, as the owner does it (M16)

```jsonc
// 1. GET /hotels/:hotelId/social-accounts/facebook/authorize
{ "authorizeUrl": "https://www.facebook.com/v26.0/dialog/oauth?client_id=…&state=v1:…" }

// the browser goes there; Facebook sends it back to META_OAUTH_REDIRECT_URI?code=…&state=…
// that page posts both to:

// 2. POST /hotels/:hotelId/social-accounts/facebook/exchange
{ "code": "AQD…", "state": "v1:…" }
// → the pages this owner administers. No token of any kind in the answer.
{ "connectionToken": "v1:…",                    // the user token, encrypted, 10 minutes
  "expiresAt": "…",
  "pages": [
    { "pageId": "1001", "name": "An Nhiên Riverside",
      "instagramId": "9001",                     // null means Instagram cannot be offered
      "connected": false }] }                    // true → the UI says "reconnect"

// 3. POST /hotels/:hotelId/social-accounts/facebook/connect
{ "connectionToken": "v1:…",
  "pages": [{ "pageId": "1001", "instagram": true }] }
// → [SocialAccount FACEBOOK 1001, SocialAccount INSTAGRAM 9001]
```

**The redirect lands on the frontend, not the API.** A redirect carries no `Authorization` header, so a `GET /callback` would arrive unauthenticated and have to trust `state` for identity as well as integrity. Posting from the page the owner lands on keeps the request inside their session, and leaves `state` doing one job: it is encrypted with the hotel id in it, so a code obtained while connecting hotel A cannot be replayed onto hotel B by an owner who holds both. Both `state` and `connectionToken` are encrypted with the same cipher as the stored tokens, so neither needed a table and neither is readable by the client holding it.

**Nothing is connected automatically.** An owner may administer a dozen pages and one of them is this hotel. Step three reads the pages from Facebook again rather than trusting the browser, and validates every pick before writing any: half a connection is worse than none.

**Reconnecting updates the row** rather than adding one beside it — unique on `(hotelId, platform, accountName)` — because a published post's schedule points at that row, and it also clears the epoch expiry that disconnecting set.

### By hand

```jsonc
// POST /hotels/:hotelId/social-accounts
{ "platform": "FACEBOOK",
  "accountName": "1234567890",            // the Page id, not the display name
  "accessToken": "EAAG…",                  // a long-lived page token
  "expiresAt": "2027-01-10T00:00:00.000Z" } // if the platform gave one

// → SocialAccount — note there is no token field
{ "id": "…", "platform": "FACEBOOK", "accountName": "1234567890",
  "expiresAt": "…", "usable": true, "createdAt": "…" }
```

The token goes **in and does not come back out**. It is encrypted at rest with the same cipher as a partner's bank details, because a page token can post as the hotel for months: a leaked row is a leaked ability to post under the hotel's name.

Pasting is kept beside the owner-facing flow because it needs no Meta app at all, which is what let publishing be finished before there was one (M11), and it is still the quickest way to connect a page by hand. [../social-setup.md](../social-setup.md) has both routes step by step.

`usable` turns false once `expiresAt` has passed. The publisher then **skips** the page and writes the reason on the post, rather than calling a platform with a token it knows is dead.

Disconnecting clears the token and **cancels everything still waiting** on that page. The account row is kept, not deleted: a published post points at it, and that record of what went out should outlive the connection.

## The picture (M18)

```
POST /marketing-content/:id/image      multipart/form-data, field `file`
DELETE /marketing-content/:id/image
```

Staff **upload a file**; they do not find a URL somewhere. JPEG, PNG or WebP up to 10MB, into its own `marketing` folder. The answer is the whole piece, with `mediaUrl` filled in.

The URL is what Meta needs - **it fetches the image itself**, so a local file or a `localhost` address is no use to it - but asking a marketing assistant to produce a public URL before they may illustrate a post is asking them to be a sysadmin. The upload path is the same `StorageService` that hotel and review photos already use.

**The picture may be changed exactly as long as the words may**: while the piece is a `DRAFT` or has been `REJECTED`. What the owner approved is what goes out, and that includes which photograph is attached - a picture swapped after approval would put something on the hotel's page that nobody agreed to.

Uploading again **replaces** the picture and deletes the file it replaced; deleting the draft takes its file too. A `mediaUrl` that was pasted in by hand through `PATCH` is left alone on both counts: the file is not ours to delete, and guessing at it would be deleting someone else's.

**Instagram refuses a post without one**, before anything is sent, so the staff member is told to attach a photo rather than shown a Meta error code. Facebook publishes to `/photos` instead of `/feed` when there is a picture.

Not yet: the writer does not produce one. Gemini writes words, so `mediaUrl` is always null on a fresh draft.

## Scheduling and publishing

```jsonc
// POST /marketing-content/:id/schedule
{ "socialAccountId": "…", "scheduledAt": "2026-11-15T10:00:00.000Z" }
// scheduledAt null, absent, or in the past → the next run of the job (within a minute)

// → ContentSchedule
{ "id": "…", "status": "SCHEDULED", "platform": "FACEBOOK",
  "accountName": "1234567890", "scheduledAt": "…",
  "publishedAt": null, "externalPostId": null, "failureReason": null }
```

Only content the owner **approved** can be scheduled, or content already `SCHEDULED` — one approved piece can go to several pages, and the first scheduling is what moved it off `APPROVED`.

A job picks up due posts every minute and is the **only** thing that publishes. That is what makes a double post impossible: a request and a timer firing in the same second would both see a `SCHEDULED` row, and the hotel's followers would see the post twice (M14).

When a platform refuses, the post becomes `FAILED` and `failureReason` carries **the platform's own words** — `Error validating access token: Session has expired` is the one thing that tells an owner what to do next. A failed post is **not retried**: a token that expired at 09:00 is still expired at 09:01, and a retry loop against Meta is how an app meets its rate limit.

| Platform | Built | Note |
|---|---|---|
| Facebook | ✅ | One call. A photo is attached by URL; Meta fetches it |
| Instagram | ✅ | Two calls: a media container, then publish. **Needs a `mediaUrl`** — Instagram has no text-only post |
| TikTok | ❌ by decision | Its API takes a video, and the writer produces text (M12). Answers `501 SOCIAL_PLATFORM_UNSUPPORTED` with that reason |

## How a post did

```jsonc
// POST /content-schedules/:id/metrics/refresh  → ContentMetric
{ "id": "…", "scheduleId": "…", "platform": "FACEBOOK",
  "views": 1204, "likes": 38, "shares": 4, "comments": 7, "recordedAt": "…" }
```

Each refresh **appends** a row rather than overwriting one. A post that gained most of its reach on day three is a different thing from one that got it all in the first hour, and an owner deciding when to post needs to tell them apart. `GET …/metrics` returns every reading, newest first.

Refreshing is a request, not a job: insight numbers move for days after a post, so a job would have to decide how long to keep asking about every post a hotel ever made. Asking when someone opens the screen costs one call and answers the question being asked.

## Cost: logged and capped

Phase 5 requires that **model call costs are capped and every call is logged**. Both are enforced in one place, so a new feature cannot forget either.

- Every call writes an `ai_usage` row: purpose, model, input and output tokens, cached tokens, and the dollars at the model's published rate.
- Before each call the hotel's spend for the **calendar month (UTC)** is summed and checked against `AI_MONTHLY_BUDGET_USD` (default **$5**).

```jsonc
// GET /hotels/:hotelId/ai-budget
{ "spentUsd": 0.0128, "limitUsd": 5, "remainingUsd": 4.9872 }
```

At `remainingUsd: 0` the writer answers `403 AI_BUDGET_EXCEEDED` until the month turns.

The cap is checked before the call and the usage written after, which is **not** a transaction: two calls starting at the same instant can both pass the check and overshoot by one call. That is deliberate — a cap measured in dollars a month does not need to be exact, and holding a lock for the length of a model call would cost more than the overshoot.

Costs keep **six decimals**. One draft costs roughly **$0.0005** on `gemini-3.8-flash` with thinking off, so rounding to cents would record almost every call as free. The $5 cap is about 9,000 drafts a month.

Two details of Gemini's token counting decide whether the figures add up, and neither is obvious from the field names:

- `promptTokenCount` **includes** the part served from cache, so the cached tokens are subtracted out before being billed at the cache rate. Otherwise they are charged twice.
- `thoughtsTokenCount` is **not** in `candidatesTokenCount`, and Google bills thinking at the output rate. Left out, a thinking model looks far cheaper than the invoice says.

Flash prices **double on 2027-01-01**. Both halves of that are in the price table, so nothing has to be remembered on the day.

## Settings

```
GEMINI_API_KEY=                   # empty turns the writer off
GEMINI_MODEL=gemini-3.8-flash     # gemini-3.1-flash-lite is cheaper, a little blunter
AI_MONTHLY_BUDGET_USD=5
META_GRAPH_VERSION=v26.0          # must be a version the connected Meta app may use
BENEFICIARY_ENCRYPTION_KEY=       # also encrypts social access tokens
```

Leaving `GEMINI_API_KEY` empty does **not** stop the server starting — the marketing endpoints answer `503 AI_UNAVAILABLE`, the same shape the Cloudinary settings already use. A deployment without a key still runs everything else.

## Error codes

| Code | Status | When |
|---|---|---|
| `AI_UNAVAILABLE` | 503 | No API key configured, or the model answered in a shape we cannot use |
| `AI_BUDGET_EXCEEDED` | 403 | The hotel has spent its budget for this calendar month |
| `AI_REFUSED` | 403 | The model declined to write what was asked for |
| `CONTENT_NOT_FOUND` | 404 | No such content, or it belongs to another hotel |
| `CONTENT_STATUS_CONFLICT` | 409 | Editing, submitting, approving or deleting content whose status does not allow it |
| `CONTENT_NOT_APPROVED` | 409 | Scheduling content the owner has not approved |
| `SOCIAL_ACCOUNT_NOT_FOUND` | 404 | No such page, or it belongs to another hotel |
| `SCHEDULE_NOT_FOUND` | 404 | No such scheduled post, or it belongs to another hotel |
| `SCHEDULE_STATUS_CONFLICT` | 409 | Cancelling a post that went out, or reading figures for one that did not |
| `SOCIAL_PUBLISH_FAILED` | 502 | The platform refused or could not be reached; its own message is passed through |
| `SOCIAL_PLATFORM_UNSUPPORTED` | 501 | TikTok, or Instagram without a photo |
| `SOCIAL_OAUTH_DISABLED` | 503 | No Meta app configured on this server; pasting a token still works |
| `SOCIAL_OAUTH_INVALID` | 400 | The `state` or `connectionToken` is not ours, is for another hotel, or expired |
| `SOCIAL_OAUTH_FAILED` | 502 | Facebook refused the exchange, or granted no page we can post to |
| `VALIDATION_ERROR` | 400 | Fewer than 2 or more than 5 voice samples, a brief under 5 characters, a token under 10 |

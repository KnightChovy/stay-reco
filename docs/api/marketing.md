# AI marketing (phase 5)

The brand voice the AI writer uses, and what it costs. Decisions are in [phase-5-ai-marketing.md](../phases/phase-5-ai-marketing.md). Rules for every API: [../api-guide.md](../api-guide.md).

Status: `BE Done` for the brand voice and the budget. Content generation, scheduling and publishing are not built yet.

## Why a brand voice exists

Without one, every hotel's posts read the same. A chain in Đà Nẵng and a homestay in Hội An should not sound alike.

Asking an owner to describe their own tone rarely works — few can, and fewer do it consistently. So the way in is the one the industry has settled on: **the hotel pastes 2–5 posts it is happy with, and the model describes the voice it finds in them**. That description is saved and goes into every later prompt.

The voice belongs to the **partner**, not the hotel, so a chain shares one voice across its properties.

## Endpoints

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| GET | `/hotels/:hotelId/brand-voice` | member | | `BrandVoice` |
| PATCH | `/hotels/:hotelId/brand-voice` | owner | `updateBrandVoiceSchema` | `BrandVoice` |
| POST | `/hotels/:hotelId/brand-voice/learn` | owner | `learnBrandVoiceSchema` | `BrandVoice` (200) |
| GET | `/hotels/:hotelId/ai-budget` | member | | `AiBudget` |

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

Costs keep **six decimals**. A short post costs around a cent, so rounding to cents would record most calls as free.

## Settings

```
ANTHROPIC_API_KEY=        # empty turns the writer off
ANTHROPIC_MODEL=claude-opus-5-5
AI_MONTHLY_BUDGET_USD=5
```

Leaving `ANTHROPIC_API_KEY` empty does **not** stop the server starting — the marketing endpoints answer `503 AI_UNAVAILABLE`, the same shape the Cloudinary settings already use. A deployment without a key still runs everything else.

## Common error codes

| Code | Status | When |
|---|---|---|
| `AI_UNAVAILABLE` | 503 | No API key configured, or the model answered in a shape we cannot use |
| `AI_BUDGET_EXCEEDED` | 403 | The hotel has spent its budget for this calendar month |
| `AI_REFUSED` | 403 | The model declined to write what was asked for |
| `VALIDATION_ERROR` | 400 | Fewer than 2 or more than 5 samples, or one shorter than 40 characters |

## Not built yet

Content generation, approval, scheduling, publishing to Facebook / Instagram / TikTok, and metrics. The schema has the tables (`marketing_content`, `content_schedule`, `social_account`, `content_metric`); see the phase 5 doc for the order and for the app-review risk that publishing carries.

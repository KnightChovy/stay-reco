# Phase 5: AI recommendations and marketing

| | |
|---|---|
| Phase status | ⬜ Not started |
| API status | None yet |
| API | None yet. When the phase starts: fill in this file from [`_template.md`](./_template.md) and write the endpoints in [api/](../api/README.md). |

## Goal

AI hotel recommendations, a conversational assistant, and marketing content tools for hotels.

## Scope

**Backend**

- pgvector, hotel embeddings (CONVENTIONS §3.7)
- Personalized recommendations, AI assistant
- AI brand for partners, marketing calendar and content
- Blog

**Frontend web / mobile** (pages already have UI in `frontend/src/app`)

- `(landing-page)/recommendations`, `(landing-page)/assistant`, `blog`, `FloatingAiButton`
- `partner/ai-brand`
- `staff/marketing/*`

## Definition of Done

- [ ] Model call costs are capped and every call is logged
- [ ] The phase's [api/](../api/README.md) pages match the code, API status `Integrated`

# StayReco docs

Where BE, FE web and mobile agree on **which phase we are in** and **what the API looks like**.

## Where to start

| You are | Read in this order |
|---|---|
| New to the project | [getting-started.md](./getting-started.md) → [api-guide.md](./api-guide.md) → the API page for the screens you work on |
| FE web / mobile | [api-guide.md](./api-guide.md) (tokens, envelope, error codes) → [api/](./api/README.md): [auth](./api/auth.md) · [partner](./api/partner.md) · [staff](./api/staff.md) · [manager](./api/manager.md) · [customer](./api/customer.md) |
| BE | [../backend/docs/CONVENTIONS.md](../backend/docs/CONVENTIONS.md) (code conventions) → [phases/](./phases/) (decisions, scope) → update [api/](./api/README.md) in the same PR as the code |
| Using the shared schemas | [../packages/shared/README.md](../packages/shared/README.md) |

## Structure

| Path | Content |
|---|---|
| [getting-started.md](./getting-started.md) | Run the backend and frontend locally, demo accounts, common errors |
| [api-guide.md](./api-guide.md) | Rules for every API: base URL, web/mobile tokens, envelope, error codes, pagination |
| [api/](./api/README.md) | Endpoints by user role: each endpoint is described once, with its schema, response type and call flow |
| [money-rules.md](./money-rules.md) | Money rules: prices and pricing rules, holds, SePay payment, wallets, commission, cancellation and refunds |
| [phases/](./phases/) | One file per phase: goal, scope, agreed decisions, states, FE tasks, Definition of Done, changelog |

## Where we are

> **Phase 1**: BE done, FE web and mobile integrating. **Phase 2** (search, booking, SePay): BE done (SePay webhook live on staging), FE integrating.
> Update this line and the table below in the same PR when a status changes.

| Phase | Content | Status | API |
|---|---|---|---|
| [0](./phases/phase-0-foundation.md) | Foundation: auth, envelope, shared package | 🟡 BE done, FE integrating | [auth](./api/auth.md) |
| [1](./phases/phase-1-hotel-onboarding.md) | Partners list their hotels, managers verify them | 🟡 BE done, FE integrating | [partner](./api/partner.md), [staff](./api/staff.md), [manager](./api/manager.md) |
| [2](./phases/phase-2-search-booking.md) | Search, booking, payment | 🟡 BE done, FE integrating | [customer](./api/customer.md), [partner](./api/partner.md#pricing-rules-phase-2), [staff](./api/staff.md#coming-in-phase-2) |
| [3](./phases/phase-3-operations.md) | Operations: check-in/out, refunds, inbox | ⬜ Not started | |
| [4](./phases/phase-4-loyalty-promotions.md) | Loyalty, promotions, reviews, wallet | ⬜ Not started | |
| [5](./phases/phase-5-ai-marketing.md) | AI recommendations, assistant, marketing | ⬜ Not started | |
| [6](./phases/phase-6-reporting-admin.md) | Reporting, administration | ⬜ Not started | |

Phase status: ⬜ Not started · 🟡 In progress · ✅ Done.
API status of a phase: `Draft` → `Agreed` → `BE Done` → `Integrated` (shown at the top of the phase file).

## How a phase runs

1. **Open the phase**: fill in `phases/phase-N-<name>.md` from [`phases/_template.md`](./phases/_template.md); write the proposed endpoints straight into the `api/<role>.md` pages, marked (`Draft`).
2. **Agree**: a PR with only docs + schemas in `packages/shared`. BE and FE review it together; once merged it becomes `Agreed`.
3. **Work in parallel**: BE builds the endpoints from the schemas; FE builds forms with the same schemas and mocks responses from the API pages.
4. **BE Done**: the endpoints are on `develop` and Swagger matches the API pages. FE switches to the real API.
5. **Integrated**: web and mobile are done, the Definition of Done is ticked, the table above is updated.

Changing the API after `Agreed`: edit the `api/` page, add a *Changelog* row in the phase file and tell the other side. Never rename a published field or error code; only add new ones.

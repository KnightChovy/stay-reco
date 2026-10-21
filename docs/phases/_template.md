# Phase N: <phase name>

| | |
|---|---|
| Phase status | ⬜ Not started · 🟡 In progress · ✅ Done |
| API status | `Draft` · `Agreed` · `BE Done` · `Integrated` |
| Agreed on | |
| BE owners | |
| FE owners | |
| API | [api/<role>.md](../api/README.md) |

> Rules for every API (envelope, error codes, pagination, dates): [api-guide.md](../api-guide.md). Endpoints are **not** written in this file but on the [api/](../api/README.md) page of the role that uses them.
>
> API status flow:
> 1. **Draft**: BE or FE writes the proposal on the `api/` page, marked *(Draft)*; anyone can edit it.
> 2. **Agreed**: BE + FE approved it (in a PR). From now on every change goes into the *Changelog* and is announced to the other side.
> 3. **BE Done**: the endpoints run on `develop` and Swagger matches the API page. FE drops the mocks and calls the real API.
> 4. **Integrated**: FE web and mobile are done.

## Goal

## Scope

**Backend**

-

**Frontend web / mobile**

-

## Out of scope

-

## Agreed decisions

| # | Decision |
|---|---|
| D1 | |

## States

```
<enum>: A → B → C
```

## Adding endpoints

- Body/query schemas go in `packages/shared/src/schemas/<feature>.ts`, added **before** the code so FE can work in parallel ([packages/shared/README.md](../../packages/shared/README.md)).
- Endpoints, response types, call flows: the `api/<role>.md` page.
- New error codes: `packages/shared/src/errors.ts` **and** the table in [api-guide.md §4.3](../api-guide.md#43-error-codes).

## FE tasks

-

## Open questions

- [ ]

## Definition of Done

- [ ]

## Changelog

| Date | Who | Change |
|---|---|---|

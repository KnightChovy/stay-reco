# StayReco Backend Conventions

> **Draft.** Items marked `TODO(meeting)` will be decided in the team meeting. Once decided, the whole team follows this document.
> Applies to `backend/` (NestJS 11 + Prisma + PostgreSQL). The API guide for web and mobile clients is [API_GUIDE.md](./API_GUIDE.md).

## 1. API URL naming

Goal: the URL alone tells you which resource an endpoint belongs to, and every endpoint is named **the same way**. No module may use its own style, and URLs must not be half role-based and half feature-based.

### 1.1 One URL structure for the whole system

`TODO(meeting)`: choose **one** of the two options. Option **A** is recommended.

| | **A. By resource/feature (recommended)** | B. By role |
|---|---|---|
| Example | `GET /bookings/:id`, `GET /hotels/:hotelId/rooms` | `GET /staff/bookings/:id`, `GET /partner/rooms` |
| Authorization | `@Roles()` plus tenant checks in the service | URL prefix plus `@Roles()` |
| Resource shared by several roles | **One** endpoint. For example, bookings are viewed by customers, staff, partners and platform managers; each role sees its own data scope. | Must be duplicated: `/customer/bookings`, `/staff/bookings`, `/partner/bookings`, `/manager/bookings` |
| When permissions change (e.g. partners may also view bookings) | Only `@Roles()` changes | New URLs are needed and the FE must follow |
| Fits existing code | Already: `/auth/...` | Everything must change |

Why A: StayReco has 6 roles that share many resources (bookings, hotels, refunds, marketing content). Splitting by role multiplies the number of endpoints and duplicates logic.

> The rest of section 1 follows option A. If the meeting picks option B, rewrite all of section 1; **never** mix the two.

### 1.2 General rules

1. Every API is prefixed with `/api/v1` (configured in `app.setup.ts`). Breaking changes go to `v2`; never change a published contract silently.
2. Paths use **plural, lowercase, kebab-case nouns**: `/room-types`, `/pricing-rules`, `/verification-requests`.
   Not `/roomType`, `/room_types` or `/getRooms`.
3. No verbs in paths for CRUD operations; the HTTP method expresses the action:

   | Action | Method + Path |
   |---|---|
   | List | `GET /room-types` |
   | Detail | `GET /room-types/:id` |
   | Create | `POST /room-types` |
   | Partial update | `PATCH /room-types/:id` |
   | Delete (soft delete or deactivate) | `DELETE /room-types/:id` |

   Use `PATCH` for all updates. `PUT` (full replacement) is not used by default.
4. **Business actions** that are not CRUD (state transitions) use `POST /<resource>/:id/<verb>`, with the verb in kebab-case:
   `POST /bookings/:id/confirm`, `POST /bookings/:id/cancel`, `POST /bookings/:id/check-in`, `POST /refund-requests/:id/approve`, `POST /verification-requests/:id/request-changes`.
5. Nest at most **one level**, only when the child resource only makes sense inside its parent: `/hotels/:hotelId/room-types`.
   Once you have the child's id, access it flat: `GET /room-types/:id`, not `/hotels/:hotelId/room-types/:id`.
6. Path parameters are `:id` (UUID), or `:<resource>Id` when there are several ids: `:hotelId`.
7. Query strings use camelCase: `?checkIn=2026-10-20&guests=2&page=1&pageSize=10&sort=-createdAt`.
8. JSON bodies and responses use **camelCase**. Database columns use snake_case, mapped with `@map` in Prisma as in the current schema.

### 1.3 Three data scopes

| Scope | URL form | Use when | Examples |
|---|---|---|---|
| The caller's own data | `/me/...` | Data that belongs to the signed-in account; no id needed | `GET /me/bookings`, `GET /me/notifications`, `PATCH /me/profile`, `GET /me/loyalty-accounts` |
| Per hotel (tenant) | `/hotels/:hotelId/...` | A partner or staff member manages the data of **one** hotel | `GET /hotels/:hotelId/bookings`, `POST /hotels/:hotelId/room-types`, `GET /hotels/:hotelId/staff` |
| Platform-wide | `/<resource>` | Public data, or system-wide administration (Platform Manager, Admin) | `GET /hotels` (public), `GET /verification-requests`, `GET /accounts`, `GET /audit-logs` |

Every `/hotels/:hotelId/...` endpoint **must** verify that the caller belongs to that hotel (see section 4). Never trust a `hotelId` sent by the client.

### 1.4 Sample mapping from SRS screens

| Screen (SRS 3.1.2) | Endpoint |
|---|---|
| Search results | `GET /hotels?destination=&checkIn=&checkOut=&guests=` |
| Hotel detail | `GET /hotels/:id` |
| My trips | `GET /me/bookings?status=upcoming` |
| Cancel booking | `POST /bookings/:id/cancel` |
| Booking list (staff) | `GET /hotels/:hotelId/bookings` |
| Check-in | `POST /bookings/:id/check-in` |
| Room catalog (partner) | `GET /hotels/:hotelId/room-types`, `GET /hotels/:hotelId/rooms` |
| Partner verification queue | `GET /verification-requests?status=pending` |
| Approve verification | `POST /verification-requests/:id/approve` |
| Account list (admin) | `GET /accounts` |

### 1.5 The existing auth group

`/auth/...` is a feature of its own, so it already follows option A; it is the one group allowed to use verbs (`login`, `refresh`, ...). `TODO(meeting)`: should `/auth/sessions` become `/me/sessions` to match section 1.3? The FE has not integrated yet, so changing it now is cheap.

## 2. Code structure

```
src/
  common/           shared decorators, guards, filters, interceptors, pipes, errors (ErrorCode), http (response types)
  config/           environment validation (zod)
  prisma/           PrismaService
  modules/<feature>/
    <feature>.module.ts
    <feature>.controller.ts        receives the request, validates the DTO, calls the service
    services/<feature>.service.ts  business logic, calls Prisma
    dto/<feature>.dto.ts           class-validator DTOs for input
```

- Folder and file names use kebab-case. Class names use PascalCase with a suffix (`BookingService`, `CreateBookingDto`).
- Controllers never call Prisma directly and contain no business logic.
- All input goes through a DTO. ValidationPipe has `whitelist` and `forbidNonWhitelisted` enabled, so unknown fields return **400**.
- Responses contain only the fields needed, chosen with `select` or an explicit mapping function (see `toAccountResponse`). Never return a raw Prisma object; it may leak `passwordHash` or internal columns.
- Every endpoint requires authentication by default. Public endpoints must be marked `@Public()`. Restrict roles with `@Roles(...)`.
- **Responses**: controllers return **plain data**. `ResponseInterceptor` wraps it as `{ success, message, data }`; do not wrap it yourself. Paginated lists return `Paginated.of(items, { page, pageSize, total })` (`common/http/api-response.ts`). Endpoints that return nothing use `@HttpCode(204)`.
- **Errors**: throw the built-in NestJS exceptions with a stable code, e.g. `throw new ConflictException({ code: ErrorCode.AUTH_EMAIL_TAKEN, message: 'Email is already registered' })`. New codes must be added to `common/errors/error-code.ts` **and** to table 4.3 in [API_GUIDE.md](./API_GUIDE.md). Name them `<FEATURE>_<DESCRIPTION>` and never rename a published code. `HttpExceptionFilter` handles formatting; unexpected errors become 500 `INTERNAL_ERROR` and are logged.
- **Swagger**: the CLI plugin (`nest-cli.json`) generates docs from TypeScript types, `class-validator` decorators and `/** */` comments in DTOs, so do **not** add `@ApiProperty` to every field. Tag each controller with `@ApiTags('<feature>')`. Only add `@ApiProperty` where the plugin cannot infer the schema, e.g. composite decorators such as `IsStrongPassword`.
- Important operations (create, update, approve, money, security) must call `AuditService.log(...)`. Add new actions to the `AuditAction` enum.

## 3. Database and migrations

1. The single source of truth is `prisma/schema.prisma` plus `prisma/migrations/`. **Never change the database by hand.** DBeaver and Prisma Studio are for reading only.
2. Each developer runs their own database in Docker (`npm run db:up`). Never share one database during development.
3. Schema change workflow:
   1. Pull or rebase onto the latest branch **before** editing the schema.
   2. Edit `schema.prisma`, then run `npm run db:migrate -- --name <short_description>` (snake_case, e.g. `add_room_type`).
   3. Commit both `schema.prisma` and the new migration folder in the **same** PR.
   4. Never edit or delete a merged migration; create a new one instead.
4. If two people create migrations in parallel, whoever merges second rebases, deletes their own migration and re-runs `db:migrate`.
5. Schema naming: models in singular PascalCase (`RoomType`), fields in camelCase, tables and columns in snake_case via `@@map` and `@map`, UUID primary keys.
6. Demo data lives in `prisma/seed.ts`. The seed must be re-runnable without errors (use `upsert`).
7. `TODO(meeting)`: switch the image to `pgvector/pgvector:pg17` and enable the `vector` extension before building the AI or recommendation modules.

## 4. Multi-tenancy

- The tenant boundary is the **hotel** (`hotel_id`). Every hotel-owned table has a `hotel_id` column.
- Every query on hotel-owned data filters by `hotelId`. The `hotelId` comes from the caller's relationship (the partner owns the hotel, or the staff member is assigned to it), **not from the client**. A value in the URL only selects the hotel and must then be verified.
- `TODO(meeting)`: write one shared helper or guard, e.g. `HotelAccessGuard`, that checks access to `:hotelId`, so services don't each check it their own way.
- Every module with tenant data must have an e2e test proving that partner A **cannot** read or modify partner B's data (risk #7 in Report 2).

## 5. Git workflow

`TODO(meeting)`: decide, then update section 6.2 of Report 2 to match.

- Main branches: `main` (stable) and `develop` (integration). Work on branches created from `develop`.
- Branch names: `<type>/<short-description>`, e.g. `feat/booking-hold`, `fix/refresh-token-race`. Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
- Commits follow Conventional Commits with the module as scope: `feat(booking): add room hold expiry job`.
- PRs into `develop` need **at least one reviewer** (backend reviews are cross-checked between Khiêm and Phúc).
- Never commit `.env`, API keys or real data.

### Pre-PR checklist

- [ ] `npm run lint` and `npm run build` pass
- [ ] `npm run test:e2e` passes, with tests added for new endpoints
- [ ] Schema changes include a migration, and the seed still runs
- [ ] New endpoints follow the URL rules in section 1, have `@Roles` or `@Public`, and check the tenant where needed
- [ ] [API_GUIDE.md](./API_GUIDE.md) or Swagger is updated if the API contract changed

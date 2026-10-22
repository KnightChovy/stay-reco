# StayReco Backend Conventions

> The whole team follows this document. Items still marked `TODO(meeting)` are not decided yet.
> Applies to `backend/` (NestJS 11 + Prisma + PostgreSQL). The API guide for web and mobile clients is [docs/api-guide.md](../../docs/api-guide.md).

## 1. API URL naming

Goal: the URL alone tells you which resource an endpoint belongs to, and every endpoint is named **the same way**. No module may use its own style, and URLs must not be half role-based and half feature-based.

### 1.1 One URL structure for the whole system

**Decided: URLs are organized by feature/resource (option A).** Role-based URLs (`/admin/...`, `/partner/...`) are not used. The comparison below is kept for reference.

| | **A. By resource/feature (chosen)** | B. By role |
|---|---|---|
| Example | `GET /bookings/:id`, `GET /hotels/:hotelId/rooms` | `GET /staff/bookings/:id`, `GET /partner/rooms` |
| Authorization | `@Roles()` plus tenant checks in the service | URL prefix plus `@Roles()` |
| Resource shared by several roles | **One** endpoint. For example, bookings are viewed by customers, staff, partners and platform managers; each role sees its own data scope. | Must be duplicated: `/customer/bookings`, `/staff/bookings`, `/partner/bookings`, `/manager/bookings` |
| When permissions change (e.g. partners may also view bookings) | Only `@Roles()` changes | New URLs are needed and the FE must follow |
| Fits existing code | Already: `/auth/...` | Everything must change |

Why A: StayReco has 6 roles that share many resources (bookings, hotels, refunds, marketing content). Splitting by role multiplies the number of endpoints and duplicates logic.

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
7. Query strings use camelCase: `?checkIn=2026-10-20&guests=2&page=1&pageSize=10&sort=price-asc`. List parameters (pagination, sorting, search, filters) follow [api-guide.md §5](../../docs/api-guide.md#5-lists-pagination-filtering-sorting).
8. JSON bodies and responses use **camelCase**. Database columns use snake_case, mapped with `@map` in Prisma as in the current schema.

### 1.3 Three data scopes

| Scope | URL form | Use when | Examples |
|---|---|---|---|
| The caller's own data | `/me/...` | Data that belongs to the signed-in account; no id needed | `GET /me/bookings`, `GET /me/notifications`, `PATCH /me/profile`, `GET /me/loyalty-accounts` |
| Per hotel (tenant) | `/hotels/:hotelId/...` | A partner or staff member manages the data of **one** hotel | `GET /hotels/:hotelId/bookings`, `POST /hotels/:hotelId/room-types`, `GET /hotels/:hotelId/staff` |
| Platform-wide | `/<resource>` | Public data, or system-wide administration (Platform Manager, Admin) | `GET /hotels` (public), `GET /verification-requests`, `GET /accounts`, `GET /audit-logs` |

Every `/hotels/:hotelId/...` endpoint **must** verify that the caller belongs to that hotel (see section 5). Never trust a `hotelId` sent by the client.

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

`/auth/...` is a feature of its own, so it already follows option A; it is the one group allowed to use verbs (`login`, `refresh`, ...). **Decided:** session management stays under `/auth/sessions` (it is not moved to `/me/sessions`).

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
- **Errors**: throw the built-in NestJS exceptions with a stable code, e.g. `throw new ConflictException({ code: ErrorCode.AUTH_EMAIL_TAKEN, message: 'Email is already registered' })`. New codes must be added to `packages/shared/src/errors.ts` (re-exported by `common/errors/error-code.ts`) **and** to table 4.3 in [docs/api-guide.md](../../docs/api-guide.md#43-error-codes). Name them `<FEATURE>_<DESCRIPTION>` and never rename a published code. `HttpExceptionFilter` handles formatting; unexpected errors become 500 `INTERNAL_ERROR` and are logged.
- **Swagger**: request bodies and queries come from the shared zod schemas (`zodDto`), so never add `@ApiProperty`. Tag each controller with `@ApiTags('<feature>')`. For every route (decorators in `common/swagger/api-docs.decorators.ts`):
  - a one-line `/** */` comment on the method: it becomes the summary; put rules the FE must know in `@ApiOperation({ description })`;
  - the success body: `@ApiData(xxxResponseSchema, status)` (201 for a plain `@Post`), `@ApiData(z.array(...))` for arrays, `@ApiPage(...)` for paginated lists; nothing for 204. Response schemas live in `packages/shared/src/responses` and are registered in `responseSchemas`;
  - `@ApiErrors(...)` with the codes the service can throw. Not needed for the derived ones: 401 on signed-in routes, 400 `VALIDATION_ERROR` when there is a body or query, access errors from `@Roles` / `@HotelAccessRequired`, upload errors from `@UploadFile`. Routes addressed by another resource (`/rooms/:id`) add `@ApiHotelAccess(level, notFoundCode)`; routes that issue tokens add `@ApiClientType()`;
  - a new error code also needs its status and meaning in `common/swagger/error-catalog.ts` (the record type makes it a compile error otherwise).
  - `test/swagger.e2e-spec.ts` fails when a route has no summary, no access note, or not exactly one documented success response.
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
7. The Docker database (`pgvector/pgvector:pg16`, container `stayreco-db`) is a **temporary** local setup until the team database is ready. Prisma 7 reads the connection from `prisma.config.ts`; the client is generated into `src/generated/prisma` (not committed; run `npx prisma generate`).
8. The HNSW vector index on `content_embedding.embedding` is **not** created yet; it will be added with the RAG module. Prisma cannot declare it in `schema.prisma`, so when it is added, every new migration must be created with `--create-only` and checked for a generated `DROP INDEX "content_embedding_hnsw"` line, which must be removed.

## 4. Money

**Storage and transport**

- Amounts are Vietnamese đồng (VND) only, stored as `Decimal(14, 2)` in Prisma/PostgreSQL: up to 999,999,999,999.99, with 2 decimal places allowed. Never use `Float` for money (binary floating point cannot represent decimal amounts exactly).
- Percentages (discount, commission rate) are stored as `Decimal(5, 2)`, e.g. `15.00`. The platform commission is 8–15%; new partners get `DEFAULT_COMMISSION_RATE` (8).
- The API sends amounts and percentages as JSON numbers with at most 2 decimals (`2250000`, `185185.05`, `12.5`). Prisma returns `Decimal` objects, which serialize as strings, so convert them to `number` in the response mapping.
- Do all calculations in the backend with `Prisma.Decimal`, never with JS `number`. The FE displays the amounts it receives and does not recompute them.

**Rounding**

A percentage of a price often has more than 2 decimals (12.5% of 1,234,567 ₫ is 154,320.875 ₫), so each derived amount is rounded at one defined point, with one rule. "Exact" means: no floating-point error, and the same input always gives the same result in the backend, the invoice and the reports.

- Compute each derived amount (discount, commission, cancellation fee, refund) with `Decimal`, then round it **once** to 2 decimals with `ROUND_HALF_UP` (`.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)`). Never round intermediate values, and never round twice.
- Payment gateways (VNPay, SePay) only accept whole đồng, so the amount **sent to the gateway** is rounded to 0 decimals with `ROUND_HALF_UP`, and the same rounded amount is stored as the paid amount.
- **Percentage discounts are based on the base price** (the effective price after pricing rules, before any discount, per BR-05). When a booking has both a promotion and a voucher (BR-06), each percentage is applied to the base price, not to the already-discounted price; the discounts are then subtracted. The final price is never below 0.

```ts
// base = 1_234_567, promotion 15%, voucher 50_000 (fixed)
const promo = base.mul(15).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP); // 185_185.05
const final = Decimal.max(base.sub(promo).sub(50_000), 0);                      // 999_381.95
const charged = final.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);                // 999_382 (sent to the gateway)
```

## 5. Multi-tenancy

- The tenant boundary is the **hotel** (`hotel_id`). Every hotel-owned table has a `hotel_id` column.
- **A staff member belongs to exactly one hotel** (`hotel_staff.hotel_id` is required). Partners invite staff to one of their own hotels.
- Every query on hotel-owned data filters by `hotelId`. The `hotelId` comes from the caller's relationship (the partner owns the hotel, or the staff member is assigned to it), **not from the client**. A value in the URL only selects the hotel and must then be verified.
- One shared `HotelAccessGuard` checks access to `:hotelId` for every `/hotels/:hotelId/...` route, so services don't each check it their own way. Owner: Khiêm.
- Every module with tenant data must have an e2e test proving that partner A **cannot** read or modify partner B's data (risk #7 in Report 2).

## 6. Git workflow

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
- [ ] [docs/api/](../../docs/api/README.md) and Swagger are updated if the API changed

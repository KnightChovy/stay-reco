# @stayreco/shared

Code shared by the backend, the web frontend and mobile: zod schemas for request bodies and queries, enums, error codes and response types. The BE validates with the same schemas the FE uses for its forms, so the two sides cannot drift apart.

| File | Content |
|---|---|
| `src/schemas/<feature>.ts` | Zod schemas for bodies and queries (`createHotelSchema`, `loginSchema`…) and their input types (`CreateHotelInput`) |
| `src/responses/<feature>.ts` | TypeScript types of the response `data` (`Hotel`, `Account`…) |
| `src/enums.ts` | `Role`, `AccountStatus`, `HotelStatus`, `RoomStatus`… (must match `backend/prisma/schema.prisma`) |
| `src/errors.ts` | `ErrorCode` (meanings in [docs/api-guide.md §4.3](../../docs/api-guide.md#43-error-codes)) |
| `src/http.ts` | Envelope types `APIResponse`, `APIError`, `PageMeta`, `ErrorDetail` |

Which schema and type each endpoint uses: see the [docs/api/](../../docs/api/README.md) pages.

## Install

All 3 apps depend on it with `"@stayreco/shared": "file:../packages/shared"` (a symlink; no workspaces or turbo, each app still runs on its own).

- **First time / after a pull**: `npm install` in the app you work on is enough. `postinstall` installs and builds shared into `dist/`. The `dev` and `build` scripts (mobile: `start`) also rebuild shared before running.
- **Editing shared a lot**: open another terminal with `cd packages/shared && npm run dev` (tsc watch) so the app picks up changes immediately.

## Use

- **Backend**: `export class CreateHotelDto extends zodDto(createHotelSchema) {}` (`backend/src/common/pipes/validation.ts`).
- **FE / mobile**: `import { loginSchema, type LoginInput, ErrorCode } from '@stayreco/shared'`. When you need a client-only schema, import `z` from `@stayreco/shared` so it uses the same zod copy as the shared schemas.

## Add schemas for a new feature

- Create `src/schemas/<feature>.ts` and export it from `src/index.ts`. Name it `xxxSchema` and add `export type XxxInput = z.infer<typeof xxxSchema>`. Use `z.strictObject` for bodies so unknown fields are rejected.
- Response types go in `src/responses/<feature>.ts`.
- Enums in `src/enums.ts` must match `backend/prisma/schema.prisma`. When a Prisma enum changes, change this file too.
- New error codes: `src/errors.ts` **and** the table in [docs/api-guide.md §4.3](../../docs/api-guide.md#43-error-codes).

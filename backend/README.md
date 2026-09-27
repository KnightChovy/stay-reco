# StayReco Backend

NestJS 11 + PostgreSQL + Prisma.

## Setup

```bash
npm install
cp .env.example .env        # then set JWT_ACCESS_SECRET
npm run db:up               # Postgres in Docker (creates stayreco + stayreco_test)
npm run db:migrate
npm run db:seed             # creates the admin from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
npm run start:dev           # http://localhost:3000/api/v1
```

Tests: `npm run test:e2e` (uses the `stayreco_test` database, see `.env.test`).

## Auth

All routes require `Authorization: Bearer <accessToken>` unless marked `@Public()`.
Restrict by role with `@Roles(Role.ADMIN, ...)`; read the caller with `@CurrentUser()`.

- **Access token**: JWT, 15 min. Checked against the session on each request, so logout/suspension is immediate.
- **Refresh token**: opaque, 30 days, rotated on every `/auth/refresh`. Reusing an old one revokes the session.
- **Clients**: send `X-Client-Type: web` to receive the refresh token as an httpOnly cookie; otherwise (mobile) it is returned in the body.

| Method | Path | Access |
|---|---|---|
| POST | `/auth/register/customer` | public |
| POST | `/auth/register/partner` | public |
| POST | `/auth/login` | public |
| POST | `/auth/refresh` | public (refresh token) |
| POST | `/auth/logout`, `/auth/logout-all` | auth |
| GET | `/auth/me` | auth |
| GET / DELETE | `/auth/sessions`, `/auth/sessions/:id` | auth |
| POST | `/auth/verify-email`, `/auth/resend-verification` | public |
| POST | `/auth/forgot-password`, `/auth/reset-password` | public |
| POST | `/auth/change-password` | auth |
| POST | `/auth/invitations/staff` | HOTEL_PARTNER |
| POST | `/auth/invitations/platform-manager` | ADMIN |
| POST | `/auth/invitations/accept` | public |

Emails are printed to the console in development (`ConsoleMailService`); swap the provider in `MailModule` for production.

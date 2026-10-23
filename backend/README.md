# StayReco Backend

NestJS 11 + PostgreSQL + Prisma.

## Setup

```bash
npm install
cp .env.example .env        # then set JWT_ACCESS_SECRET
npm run db:up               # Postgres in Docker (creates stayreco + stayreco_test)
                            # port/credentials come from DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in .env
npm run db:migrate
npm run db:seed             # creates the admin from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
npm run dev                 # (= start:dev) http://localhost:3000/api/v1, Swagger: /api/docs
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

## Email

Sent with Nodemailer over SMTP, so any provider works by changing `.env` only.

- **`SMTP_HOST` empty** (default, and in e2e tests): emails are printed to the console, including the 6-digit verification code.
- **SMTP set**: fill `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` (see `.env.example` for Gmail and Mailtrap). The connection is checked at startup (`SMTP ready` or `SMTP connection failed` in the log).
- A failed send is logged with the SMTP server's answer and does not fail the request; users can ask to resend.
- With Gmail, `MAIL_FROM` must be the same Gmail address as `SMTP_USER`. Sending "from" a Gmail address through another provider (Brevo, SendGrid…) gets rejected or lands in spam.

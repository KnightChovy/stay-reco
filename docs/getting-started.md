# Running StayReco locally

For FE web, mobile and newcomers: run the backend on your machine to wire up the API.

## Prerequisites (once)

- **Node.js 20.19 or later** (or 22). Check with `node -v`. Prisma 7 does not run on older versions.
- **Docker Desktop**, running (PostgreSQL runs in Docker).
- The `stay-reco` repo cloned, on the `develop` branch.

## Backend: first time

Open a terminal in `stay-reco/backend`:

```bash
cp .env.example .env
```

Open `backend/.env` and change 2 values:

1. `JWT_ACCESS_SECRET=`: any string of at least 32 characters.
2. `BENEFICIARY_ENCRYPTION_KEY=`: **required**, the backend will not start without it. Generate it with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

   Paste the printed string after the `=`. Each person generates their own key for their own database; do not copy someone else's. Keep it once you have seeded: the data in your database can only be read with the key it was encrypted with. To switch keys, see *Common errors* below.

Leave the other variables as they are. With `CLOUDINARY_*` empty, only the image and document upload APIs return `503 UPLOAD_UNAVAILABLE`; every other API works. Ask the BE for the Cloudinary settings if you need real uploads.

Then run, in order:

```bash
npm install          # installs packages, builds packages/shared and the Prisma client
npm run db:up        # starts PostgreSQL in Docker
npm run db:migrate   # creates the tables
npm run db:seed      # sample data: amenities, bed types, admin, demo hotels
npm run dev          # starts the backend
```

The backend runs at **http://localhost:3000/api/v1**; browse and try the API at **http://localhost:3000/api/docs** (Swagger: click Authorize and paste an access token from `POST /auth/login`).

## Backend: after each pull

In `stay-reco/backend`:

```bash
git pull
npm install
npm run db:up        # skip if the database is already running
npm run db:migrate   # applies new database changes (if any)
npm run db:seed      # safe to re-run, creates no duplicates
npm run dev
```

## Running the frontend alongside

Start the backend first, then run the frontend on **port 3001** (the backend uses port 3000 and only allows CORS from `localhost:3001`):

```bash
cd frontend
npm install
npm run dev -- -p 3001
```

- Open the web app at **http://localhost:3001**. The FE calls the API at `http://localhost:3000/api/v1` by default (`frontend/src/lib/axios.ts`); to change it, set `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.
- Links in emails (verification, password reset, invitations) point to `http://localhost:3001`. Locally, emails are not sent but **printed in the backend terminal**, so take the OTP and links from there.

## Demo accounts

Shared password `Demo@123456` (change it with `SEED_DEMO_PASSWORD`).

| Email | Role | Data |
|---|---|---|
| `partner.danang@stayreco.local` | Partner | 2 hotels: Sơn Trà Bay Resort & Spa (active, 3 room types, 12 rooms), Mỹ Khê Boutique Hotel (waiting for verification) |
| `partner.hanoi@stayreco.local` | Partner | Hồ Gươm Heritage Hotel (active) |
| `partner.hcm@stayreco.local` | Partner | Sài Gòn Riverside Grand Hotel (active) |
| `staff.danang@stayreco.local`, `staff.hanoi@stayreco.local`, `staff.hcm@stayreco.local` | Staff: position Lễ tân (receptionist), permissions `FRONT_DESK`, `BOOKING` | The active hotel in that city |
| `pm@stayreco.local` | Platform manager | The queue has 1 pending request (Mỹ Khê) |
| `admin@stayreco.local` | Admin | Password is `SEED_ADMIN_PASSWORD` in `.env` (default `Admin@123456`) |

Hotel and company names are fictional; images come from picsum.photos; demo documents have no real file on Cloudinary (the file link reports it as not found).

## Common errors

| Error | Fix |
|---|---|
| `P1001: Can't reach database server at localhost:5432` | Docker Desktop is not running, or `npm run db:up` was not run |
| `Invalid environment variables ... BENEFICIARY_ENCRYPTION_KEY` | The key is missing or malformed; generate it again with the command above |
| Verification APIs (request detail, history, approve, reject, submit) return `500 INTERNAL_ERROR`, and the backend terminal shows `Cannot decrypt a stored value` | `BENEFICIARY_ENCRYPTION_KEY` is not the key your database was seeded with (it was changed, or copied from someone else). Put the old key back, or keep the new one and recreate the local data: `npx prisma migrate reset`, then `npm run db:seed` (all local data is lost) |
| `Port 3000 is already in use` | Another app (usually the frontend) holds port 3000: stop it, start the backend first, run the frontend on port 3001 |
| The browser reports a **CORS** error | The frontend is not running on `localhost:3001`; restart it with `npm run dev -- -p 3001` |
| `npm run db:migrate` asks whether to **reset** the database | Answer **No** and tell the BE. Run `npx prisma migrate reset` (recreates the tables, empty) then `npm run db:seed` only if you accept losing all local data |
| API calls return `401 UNAUTHENTICATED` | The access token expired (15 minutes): axios refreshes it; if it still fails, sign in again |

## Next

- API rules (tokens, envelope, error codes, pagination): [api-guide.md](./api-guide.md).
- Endpoints for the screens you work on: [api/](./api/README.md).

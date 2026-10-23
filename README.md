# StayReco

A hotel booking platform with AI recommendations: customers search and book rooms, partners list and run their hotels, platform managers verify and oversee them.

## Repository layout

| Folder | Content |
|---|---|
| [backend/](./backend/) | API: NestJS 11, Prisma 7, PostgreSQL 16 (pgvector) |
| [frontend/](./frontend/) | Web: Next.js |
| [mobile/](./mobile/) | App: Expo (React Native) |
| [packages/shared/](./packages/shared/README.md) | Zod schemas, enums, error codes and response types shared by the 3 apps |
| [docs/](./docs/README.md) | Team docs: local setup, API rules, endpoints by user role, phase plans |

Each app is installed and run on its own, inside its folder (no workspaces).

## Getting started

- Run locally: [docs/getting-started.md](./docs/getting-started.md)
- API rules: [docs/api-guide.md](./docs/api-guide.md)
- Endpoints by user role: [docs/api/](./docs/api/README.md)
- Current phase: [docs/README.md](./docs/README.md#where-we-are)
- Backend code conventions: [backend/docs/CONVENTIONS.md](./backend/docs/CONVENTIONS.md)

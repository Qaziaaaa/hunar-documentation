# HUNAR Backend

Backend for the HUNAR home-services platform.

> **Scope of this branch (`feat/shafqatullah`):** Module 1 worker-flow backend modules assigned to
> **Shafqat Ullah** — Jobs & Matching (PostGIS), Offers, Visits (+ location tracking), Inspection,
> Repair, Commission tracking, and Reviews. See `Task Contribution/module_1.md` (lines 808–946).

## Stack

NestJS (TypeScript) modular monolith · Prisma · PostgreSQL + PostGIS · Redis (ioredis) · Socket.IO ·
JWT (Passport) · class-validator/class-transformer · `@nestjs/event-emitter`.

## Run (development)

1. Start dependencies: PostgreSQL with PostGIS + Redis.
2. `cp .env.example .env` and set `DATABASE_URL` / `REDIS_*`.
3. `npm install`
4. `npm run prisma:generate`
5. `npm run prisma:migrate` (applies `prisma/migrations` incl. PostGIS extension + GiST index)
6. `npm run prisma:seed` (service categories + test users)
7. `npm start:dev`

## Scripts

| Command | Purpose |
|---|---|
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |
| `npm run test:e2e` | E2E (needs DB) |
| `npm run prisma:validate` | Validate Prisma schema |

## API prefix

All endpoints are prefixed with `/api/v1` (see `src/main.ts`).
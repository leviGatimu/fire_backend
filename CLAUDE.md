# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

TZW FEMS — a Fire Extinguisher Management System built as a **RESTful microservices monorepo** (npm workspaces). React SPA → API Gateway → 7 Express/TypeScript services → PostgreSQL (Prisma). See `docs/ARCHITECTURE.md` for the full picture.

## Common commands

```bash
# Whole stack via Docker (postgres + migrate/seed + 8 services + frontend)
docker compose up --build

# Local dev (needs a running Postgres + DATABASE_URL in .env)
npm install
npm run prisma:generate
npm run prisma:migrate            # prisma migrate dev --name init
npm run seed                      # ts-node prisma/seed.ts
npm run dev                       # all services + gateway via concurrently
npm run dev -w services/auth-service   # a single service

# Frontend
cd frontend && npm install && npm run dev   # Vite on :5173

# Tests
npm test                          # all workspaces
npm test -w services/auth-service # one service
npx jest src/__tests__/auth.test.ts -w services/auth-service  # one file
```

## Architecture notes that aren't obvious from one file

- **Shared library `packages/shared`** is the backbone: every service imports `authenticate`, `authorize(...roles)`, `validate(zodSchema)`, the `AppError` hierarchy + `errorHandler`, the Winston logger + `requestLogger`, JWT helpers, the pooled Prisma client, and `mountSwagger`. Change cross-cutting behavior here, not per-service.
- **Single Prisma schema, multiple bounded contexts.** All services share one Postgres + `prisma/schema.prisma`, but each service only writes the tables it owns (see the ownership table in `docs/ARCHITECTURE.md`). Keep that discipline — don't have, say, `reporting-service` write to `inspections`.
- **Zero-trust auth.** The gateway does routing/CORS/rate-limiting only; it does **not** terminate auth. Every service re-verifies the JWT via `authenticate`. So new protected routes must add `authenticate` (+ `authorize`) themselves.
- **Each service mounts its routes twice** — at `/api/<resource>` and at `/` — because the gateway strips the `/api/<resource>` prefix before proxying (`pathRewrite` in `services/api-gateway/src/index.ts`). Keep both mounts when adding a service.
- **Response envelope is uniform:** success → `{ success: true, data }` (lists add `meta`); errors → `{ success: false, error: { code, message, details? } }`. The frontend and Swagger examples assume this shape.
- **Refresh-token rotation:** tokens are stored hashed in `refresh_tokens`, rotated on `/auth/refresh`, and revoked on logout/password-change. The frontend axios interceptor (`frontend/src/lib/api.ts`) refreshes transparently on 401 and retries once.
- **Service-to-service calls** use `serviceFetch` (short timeout, best-effort). The only current edge is `inspection-service` → `notification-service /internal/notify`; failures are swallowed by design.

## Adding a new endpoint to a service

1. Zod schema in `src/validators/*.schema.ts`.
2. Business logic in `src/services/*.service.ts` (throws `AppError` subclasses).
3. Wire route in `src/routes/*.routes.ts` with `authenticate`, `authorize(...)`, `validate(...)`, `asyncHandler(...)`.
4. Document it in `src/docs/openapi.ts` (served at `/docs` and aggregated by the gateway).

## Ports

gateway 8080 · auth 4001 · user 4002 · extinguisher 4003 · inspection 4004 · maintenance 4005 · reporting 4006 · notification 4007 · postgres 5432 · frontend 5173.

## Conventions

- TypeScript everywhere; services run via `ts-node`/`ts-node-dev` (no build step needed for dev).
- Enums (type/size/status) are defined once in `prisma/schema.prisma` and mirrored in Zod validators and the frontend `labelize` helper — update all three together.
- Seeded demo accounts: `admin@tzw.com / Admin@1234`, `inspector@tzw.com / Inspect@1234`, `user@tzw.com / User@1234`.

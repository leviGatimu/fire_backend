# System Architecture — TZW FEMS

## 1. Overview

FEMS is a **RESTful microservices** platform. A React SPA talks to a single
**API Gateway**, which reverse-proxies to seven independent services. Each
service owns a bounded context, exposes its own OpenAPI document, and verifies
JWTs independently (zero-trust). PostgreSQL is the system of record; Prisma is
the ORM and migration tool.

```
                         ┌──────────────────────────┐
                         │   React SPA (Vite, :5173) │
                         │  Tailwind + shadcn/ui     │
                         │  React Query + Axios      │
                         └────────────┬─────────────┘
                                      │ HTTPS / JSON  (Bearer JWT)
                                      ▼
                         ┌──────────────────────────┐
                         │     API Gateway (:8080)   │
                         │  CORS · rate limit ·      │
                         │  routing · aggregated      │
                         │  Swagger (/docs)          │
                         └────────────┬─────────────┘
            ┌───────────────┬─────────┼──────────┬───────────────┬───────────────┐
            ▼               ▼         ▼          ▼               ▼               ▼
      ┌──────────┐   ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐
      │  auth    │   │  user    │ │  exting │ │ inspect. │ │ maintenance│ │  reporting   │
      │  :4001   │   │  :4002   │ │  :4003  │ │  :4004   │ │   :4005    │ │    :4006     │
      └────┬─────┘   └────┬─────┘ └────┬────┘ └────┬─────┘ └─────┬──────┘ └──────┬───────┘
           │              │            │           │  notify───────────────► ┌──────────────┐
           │              │            │           │             │           │ notification │
           │              │            │           │             │           │    :4007     │
           └──────────────┴────────────┴───────────┴─────────────┴───────────┴──────┬───────┘
                                                                                     ▼
                                                                        ┌──────────────────────┐
                                                                        │  PostgreSQL (:5432)   │
                                                                        │  Prisma schema        │
                                                                        └──────────────────────┘
```

## 2. Why these boundaries

| Service | Bounded context | Owns tables |
|---|---|---|
| **auth-service** | Identity, sessions, password recovery | `users` (auth columns), `refresh_tokens` |
| **user-service** | User & role administration, profile | `users`, `roles` |
| **extinguisher-service** | Asset master data | `fire_extinguishers` |
| **inspection-service** | Inspection lifecycle | `inspections` |
| **maintenance-service** | Service records | `maintenance_logs` |
| **reporting-service** | Read-only aggregation & exports | (reads all) |
| **notification-service** | Async messaging | `notifications` |
| (cross-cutting) | Audit trail | `audit_logs` |

> **Data ownership note.** A textbook deployment gives each service its own
> database. For this project all services share one PostgreSQL instance with a
> single Prisma schema, but each service only writes to the tables it owns
> (enforced in code). This keeps the project runnable on a laptop while
> preserving clean seams. The migration path to DB-per-service is: split
> `schema.prisma`, give each service its own `DATABASE_URL`, and replace the
> few cross-context reads with service-to-service calls or a read replica.

## 3. Request lifecycle (example: schedule an inspection)

1. SPA `POST /api/inspections` with `Authorization: Bearer <access>`.
2. Gateway applies rate limiting + CORS, rewrites `/api/inspections` → `/`, proxies to `inspection-service:4004`.
3. `authenticate` middleware verifies the JWT signature/expiry → `req.user`.
4. `authorize('ADMIN','INSPECTOR')` enforces RBAC.
5. Zod `validate` parses/coerces the body.
6. Service-layer business rules run (extinguisher exists, assignee is staff).
7. Prisma persists the row; `inspection-service` fires a best-effort call to
   `notification-service /internal/notify`.
8. A normalized JSON envelope returns: `{ success, data }`.

## 4. Cross-cutting concerns (the `@tzw/shared` package)

* **AuthN/AuthZ** — `authenticate`, `authorize(...roles)`, JWT sign/verify, token hashing.
* **Validation** — `validate(zodSchema)` for body/query/params.
* **Errors** — `AppError` hierarchy + central `errorHandler` (maps Zod & Prisma errors).
* **Logging** — Winston structured logger + `requestLogger` with correlation ids (`x-request-id`). In production logs are JSON, ready for ELK/Loki/CloudWatch.
* **Swagger** — `mountSwagger` + shared security schemes/responses.
* **Prisma** — one pooled client per process.

## 5. Authentication & tokens

* **Access token** (JWT, 15 min) — sent as `Bearer`, verified by every service.
* **Refresh token** (JWT, 7 days) — stored **hashed** (`sha256`) in `refresh_tokens`; rotated on every refresh; revoked on logout / password change.
* **RBAC** — `ADMIN`, `INSPECTOR`, `USER` (see `docs/SECURITY.md` for the matrix).

## 6. Scalability & operations

* Every service is stateless → horizontally scalable behind the gateway.
* `docker-compose` runs the full stack; the `migrate` one-shot applies
  migrations + seed before services boot (compose `depends_on` conditions).
* Health endpoints (`/health`) on every service for orchestrator probes.
* For Kubernetes: one Deployment + Service per microservice, an Ingress in
  place of the gateway container (or keep the gateway as an internal LB),
  and a managed Postgres.
```

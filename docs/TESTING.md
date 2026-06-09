# Testing Strategy — TZW FEMS

## Test pyramid

```
        ▲  E2E (Playwright)         few — login → schedule → complete flow
       ╱ ╲ Integration (Supertest)  per-service: route + middleware + DB
      ╱───╲ Unit (Jest)             services, validators, RBAC, JWT helpers
```

## 1. Unit tests (Jest + ts-jest)
- **Pure logic**: token signing/verifying, password policy (Zod), RBAC `authorize`, report aggregation math.
- **Service layer** with Prisma mocked (`jest-mock-extended`) — assert business rules (e.g. cannot complete a cancelled inspection, refresh rotation revokes old token).

## 2. Integration tests (Supertest against the Express app)
- Spin up the service `createApp()` with a **test database** (Dockerized Postgres or `pg-mem`).
- Cover the full middleware chain: auth → authorize → validate → controller → Prisma.
- Example matrix for `extinguisher-service`:
  - `POST /` as USER → `403`
  - `POST /` as ADMIN with bad body → `422`
  - `POST /` duplicate serial → `409`
  - `GET /` with filters/pagination → correct `meta`
  - `GET /:id` missing → `404`

## 3. Contract tests
- Each service publishes `/docs.json` (OpenAPI 3). Validate responses against the schema (e.g. `jest-openapi`) so the gateway-aggregated contract stays honest.

## 4. End-to-end (Playwright)
- Critical path against the running Docker stack: login → create extinguisher → schedule inspection → complete → verify dashboard counts update → export PDF.

## 5. Example test (auth-service)
See [`services/auth-service/src/__tests__/auth.test.ts`](../services/auth-service/src/__tests__/auth.test.ts).

## 6. Running
```bash
npm test                       # all workspaces
npm test -w services/auth-service
```

## 7. CI gate (suggested)
1. `npm ci` → `npm run lint` → `npm run build`
2. Start ephemeral Postgres (service container) → `prisma migrate deploy`
3. `npm test` with coverage thresholds (e.g. 80% lines on service layers)
4. Build images; run Playwright E2E against compose; scan images (Trivy).

## Coverage targets
| Layer | Target |
|---|---|
| Service/business logic | ≥ 85% |
| Validators & middleware | ≥ 90% |
| Controllers/routes (integration) | key paths + error codes |

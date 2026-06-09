# Deployment Guide — TZW FEMS

## A. Local development with Docker (recommended)

```bash
cp .env.example .env          # adjust secrets
docker compose up --build     # builds 8 services + frontend + postgres
```

Boot order is enforced by compose:
`postgres (healthy)` → `migrate (prisma migrate deploy + seed)` → services → gateway → frontend.

Open http://localhost:5173 and sign in with `admin@tzw.com / Admin@1234`.

Tear down (keep data): `docker compose down`
Tear down (wipe data): `docker compose down -v`

## B. Local development without Docker

Prereqs: Node 20+, a running PostgreSQL.

```bash
npm install
# point DATABASE_URL at your local Postgres in .env (host=localhost)
npm run prisma:generate
npm run prisma:migrate        # creates tables
npm run seed                  # roles, users, sample data
npm run dev                   # all services + gateway (concurrently)

cd frontend && npm install && npm run dev   # SPA on :5173
```

Run a single service: `npm run dev -w services/auth-service`

## C. Database migrations

```bash
# create a new migration after editing prisma/schema.prisma
npx prisma migrate dev --name <change>
# apply pending migrations in CI/prod (no prompts)
npx prisma migrate deploy
```

## D. Production notes

1. **Build images** per service (each has its own Dockerfile, build context = repo root).
   In CI: `docker build -f services/<name>/Dockerfile -t registry/fems-<name>:<tag> .`
2. **Secrets** via your platform's secret store; never bake into images.
3. **TLS** terminates at the gateway/ingress. Set `CORS_ORIGIN` to the real frontend origin and `VITE_API_URL` to the public API URL at build time.
4. **Postgres**: use a managed instance; run `prisma migrate deploy` as a release job (mirrors the compose `migrate` one-shot).
5. **Scaling**: services are stateless — scale replicas behind the gateway. Postgres connection limits: tune Prisma pool / use PgBouncer.

### Kubernetes sketch
- Deployment + Service per microservice (`replicas: 2+`).
- Ingress routes `/api/*` to the gateway Service; `/` to the frontend Service.
- `initContainer` or a `Job` runs `prisma migrate deploy`.
- `liveness`/`readiness` probes → `GET /health`.
- HPA on CPU for the gateway and hot services.

## E. Smoke test after deploy

```bash
curl -s http://localhost:8080/health
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@tzw.com","password":"Admin@1234"}'
# → { "success": true, "data": { "accessToken": "...", "refreshToken": "..." } }
```

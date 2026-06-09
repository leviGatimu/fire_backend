# TZW Fire Extinguisher Management System (FEMS)

Enterprise-grade, RESTful **microservices** platform for managing fire
extinguishers, inspections, maintenance, users, and compliance reporting across
multiple facilities.

> Built for TZW LTD. Stack: Node.js + Express + TypeScript, PostgreSQL + Prisma,
> JWT + RBAC, React + Vite + TypeScript + Tailwind + shadcn/ui + React Query,
> Docker + Docker Compose, OpenAPI/Swagger, centralized logging.

---

## 1. What's in this repository

```
fire/
├─ docker-compose.yml          # One command to run the whole platform
├─ .env.example                # Copy to .env and adjust
├─ package.json                # npm workspaces (monorepo root)
├─ tsconfig.base.json          # Shared TS compiler options
├─ prisma/                     # Single source of truth for the data model
│  ├─ schema.prisma
│  └─ seed.ts
├─ packages/
│  └─ shared/                  # Cross-service library (auth, logging, errors, prisma, swagger)
├─ services/
│  ├─ api-gateway/             # Single public entrypoint, routing, rate limiting, JWT pre-check
│  ├─ auth-service/            # register / login / logout / refresh / forgot / reset
│  ├─ user-service/            # user & role management, profile, change password
│  ├─ extinguisher-service/    # fire extinguisher CRUD
│  ├─ inspection-service/      # schedule / update / cancel / complete inspections
│  ├─ maintenance-service/     # maintenance logs & history
│  ├─ reporting-service/       # dashboards, stats, PDF/Excel export
│  └─ notification-service/    # async notifications (email/in-app)
├─ frontend/                   # React + TS + Tailwind + shadcn/ui SPA
└─ docs/
   ├─ ARCHITECTURE.md          # System & service design, diagrams
   ├─ ERD.md                   # Entity-relationship model
   ├─ DEPLOYMENT.md            # Local + production deployment guide
   ├─ SECURITY.md              # Security best practices applied
   ├─ TESTING.md               # Testing strategy
   └─ postman_collection.json  # Importable API collection
```

## 2. Quick start (Docker — recommended)

```bash
cp .env.example .env
docker compose up --build
```

Then open:

| Surface                | URL                                   |
|------------------------|---------------------------------------|
| Frontend (SPA)         | http://localhost:5173                 |
| API Gateway            | http://localhost:8080                 |
| Aggregated Swagger UI  | http://localhost:8080/docs            |
| Auth Swagger           | http://localhost:4001/docs            |
| PostgreSQL             | localhost:5432                        |

Seeded accounts (see `prisma/seed.ts`):

| Role      | Email                  | Password      |
|-----------|------------------------|---------------|
| Admin     | admin@tzw.com          | Admin@1234    |
| Inspector | inspector@tzw.com      | Inspect@1234  |
| User      | user@tzw.com           | User@1234     |

## 3. Quick start (local, without Docker)

```bash
npm install                         # installs all workspaces
# start a local Postgres and set DATABASE_URL in .env
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev                         # runs all services + gateway concurrently
cd frontend && npm run dev          # SPA on :5173
```

## 4. Service map / ports

| Service                | Port  | Base path (via gateway) |
|------------------------|-------|--------------------------|
| api-gateway            | 8080  | `/`                      |
| auth-service           | 4001  | `/api/auth`              |
| user-service           | 4002  | `/api/users`             |
| extinguisher-service   | 4003  | `/api/extinguishers`     |
| inspection-service     | 4004  | `/api/inspections`       |
| maintenance-service    | 4005  | `/api/maintenance`       |
| reporting-service      | 4006  | `/api/reports`           |
| notification-service   | 4007  | `/api/notifications`     |

## 5. Documentation

Start with [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the big picture,
then [`docs/ERD.md`](docs/ERD.md) for the data model. Deployment, security, and
testing strategy live in their respective files under `docs/`.

# Security Best Practices — TZW FEMS

## Authentication
- **Password hashing** with bcrypt (cost factor 12). Plaintext passwords are never stored or logged.
- **JWT access tokens** (15 min) signed with `JWT_ACCESS_SECRET`; **refresh tokens** (7 days) signed with a *separate* `JWT_REFRESH_SECRET`.
- Refresh tokens are persisted **hashed** (`sha256`) and **rotated** on each use; the previous token is revoked (detects token theft/replay).
- Logout and password change/reset **revoke all refresh tokens** for the user.
- `forgot-password` always returns the same response → **no user enumeration**. Reset tokens are random 32-byte values, stored hashed, expiring in 30 minutes.

## Authorization (RBAC)
| Capability | ADMIN | INSPECTOR | USER |
|---|:--:|:--:|:--:|
| View extinguishers / inspections | ✅ | ✅ | ✅ |
| Create/edit/delete extinguishers | ✅ | — | — |
| Schedule / complete / cancel inspections | ✅ | ✅ | — |
| Log / edit maintenance | ✅ | ✅ | — |
| Reports & exports (PDF/Excel) | ✅ | — | — |
| Manage users & roles | ✅ | — | — |
| Edit own profile / change own password | ✅ | ✅ | ✅ |

Enforced by `authorize(...roles)` after `authenticate`. **Zero-trust:** each
service re-verifies the JWT — the gateway is not the only line of defense.

## Transport & headers
- **Helmet** sets secure headers (CSP-ready, `X-Content-Type-Options`, `frameguard`, HSTS in prod).
- **CORS** restricted to the configured `CORS_ORIGIN`.
- Terminate **TLS** at the gateway/ingress in production; never expose service ports publicly.

## Input handling
- All input validated/coerced with **Zod** (body, query, params). Unknown fields are dropped.
- Prisma parameterizes all queries → **no SQL injection**.
- Central error handler returns sanitized messages; stack traces are logged, never returned.

## Rate limiting & abuse
- Global rate limit at the gateway (`RATE_LIMIT_MAX` per window).
- Stricter limiter on `auth` credential endpoints (20/15 min) to slow brute force.

## Secrets & config
- All secrets via environment variables (`.env`, never committed). `.env.example` documents every key.
- Rotate `JWT_*` secrets and DB credentials per environment. Use a secret manager (AWS Secrets Manager / Vault) in production.

## Auditing
- `audit_logs` captures security-relevant actions (actor, action, entity, IP) for forensics.
- Structured request logs carry a correlation id (`x-request-id`) propagated across services.

## Hardening checklist for production
- [ ] Strong, unique `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (32+ bytes).
- [ ] TLS everywhere; HSTS enabled.
- [ ] Network-isolate `notification-service/internal/*` to the internal network only.
- [ ] DB least-privilege users; managed Postgres with automated backups.
- [ ] Dependency scanning (`npm audit`, Snyk) in CI; image scanning (Trivy).
- [ ] Centralized log shipping + alerting on auth failures/5xx spikes.

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import swaggerUi from 'swagger-ui-express';
import { createLogger, requestLogger } from '@tzw/shared';
import { config, routeTable } from './config';

const logger = createLogger(config.serviceName);
const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(requestLogger(logger));

// Global rate limiting at the edge.
app.use(rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.max, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

// ── Aggregated Swagger UI: a dropdown of every service's spec ────────────────
const swaggerUrls = routeTable
  .filter((r) => r.prefix !== '/api/auth')
  .map((r) => ({ name: r.prefix.replace('/api/', ''), url: `${r.prefix}/docs.json` }));
swaggerUrls.unshift({ name: 'auth', url: '/api/auth/docs.json' });

app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    explorer: true,
    swaggerOptions: { urls: swaggerUrls },
    customSiteTitle: 'TZW FEMS — API Gateway',
  }),
);

// ── Reverse proxy: forward each prefix to its upstream service ───────────────
// NOTE: the gateway does NOT terminate auth — each service verifies the JWT
// itself (zero-trust). The gateway focuses on routing, CORS, and rate limiting.
for (const { prefix, target } of routeTable) {
  app.use(
    prefix,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      // Strip the public prefix; services mount routes at their root too.
      pathRewrite: (path) => path.replace(prefix, '') || '/',
      on: {
        error: (err, _req, res) => {
          logger.error('proxy error', { target, err: (err as Error).message });
          (res as express.Response).status(502).json({ success: false, error: { code: 'BAD_GATEWAY', message: `Upstream ${prefix} unavailable` } });
        },
      },
    }),
  );
}

app.use((req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `No route for ${req.originalUrl}` } }));

app.listen(config.port, () => {
  logger.info(`🚪 api-gateway listening on :${config.port} — Swagger at /docs`);
  routeTable.forEach((r) => logger.info(`   ${r.prefix}  →  ${r.target}`));
});

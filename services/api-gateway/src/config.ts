import { intEnv, optionalEnv } from '@tzw/shared';

export const config = {
  port: intEnv('GATEWAY_PORT', 8080),
  corsOrigin: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),
  rateLimit: {
    windowMs: intEnv('RATE_LIMIT_WINDOW_MS', 15 * 60_000),
    max: intEnv('RATE_LIMIT_MAX', 300),
  },
  serviceName: 'api-gateway',
  services: {
    auth: optionalEnv('AUTH_SERVICE_URL', 'http://auth-service:4001'),
    user: optionalEnv('USER_SERVICE_URL', 'http://user-service:4002'),
    extinguisher: optionalEnv('EXTINGUISHER_SERVICE_URL', 'http://extinguisher-service:4003'),
    inspection: optionalEnv('INSPECTION_SERVICE_URL', 'http://inspection-service:4004'),
    maintenance: optionalEnv('MAINTENANCE_SERVICE_URL', 'http://maintenance-service:4005'),
    reporting: optionalEnv('REPORTING_SERVICE_URL', 'http://reporting-service:4006'),
    notification: optionalEnv('NOTIFICATION_SERVICE_URL', 'http://notification-service:4007'),
  },
};

// path prefix (under /api) -> upstream service URL
export const routeTable: { prefix: string; target: string }[] = [
  { prefix: '/api/auth', target: config.services.auth },
  { prefix: '/api/users', target: config.services.user },
  { prefix: '/api/extinguishers', target: config.services.extinguisher },
  { prefix: '/api/inspections', target: config.services.inspection },
  { prefix: '/api/maintenance', target: config.services.maintenance },
  { prefix: '/api/reports', target: config.services.reporting },
  { prefix: '/api/notifications', target: config.services.notification },
];

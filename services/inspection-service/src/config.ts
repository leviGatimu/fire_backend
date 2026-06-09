import { intEnv, optionalEnv } from '@tzw/shared';

export const config = {
  port: intEnv('INSPECTION_PORT', 4004),
  corsOrigin: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),
  notificationUrl: optionalEnv('NOTIFICATION_SERVICE_URL', 'http://notification-service:4007'),
  serviceName: 'inspection-service',
};

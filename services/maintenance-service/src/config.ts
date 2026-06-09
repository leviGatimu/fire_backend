import { intEnv, optionalEnv } from '@tzw/shared';

export const config = {
  port: intEnv('MAINTENANCE_PORT', 4005),
  corsOrigin: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),
  serviceName: 'maintenance-service',
};

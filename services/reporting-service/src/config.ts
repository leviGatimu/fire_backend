import { intEnv, optionalEnv } from '@tzw/shared';

export const config = {
  port: intEnv('REPORTING_PORT', 4006),
  corsOrigin: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),
  serviceName: 'reporting-service',
};

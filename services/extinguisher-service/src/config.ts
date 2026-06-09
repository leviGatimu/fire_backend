import { intEnv, optionalEnv } from '@tzw/shared';

export const config = {
  port: intEnv('EXTINGUISHER_PORT', 4003),
  corsOrigin: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),
  serviceName: 'extinguisher-service',
};

import { intEnv, optionalEnv } from '@tzw/shared';

export const config = {
  port: intEnv('AUTH_PORT', 4001),
  corsOrigin: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),
  bcryptRounds: 12,
  resetTokenTtlMinutes: 30,
  serviceName: 'auth-service',
};

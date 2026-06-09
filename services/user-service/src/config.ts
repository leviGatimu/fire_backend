import { intEnv, optionalEnv } from '@tzw/shared';

export const config = {
  port: intEnv('USER_PORT', 4002),
  corsOrigin: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),
  bcryptRounds: 12,
  serviceName: 'user-service',
};

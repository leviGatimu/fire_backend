import { intEnv, optionalEnv } from '@tzw/shared';

export const config = {
  port: intEnv('NOTIFICATION_PORT', 4007),
  corsOrigin: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),
  serviceName: 'notification-service',
  smtp: {
    host: optionalEnv('SMTP_HOST', ''),
    port: intEnv('SMTP_PORT', 2525),
    user: optionalEnv('SMTP_USER', ''),
    pass: optionalEnv('SMTP_PASS', ''),
    from: optionalEnv('MAIL_FROM', 'TZW FEMS <no-reply@tzw.com>'),
  },
};

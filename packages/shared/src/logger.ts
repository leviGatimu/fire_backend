import winston from 'winston';

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, service, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${service ?? 'app'}] ${level}: ${message}${metaStr}`;
});

/**
 * Centralized structured logger. In production it emits JSON (ready to ship to
 * an ELK / Loki / CloudWatch pipeline); in dev it is human-readable.
 */
export function createLogger(service: string) {
  return winston.createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    defaultMeta: { service },
    format:
      process.env.NODE_ENV === 'production'
        ? combine(timestamp(), errors({ stack: true }), json())
        : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), devFormat),
    transports: [new winston.transports.Console()],
  });
}

export type Logger = ReturnType<typeof createLogger>;

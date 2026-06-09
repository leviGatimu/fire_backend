import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Logger } from '../logger';

/**
 * Assigns a correlation id (propagated downstream via `x-request-id`) and logs
 * one structured line per completed request — the basis of centralized logging.
 */
export function requestLogger(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) ?? crypto.randomUUID();
    res.setHeader('x-request-id', requestId);
    const start = Date.now();

    res.on('finish', () => {
      logger.info('request', {
        requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - start,
      });
    });
    next();
  };
}

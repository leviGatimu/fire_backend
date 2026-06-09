import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors';
import { Logger } from '../logger';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
  });
}

/**
 * Central error handler — normalizes every thrown error into a consistent JSON
 * envelope. Must be registered last, after all routes.
 */
export function errorHandler(logger: Logger) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    // Known application errors
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: err.code, message: err.message, details: err.details },
      });
    }

    // Zod validation errors
    if (err instanceof ZodError) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: err.flatten(),
        },
      });
    }

    // Prisma known errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: 'A record with this unique value already exists.' },
        });
      }
      if (err.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Record not found.' },
        });
      }
    }

    logger.error('Unhandled error', { err });
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    });
  };
}

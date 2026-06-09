import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, Role } from '../types';
import { ForbiddenError, UnauthorizedError } from '../errors';

/**
 * Role-Based Access Control guard. Usage: `authorize('ADMIN', 'INSPECTOR')`.
 * Must run after `authenticate`.
 */
export function authorize(...allowed: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) throw new UnauthorizedError();
    if (!allowed.includes(req.user.role)) {
      throw new ForbiddenError(`Requires one of roles: ${allowed.join(', ')}`);
    }
    next();
  };
}

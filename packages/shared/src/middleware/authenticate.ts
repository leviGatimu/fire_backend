import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { verifyAccessToken } from '../jwt';
import { UnauthorizedError } from '../errors';

/**
 * Verifies the Bearer access token and attaches `req.user`.
 *
 * Two-tier model: the API gateway performs a fast pre-check and forwards the
 * verified identity via headers, but every service ALSO verifies independently
 * (zero-trust) so a service is never reachable without a valid token.
 */
export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }
  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') throw new UnauthorizedError('Invalid token type');
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

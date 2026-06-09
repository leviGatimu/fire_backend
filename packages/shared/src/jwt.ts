import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { JwtPayload, Role } from './types';
import { requireEnv, optionalEnv } from './env';

export function signAccessToken(payload: { sub: string; email: string; role: Role }): string {
  const options: SignOptions = { expiresIn: optionalEnv('JWT_ACCESS_TTL', '15m') as any };
  return jwt.sign({ ...payload, type: 'access' }, requireEnv('JWT_ACCESS_SECRET'), options);
}

export function signRefreshToken(payload: { sub: string; email: string; role: Role }): string {
  const options: SignOptions = { expiresIn: optionalEnv('JWT_REFRESH_TTL', '7d') as any };
  return jwt.sign({ ...payload, type: 'refresh' }, requireEnv('JWT_REFRESH_SECRET'), options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, requireEnv('JWT_ACCESS_SECRET')) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, requireEnv('JWT_REFRESH_SECRET')) as JwtPayload;
}

/** Refresh tokens are stored hashed (never in plaintext) — defense in depth. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

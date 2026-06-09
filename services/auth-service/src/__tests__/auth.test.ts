/**
 * Unit tests for JWT + password-policy logic. These run without a database.
 * Integration tests (Supertest against createApp + a test DB) are described in
 * docs/TESTING.md.
 */
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from '@tzw/shared';
import { registerSchema } from '../validators/auth.schema';

describe('JWT helpers', () => {
  const payload = { sub: 'user-1', email: 'a@tzw.com', role: 'ADMIN' as const };

  it('issues and verifies an access token', () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.type).toBe('access');
  });

  it('refresh tokens are distinct and verifiable', () => {
    const token = signRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.type).toBe('refresh');
  });

  it('hashToken is deterministic and one-way', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toBe('abc');
  });
});

describe('registration validation', () => {
  it('rejects a weak password', () => {
    const result = registerSchema.safeParse({
      body: { firstName: 'A', lastName: 'B', email: 'a@tzw.com', password: 'weak' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid payload', () => {
    const result = registerSchema.safeParse({
      body: { firstName: 'A', lastName: 'B', email: 'a@tzw.com', password: 'Str0ngPass' },
    });
    expect(result.success).toBe(true);
  });
});

// Secrets must be set BEFORE importing the jwt module, since requireEnv reads
// process.env at call time but we keep this explicit and at the very top.
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

import {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../jwt';

const payload = { sub: 'user-1', email: 'user@example.com', role: 'ADMIN' as const };

describe('jwt access/refresh tokens', () => {
  it('round-trips an access token with type "access"', () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);

    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.type).toBe('access');
  });

  it('round-trips a refresh token with type "refresh"', () => {
    const token = signRefreshToken(payload);
    const decoded = verifyRefreshToken(token);

    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.type).toBe('refresh');
  });
});

describe('hashToken', () => {
  it('is deterministic for the same input', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
  });

  it('does not return the plaintext input', () => {
    const hashed = hashToken('abc');
    expect(hashed).not.toBe('abc');
    expect(hashed).toMatch(/^[a-f0-9]{64}$/); // sha256 hex
  });

  it('produces different hashes for different inputs', () => {
    expect(hashToken('abc')).not.toBe(hashToken('abd'));
  });
});

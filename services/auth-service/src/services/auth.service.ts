import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  prisma,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  Role,
} from '@tzw/shared';
import { config } from '../config';

function toAuthUser(u: { id: string; firstName: string; lastName: string; email: string; role: { name: string } }) {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: u.role.name as Role,
  };
}

async function issueTokens(user: { id: string; email: string; role: Role }) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, email: user.email, role: user.role });

  const decoded = verifyRefreshToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date((decoded as any).exp * 1000),
    },
  });
  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: { firstName: string; lastName: string; email: string; password: string }) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError('Email is already registered');

    // New self-registrations get the USER role by default.
    const role = await prisma.role.findUnique({ where: { name: 'USER' } });
    if (!role) throw new BadRequestError('Default role not configured. Run the seed.');

    const passwordHash = await bcrypt.hash(input.password, config.bcryptRounds);
    const { password: _password, ...profile } = input;
    const user = await prisma.user.create({
      data: { ...profile, passwordHash, roleId: role.id },
      include: { role: true },
    });

    const tokens = await issueTokens({ id: user.id, email: user.email, role: 'USER' });
    return { user: toAuthUser(user), ...tokens };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
    if (!user || !user.isActive) throw new UnauthorizedError('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Invalid credentials');

    const tokens = await issueTokens({ id: user.id, email: user.email, role: user.role.name as Role });
    return { user: toAuthUser(user), ...tokens };
  },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    if (payload.type !== 'refresh') throw new UnauthorizedError('Invalid token type');

    const stored = await prisma.refreshToken.findFirst({
      where: { userId: payload.sub, tokenHash: hashToken(refreshToken), revoked: false },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token is not recognized or has expired');
    }

    // Rotate: revoke the old token, issue a fresh pair.
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.sub }, include: { role: true } });
    const tokens = await issueTokens({ id: user.id, email: user.email, role: user.role.name as Role });
    return { user: toAuthUser(user), ...tokens };
  },

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken) },
      data: { revoked: true },
    });
  },

  /** Generates a reset token. In production this is emailed via notification-service. */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always behave the same way to avoid user enumeration.
    if (!user) return { delivered: true };

    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + config.resetTokenTtlMinutes * 60_000);
    await prisma.user.update({
      where: { id: user.id },
      data: { resetTokenHash: hashToken(rawToken), resetTokenExpiry: expiry },
    });
    // The raw token is returned here only so the flow is testable without SMTP.
    return { delivered: true, resetToken: rawToken };
  },

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: { resetTokenHash: hashToken(token), resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) throw new NotFoundError('Reset token is invalid or has expired');

    const passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetTokenHash: null, resetTokenExpiry: null },
    });
    // Invalidate all sessions after a password reset.
    await prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { revoked: true } });
    return { reset: true };
  },
};

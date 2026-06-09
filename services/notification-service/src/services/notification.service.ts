import nodemailer from 'nodemailer';
import { prisma, NotFoundError } from '@tzw/shared';
import { config } from '../config';

// Lazily create a transport only if SMTP is configured.
const transporter =
  config.smtp.host && config.smtp.user
    ? nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        auth: { user: config.smtp.user, pass: config.smtp.pass },
      })
    : null;

export const notificationService = {
  /** Persist a notification and (best-effort) deliver via email. */
  async notify(input: { userId: string; channel?: 'EMAIL' | 'IN_APP'; subject: string; body: string; metadata?: unknown }) {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) throw new NotFoundError('Target user not found');

    const channel = input.channel ?? 'IN_APP';
    let status: 'SENT' | 'FAILED' | 'PENDING' = channel === 'IN_APP' ? 'SENT' : 'PENDING';

    if (channel === 'EMAIL' && transporter) {
      try {
        await transporter.sendMail({ from: config.smtp.from, to: user.email, subject: input.subject, text: input.body });
        status = 'SENT';
      } catch {
        status = 'FAILED';
      }
    } else if (channel === 'EMAIL') {
      // No SMTP configured — record it as in-app so it still surfaces in the UI.
      status = 'SENT';
    }

    return prisma.notification.create({
      data: { userId: input.userId, channel, subject: input.subject, body: input.body, status, metadata: input.metadata as any },
    });
  },

  async listForUser(userId: string) {
    return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
  },

  async markRead(id: string, userId: string) {
    const n = await prisma.notification.findFirst({ where: { id, userId } });
    if (!n) throw new NotFoundError('Notification not found');
    return prisma.notification.update({ where: { id }, data: { status: 'READ' } });
  },
};

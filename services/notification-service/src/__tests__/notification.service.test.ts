import { mockPrisma } from '../../../../test/prisma-mock';
jest.mock('@tzw/shared', () => {
  const actual = jest.requireActual('@tzw/shared');
  return { __esModule: true, ...actual, prisma: mockPrisma };
});

import { notificationService } from '../services/notification.service';
import { NotFoundError } from '@tzw/shared';

describe('notificationService.notify', () => {
  it('throws NotFoundError when the target user is missing', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null as any);

    await expect(
      notificationService.notify({ userId: 'missing', subject: 'Hi', body: 'There' }),
    ).rejects.toThrow(NotFoundError);

    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it('creates an IN_APP notification with status SENT (default channel)', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'u@example.com' } as any);
    mockPrisma.notification.create.mockResolvedValueOnce({ id: 'n1' } as any);

    await notificationService.notify({ userId: 'u1', subject: 'Subject', body: 'Body' });

    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u1',
        channel: 'IN_APP',
        subject: 'Subject',
        body: 'Body',
        status: 'SENT',
      }),
    });
  });

  it('records EMAIL as SENT when no SMTP transporter is configured', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'u@example.com' } as any);
    mockPrisma.notification.create.mockResolvedValueOnce({ id: 'n2' } as any);

    await notificationService.notify({ userId: 'u1', channel: 'EMAIL', subject: 'S', body: 'B' });

    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ channel: 'EMAIL', status: 'SENT' }),
    });
  });
});

describe('notificationService.markRead', () => {
  it('throws NotFoundError when the notification is not found', async () => {
    mockPrisma.notification.findFirst.mockResolvedValueOnce(null as any);

    await expect(notificationService.markRead('n1', 'u1')).rejects.toThrow(NotFoundError);
    expect(mockPrisma.notification.update).not.toHaveBeenCalled();
  });

  it('updates the notification status to READ on success', async () => {
    mockPrisma.notification.findFirst.mockResolvedValueOnce({ id: 'n1', userId: 'u1' } as any);
    mockPrisma.notification.update.mockResolvedValueOnce({ id: 'n1', status: 'READ' } as any);

    await notificationService.markRead('n1', 'u1');

    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'n1' },
      data: { status: 'READ' },
    });
  });
});

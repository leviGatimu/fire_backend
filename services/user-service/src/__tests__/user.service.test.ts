import bcrypt from 'bcryptjs';
import { mockPrisma } from '../../../../test/prisma-mock';

jest.mock('@tzw/shared', () => {
  const actual = jest.requireActual('@tzw/shared');
  return { __esModule: true, ...actual, prisma: mockPrisma };
});

import { NotFoundError, ConflictError, UnauthorizedError } from '@tzw/shared';
import { userService } from '../services/user.service';

describe('userService', () => {
  describe('getById', () => {
    it('throws NotFoundError when the user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null as any);
      await expect(userService.getById('missing')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns the user when found', async () => {
      const user = { id: 'u1', firstName: 'A', lastName: 'B' };
      mockPrisma.user.findUnique.mockResolvedValue(user as any);
      await expect(userService.getById('u1')).resolves.toEqual(user);
    });
  });

  describe('create', () => {
    it('throws ConflictError when the email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' } as any);
      await expect(
        userService.create({
          firstName: 'A',
          lastName: 'B',
          email: 'taken@tzw.com',
          password: 'Str0ngPass',
          role: 'USER',
        }),
      ).rejects.toBeInstanceOf(ConflictError);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('hashes the password, looks up the role, and creates the user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null as any);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-1' } as any);
      mockPrisma.user.create.mockResolvedValue({ id: 'new-user' } as any);

      const result = await userService.create({
        firstName: 'A',
        lastName: 'B',
        email: 'new@tzw.com',
        password: 'Str0ngPass',
        role: 'USER',
      });

      expect(result).toEqual({ id: 'new-user' });
      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({ where: { name: 'USER' } });
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);

      const createArg = mockPrisma.user.create.mock.calls[0][0] as any;
      expect(createArg.data.roleId).toBe('role-1');
      expect(createArg.data.email).toBe('new@tzw.com');
      // password is hashed (not stored in plaintext)
      expect(createArg.data.passwordHash).toBeDefined();
      expect(createArg.data.passwordHash).not.toBe('Str0ngPass');
      expect(await bcrypt.compare('Str0ngPass', createArg.data.passwordHash)).toBe(true);
    });
  });

  describe('changePassword', () => {
    it('throws UnauthorizedError when the current password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: await bcrypt.hash('Right1234', 10),
      } as any);

      await expect(userService.changePassword('u1', 'Wrong', 'New12345')).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('updates the password and revokes refresh tokens when current password is correct', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: await bcrypt.hash('Right1234', 10),
      } as any);
      mockPrisma.user.update.mockResolvedValue({ id: 'u1' } as any);
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 } as any);

      await expect(
        userService.changePassword('u1', 'Right1234', 'New12345'),
      ).resolves.toEqual({ changed: true });

      expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
      const updateArg = mockPrisma.user.update.mock.calls[0][0] as any;
      expect(updateArg.where).toEqual({ id: 'u1' });
      expect(await bcrypt.compare('New12345', updateArg.data.passwordHash)).toBe(true);

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        data: { revoked: true },
      });
    });

    it('throws NotFoundError when the user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null as any);
      await expect(userService.changePassword('missing', 'x', 'New12345')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe('list', () => {
    it('computes pagination meta from findMany + count', async () => {
      const data = [{ id: 'u1' }, { id: 'u2' }];
      mockPrisma.user.findMany.mockResolvedValue(data as any);
      mockPrisma.user.count.mockResolvedValue(23 as any);

      const result = await userService.list({ page: 2, limit: 10 });

      expect(result.data).toEqual(data);
      expect(result.meta).toEqual({ page: 2, limit: 10, total: 23, totalPages: 3 });

      const findArg = mockPrisma.user.findMany.mock.calls[0][0] as any;
      expect(findArg.skip).toBe(10);
      expect(findArg.take).toBe(10);
    });
  });
});

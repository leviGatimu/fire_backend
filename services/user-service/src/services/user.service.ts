import bcrypt from 'bcryptjs';
import {
  prisma,
  NotFoundError,
  ConflictError,
  BadRequestError,
  UnauthorizedError,
  PaginatedResult,
} from '@tzw/shared';
import { config } from '../config';

const publicSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  isActive: true,
  createdAt: true,
  role: { select: { name: true } },
};

async function roleIdByName(name: string) {
  const role = await prisma.role.findUnique({ where: { name: name as any } });
  if (!role) throw new BadRequestError(`Role ${name} not configured`);
  return role.id;
}

export const userService = {
  async list(params: { page: number; limit: number; search?: string; role?: string }): Promise<PaginatedResult<any>> {
    const { page, limit, search, role } = params;
    const where: any = {
      ...(role ? { role: { name: role } } : {}),
      ...(search
        ? { OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ] }
        : {}),
    };
    const [data, total] = await Promise.all([
      prisma.user.findMany({ where, select: publicSelect, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: publicSelect });
    if (!user) throw new NotFoundError('User not found');
    return user;
  },

  async create(input: { firstName: string; lastName: string; email: string; password: string; role: string }) {
    if (await prisma.user.findUnique({ where: { email: input.email } })) {
      throw new ConflictError('Email already in use');
    }
    const passwordHash = await bcrypt.hash(input.password, config.bcryptRounds);
    return prisma.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash,
        roleId: await roleIdByName(input.role),
      },
      select: publicSelect,
    });
  },

  async update(id: string, input: { firstName?: string; lastName?: string; phone?: string; isActive?: boolean; role?: string }) {
    await this.getById(id);
    const { role, ...rest } = input;
    return prisma.user.update({
      where: { id },
      data: { ...rest, ...(role ? { roleId: await roleIdByName(role) } : {}) },
      select: publicSelect,
    });
  },

  async remove(id: string) {
    await this.getById(id);
    await prisma.user.delete({ where: { id } });
    return { deleted: true };
  },

  async updateProfile(id: string, input: { firstName?: string; lastName?: string; phone?: string }) {
    return prisma.user.update({ where: { id }, data: input, select: publicSelect });
  },

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Current password is incorrect');
    const passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    await prisma.refreshToken.updateMany({ where: { userId: id }, data: { revoked: true } });
    return { changed: true };
  },

  async listRoles() {
    return prisma.role.findMany({ orderBy: { name: 'asc' } });
  },
};

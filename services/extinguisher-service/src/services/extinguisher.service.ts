import { Prisma } from '@prisma/client';
import { prisma, NotFoundError, PaginatedResult } from '@tzw/shared';

type ListParams = {
  page: number;
  limit: number;
  search?: string;
  status?: any;
  type?: any;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

export const extinguisherService = {
  async create(data: Prisma.FireExtinguisherUncheckedCreateInput) {
    return prisma.fireExtinguisher.create({ data });
  },

  async list(params: ListParams): Promise<PaginatedResult<any>> {
    const { page, limit, search, status, type, sortBy, sortOrder } = params;
    const where: Prisma.FireExtinguisherWhereInput = {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { serialNumber: { contains: search, mode: 'insensitive' } },
              { location: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.fireExtinguisher.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.fireExtinguisher.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getById(id: string) {
    const item = await prisma.fireExtinguisher.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Fire extinguisher not found');
    return item;
  },

  async update(id: string, data: Prisma.FireExtinguisherUncheckedUpdateInput) {
    await this.getById(id);
    return prisma.fireExtinguisher.update({ where: { id }, data });
  },

  async remove(id: string) {
    await this.getById(id);
    await prisma.fireExtinguisher.delete({ where: { id } });
    return { deleted: true };
  },
};

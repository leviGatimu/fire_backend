import { prisma, NotFoundError, BadRequestError, PaginatedResult } from '@tzw/shared';

const include = {
  extinguisher: { select: { id: true, serialNumber: true, location: true } },
  inspector: { select: { id: true, firstName: true, lastName: true } },
};

export const maintenanceService = {
  async create(inspectorId: string, input: { extinguisherId: string; actionTaken: string; actionDate: Date; conditionNotes?: string; recommendations?: string }) {
    const ext = await prisma.fireExtinguisher.findUnique({ where: { id: input.extinguisherId } });
    if (!ext) throw new BadRequestError('Extinguisher does not exist');
    return prisma.maintenanceLog.create({ data: { ...input, inspectorId }, include });
  },

  async list(params: { page: number; limit: number; extinguisherId?: string }): Promise<PaginatedResult<any>> {
    const { page, limit, extinguisherId } = params;
    const where = extinguisherId ? { extinguisherId } : {};
    const [data, total] = await Promise.all([
      prisma.maintenanceLog.findMany({ where, include, skip: (page - 1) * limit, take: limit, orderBy: { actionDate: 'desc' } }),
      prisma.maintenanceLog.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getById(id: string) {
    const item = await prisma.maintenanceLog.findUnique({ where: { id }, include });
    if (!item) throw new NotFoundError('Maintenance log not found');
    return item;
  },

  async historyFor(extinguisherId: string) {
    return prisma.maintenanceLog.findMany({ where: { extinguisherId }, include, orderBy: { actionDate: 'desc' } });
  },

  async update(id: string, input: any) {
    await this.getById(id);
    return prisma.maintenanceLog.update({ where: { id }, data: input, include });
  },

  /** Returns a CSV string of all maintenance logs (optionally for one extinguisher). */
  async exportCsv(extinguisherId?: string) {
    const where = extinguisherId ? { extinguisherId } : {};
    const logs = await prisma.maintenanceLog.findMany({ where, include, orderBy: { actionDate: 'desc' } });
    const header = ['Log ID', 'Serial', 'Location', 'Inspector', 'Action Taken', 'Action Date', 'Condition Notes', 'Recommendations'];
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = logs.map((l) => [
      l.id, l.extinguisher.serialNumber, l.extinguisher.location,
      `${l.inspector.firstName} ${l.inspector.lastName}`, l.actionTaken,
      l.actionDate.toISOString(), l.conditionNotes, l.recommendations,
    ].map(escape).join(','));
    return [header.map(escape).join(','), ...rows].join('\n');
  },
};

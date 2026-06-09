import { prisma, NotFoundError, BadRequestError, ConflictError, serviceFetch, PaginatedResult } from '@tzw/shared';
import { config } from '../config';

const include = {
  extinguisher: { select: { id: true, serialNumber: true, location: true } },
  inspector: { select: { id: true, firstName: true, lastName: true, email: true } },
};

/** Fire-and-forget notification to the assigned inspector. Never blocks the flow. */
async function notifyInspector(userId: string, subject: string, body: string) {
  try {
    await serviceFetch(`${config.notificationUrl}/internal/notify`, {
      method: 'POST',
      body: JSON.stringify({ userId, channel: 'EMAIL', subject, body }),
      timeoutMs: 3000,
    });
  } catch {
    // Logged centrally by the caller's request logger; intentionally swallowed.
  }
}

export const inspectionService = {
  async create(input: { extinguisherId: string; inspectorId: string; scheduledAt: Date; notes?: string }) {
    const ext = await prisma.fireExtinguisher.findUnique({ where: { id: input.extinguisherId } });
    if (!ext) throw new BadRequestError('Extinguisher does not exist');
    const inspector = await prisma.user.findUnique({ where: { id: input.inspectorId }, include: { role: true } });
    if (!inspector) throw new BadRequestError('Inspector does not exist');
    if (inspector.role.name === 'USER') throw new BadRequestError('Assigned user is not an inspector/admin');

    const inspection = await prisma.inspection.create({ data: { ...input, status: 'SCHEDULED' }, include });
    await notifyInspector(
      inspector.id,
      'New inspection assigned',
      `You are assigned to inspect ${ext.serialNumber} at ${ext.location} on ${input.scheduledAt.toISOString()}.`,
    );
    return inspection;
  },

  async list(params: any): Promise<PaginatedResult<any>> {
    const { page, limit, status, extinguisherId, inspectorId } = params;
    const where: any = { ...(status && { status }), ...(extinguisherId && { extinguisherId }), ...(inspectorId && { inspectorId }) };
    const [data, total] = await Promise.all([
      prisma.inspection.findMany({ where, include, skip: (page - 1) * limit, take: limit, orderBy: { scheduledAt: 'desc' } }),
      prisma.inspection.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getById(id: string) {
    const item = await prisma.inspection.findUnique({ where: { id }, include });
    if (!item) throw new NotFoundError('Inspection not found');
    return item;
  },

  async update(id: string, input: any) {
    const existing = await this.getById(id);
    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new ConflictError(`Cannot modify a ${existing.status.toLowerCase()} inspection`);
    }
    return prisma.inspection.update({ where: { id }, data: input, include });
  },

  async cancel(id: string) {
    const existing = await this.getById(id);
    if (existing.status === 'COMPLETED') throw new ConflictError('Cannot cancel a completed inspection');
    return prisma.inspection.update({ where: { id }, data: { status: 'CANCELLED' }, include });
  },

  async complete(id: string, notes?: string) {
    const existing = await this.getById(id);
    if (existing.status === 'CANCELLED') throw new ConflictError('Cannot complete a cancelled inspection');

    // Completing an inspection clears the "due" flag on the extinguisher.
    const [inspection] = await prisma.$transaction([
      prisma.inspection.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date(), ...(notes ? { notes } : {}) },
        include,
      }),
      prisma.fireExtinguisher.updateMany({
        where: { id: existing.extinguisherId, status: 'DUE_FOR_INSPECTION' },
        data: { status: 'ACTIVE' },
      }),
    ]);
    return inspection;
  },
};

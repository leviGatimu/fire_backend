import { mockPrisma } from '../../../../test/prisma-mock';
jest.mock('@tzw/shared', () => {
  const actual = jest.requireActual('@tzw/shared');
  return { __esModule: true, ...actual, prisma: mockPrisma };
});
import { NotFoundError, BadRequestError, ConflictError } from '@tzw/shared';
import { inspectionService } from '../services/inspection.service';

// Prevent any real network from notifyInspector -> serviceFetch (uses global fetch).
global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as any);

const createInput = {
  extinguisherId: 'ext-1',
  inspectorId: 'user-1',
  scheduledAt: new Date('2026-07-01T10:00:00.000Z'),
  notes: 'check',
};

describe('inspectionService.create', () => {
  it('throws BadRequestError when extinguisher is missing', async () => {
    mockPrisma.fireExtinguisher.findUnique.mockResolvedValue(null as any);
    await expect(inspectionService.create(createInput)).rejects.toBeInstanceOf(BadRequestError);
    expect(mockPrisma.inspection.create).not.toHaveBeenCalled();
  });

  it('throws BadRequestError when assigned inspector has role USER', async () => {
    mockPrisma.fireExtinguisher.findUnique.mockResolvedValue({
      id: 'ext-1',
      serialNumber: 'SN-1',
      location: 'A',
    } as any);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: { name: 'USER' },
    } as any);

    await expect(inspectionService.create(createInput)).rejects.toBeInstanceOf(BadRequestError);
    expect(mockPrisma.inspection.create).not.toHaveBeenCalled();
  });

  it('creates the inspection when extinguisher and inspector are valid', async () => {
    mockPrisma.fireExtinguisher.findUnique.mockResolvedValue({
      id: 'ext-1',
      serialNumber: 'SN-1',
      location: 'A',
    } as any);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: { name: 'INSPECTOR' },
    } as any);
    const created = { id: 'insp-1', status: 'SCHEDULED' };
    mockPrisma.inspection.create.mockResolvedValue(created as any);

    const result = await inspectionService.create(createInput);

    expect(result).toEqual(created);
    const createArg = mockPrisma.inspection.create.mock.calls[0][0] as any;
    expect(createArg.data.status).toBe('SCHEDULED');
  });
});

describe('inspectionService.getById', () => {
  it('throws NotFoundError when missing', async () => {
    mockPrisma.inspection.findUnique.mockResolvedValue(null as any);
    await expect(inspectionService.getById('nope')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns the inspection when found', async () => {
    const insp = { id: 'insp-1', status: 'SCHEDULED' };
    mockPrisma.inspection.findUnique.mockResolvedValue(insp as any);
    await expect(inspectionService.getById('insp-1')).resolves.toEqual(insp);
  });
});

describe('inspectionService.update', () => {
  it('throws ConflictError when existing status is COMPLETED', async () => {
    mockPrisma.inspection.findUnique.mockResolvedValue({ id: 'insp-1', status: 'COMPLETED' } as any);
    await expect(inspectionService.update('insp-1', { notes: 'x' })).rejects.toBeInstanceOf(ConflictError);
    expect(mockPrisma.inspection.update).not.toHaveBeenCalled();
  });

  it('throws ConflictError when existing status is CANCELLED', async () => {
    mockPrisma.inspection.findUnique.mockResolvedValue({ id: 'insp-1', status: 'CANCELLED' } as any);
    await expect(inspectionService.update('insp-1', { notes: 'x' })).rejects.toBeInstanceOf(ConflictError);
  });

  it('updates when status is modifiable', async () => {
    mockPrisma.inspection.findUnique.mockResolvedValue({ id: 'insp-1', status: 'SCHEDULED' } as any);
    const updated = { id: 'insp-1', notes: 'x' };
    mockPrisma.inspection.update.mockResolvedValue(updated as any);
    await expect(inspectionService.update('insp-1', { notes: 'x' })).resolves.toEqual(updated);
  });
});

describe('inspectionService.cancel', () => {
  it('throws ConflictError when existing status is COMPLETED', async () => {
    mockPrisma.inspection.findUnique.mockResolvedValue({ id: 'insp-1', status: 'COMPLETED' } as any);
    await expect(inspectionService.cancel('insp-1')).rejects.toBeInstanceOf(ConflictError);
    expect(mockPrisma.inspection.update).not.toHaveBeenCalled();
  });

  it('cancels a scheduled inspection', async () => {
    mockPrisma.inspection.findUnique.mockResolvedValue({ id: 'insp-1', status: 'SCHEDULED' } as any);
    mockPrisma.inspection.update.mockResolvedValue({ id: 'insp-1', status: 'CANCELLED' } as any);
    const result = await inspectionService.cancel('insp-1');
    expect(result).toEqual({ id: 'insp-1', status: 'CANCELLED' });
    const arg = mockPrisma.inspection.update.mock.calls[0][0] as any;
    expect(arg.data.status).toBe('CANCELLED');
  });
});

describe('inspectionService.complete', () => {
  it('throws ConflictError when existing status is CANCELLED', async () => {
    mockPrisma.inspection.findUnique.mockResolvedValue({ id: 'insp-1', status: 'CANCELLED' } as any);
    await expect(inspectionService.complete('insp-1')).rejects.toBeInstanceOf(ConflictError);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('completes a scheduled inspection via $transaction', async () => {
    mockPrisma.inspection.findUnique.mockResolvedValue({
      id: 'insp-1',
      status: 'SCHEDULED',
      extinguisherId: 'ext-1',
    } as any);
    mockPrisma.$transaction.mockResolvedValue([{ id: 'insp-1', status: 'COMPLETED' }, {}] as any);

    const result = await inspectionService.complete('insp-1', 'all good');

    expect(result).toEqual({ id: 'insp-1', status: 'COMPLETED' });
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });
});

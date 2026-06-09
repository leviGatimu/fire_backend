import { mockPrisma } from '../../../../test/prisma-mock';
jest.mock('@tzw/shared', () => {
  const actual = jest.requireActual('@tzw/shared');
  return { __esModule: true, ...actual, prisma: mockPrisma };
});
import { NotFoundError } from '@tzw/shared';
import { extinguisherService } from '../services/extinguisher.service';

const baseListParams = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
};

describe('extinguisherService', () => {
  describe('getById', () => {
    it('throws NotFoundError when findUnique returns null', async () => {
      mockPrisma.fireExtinguisher.findUnique.mockResolvedValue(null as any);
      await expect(extinguisherService.getById('missing-id')).rejects.toBeInstanceOf(NotFoundError);
      expect(mockPrisma.fireExtinguisher.findUnique).toHaveBeenCalledWith({ where: { id: 'missing-id' } });
    });

    it('returns the record when found', async () => {
      const record = { id: 'ext-1', serialNumber: 'SN-1' };
      mockPrisma.fireExtinguisher.findUnique.mockResolvedValue(record as any);
      await expect(extinguisherService.getById('ext-1')).resolves.toEqual(record);
    });
  });

  describe('list', () => {
    it('returns data passthrough and meta with correct totalPages', async () => {
      const rows = [{ id: 'a' }, { id: 'b' }];
      mockPrisma.fireExtinguisher.findMany.mockResolvedValue(rows as any);
      mockPrisma.fireExtinguisher.count.mockResolvedValue(25 as any);

      const result = await extinguisherService.list(baseListParams);

      expect(result.data).toBe(rows);
      // total 25, limit 10 -> ceil(2.5) = 3 pages
      expect(result.meta).toEqual({ page: 1, limit: 10, total: 25, totalPages: 3 });
    });

    it('computes pagination skip/take and builds search/status/type where clause', async () => {
      mockPrisma.fireExtinguisher.findMany.mockResolvedValue([] as any);
      mockPrisma.fireExtinguisher.count.mockResolvedValue(0 as any);

      await extinguisherService.list({
        ...baseListParams,
        page: 3,
        limit: 5,
        search: 'foo',
        status: 'ACTIVE',
        type: 'CO2',
      });

      const findManyArg = mockPrisma.fireExtinguisher.findMany.mock.calls[0][0] as any;
      expect(findManyArg.skip).toBe(10); // (3-1)*5
      expect(findManyArg.take).toBe(5);
      expect(findManyArg.orderBy).toEqual({ createdAt: 'desc' });
      expect(findManyArg.where.status).toBe('ACTIVE');
      expect(findManyArg.where.type).toBe('CO2');
      expect(findManyArg.where.OR).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('throws NotFoundError (via getById) when id is missing and does not call update', async () => {
      mockPrisma.fireExtinguisher.findUnique.mockResolvedValue(null as any);
      await expect(extinguisherService.update('nope', { location: 'X' } as any)).rejects.toBeInstanceOf(
        NotFoundError,
      );
      expect(mockPrisma.fireExtinguisher.update).not.toHaveBeenCalled();
    });

    it('calls getById first then prisma.update when present', async () => {
      mockPrisma.fireExtinguisher.findUnique.mockResolvedValue({ id: 'ext-1' } as any);
      const updated = { id: 'ext-1', location: 'New' };
      mockPrisma.fireExtinguisher.update.mockResolvedValue(updated as any);

      const result = await extinguisherService.update('ext-1', { location: 'New' } as any);

      expect(mockPrisma.fireExtinguisher.findUnique).toHaveBeenCalledWith({ where: { id: 'ext-1' } });
      expect(mockPrisma.fireExtinguisher.update).toHaveBeenCalledWith({
        where: { id: 'ext-1' },
        data: { location: 'New' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('throws NotFoundError when missing and does not delete', async () => {
      mockPrisma.fireExtinguisher.findUnique.mockResolvedValue(null as any);
      await expect(extinguisherService.remove('nope')).rejects.toBeInstanceOf(NotFoundError);
      expect(mockPrisma.fireExtinguisher.delete).not.toHaveBeenCalled();
    });

    it('returns { deleted: true } when present', async () => {
      mockPrisma.fireExtinguisher.findUnique.mockResolvedValue({ id: 'ext-1' } as any);
      mockPrisma.fireExtinguisher.delete.mockResolvedValue({ id: 'ext-1' } as any);

      await expect(extinguisherService.remove('ext-1')).resolves.toEqual({ deleted: true });
      expect(mockPrisma.fireExtinguisher.delete).toHaveBeenCalledWith({ where: { id: 'ext-1' } });
    });
  });
});

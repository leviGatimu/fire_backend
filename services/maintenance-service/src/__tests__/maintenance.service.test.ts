import { mockPrisma } from '../../../../test/prisma-mock';

jest.mock('@tzw/shared', () => {
  const actual = jest.requireActual('@tzw/shared');
  return { __esModule: true, ...actual, prisma: mockPrisma };
});

import { NotFoundError, BadRequestError } from '@tzw/shared';
import { maintenanceService } from '../services/maintenance.service';

describe('maintenanceService', () => {
  describe('create', () => {
    it('throws BadRequestError when the extinguisher does not exist', async () => {
      mockPrisma.fireExtinguisher.findUnique.mockResolvedValue(null as any);
      await expect(
        maintenanceService.create('inspector-1', {
          extinguisherId: 'missing',
          actionTaken: 'Refill',
          actionDate: new Date('2026-01-01'),
        }),
      ).rejects.toBeInstanceOf(BadRequestError);
      expect(mockPrisma.maintenanceLog.create).not.toHaveBeenCalled();
    });

    it('creates the log with the inspectorId passed in', async () => {
      mockPrisma.fireExtinguisher.findUnique.mockResolvedValue({ id: 'ext-1' } as any);
      mockPrisma.maintenanceLog.create.mockResolvedValue({ id: 'log-1' } as any);

      const actionDate = new Date('2026-01-01');
      const result = await maintenanceService.create('inspector-1', {
        extinguisherId: 'ext-1',
        actionTaken: 'Refill',
        actionDate,
        conditionNotes: 'ok',
      });

      expect(result).toEqual({ id: 'log-1' });
      expect(mockPrisma.maintenanceLog.create).toHaveBeenCalledTimes(1);
      const createArg = mockPrisma.maintenanceLog.create.mock.calls[0][0] as any;
      expect(createArg.data.inspectorId).toBe('inspector-1');
      expect(createArg.data.extinguisherId).toBe('ext-1');
      expect(createArg.data.actionTaken).toBe('Refill');
      expect(createArg.data.actionDate).toBe(actionDate);
    });
  });

  describe('getById', () => {
    it('throws NotFoundError when the log does not exist', async () => {
      mockPrisma.maintenanceLog.findUnique.mockResolvedValue(null as any);
      await expect(maintenanceService.getById('missing')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns the log when found', async () => {
      const log = { id: 'log-1' };
      mockPrisma.maintenanceLog.findUnique.mockResolvedValue(log as any);
      await expect(maintenanceService.getById('log-1')).resolves.toEqual(log);
    });
  });

  describe('list', () => {
    it('computes pagination meta from findMany + count', async () => {
      const data = [{ id: 'log-1' }];
      mockPrisma.maintenanceLog.findMany.mockResolvedValue(data as any);
      mockPrisma.maintenanceLog.count.mockResolvedValue(5 as any);

      const result = await maintenanceService.list({ page: 1, limit: 2 });

      expect(result.data).toEqual(data);
      expect(result.meta).toEqual({ page: 1, limit: 2, total: 5, totalPages: 3 });

      const findArg = mockPrisma.maintenanceLog.findMany.mock.calls[0][0] as any;
      expect(findArg.skip).toBe(0);
      expect(findArg.take).toBe(2);
    });
  });

  describe('exportCsv', () => {
    it('builds a CSV with header, rows, and proper escaping of commas/quotes', async () => {
      mockPrisma.maintenanceLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          extinguisher: { serialNumber: 'SN-001', location: 'Lobby, Floor 1' },
          inspector: { firstName: 'Jane', lastName: 'Doe' },
          actionTaken: 'Refill',
          actionDate: new Date('2026-01-01T00:00:00.000Z'),
          conditionNotes: 'He said "ok"',
          recommendations: 'None',
        },
        {
          id: 'log-2',
          extinguisher: { serialNumber: 'SN-002', location: 'Garage' },
          inspector: { firstName: 'John', lastName: 'Smith' },
          actionTaken: 'Inspect',
          actionDate: new Date('2026-02-02T00:00:00.000Z'),
          conditionNotes: null,
          recommendations: null,
        },
      ] as any);

      const csv = await maintenanceService.exportCsv();
      const lines = csv.split('\n');

      // Header present and first.
      expect(lines[0]).toBe(
        '"Log ID","Serial","Location","Inspector","Action Taken","Action Date","Condition Notes","Recommendations"',
      );
      // 1 header + 2 data rows.
      expect(lines).toHaveLength(3);

      // Serial numbers present.
      expect(csv).toContain('SN-001');
      expect(csv).toContain('SN-002');

      // A value containing a comma is wrapped in quotes (not split into extra fields).
      expect(lines[1]).toContain('"Lobby, Floor 1"');

      // Embedded quotes are doubled per CSV escaping rules.
      expect(lines[1]).toContain('"He said ""ok"""');

      // Inspector full name composed correctly.
      expect(lines[1]).toContain('"Jane Doe"');

      // Null values render as empty quoted fields.
      expect(lines[2]).toContain('"SN-002"');
      expect(lines[2].endsWith('"",""')).toBe(true);
    });
  });
});

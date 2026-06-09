import { mockPrisma } from '../../../../test/prisma-mock';
jest.mock('@tzw/shared', () => {
  const actual = jest.requireActual('@tzw/shared');
  return { __esModule: true, ...actual, prisma: mockPrisma };
});

import { reportService } from '../services/report.service';

describe('reportService.summary', () => {
  it('aggregates cards and maps charts', async () => {
    // Order of awaits in Promise.all (see report.service.ts):
    // 1 fireExtinguisher.count()                  -> totalExtinguishers
    // 2 fireExtinguisher.count(ACTIVE)            -> active
    // 3 fireExtinguisher.count(EXPIRED)           -> expired
    // 4 fireExtinguisher.count(UNDER_MAINTENANCE) -> underMaintenance
    // 5 fireExtinguisher.count(OUT_OF_SERVICE)    -> outOfService
    // 6 fireExtinguisher.count(DUE_FOR_INSPECTION)-> dueForInspection
    // 7 fireExtinguisher.count(expiry window)     -> expiringSoon
    // 8 inspection.count(SCHEDULED)               -> scheduledInspections
    // 9 inspection.count(COMPLETED)               -> completedInspections
    // 10 maintenanceLog.count()                   -> maintenanceCount
    mockPrisma.fireExtinguisher.count
      .mockResolvedValueOnce(100) // total
      .mockResolvedValueOnce(60) // active
      .mockResolvedValueOnce(10) // expired
      .mockResolvedValueOnce(5) // under maintenance
      .mockResolvedValueOnce(3) // out of service
      .mockResolvedValueOnce(8) // due for inspection
      .mockResolvedValueOnce(7); // expiring soon

    mockPrisma.inspection.count
      .mockResolvedValueOnce(12) // scheduled
      .mockResolvedValueOnce(9); // completed

    mockPrisma.maintenanceLog.count.mockResolvedValueOnce(4);

    // groupBy is an overloaded Prisma signature; cast to jest.Mock for mocking.
    (mockPrisma.fireExtinguisher.groupBy as unknown as jest.Mock)
      .mockResolvedValueOnce([{ type: 'CO2', _count: 2 }]) // byType
      .mockResolvedValueOnce([{ status: 'ACTIVE', _count: 3 }]); // byStatus

    const result = await reportService.summary();

    expect(result.cards.totalExtinguishers).toBe(100);
    expect(result.cards.active).toBe(60);
    expect(result.cards.expired).toBe(10);
    expect(result.cards.underMaintenance).toBe(5);
    expect(result.cards.outOfService).toBe(3);
    expect(result.cards.dueForInspection).toBe(8);
    expect(result.cards.expiringSoon).toBe(7);
    expect(result.cards.scheduledInspections).toBe(12);
    expect(result.cards.completedInspections).toBe(9);
    expect(result.cards.maintenanceActivities).toBe(4);

    expect(result.charts.byType).toEqual([{ label: 'CO2', value: 2 }]);
    expect(result.charts.byStatus).toEqual([{ label: 'ACTIVE', value: 3 }]);
  });
});

describe('reportService.monthly', () => {
  it('buckets inspections, completed and maintenance into the correct month index', async () => {
    const year = 2025;
    // Month indexes are zero-based: Feb = 1, Apr = 3, Jul = 6.
    mockPrisma.inspection.findMany.mockResolvedValueOnce([
      { scheduledAt: new Date(year, 1, 10), status: 'SCHEDULED' }, // Feb, not completed
      { scheduledAt: new Date(year, 1, 20), status: 'COMPLETED' }, // Feb, completed
      { scheduledAt: new Date(year, 3, 5), status: 'COMPLETED' }, // Apr, completed
    ] as any);

    mockPrisma.maintenanceLog.findMany.mockResolvedValueOnce([
      { actionDate: new Date(year, 6, 1) }, // Jul
      { actionDate: new Date(year, 6, 15) }, // Jul
    ] as any);

    const result = await reportService.monthly(year);

    expect(result.year).toBe(year);
    expect(result.months).toHaveLength(12);

    // February (index 1): 2 inspections, 1 completed, 0 maintenance.
    expect(result.months[1].inspections).toBe(2);
    expect(result.months[1].completed).toBe(1);
    expect(result.months[1].maintenance).toBe(0);

    // April (index 3): 1 inspection, 1 completed.
    expect(result.months[3].inspections).toBe(1);
    expect(result.months[3].completed).toBe(1);

    // July (index 6): 2 maintenance, 0 inspections.
    expect(result.months[6].maintenance).toBe(2);
    expect(result.months[6].inspections).toBe(0);

    // A month with no activity stays at zero.
    expect(result.months[0].inspections).toBe(0);
    expect(result.months[0].maintenance).toBe(0);
  });
});

import { prisma } from '@tzw/shared';

export const reportService = {
  /** Headline numbers + breakdowns for the dashboard. */
  async summary() {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 86_400_000);

    const [
      totalExtinguishers,
      active,
      expired,
      underMaintenance,
      outOfService,
      dueForInspection,
      expiringSoon,
      scheduledInspections,
      completedInspections,
      maintenanceCount,
      byType,
      byStatus,
    ] = await Promise.all([
      prisma.fireExtinguisher.count(),
      prisma.fireExtinguisher.count({ where: { status: 'ACTIVE' } }),
      prisma.fireExtinguisher.count({ where: { status: 'EXPIRED' } }),
      prisma.fireExtinguisher.count({ where: { status: 'UNDER_MAINTENANCE' } }),
      prisma.fireExtinguisher.count({ where: { status: 'OUT_OF_SERVICE' } }),
      prisma.fireExtinguisher.count({ where: { status: 'DUE_FOR_INSPECTION' } }),
      prisma.fireExtinguisher.count({ where: { expiryDate: { lte: in30Days, gte: now } } }),
      prisma.inspection.count({ where: { status: 'SCHEDULED' } }),
      prisma.inspection.count({ where: { status: 'COMPLETED' } }),
      prisma.maintenanceLog.count(),
      prisma.fireExtinguisher.groupBy({ by: ['type'], _count: true }),
      prisma.fireExtinguisher.groupBy({ by: ['status'], _count: true }),
    ]);

    return {
      cards: {
        totalExtinguishers,
        active,
        expired,
        dueForInspection,
        expiringSoon,
        underMaintenance,
        outOfService,
        scheduledInspections,
        completedInspections,
        maintenanceActivities: maintenanceCount,
      },
      charts: {
        byType: byType.map((t) => ({ label: t.type, value: t._count })),
        byStatus: byStatus.map((s) => ({ label: s.status, value: s._count })),
      },
    };
  },

  /** Inspections & maintenance grouped by month for a given year. */
  async monthly(year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    const [inspections, maintenance] = await Promise.all([
      prisma.inspection.findMany({ where: { scheduledAt: { gte: start, lt: end } }, select: { scheduledAt: true, status: true } }),
      prisma.maintenanceLog.findMany({ where: { actionDate: { gte: start, lt: end } }, select: { actionDate: true } }),
    ]);

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(year, i, 1).toLocaleString('en', { month: 'short' }),
      inspections: 0,
      completed: 0,
      maintenance: 0,
    }));
    inspections.forEach((i) => {
      const m = i.scheduledAt.getMonth();
      months[m].inspections += 1;
      if (i.status === 'COMPLETED') months[m].completed += 1;
    });
    maintenance.forEach((m) => { months[m.actionDate.getMonth()].maintenance += 1; });
    return { year, months };
  },

  async yearly() {
    const extinguishers = await prisma.fireExtinguisher.findMany({ select: { installationDate: true } });
    const byYear: Record<number, number> = {};
    extinguishers.forEach((e) => {
      const y = e.installationDate.getFullYear();
      byYear[y] = (byYear[y] ?? 0) + 1;
    });
    return Object.entries(byYear).map(([year, installed]) => ({ year: Number(year), installed })).sort((a, b) => a.year - b.year);
  },
};

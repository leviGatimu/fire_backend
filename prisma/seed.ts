import { PrismaClient, RoleName, ExtinguisherType, ExtinguisherSize, ExtinguisherStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Roles
  const roles: { name: RoleName; description: string }[] = [
    { name: 'ADMIN', description: 'Full system access' },
    { name: 'INSPECTOR', description: 'Conduct inspections and log maintenance' },
    { name: 'USER', description: 'Read-only access to extinguishers and schedules' },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
  const inspectorRole = await prisma.role.findUniqueOrThrow({ where: { name: 'INSPECTOR' } });
  const userRole = await prisma.role.findUniqueOrThrow({ where: { name: 'USER' } });

  // Users
  const seedUsers = [
    { firstName: 'Tariq', lastName: 'Admin', email: 'admin@tzw.com', password: 'Admin@1234', roleId: adminRole.id },
    { firstName: 'Ivy', lastName: 'Inspector', email: 'inspector@tzw.com', password: 'Inspect@1234', roleId: inspectorRole.id },
    { firstName: 'Uma', lastName: 'User', email: 'user@tzw.com', password: 'User@1234', roleId: userRole.id },
  ];

  let inspectorId = '';
  for (const u of seedUsers) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        passwordHash,
        roleId: u.roleId,
      },
    });
    if (u.email === 'inspector@tzw.com') inspectorId = created.id;
  }

  // Fire extinguishers
  const extinguishers = [
    { serialNumber: 'FE-1001', location: 'Building A — Floor 1 Lobby', type: 'CO2' as ExtinguisherType, size: 'LBS_5' as ExtinguisherSize, status: 'ACTIVE' as ExtinguisherStatus, monthsOld: 6, monthsToExpiry: 54 },
    { serialNumber: 'FE-1002', location: 'Building A — Floor 2 Kitchen', type: 'FOAM' as ExtinguisherType, size: 'LBS_9' as ExtinguisherSize, status: 'DUE_FOR_INSPECTION' as ExtinguisherStatus, monthsOld: 11, monthsToExpiry: 49 },
    { serialNumber: 'FE-1003', location: 'Warehouse B — Bay 3', type: 'DRY_CHEMICAL' as ExtinguisherType, size: 'LBS_12' as ExtinguisherSize, status: 'UNDER_MAINTENANCE' as ExtinguisherStatus, monthsOld: 24, monthsToExpiry: 36 },
    { serialNumber: 'FE-1004', location: 'Building C — Server Room', type: 'CO2' as ExtinguisherType, size: 'LBS_2_5' as ExtinguisherSize, status: 'EXPIRED' as ExtinguisherStatus, monthsOld: 72, monthsToExpiry: -2 },
    { serialNumber: 'FE-1005', location: 'Parking Garage — Level B1', type: 'WATER' as ExtinguisherType, size: 'LBS_9' as ExtinguisherSize, status: 'ACTIVE' as ExtinguisherStatus, monthsOld: 3, monthsToExpiry: 57 },
  ];

  const addMonths = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d;
  };

  for (const e of extinguishers) {
    await prisma.fireExtinguisher.upsert({
      where: { serialNumber: e.serialNumber },
      update: {},
      create: {
        serialNumber: e.serialNumber,
        location: e.location,
        type: e.type,
        size: e.size,
        status: e.status,
        installationDate: addMonths(-e.monthsOld),
        expiryDate: addMonths(e.monthsToExpiry),
      },
    });
  }

  // A sample scheduled inspection
  const fe = await prisma.fireExtinguisher.findUnique({ where: { serialNumber: 'FE-1002' } });
  if (fe && inspectorId) {
    const existing = await prisma.inspection.findFirst({ where: { extinguisherId: fe.id } });
    if (!existing) {
      await prisma.inspection.create({
        data: {
          extinguisherId: fe.id,
          inspectorId,
          scheduledAt: addMonths(0),
          status: 'SCHEDULED',
          notes: 'Routine annual inspection.',
        },
      });
    }
  }

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

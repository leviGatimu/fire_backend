import { PrismaClient } from '@prisma/client';

// A single shared PrismaClient instance per process (avoids exhausting the
// connection pool when modules hot-reload in development).
declare global {
  // eslint-disable-next-line no-var
  var __tzwPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__tzwPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__tzwPrisma = prisma;
}

export { PrismaClient };

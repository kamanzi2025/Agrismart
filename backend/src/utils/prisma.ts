import { PrismaClient } from '@prisma/client';

/** Singleton Prisma client — reused across all modules */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

export default prisma;

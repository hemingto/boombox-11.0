/**
 * @fileoverview Prisma database client with connection pooling
 * @source boombox-10.0/src/app/lib/prisma.ts
 * @refactor Moved to database directory with NO LOGIC CHANGES
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // Optional: Enable logs for debugging
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

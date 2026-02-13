/**
 * @fileoverview Prisma database client with connection pooling
 * @source boombox-10.0/src/app/lib/prisma.ts
 * @refactor Moved to database directory with NO LOGIC CHANGES
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Use a placeholder URL during build if DATABASE_URL is not set
// This prevents build errors on Vercel while still allowing the build to complete
const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://placeholder:placeholder@localhost:5432/placeholder';

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

// Re-create the client if the model set has changed (e.g., after prisma migrate dev)
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

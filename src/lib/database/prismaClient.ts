/**
 * @fileoverview Prisma database client configured for Neon + PgBouncer on Vercel
 * @source boombox-10.0/src/app/lib/prisma.ts
 * @refactor Moved to database directory, added serverless connection hardening
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function buildDatabaseUrl(): string {
  const base =
    process.env.DATABASE_URL ||
    'postgresql://placeholder:placeholder@localhost:5432/placeholder';

  if (base.includes('placeholder')) return base;

  const url = new URL(base);
  url.searchParams.set('pgbouncer', 'true');
  url.searchParams.set('connect_timeout', '15');
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', '1');
  }
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', '15');
  }
  return url.toString();
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    datasources: {
      db: {
        url: buildDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Execute a database operation with automatic retry on transient connection errors
 * (e.g. Neon/PgBouncer closing idle connections during long-running AI calls).
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isTransient =
        error?.message?.includes('Closed') ||
        error?.message?.includes('connection') ||
        error?.code === 'P1017' ||
        error?.code === 'P1001' ||
        error?.code === 'P2024';

      if (isTransient && attempt < maxRetries) {
        console.warn(
          `[Prisma] Transient connection error (attempt ${attempt}/${maxRetries}), retrying...`
        );
        await prisma.$disconnect();
        await new Promise(r => setTimeout(r, 1000 * attempt));
        await prisma.$connect();
        continue;
      }
      throw error;
    }
  }
  throw new Error('withRetry: unreachable');
}

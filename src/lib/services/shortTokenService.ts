import { nanoid } from 'nanoid';
import { prisma } from '@/lib/database/prismaClient';

export type ShortTokenType =
  | 'appt_tracking'
  | 'appt_feedback'
  | 'ps_tracking'
  | 'ps_feedback'
  | 'driver_offer'
  | 'driver_reconfirm'
  | 'mover_change'
  | 'ps_route_offer';

const TOKEN_LENGTH = 10;

export async function createShortToken(
  type: ShortTokenType,
  payload: Record<string, unknown>,
  expiresAt?: Date
): Promise<string> {
  const token = nanoid(TOKEN_LENGTH);

  await prisma.shortToken.create({
    data: {
      token,
      type,
      payload,
      expiresAt: expiresAt ?? null,
    },
  });

  return token;
}

export class ShortTokenExpiredError extends Error {
  constructor(token: string) {
    super(`Token expired: ${token}`);
    this.name = 'ShortTokenExpiredError';
  }
}

export class ShortTokenNotFoundError extends Error {
  constructor(token: string) {
    super(`Token not found: ${token}`);
    this.name = 'ShortTokenNotFoundError';
  }
}

export async function resolveShortToken(
  token: string,
  expectedType?: ShortTokenType
): Promise<Record<string, unknown>> {
  const record = await prisma.shortToken.findUnique({
    where: { token },
  });

  if (!record || (expectedType && record.type !== expectedType)) {
    throw new ShortTokenNotFoundError(token);
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    throw new ShortTokenExpiredError(token);
  }

  return record.payload as Record<string, unknown>;
}

export function expiresIn(ms: number): Date {
  return new Date(Date.now() + ms);
}

export const DURATIONS = {
  HOURS_2: 2 * 60 * 60 * 1000,
  HOURS_24: 24 * 60 * 60 * 1000,
  DAYS_30: 30 * 24 * 60 * 60 * 1000,
} as const;

export function generateShortId(): string {
  return nanoid(TOKEN_LENGTH);
}

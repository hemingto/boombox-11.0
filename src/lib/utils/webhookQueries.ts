/**
 * @fileoverview Database query utilities for webhook operations
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (repeated query patterns)
 * @refactor Consolidated repeated appointment and order queries from webhook handlers
 */

import { prisma } from '@/lib/database/prismaClient';
import type { 
  Appointment, 
  PackingSupplyOrder, 
  OnfleetTask
} from '@prisma/client';

// Simplified type definitions using Prisma's include types
export interface FindAppointmentOptions {
  stepNumber?: number;
  excludeStatus?: string;
  includeInactiveUnits?: boolean;
}

/**
 * Consolidated appointment query with all necessary includes
 * Replaces 5+ repeated queries in the webhook handler
 */
export async function findAppointmentByOnfleetTask(
  taskShortId: string,
  options: FindAppointmentOptions = {}
) {
  const { stepNumber, excludeStatus } = options;

  const whereClause: any = {
    onfleetTasks: {
      some: {
        shortId: taskShortId,
        ...(stepNumber && { stepNumber })
      }
    }
  };

  if (excludeStatus) {
    whereClause.NOT = { status: excludeStatus };
  }

  return await prisma.appointment.findFirst({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          phoneNumber: true,
          stripeCustomerId: true
        }
      },
      movingPartner: {
        select: {
          id: true,
          name: true
        }
      },
      thirdPartyMovingPartner: {
        select: {
          id: true,
          title: true
        }
      },
      onfleetTasks: true,
      requestedStorageUnits: {
        include: {
          storageUnit: {
            select: {
              id: true,
              storageUnitNumber: true
            }
          }
        }
      }
    }
  });
}

/**
 * Find packing supply order with all necessary includes
 * Used by packing supply webhook handlers
 */
export async function findPackingSupplyOrderById(orderId: number) {
  return await prisma.packingSupplyOrder.findUnique({
    where: { id: orderId },
    include: {
      orderDetails: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true
            }
          }
        }
      },
      assignedDriver: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      user: {
        select: {
          id: true,
          phoneNumber: true
        }
      }
    }
  });
}

/**
 * Find OnfleetTask to get unitNumber and other metadata
 */
export async function findOnfleetTaskByShortId(shortId: string): Promise<OnfleetTask | null> {
  return await prisma.onfleetTask.findUnique({
    where: { shortId }
  });
}

/**
 * Update appointment status and related fields
 * Centralizes status update patterns used throughout webhook handlers
 */
export async function updateAppointmentStatus(
  appointmentId: number,
  status: string,
  additionalData: Record<string, any> = {}
): Promise<Appointment> {
  return await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status,
      ...additionalData
    }
  });
}

/**
 * Update packing supply order status
 */
export async function updatePackingSupplyOrderStatus(
  orderId: number,
  status: string,
  additionalData: Record<string, any> = {}
): Promise<PackingSupplyOrder> {
  return await prisma.packingSupplyOrder.update({
    where: { id: orderId },
    data: {
      status,
      ...additionalData
    }
  });
}

/**
 * Update OnfleetTask webhook time
 * Used for taskStarted triggers on steps 1-4
 */
export async function updateOnfleetTaskWebhookTime(
  shortId: string,
  webhookTime: string
): Promise<OnfleetTask> {
  return await prisma.onfleetTask.update({
    where: { shortId },
    data: { webhookTime }
  });
}

/**
 * Update storage unit usage records for end of term
 * Handles the storage termination database operations
 */
export async function updateStorageUnitUsageForTermination(
  storageUnitIds: number[],
  appointmentId: number
): Promise<void> {
  for (const storageUnitId of storageUnitIds) {
    await prisma.storageUnitUsage.updateMany({
      where: {
        storageUnitId,
        usageEndDate: null
      },
      data: {
        usageEndDate: new Date(),
        endAppointmentId: appointmentId
      }
    });
  }
}

/**
 * Update StorageUnitUsage main image from Step 2 completion photo
 */
export async function updateStorageUnitMainImage(
  storageUnitId: number,
  imageUrl: string
): Promise<void> {
  await prisma.storageUnitUsage.updateMany({
    where: {
      storageUnitId,
      usageEndDate: null // Only update active usage records
    },
    data: {
      mainImage: imageUrl
    }
  });
}

/**
 * Find storage usage for early termination calculations
 */
export async function findActiveStorageUsage(storageUnitId: number) {
  return await prisma.storageUnitUsage.findFirst({
    where: {
      storageUnitId,
      usageEndDate: null
    },
    orderBy: {
      usageStartDate: 'asc'
    }
  });
} 
/**
 * @fileoverview Database query utilities for inbound message processing
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (lines 63-87, 245-258, 339-356)
 * @refactor Extracted inline database queries to centralized utilities
 */

import { prisma } from '@/lib/database/prismaClient';
import type { User, Driver, OnfleetTask, PackingSupplyRoute, Appointment } from '@prisma/client';

/**
 * Find customer by phone number
 * @param phoneNumber - Customer phone number
 * @returns Promise<User | null>
 */
export async function findCustomerByPhone(phoneNumber: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { phoneNumber }
  });
}

/**
 * Find driver by phone number
 * @param phoneNumber - Driver phone number
 * @returns Promise<Driver | null>
 */
export async function findDriverByPhone(phoneNumber: string): Promise<Driver | null> {
  return await prisma.driver.findUnique({
    where: { phoneNumber }
  });
}

/**
 * Find pending mover change request for customer
 * @param userId - Customer user ID
 * @returns Promise<Appointment | null>
 */
export async function findPendingMoverChange(userId: string): Promise<Appointment | null> {
  return await prisma.appointment.findFirst({
    where: {
      userId,
      description: {
        contains: '"moverChangeRequest"'
      }
    },
    orderBy: {
      date: 'desc'
    }
  });
}

/**
 * Find recent packing supply route offers for driver (within last 30 minutes)
 * @param driverId - Driver ID (optional, will search for any recent offer if not provided)
 * @returns Promise<PackingSupplyRoute | null>
 */
export async function findRecentPackingSupplyRoute(driverId?: string): Promise<PackingSupplyRoute | null> {
  return await prisma.packingSupplyRoute.findFirst({
    where: {
      driverOfferSentAt: {
        gte: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
      },
      driverOfferStatus: 'sent',
      driverOfferExpiresAt: {
        gt: new Date() // Not expired
      }
    },
    orderBy: {
      driverOfferSentAt: 'desc'
    }
  });
}

/**
 * Find latest task notification sent to driver (including reconfirmation tasks)
 * @param driverId - Driver ID
 * @returns Promise<(OnfleetTask & { appointment: Appointment }) | null>
 */
export async function findLatestDriverTask(
  driverId: string
): Promise<(OnfleetTask & { appointment: Appointment }) | null> {
  return await prisma.onfleetTask.findFirst({
    where: {
      lastNotifiedDriverId: driverId,
      driverNotificationStatus: {
        in: ['sent', 'pending_reconfirmation']
      },
      driverNotificationSentAt: {
        // Within the last 2 hours
        gte: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    },
    orderBy: {
      driverNotificationSentAt: 'desc'
    },
    include: {
      appointment: true
    }
  });
}

/**
 * Parse appointment description JSON safely
 * @param description - Appointment description string
 * @returns Parsed description object or empty object
 */
export function parseAppointmentDescription(description: string | null): any {
  if (!description) return {};
  
  try {
    return JSON.parse(description);
  } catch {
    return {};
  }
}

/**
 * Update OnfleetTasks to remove driver from appointment (for reconfirmation declines)
 * @param appointmentId - Appointment ID
 * @param driverId - Driver ID to remove
 */
export async function removeDriverFromAppointment(appointmentId: string, driverId: string): Promise<void> {
  await prisma.onfleetTask.updateMany({
    where: {
      appointmentId,
      driverId
    },
    data: {
      driverId: null,
      driverNotificationStatus: 'cancelled',
      driverAcceptedAt: null,
      declinedDriverIds: []
    }
  });
}
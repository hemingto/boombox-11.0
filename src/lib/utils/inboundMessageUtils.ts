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
 * Attempts exact match first, then tries normalized formats
 * @param phoneNumber - Driver phone number (e.g., +16508709543 from Twilio)
 * @returns Promise<Driver | null>
 */
export async function findDriverByPhone(phoneNumber: string): Promise<Driver | null> {
  console.log('--- findDriverByPhone DEBUG ---');
  console.log('Input phone number:', phoneNumber);
  
  // First try exact match
  let driver = await prisma.driver.findUnique({
    where: { phoneNumber }
  });
  
  if (driver) {
    console.log('DEBUG: Found driver with exact match. Driver ID:', driver.id);
    return driver;
  }
  
  console.log('DEBUG: No exact match found, trying normalized formats...');
  
  // Try without the +1 prefix (in case stored as 10 digits)
  const digits = phoneNumber.replace(/\D/g, '');
  const last10Digits = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  
  console.log('DEBUG: Extracted digits:', digits);
  console.log('DEBUG: Last 10 digits:', last10Digits);
  
  // Try finding with just the 10 digits
  driver = await prisma.driver.findUnique({
    where: { phoneNumber: last10Digits }
  });
  
  if (driver) {
    console.log('DEBUG: Found driver with 10-digit format. Driver ID:', driver.id);
    return driver;
  }
  
  // Try with +1 prefix if input didn't have it
  if (!phoneNumber.startsWith('+1') && last10Digits.length === 10) {
    driver = await prisma.driver.findUnique({
      where: { phoneNumber: `+1${last10Digits}` }
    });
    
    if (driver) {
      console.log('DEBUG: Found driver with +1 prefix. Driver ID:', driver.id);
      return driver;
    }
  }
  
  // Log all drivers for debugging (limit to first few)
  console.log('DEBUG: No driver found. Checking database for similar phones...');
  const similarDrivers = await prisma.driver.findMany({
    where: {
      phoneNumber: {
        contains: last10Digits.slice(-7) // Last 7 digits
      }
    },
    select: { id: true, phoneNumber: true, firstName: true, lastName: true },
    take: 5
  });
  console.log('DEBUG: Drivers with similar phone numbers:', JSON.stringify(similarDrivers, null, 2));
  
  return null;
}

/**
 * Find pending mover change request for customer
 * @param userId - Customer user ID
 * @returns Promise<Appointment | null>
 */
export async function findPendingMoverChange(userId: string): Promise<Appointment | null> {
  return await prisma.appointment.findFirst({
    where: {
      userId: parseInt(userId, 10),
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
 * @param driverId - Driver ID (number)
 * @returns Promise<(OnfleetTask & { appointment: Appointment }) | null>
 */
export async function findLatestDriverTask(
  driverId: number
): Promise<(OnfleetTask & { appointment: Appointment }) | null> {
  console.log('--- findLatestDriverTask DEBUG ---');
  console.log('Looking for tasks with lastNotifiedDriverId:', driverId);
  console.log('Type of driverId:', typeof driverId);
  
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  console.log('DEBUG: Time window - tasks sent after:', twoHoursAgo.toISOString());
  
  const task = await prisma.onfleetTask.findFirst({
    where: {
      lastNotifiedDriverId: driverId,
      driverNotificationStatus: {
        in: ['sent', 'pending_reconfirmation']
      },
      driverNotificationSentAt: {
        gte: twoHoursAgo
      }
    },
    orderBy: {
      driverNotificationSentAt: 'desc'
    },
    include: {
      appointment: true
    }
  });
  
  if (task) {
    console.log('DEBUG: Task found:', {
      id: task.id,
      taskId: task.taskId,
      appointmentId: task.appointmentId,
      lastNotifiedDriverId: task.lastNotifiedDriverId,
      driverNotificationStatus: task.driverNotificationStatus,
      driverNotificationSentAt: task.driverNotificationSentAt
    });
  } else {
    console.log('DEBUG: No task found. Checking all tasks for this driver...');
    // Debug query to see what tasks exist for this driver
    const allDriverTasks = await prisma.onfleetTask.findMany({
      where: {
        lastNotifiedDriverId: driverId
      },
      select: {
        id: true,
        taskId: true,
        appointmentId: true,
        driverNotificationStatus: true,
        driverNotificationSentAt: true,
        lastNotifiedDriverId: true
      },
      take: 5,
      orderBy: {
        driverNotificationSentAt: 'desc'
      }
    });
    console.log('DEBUG: All tasks for driver (any status):', JSON.stringify(allDriverTasks, null, 2));
    
    // Also check tasks with 'sent' status but maybe wrong driver
    const recentSentTasks = await prisma.onfleetTask.findMany({
      where: {
        driverNotificationStatus: 'sent',
        driverNotificationSentAt: {
          gte: twoHoursAgo
        }
      },
      select: {
        id: true,
        taskId: true,
        appointmentId: true,
        driverNotificationStatus: true,
        driverNotificationSentAt: true,
        lastNotifiedDriverId: true
      },
      take: 5
    });
    console.log('DEBUG: Recent "sent" tasks (any driver):', JSON.stringify(recentSentTasks, null, 2));
  }
  
  return task;
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
      appointmentId: parseInt(appointmentId, 10),
      driverId: parseInt(driverId, 10)
    },
    data: {
      driverId: null,
      driverNotificationStatus: 'cancelled',
      driverAcceptedAt: null,
      declinedDriverIds: []
    }
  });
}
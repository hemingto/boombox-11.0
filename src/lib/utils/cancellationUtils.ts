/**
 * @fileoverview Utility functions for appointment cancellation logic
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/mover-driver-cancel/route.ts
 * @refactor Extracted complex cancellation logic into reusable utilities
 */

import { prisma } from '@/lib/database/prismaClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { driverReassignmentOfferTemplate, moverChangeNotificationTemplate } from '@/lib/messaging/templates/sms/booking';

// Types for utility functions
export interface DriverCancellationData {
  driverId: number;
  appointmentId: number;
  cancellationReason?: string;
}

export interface MoverCancellationData {
  movingPartnerId: number;
  appointmentId: number;
  cancellationReason?: string;
}

export interface AvailableDriver {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  onfleetWorkerId: string | null;
}

/**
 * Generate driver token for job offers
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/mover-driver-cancel/route.ts (generateDriverToken)
 */
export async function generateDriverToken(
  driverId: number, 
  appointmentId: number, 
  unitNumber: number, 
  action: string
): Promise<string> {
  const payload = { driverId, appointmentId, unitNumber, action, timestamp: Date.now() };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Generate customer mover change token
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/mover-driver-cancel/route.ts (generateCustomerMoverChangeToken)
 */
export async function generateCustomerMoverChangeToken(
  appointmentId: number,
  suggestedMoverId: number,
  originalMoverId: number
): Promise<string> {
  const payload = { 
    appointmentId, 
    suggestedMoverId, 
    originalMoverId, 
    timestamp: Date.now(),
    expiresAt: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Find available drivers for appointment reassignment
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/mover-driver-cancel/route.ts (findAvailableDrivers)
 */
export async function findAvailableDrivers(
  appointment: any, 
  task: any, 
  excludeDriverIds: number[] = []
): Promise<AvailableDriver[]> {
  const appointmentDate = new Date(appointment.date);
  const dayOfWeek = appointmentDate.toLocaleDateString("en-US", { weekday: "long" });
  const appointmentTime = new Date(appointment.time);
  const hours = appointmentTime.getHours();
  const minutes = appointmentTime.getMinutes();
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return prisma.driver.findMany({
    where: {
      isApproved: true,
      applicationComplete: true,
      status: 'Active',
      onfleetWorkerId: { not: null },
      id: { notIn: excludeDriverIds },
      availability: {
        some: {
          dayOfWeek,
          startTime: { lte: formattedTime },
          endTime: { gte: formattedTime },
          isBlocked: false
        }
      },
      NOT: {
        assignedTasks: {
          some: {
            appointment: {
              date: { equals: appointmentDate },
              time: {
                gte: new Date(appointmentTime.getTime() - (60 * 60 * 1000)),
                lte: new Date(appointmentTime.getTime() + (60 * 60 * 1000))
              }
            }
          }
        }
      }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      onfleetWorkerId: true,
    },
    orderBy: [{ assignedTasks: { _count: 'desc' } }]
  });
}

/**
 * Notify driver about reassignment opportunity
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/mover-driver-cancel/route.ts (triggerReassignmentForUnit)
 */
export async function notifyDriverReassignment(
  driver: AvailableDriver,
  appointment: any,
  unitNumber: number
): Promise<void> {
  if (!driver.phoneNumber) {
    console.error(`Cannot notify driver ${driver.id}: no phone number`);
    return;
  }

  const acceptToken = await generateDriverToken(driver.id, appointment.id, unitNumber, 'accept');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.boomboxstorage.com';
  const webViewUrl = `${baseUrl}/driver/offer/${acceptToken}`;
  
  const appointmentDate = new Date(appointment.date);
  const appointmentTimeOriginal = new Date(appointment.time);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = appointmentTimeOriginal.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });

  await MessageService.sendSms(
    driver.phoneNumber,
    driverReassignmentOfferTemplate,
    {
      formattedTime,
      formattedDate,
      address: appointment.address,
      webViewUrl
    }
  );
}

/**
 * Notify customer about mover change
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/mover-driver-cancel/route.ts (notifyCustomerMoverChange)
 */
export async function notifyCustomerMoverChange(
  appointment: any, 
  suggestedMover: any, 
  originalLoadingHelpPrice: number
): Promise<void> {
  if (!appointment.user.phoneNumber) {
    console.error('Cannot notify customer of mover change: no phone number');
    return;
  }

  const token = await generateCustomerMoverChangeToken(
    appointment.id,
    suggestedMover.id,
    appointment.movingPartnerId
  );
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.boomboxstorage.com';
  const webViewUrl = `${baseUrl}/customer/mover-change/${token}`;
  
  const appointmentDate = new Date(appointment.date);
  const appointmentTime = new Date(appointment.time);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = appointmentTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });

  const priceDifference = (suggestedMover.hourlyRate || 0) - originalLoadingHelpPrice;
  const priceText = priceDifference === 0 
    ? `same rate ($${suggestedMover.hourlyRate || 0}/hr)`
    : priceDifference > 0 
      ? `+$${priceDifference}/hr (${suggestedMover.hourlyRate || 0}/hr total)`
      : `-$${Math.abs(priceDifference)}/hr (${suggestedMover.hourlyRate || 0}/hr total)`;

  await MessageService.sendSms(
    appointment.user.phoneNumber,
    moverChangeNotificationTemplate,
    {
      formattedDate,
      formattedTime,
      suggestedMoverName: suggestedMover.name,
      priceText,
      webViewUrl
    }
  );
}

/**
 * Record driver cancellation in database
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/mover-driver-cancel/route.ts
 */
export async function recordDriverCancellation(data: DriverCancellationData): Promise<void> {
  await prisma.driverCancellation.create({
    data: {
      driverId: data.driverId,
      appointmentId: data.appointmentId,
      cancellationReason: data.cancellationReason || 'No reason added',
    },
  });
}

/**
 * Record mover cancellation in database
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/mover-driver-cancel/route.ts
 */
export async function recordMoverCancellation(data: MoverCancellationData): Promise<void> {
  await prisma.moverCancellation.create({
    data: {
      movingPartnerId: data.movingPartnerId,
      appointmentId: data.appointmentId,
      cancellationReason: data.cancellationReason || 'No reason added',
    },
  });
} 
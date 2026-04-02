/**
 * @fileoverview Utility functions for appointment cancellation logic
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/mover-driver-cancel/route.ts
 * @refactor Extracted complex cancellation logic into reusable utilities
 */

import { prisma } from '@/lib/database/prismaClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { formatTime, formatTime24Hour } from './dateUtils';
import {
  driverReassignmentOfferTemplate,
  moverChangeNotificationTemplate,
} from '@/lib/messaging/templates/sms/booking';
import {
  createShortToken,
  expiresIn,
  DURATIONS,
} from '@/lib/services/shortTokenService';

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
 * Generate a secure short token for driver job offers, stored in ShortToken table
 */
export async function generateDriverToken(
  driverId: number,
  appointmentId: number,
  unitNumber: number,
  action: string
): Promise<string> {
  return createShortToken(
    'driver_offer',
    { driverId, appointmentId, unitNumber, action, timestamp: Date.now() },
    expiresIn(DURATIONS.HOURS_2)
  );
}

/**
 * Generate a secure short token for customer mover change, stored in ShortToken table
 */
export async function generateCustomerMoverChangeToken(
  appointmentId: number,
  suggestedMoverId: number,
  originalMoverId: number
): Promise<string> {
  return createShortToken(
    'mover_change',
    {
      appointmentId,
      suggestedMovingPartnerId: suggestedMoverId,
      originalMovingPartnerId: originalMoverId,
      timestamp: Date.now(),
    },
    expiresIn(DURATIONS.HOURS_24)
  );
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
  const dayOfWeek = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
  });
  const appointmentTime = new Date(appointment.time);
  const formattedTime = formatTime24Hour(appointmentTime);

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
          isBlocked: false,
        },
      },
      NOT: {
        assignedTasks: {
          some: {
            appointment: {
              date: { equals: appointmentDate },
              time: {
                gte: new Date(appointmentTime.getTime() - 60 * 60 * 1000),
                lte: new Date(appointmentTime.getTime() + 60 * 60 * 1000),
              },
            },
          },
        },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      onfleetWorkerId: true,
    },
    orderBy: [{ assignedTasks: { _count: 'desc' } }],
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

  const acceptToken = await generateDriverToken(
    driver.id,
    appointment.id,
    unitNumber,
    'accept'
  );
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.boomboxstorage.com';
  const webViewUrl = `${baseUrl}/service-provider/driver/offer/${acceptToken}`;

  const appointmentDate = new Date(appointment.date);
  const appointmentTimeOriginal = new Date(appointment.time);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = formatTime(appointmentTimeOriginal);

  await MessageService.sendSms(
    driver.phoneNumber,
    driverReassignmentOfferTemplate,
    {
      formattedTime,
      formattedDate,
      address: appointment.address,
      webViewUrl,
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

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.boomboxstorage.com';
  const webViewUrl = `${baseUrl}/customer/mover-change/${token}`;

  const appointmentDate = new Date(appointment.date);
  const appointmentTime = new Date(appointment.time);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = formatTime(appointmentTime);

  const priceDifference =
    (suggestedMover.hourlyRate || 0) - originalLoadingHelpPrice;
  const priceText =
    priceDifference === 0
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
      webViewUrl,
    }
  );
}

/**
 * Record driver cancellation in database
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/mover-driver-cancel/route.ts
 */
export async function recordDriverCancellation(
  data: DriverCancellationData
): Promise<void> {
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
export async function recordMoverCancellation(
  data: MoverCancellationData
): Promise<void> {
  await prisma.moverCancellation.create({
    data: {
      movingPartnerId: data.movingPartnerId,
      appointmentId: data.appointmentId,
      cancellationReason: data.cancellationReason || 'No reason added',
    },
  });
}

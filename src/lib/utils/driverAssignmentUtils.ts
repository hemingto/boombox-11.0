/**
 * @fileoverview Driver assignment utilities for appointment management
 * @source boombox-10.0/src/app/api/driver-assign/route.ts (extracted utility functions)
 * @refactor Extracted driver assignment logic into reusable utility functions
 */

import { prisma } from '@/lib/database/prismaClient';
import { getOnfleetClient } from '@/lib/integrations/onfleetClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { driverJobOfferSms } from '@/lib/messaging/templates/sms/booking/driverJobOffer';
import { calculateDriverPayment, calculateMovingPartnerPayment, getShortAddress } from '@/lib/services/payment-calculator';
import { formatTime, formatDate } from '@/lib/utils/dateUtils';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';

// Time window in milliseconds for driver to accept a task (2 hours)
export const DRIVER_ACCEPTANCE_WINDOW = 2 * 60 * 60 * 1000;

// Define stagger time in minutes
export const STAGGER_TIME_MINUTES = 45;

// Interfaces for driver assignment functionality
export interface DriverAssignmentResult {
  unitNumber: number;
  status: string;
  message?: string;
  driverId?: number;
  movingPartnerId?: number;
}

export interface AvailableDriver {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  onfleetWorkerId: string | null;
  averageRating: number;
  completedTasks: number;
  tasksToday: number;
}

export interface TokenPayload {
  driverId: number;
  appointmentId: number;
  unitNumber: number;
  action: string;
  timestamp: number;
}

/**
 * Calculate unit-specific start time with staggering
 */
export function getUnitSpecificStartTime(originalAppointmentTime: Date, unitNumber: number): Date {
  if (unitNumber <= 1) {
    return originalAppointmentTime;
  }
  // Calculate offset in milliseconds
  const offset = (unitNumber - 1) * STAGGER_TIME_MINUTES * 60 * 1000;
  return new Date(originalAppointmentTime.getTime() + offset);
}

/**
 * Generate a secure token for driver actions
 * @REFACTOR-P9-TEMP: This should use proper JWT or secure token generation in production
 */
export async function generateDriverToken(
  driverId: number, 
  appointmentId: number, 
  unitNumber: number, 
  action: string
): Promise<string> {
  const payload: TokenPayload = {
    driverId,
    appointmentId,
    unitNumber,
    action,
    timestamp: Date.now()
  };
  
  // @REFACTOR-P9-TEMP: In production, use a proper JWT or other secure token
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Find available drivers for an appointment task, considering unit-specific staggered start times
 */
export async function findAvailableDrivers(
  appointment: any,
  taskForNewJob: any,
  excludeDriverIds: number[] = [],
  movingPartnerId?: number
): Promise<AvailableDriver[]> {
  const originalAppointmentTimeForNewJob = new Date(appointment.time);
  const unitNumberForNewJob = taskForNewJob.unitNumber;
  const newJobUnitSpecificStartTime = getUnitSpecificStartTime(originalAppointmentTimeForNewJob, unitNumberForNewJob);
  const newJobDate = new Date(appointment.date);

  const dayOfWeek = newJobDate.toLocaleDateString("en-US", { weekday: "long" });
  
  // Format the original appointment time for general availability check (HH:MM)
  const hours = originalAppointmentTimeForNewJob.getHours();
  const minutes = originalAppointmentTimeForNewJob.getMinutes();
  const formattedOriginalTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // Determine required team based on appointment type
  let requiredTeamId: string | null = null;
  
  if (appointment.appointmentType === 'Initial Pickup' || 
      appointment.appointmentType === 'Storage Unit Access' || 
      appointment.appointmentType === 'Additional Storage' || 
      appointment.appointmentType === 'End Storage Term') {
    requiredTeamId = process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID || null;
  } else {
    requiredTeamId = process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID || null;
  }

  // Build the where clause
  const whereClause: any = {
    isApproved: true,
    applicationComplete: true,
    status: 'Active',
    onfleetWorkerId: { not: null },
    id: { notIn: excludeDriverIds },
    availability: {
      some: {
        dayOfWeek,
        startTime: { lte: formattedOriginalTime },
        endTime: { gte: formattedOriginalTime },
        isBlocked: false
      }
    },
  };
  
  // Add team membership filter
  if (requiredTeamId) {
    whereClause.onfleetTeamIds = {
      has: requiredTeamId
    };
  }
  
  // If movingPartnerId is specified, only include drivers from that Moving Partner
  if (movingPartnerId) {
    whereClause.movingPartnerAssociations = {
      some: {
        movingPartnerId: movingPartnerId,
        isActive: true
      }
    };
  }

  // Fetch potentially available drivers
  const candidateDrivers = await prisma.driver.findMany({
    where: whereClause,
    include: {
      assignedTasks: {
        where: {
          appointment: {
            date: newJobDate,
          },
        },
        include: {
          appointment: {
            select: {
              id: true,
              date: true,
              time: true,
            }
          }
        }
      },
      _count: { select: { assignedTasks: true } }
    }
  });

  const oneHourInMillis = 60 * 60 * 1000;
  const availableDriversFiltered = [];

  for (const driver of candidateDrivers) {
    let isDriverActuallyAvailable = true;
    const newJobStartTimeMillis = newJobUnitSpecificStartTime.getTime();
    const newJobBlockedWindowStart = newJobStartTimeMillis - oneHourInMillis;
    const newJobBlockedWindowEnd = newJobStartTimeMillis + oneHourInMillis;

    for (const existingTask of driver.assignedTasks) {
      if (!existingTask.appointment) continue;

      const originalExistingTaskAppointmentTime = new Date(existingTask.appointment.time);
      const existingTaskUnitSpecificStartTime = getUnitSpecificStartTime(originalExistingTaskAppointmentTime, existingTask.unitNumber);
      const existingTaskStartTimeMillis = existingTaskUnitSpecificStartTime.getTime();
      
      const existingTaskBlockedWindowStart = existingTaskStartTimeMillis - oneHourInMillis;
      const existingTaskBlockedWindowEnd = existingTaskStartTimeMillis + oneHourInMillis;

      // Check for overlap
      if (newJobBlockedWindowStart < existingTaskBlockedWindowEnd && newJobBlockedWindowEnd > existingTaskBlockedWindowStart) {
        isDriverActuallyAvailable = false;
        break;
      }
    }

    if (isDriverActuallyAvailable) {
      availableDriversFiltered.push(driver);
    }
  }

  // Calculate average rating and sort
  const driversWithRating = availableDriversFiltered.map(driver => {
    const typedDriver = driver as any;
    const appointmentDateOnlyString = new Date(appointment.date).toDateString();
    
    const ratings = typedDriver.assignedTasks
      .filter((task: any) => task.appointment?.feedback)
      .map((task: any) => task.appointment.feedback.rating)
      .filter((rating: any) => rating !== null && rating !== undefined) as number[];
    
    const averageRating = ratings.length > 0 ? ratings.reduce((acc: number, rating: number) => acc + rating, 0) / ratings.length : 0;
    
    const tasksToday = driver.assignedTasks.filter(task =>
      task.appointment && new Date(task.appointment.date).toDateString() === appointmentDateOnlyString
    ).length;

    return {
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      phoneNumber: driver.phoneNumber,
      onfleetWorkerId: driver.onfleetWorkerId,
      averageRating,
      completedTasks: typedDriver._count.assignedTasks,
      tasksToday
    };
  });

  return driversWithRating.sort((a, b) => {
    if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
    return b.completedTasks - a.completedTasks;
  });
}

/**
 * Notify a driver about an available task using centralized messaging
 */
export async function notifyDriverAboutJob(
  driver: AvailableDriver,
  appointment: any,
  task: any
): Promise<boolean> {
  if (!driver.phoneNumber) {
    console.error(`Cannot notify driver ${driver.id}: no phone number`);
    return false;
  }

  const unitNumber = task.unitNumber;
  const acceptToken = await generateDriverToken(driver.id, appointment.id, unitNumber, 'accept');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.boomboxstorage.com';
  const webViewUrl = `${baseUrl}/driver/offer/${acceptToken}`;

  // Calculate timing with unit-specific adjustments
  const unitSpecificStartTime = getUnitSpecificStartTime(new Date(appointment.time), unitNumber);
  const notificationDisplayTime = new Date(unitSpecificStartTime.getTime() - (60 * 60 * 1000));

  const formattedDate = formatDate(new Date(appointment.date), 'weekday-month-day');
  const formattedTime = formatTime(notificationDisplayTime, '12-hour');
  const shortAddress = getShortAddress(appointment.address);

  // Calculate payment estimate
  let paymentEstimateText = '';
  if (appointment.totalEstimatedCost && appointment.totalEstimatedCost > 0) {
    paymentEstimateText = `$${Math.round(appointment.totalEstimatedCost)}`;
  } else {
    const paymentEstimate = await calculateDriverPayment(
      appointment.address,
      appointment.appointmentType
    );
    paymentEstimateText = paymentEstimate.formattedEstimate;
  }

  // Send SMS using centralized messaging system
  try {
    const templateVariables = {
      appointmentType: appointment.appointmentType,
      formattedTime,
      formattedDate,
      shortAddress,
      paymentEstimate: paymentEstimateText,
      webViewUrl,
    };

    const result = await MessageService.sendSms(
      normalizePhoneNumberToE164(driver.phoneNumber),
      driverJobOfferSms,
      templateVariables
    );

    if (result.success) {
      console.log(`Notification sent to driver ${driver.id} for task ${task.id}`);
      return true;
    } else {
      console.error(`Failed to send notification to driver ${driver.id}:`, result.error);
      return false;
    }
  } catch (error) {
    console.error(`Error sending notification to driver ${driver.id}:`, error);
    return false;
  }
}

/**
 * Find and notify the next available driver for a unit
 * Consolidates the logic from findAndNotifyNextDriverForUnit
 */
export async function findAndNotifyNextDriverForUnit(
  appointment: any,
  unitTasks: any[],
  unitNumber: number,
  onfleetClient: any,
  excludePreviouslyNotifiedForAppointment: number[] = []
): Promise<DriverAssignmentResult> {
  if (unitTasks.length === 0) {
    return {
      unitNumber,
      status: 'no_tasks_for_unit',
      message: 'No tasks provided for this unit to assign driver.'
    };
  }
  
  const availableDrivers = await findAvailableDrivers(appointment, unitTasks[0], excludePreviouslyNotifiedForAppointment);
  
  if (availableDrivers.length === 0) {
    await notifyAdminNoDrivers(appointment, unitTasks[0]);
    return {
      unitNumber,
      status: 'no_drivers',
      message: 'No available Boombox drivers for this unit'
    };
  }
  
  const firstDriver = availableDrivers[0];
  
  if (!firstDriver.phoneNumber) {
    console.error(`Cannot notify driver ${firstDriver.id} (Boombox): no phone number`);
    return {
      unitNumber,
      status: 'error',
      message: 'Selected Boombox driver has no phone number'
    };
  }

  // Send notification
  const notificationSuccess = await notifyDriverAboutJob(firstDriver, appointment, unitTasks[0]);
  
  if (notificationSuccess) {
    // Update all tasks for this unit
    for (const task of unitTasks) {
      await prisma.onfleetTask.update({
        where: { id: task.id },
        data: {
          driverNotificationSentAt: new Date(),
          driverNotificationStatus: 'sent',
          lastNotifiedDriverId: firstDriver.id
        }
      });
    }
    
    return {
      unitNumber,
      status: 'notified_boombox_driver',
      driverId: firstDriver.id
    };
  } else {
    return {
      unitNumber,
      status: 'error_sending_notification_boombox',
      message: 'Failed to send notification to Boombox driver'
    };
  }
}

/**
 * Notify admin when no drivers are available
 * @REFACTOR-P9-TEMP: This should implement actual admin notification logic
 */
export async function notifyAdminNoDrivers(appointment: any, task: any): Promise<boolean> {
  // @REFACTOR-P9-TEMP: In production, this might:
  // 1. Send an email to admin
  // 2. Create a notification in the admin dashboard
  // 3. Potentially trigger an automated phone call
  console.log(`No available drivers for appointment ${appointment.id}, task ${task.id}`);
  
  return true;
}

/**
 * Notify moving partner about appointment assignment
 * @REFACTOR-P9-TEMP: This should use centralized messaging templates
 */
export async function notifyMovingPartner(appointment: any, driverName?: string): Promise<boolean> {
  if (!appointment.movingPartnerId) {
    return false;
  }

  const movingPartner = await prisma.movingPartner.findUnique({
    where: { id: appointment.movingPartnerId },
    select: { id: true, name: true, email: true, phoneNumber: true }
  });

  if (!movingPartner) {
    console.warn(`Moving partner ${appointment.movingPartnerId} not found for appointment ${appointment.id}.`);
    return false;
  }

  const user = appointment.user;
  if (!user) {
    console.warn(`User details not found for appointment ${appointment.id}, cannot notify moving partner.`);
    return false;
  }
  
  // @REFACTOR-P9-TEMP: This should use centralized messaging templates instead of inline logic
  const appointmentDateFmt = formatDate(new Date(appointment.date), 'full-date');
  const originalAppointmentTime = new Date(appointment.time);
  const notificationAppointmentTime = new Date(originalAppointmentTime.getTime() - (60 * 60 * 1000));
  const appointmentTimeFmt = formatTime(notificationAppointmentTime, '12-hour-padded');

  let baseMessage: string;
  if (driverName) {
    baseMessage = `Customer ${user.firstName} ${user.lastName}, ${appointment.appointmentType} on ${appointmentDateFmt} at ${appointmentTimeFmt}. Address: ${appointment.address}. Appt ID: ${appointment.id}. ${driverName} has been assigned to the job. To edit driver assignment do so in the onfleet dashboard.`;
  } else {
    baseMessage = `Customer ${user.firstName} ${user.lastName}, ${appointment.appointmentType} on ${appointmentDateFmt} at ${appointmentTimeFmt}. Address: ${appointment.address}. Please assign driver in Onfleet. Appt ID: ${appointment.id}.`;
  }

  // @REFACTOR-P9-TEMP: Replace with centralized messaging service calls
  console.log(`Moving Partner notification: ${baseMessage}`);
  
  return true;
} 
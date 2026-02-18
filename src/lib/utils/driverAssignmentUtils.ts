/**
 * @fileoverview Driver assignment utilities for appointment management
 * @source boombox-10.0/src/app/api/driver-assign/route.ts (extracted utility functions)
 * @refactor Extracted driver assignment logic into reusable utility functions
 */

import { prisma } from '@/lib/database/prismaClient';
import { getOnfleetClient } from '@/lib/integrations/onfleetClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { driverJobOfferSms } from '@/lib/messaging/templates/sms/booking/driverJobOffer';
import { movingPartnerNewJobSms, movingPartnerNewJobWithDriverSms } from '@/lib/messaging/templates/sms/appointment/movingPartnerNewJob';
import { movingPartnerNewJobEmail } from '@/lib/messaging/templates/email/appointment/movingPartnerNewJob';
import { calculateDriverPayment, calculateMovingPartnerPayment, getShortAddress } from '@/lib/services/payment-calculator';
import { formatTime, formatDate, TIME_ZONE, normalizePhoneNumberToE164 } from '@/lib/utils';
import { toZonedTime } from 'date-fns-tz';
import { NotificationService } from '@/lib/services/NotificationService';
import { JOB_TIMING, calculateJobBlockedWindow, doWindowsOverlap } from '@/lib/constants/jobTiming';

// Time window in milliseconds for driver to accept a task (2 hours)
export const DRIVER_ACCEPTANCE_WINDOW = 2 * 60 * 60 * 1000;

// Re-export stagger time for backwards compatibility
export const STAGGER_TIME_MINUTES = JOB_TIMING.STAGGER_TIME_MINUTES;

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
 * Calculate unit completion time (end of service, before return buffer)
 * 
 * Uses centralized JOB_TIMING constants:
 * - Service duration: 60 minutes (1 hour)
 * 
 * Note: This returns when service ends, not when the driver is fully available.
 * For the full blocked window, use calculateJobBlockedWindow() from jobTiming.ts
 */
export function getUnitCompletionTime(
  originalAppointmentTime: Date,
  unitNumber: number
): Date {
  const unitStartTime = getUnitSpecificStartTime(originalAppointmentTime, unitNumber);
  
  // Service time at customer location
  const serviceDurationMs = JOB_TIMING.SERVICE_DURATION_MINUTES * 60 * 1000;
  
  return new Date(unitStartTime.getTime() + serviceDurationMs);
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
  movingPartnerId?: number,
  excludeAppointmentId?: number
): Promise<AvailableDriver[]> {
  const originalAppointmentTimeForNewJob = new Date(appointment.time);
  const unitNumberForNewJob = taskForNewJob.unitNumber;
  const newJobUnitSpecificStartTime = getUnitSpecificStartTime(originalAppointmentTimeForNewJob, unitNumberForNewJob);
  const newJobDate = new Date(appointment.date);

  const dayOfWeek = newJobDate.toLocaleDateString("en-US", { weekday: "long", timeZone: TIME_ZONE });
  
  // Format the original appointment time for general availability check (HH:MM)
  // Convert to PST so we compare against driver availability stored in local time
  const pstTime = toZonedTime(originalAppointmentTimeForNewJob, TIME_ZONE);
  const hours = pstTime.getHours();
  const minutes = pstTime.getMinutes();
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
  };
  
  // Only apply DriverAvailability check for Boombox Delivery Network drivers (non-moving partner)
  // Moving partner drivers don't set their own availability - the moving partner manages their schedules
  if (!movingPartnerId) {
    whereClause.availability = {
      some: {
        dayOfWeek,
        startTime: { lte: formattedOriginalTime },
        endTime: { gte: formattedOriginalTime },
        isBlocked: false
      }
    };
    
    // Add team membership filter only for Boombox drivers
    if (requiredTeamId) {
      whereClause.onfleetTeamIds = {
        has: requiredTeamId
      };
    }
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

  // Log the query context for debugging
  const isMovingPartnerSearch = !!movingPartnerId;
  console.log(`DRIVER_SEARCH: ${isMovingPartnerSearch ? 'Moving Partner' : 'Boombox'} driver search for ${dayOfWeek} at ${formattedOriginalTime}${isMovingPartnerSearch ? ` (MP ID: ${movingPartnerId})` : ''}`);

  // Fetch potentially available drivers with their time slot bookings
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
      availability: {
        include: {
          driverTimeSlotBookings: {
            where: {
              bookingDate: {
                gte: new Date(newJobDate.setHours(0, 0, 0, 0)),
                lt: new Date(new Date(newJobDate).setHours(23, 59, 59, 999))
              }
            }
          }
        }
      },
      _count: { select: { assignedTasks: true } }
    }
  });

  console.log(`DRIVER_SEARCH: Found ${candidateDrivers.length} candidate driver(s) matching base criteria`);

  const availableDriversFiltered = [];

  // Calculate the new job's blocked window using centralized timing constants
  // This ensures consistency with AvailabilityService
  const newJobWindow = calculateJobBlockedWindow(originalAppointmentTimeForNewJob, unitNumberForNewJob);
  
  console.log(`DRIVER_SEARCH: New job blocks ${newJobWindow.blockedStart.toISOString()} to ${newJobWindow.blockedEnd.toISOString()} (${JOB_TIMING.TOTAL_BLOCKED_HOURS}h)`);

  for (const driver of candidateDrivers) {
    let isDriverActuallyAvailable = true;
    let conflictReason: string | null = null;

    // Check OnfleetTask conflicts (primary booking records)
    for (const existingTask of driver.assignedTasks) {
      if (!existingTask.appointment) continue;
      
      // Skip conflicts with the appointment being edited (for edit mode)
      if (excludeAppointmentId && existingTask.appointment.id === excludeAppointmentId) continue;

      const existingTaskWindow = calculateJobBlockedWindow(
        new Date(existingTask.appointment.time), 
        existingTask.unitNumber
      );

      // Check for overlap using centralized function
      if (doWindowsOverlap(
        newJobWindow.blockedStart,
        newJobWindow.blockedEnd,
        existingTaskWindow.blockedStart,
        existingTaskWindow.blockedEnd
      )) {
        isDriverActuallyAvailable = false;
        conflictReason = `OnfleetTask conflict with appointment ${existingTask.appointment.id} (unit ${existingTask.unitNumber})`;
        break;
      }
    }

    // Check DriverTimeSlotBooking conflicts (formal time slot reservations)
    // Note: TimeSlotBooking stores serviceStart/serviceEnd, so we need to add buffers
    if (isDriverActuallyAvailable && driver.availability) {
      for (const avail of driver.availability) {
        if (!avail.driverTimeSlotBookings) continue;
        
        for (const booking of avail.driverTimeSlotBookings) {
          // Skip conflicts with the appointment being edited (for edit mode)
          if (excludeAppointmentId && booking.appointmentId === excludeAppointmentId) continue;
          
          // bookingDate = service start, endDate = service end
          // Add buffers to get full blocked window
          const bookingBlockedStart = new Date(
            new Date(booking.bookingDate).getTime() - JOB_TIMING.BUFFER_BEFORE_MINUTES * 60 * 1000
          );
          const bookingBlockedEnd = new Date(
            new Date(booking.endDate).getTime() + JOB_TIMING.BUFFER_AFTER_MINUTES * 60 * 1000
          );

          // Check for overlap
          if (doWindowsOverlap(
            newJobWindow.blockedStart,
            newJobWindow.blockedEnd,
            bookingBlockedStart,
            bookingBlockedEnd
          )) {
            isDriverActuallyAvailable = false;
            conflictReason = `TimeSlotBooking conflict with appointment ${booking.appointmentId}`;
            break;
          }
        }
        if (!isDriverActuallyAvailable) break;
      }
    }

    if (isDriverActuallyAvailable) {
      availableDriversFiltered.push(driver);
      console.log(`DRIVER_SEARCH: Driver ${driver.firstName} ${driver.lastName} (ID: ${driver.id}) - AVAILABLE`);
    } else {
      console.log(`DRIVER_SEARCH: Driver ${driver.firstName} ${driver.lastName} (ID: ${driver.id}) - CONFLICT: ${conflictReason}`);
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
  const webViewUrl = `${baseUrl}/service-provider/driver/offer/${acceptToken}`;

  // Calculate timing with unit-specific adjustments
  const unitSpecificStartTime = getUnitSpecificStartTime(new Date(appointment.time), unitNumber);
  const notificationDisplayTime = new Date(unitSpecificStartTime.getTime() - (60 * 60 * 1000));

  const formattedDate = formatDate(new Date(appointment.date), 'weekday-month-day');
  const formattedTime = formatTime(notificationDisplayTime, '12-hour');
  const shortAddress = getShortAddress(appointment.address);

  // Calculate payment estimate for THIS SPECIFIC UNIT (not the total appointment)
  // Important: For multi-unit appointments, each driver is only offered ONE unit's worth of work
  let paymentEstimateText = '';
  let paymentEstimateNumber = 0;
  
  // Sum estimated costs for only THIS unit's tasks (Step 1, 2, 3 for this unitNumber)
  const unitTasks = await prisma.onfleetTask.findMany({
    where: { 
      appointmentId: appointment.id,
      unitNumber: unitNumber  // Filter to only this unit's tasks
    },
    select: { estimatedCost: true }
  });
  
  const unitTaskCostSum = unitTasks.reduce((sum, t) => sum + (t.estimatedCost || 0), 0);
  
  if (unitTaskCostSum > 0) {
    // Use sum of this unit's task costs
    paymentEstimateNumber = unitTaskCostSum;
    paymentEstimateText = `$${Math.round(paymentEstimateNumber)}`;
  } else {
    // Fall back to calculating for a single unit if no task costs saved yet
    const paymentEstimate = await calculateDriverPayment(
      appointment.address,
      appointment.appointmentType
    );
    paymentEstimateNumber = paymentEstimate.total;
    paymentEstimateText = paymentEstimate.formattedEstimate;
  }
  
  console.log(`Driver notification: Unit ${unitNumber} payment estimate: ${paymentEstimateText} (from ${unitTasks.length} tasks)`);

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
      
      // Create in-app notification for job offer
      try {
        await NotificationService.notifyJobOffer(
          driver.id,
          {
            appointmentId: appointment.id,
            jobType: appointment.appointmentType,
            date: appointment.date,
            time: notificationDisplayTime,
            address: appointment.address || '',
            estimatedPayout: paymentEstimateNumber > 0 ? paymentEstimateNumber : undefined
          }
        );
      } catch (notificationError) {
        console.error('Error creating in-app job offer notification:', notificationError);
        // Don't fail if in-app notification fails
      }
      
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
  
  // Pass appointment.id to excludeAppointmentId to prevent false conflicts during edits
  const availableDrivers = await findAvailableDrivers(
    appointment, 
    unitTasks[0], 
    excludePreviouslyNotifiedForAppointment,
    undefined, // movingPartnerId - not applicable for Boombox driver search
    appointment.id // excludeAppointmentId - prevent conflicts with current appointment
  );
  
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
 * Notify moving partner about appointment assignment
 * Sends both SMS and email notifications using centralized MessageService
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
  
  // Format date and time (time is 1 hour earlier for notification)
  const appointmentDateFmt = formatDate(new Date(appointment.date), 'full-date');
  const originalAppointmentTime = new Date(appointment.time);
  const notificationAppointmentTime = new Date(originalAppointmentTime.getTime() - (60 * 60 * 1000));
  const appointmentTimeFmt = formatTime(notificationAppointmentTime, '12-hour-padded');
  const customerName = `${user.firstName} ${user.lastName}`;

  let smsSent = false;
  let emailSent = false;

  // Send SMS if phone number exists
  if (movingPartner.phoneNumber) {
    try {
      const normalizedPhone = normalizePhoneNumberToE164(movingPartner.phoneNumber);
      
      // Select template based on whether driver is assigned
      const smsTemplate = driverName ? movingPartnerNewJobWithDriverSms : movingPartnerNewJobSms;
      const smsVariables: Record<string, string | number> = {
        customerName,
        appointmentType: appointment.appointmentType,
        appointmentDate: appointmentDateFmt,
        appointmentTime: appointmentTimeFmt,
        address: appointment.address,
        appointmentId: appointment.id,
      };
      
      if (driverName) {
        smsVariables.driverName = driverName;
      }

      const smsResult = await MessageService.sendSms(normalizedPhone, smsTemplate, smsVariables);
      
      if (smsResult.success) {
        console.log(`Moving partner SMS sent to ${movingPartner.phoneNumber} for appointment ${appointment.id}`);
        smsSent = true;
      } else {
        console.error(`Failed to send moving partner SMS: ${smsResult.error}`);
      }
    } catch (error: any) {
      console.error(`Error sending moving partner SMS: ${error.message}`);
    }
  } else {
    console.warn(`Moving partner ${movingPartner.id} has no phone number. Skipping SMS notification.`);
  }

  // Send Email if email exists
  if (movingPartner.email) {
    try {
      // Prepare email message body and driver assignment info
      const emailMessageBody = driverName
        ? `New Boombox Job: Customer ${customerName}, ${appointment.appointmentType} on ${appointmentDateFmt} at ${appointmentTimeFmt}. Address: ${appointment.address}. Appt ID: ${appointment.id}. ${driverName} has been assigned to the job. To edit driver assignment do so in the Onfleet dashboard.`
        : `New Boombox Job: Customer ${customerName}, ${appointment.appointmentType} on ${appointmentDateFmt} at ${appointmentTimeFmt}. Address: ${appointment.address}. Please assign driver in Onfleet. Appt ID: ${appointment.id}.`;

      const driverAssignmentInfo = driverName
        ? `Driver Assigned: ${driverName}`
        : 'Please log in to your Onfleet dashboard to assign a driver from your team.';
      
      const driverAssignmentHtml = driverName
        ? `<p><strong>Driver Assigned:</strong> ${driverName}</p>`
        : '<p>Please log in to your Onfleet dashboard to assign a driver from your team.</p>';

      const emailVariables = {
        movingPartnerName: movingPartner.name || 'Moving Partner',
        emailMessageBody,
        customerName,
        customerEmail: user.email || 'N/A',
        customerPhone: user.phoneNumber || 'N/A',
        appointmentId: appointment.id,
        jobCode: appointment.jobCode || 'N/A',
        appointmentType: appointment.appointmentType,
        appointmentDate: appointmentDateFmt,
        appointmentTime: appointmentTimeFmt,
        address: appointment.address,
        zipcode: appointment.zipcode || '',
        numberOfUnits: appointment.numberOfUnits || 1,
        planType: appointment.planType || 'N/A',
        driverAssignmentInfo,
        driverAssignmentHtml,
      };

      const emailResult = await MessageService.sendEmail(movingPartner.email, movingPartnerNewJobEmail, emailVariables);
      
      if (emailResult.success) {
        console.log(`Moving partner email sent to ${movingPartner.email} for appointment ${appointment.id}`);
        emailSent = true;
      } else {
        console.error(`Failed to send moving partner email: ${emailResult.error}`);
      }
    } catch (error: any) {
      console.error(`Error sending moving partner email: ${error.message}`);
    }
  } else {
    console.warn(`Moving partner ${movingPartner.id} has no email. Skipping email notification.`);
  }

  // Create in-app notification for the mover account page
  let inAppNotificationSent = false;
  try {
    await NotificationService.notifyNewJobAvailable(movingPartner.id, {
      appointmentId: appointment.id,
      jobType: appointment.appointmentType,
      date: new Date(appointment.date),
      time: new Date(appointment.time),
      address: appointment.address,
      customerName,
      driverName,
    });
    console.log(`In-app notification created for moving partner ${movingPartner.id} for appointment ${appointment.id}`);
    inAppNotificationSent = true;
  } catch (error: any) {
    console.error(`Error creating in-app notification for moving partner: ${error.message}`);
  }

  // Return true if at least one notification was sent successfully
  return smsSent || emailSent || inAppNotificationSent;
}

/**
 * Notify admin users when no drivers are available for a unit
 * Sends both in-app notifications and email alerts to Admin table
 */
export async function notifyAdminNoDrivers(
  appointment: any,
  task: any
): Promise<void> {
  try {
    // Get all admins from the Admin table with ADMIN or SUPERADMIN roles
    const admins = await prisma.admin.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPERADMIN']
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    if (admins.length === 0) {
      console.warn('No admin users found to notify about driver assignment failure');
      return;
    }

    const formattedDate = formatDate(new Date(appointment.date), 'full-date');
    const formattedTime = formatTime(new Date(appointment.time));
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.boomboxstorage.com'}/admin/appointments/${appointment.id}`;

    // Send email to each admin
    for (const admin of admins) {
      try {
        // Import the email template dynamically to avoid circular dependencies
        const { driverAssignmentFailedTemplate } = await import('@/lib/messaging/templates/email/admin/driverAssignmentFailedTemplate');
        
        await MessageService.sendEmail(
          admin.email,
          driverAssignmentFailedTemplate,
          {
            appointmentId: appointment.id.toString(),
            appointmentType: appointment.appointmentType,
            unitNumber: task.unitNumber.toString(),
            formattedDate,
            formattedTime,
            address: appointment.address,
            dashboardUrl
          }
        );
        
        console.log(`Sent driver assignment failure email to admin: ${admin.email}`);
      } catch (emailError) {
        console.error(`Failed to send email to admin ${admin.email}:`, emailError);
        // Continue to next admin even if one fails
      }
    }
    
    console.log(`Notified ${admins.length} admin(s) about driver assignment failure for appointment ${appointment.id}, unit ${task.unitNumber}`);
  } catch (error) {
    console.error('Error notifying admins about driver assignment failure:', error);
    // Don't throw - we don't want to fail the entire assignment process if notification fails
  }
}

/**
 * Handle retrying driver assignment for expired notifications
 * Based on the retry logic from boombox-10.0 driver-assign route
 */
export async function handleRetryAssignment(appointment: any): Promise<{
  message: string;
  appointmentId: number;
  unitResults: DriverAssignmentResult[];
}> {
  const tasksByUnit: { [unitNumberKey: string]: any[] } = {};
  
  // Group tasks by unit
  for (const task of appointment.onfleetTasks) {
    const unitNumStr = (task.unitNumber || 0).toString();
    if (!tasksByUnit[unitNumStr]) {
      tasksByUnit[unitNumStr] = [];
    }
    tasksByUnit[unitNumStr].push(task);
  }
  
  const unitResults: DriverAssignmentResult[] = [];
  
  for (const [unitNumberKey, unitTasks] of Object.entries(tasksByUnit)) {
    const numericUnitNumber = parseInt(unitNumberKey);
    
    // Check if retry is needed for this unit
    const needsRetry = unitTasks.some((task: any) => {
      return task.driverNotificationStatus === 'sent' && 
             task.driverNotificationSentAt && 
             (new Date().getTime() - new Date(task.driverNotificationSentAt).getTime() > DRIVER_ACCEPTANCE_WINDOW);
    });
    
    if (!needsRetry) {
      unitResults.push({
        unitNumber: numericUnitNumber,
        status: 'no_retry_needed',
        message: 'No tasks to retry for this unit'
      });
      continue;
    }
    
    const unassignedTasks = unitTasks.filter((task: any) => !task.driverId);
    
    if (unassignedTasks.length === 0) {
      unitResults.push({
        unitNumber: numericUnitNumber,
        status: 'all_assigned',
        message: 'All tasks are already assigned for this unit'
      });
      continue;
    }
    
    // Build exclude list from declined drivers and previously notified
    const excludeDriverIds: number[] = [];
    for (const task of unassignedTasks) {
      if (task.declinedDriverIds && task.declinedDriverIds.length > 0) {
        excludeDriverIds.push(...task.declinedDriverIds);
      }
      if (task.lastNotifiedDriverId && task.driverNotificationStatus === 'sent') {
        excludeDriverIds.push(task.lastNotifiedDriverId);
      }
    }
    
    // Find next available driver
    const movingPartnerId = appointment.planType === 'Full Service Plan' ? appointment.movingPartnerId : undefined;
    const availableDrivers = await findAvailableDrivers(appointment, unassignedTasks[0], excludeDriverIds, movingPartnerId);
    
    if (availableDrivers.length === 0) {
      await notifyAdminNoDrivers(appointment, unassignedTasks[0]);
      unitResults.push({
        unitNumber: numericUnitNumber,
        status: 'no_drivers',
        message: 'No more available drivers for this unit, admin notified'
      });
      continue;
    }
    
    const nextDriver = availableDrivers[0];
    
    if (!nextDriver.phoneNumber) {
      console.error(`Cannot notify driver ${nextDriver.id}: no phone number`);
      unitResults.push({
        unitNumber: numericUnitNumber,
        status: 'error',
        message: 'Selected driver has no phone number'
      });
      continue;
    }

    // Send notification to the next driver
    const notificationSuccess = await notifyDriverAboutJob(nextDriver, appointment, unassignedTasks[0]);
    
    if (notificationSuccess) {
      // Update all unassigned tasks for this unit
      for (const task of unassignedTasks) {
        await prisma.onfleetTask.update({
          where: { id: task.id },
          data: { 
            driverNotificationSentAt: new Date(), 
            driverNotificationStatus: 'sent', 
            lastNotifiedDriverId: nextDriver.id, 
            declinedDriverIds: excludeDriverIds 
          }
        });
      }
      
      unitResults.push({
        unitNumber: numericUnitNumber,
        status: 'retry_sent',
        driverId: nextDriver.id
      });
    } else {
      unitResults.push({
        unitNumber: numericUnitNumber,
        status: 'error',
        message: 'Failed to send notification to next driver'
      });
    }
  }
  
  return { 
    message: 'Retry process completed for appointment units',
    appointmentId: appointment.id,
    unitResults
  };
}

/**
 * Create a DriverTimeSlotBooking record when a driver accepts an appointment
 * This prevents overbooking by formally reserving the driver's time slot
 * 
 * @param driverId - The driver accepting the job
 * @param appointmentId - The appointment being accepted
 * @param appointmentDate - The date of the appointment
 * @param appointmentTime - The time of the appointment
 * @param unitNumber - The unit number for staggered timing calculation
 */
export async function createDriverTimeSlotBooking(
  driverId: number,
  appointmentId: number,
  appointmentDate: Date,
  appointmentTime: Date,
  unitNumber: number
): Promise<boolean> {
  try {
    // Calculate the unit-specific booking window
    const bookingStart = getUnitSpecificStartTime(appointmentTime, unitNumber);
    const bookingEnd = getUnitCompletionTime(appointmentTime, unitNumber);
    
    // Get the day of week for finding the availability slot (in PST)
    const dayOfWeek = appointmentDate.toLocaleDateString("en-US", { weekday: "long", timeZone: TIME_ZONE });
    
    // Format time for availability lookup (HH:MM) - convert to PST
    const pstAppointmentTime = toZonedTime(appointmentTime, TIME_ZONE);
    const hours = pstAppointmentTime.getHours();
    const minutes = pstAppointmentTime.getMinutes();
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Find the driver's availability slot for this day/time
    const availabilitySlot = await prisma.driverAvailability.findFirst({
      where: {
        driverId,
        dayOfWeek,
        startTime: { lte: formattedTime },
        endTime: { gte: formattedTime },
        isBlocked: false
      }
    });

    if (!availabilitySlot) {
      console.warn(`No availability slot found for driver ${driverId} on ${dayOfWeek} at ${formattedTime}. Skipping time slot booking creation.`);
      return false;
    }

    // Check if a booking already exists for this appointment
    const existingBooking = await prisma.driverTimeSlotBooking.findUnique({
      where: { appointmentId }
    });

    if (existingBooking) {
      console.log(`DriverTimeSlotBooking already exists for appointment ${appointmentId}`);
      return true;
    }

    // Create the time slot booking
    await prisma.driverTimeSlotBooking.create({
      data: {
        driverAvailabilityId: availabilitySlot.id,
        appointmentId,
        bookingDate: bookingStart,
        endDate: bookingEnd
      }
    });

    console.log(`Created DriverTimeSlotBooking for driver ${driverId}, appointment ${appointmentId}, unit ${unitNumber}`);
    return true;
  } catch (error: any) {
    console.error(`Error creating DriverTimeSlotBooking for driver ${driverId}, appointment ${appointmentId}:`, error);
    // Don't throw - we don't want to fail the driver acceptance if booking creation fails
    // The OnfleetTask.driverId assignment serves as the primary booking record
    return false;
  }
}

/**
 * Delete a DriverTimeSlotBooking record when a driver cancels or is removed from an appointment
 * This frees up the time slot for other drivers
 * 
 * @param appointmentId - The appointment to remove the booking for
 */
export async function deleteDriverTimeSlotBooking(appointmentId: number): Promise<boolean> {
  try {
    const existingBooking = await prisma.driverTimeSlotBooking.findUnique({
      where: { appointmentId }
    });

    if (!existingBooking) {
      console.log(`No DriverTimeSlotBooking found for appointment ${appointmentId} to delete`);
      return true;
    }

    await prisma.driverTimeSlotBooking.delete({
      where: { appointmentId }
    });

    console.log(`Deleted DriverTimeSlotBooking for appointment ${appointmentId}`);
    return true;
  } catch (error: any) {
    console.error(`Error deleting DriverTimeSlotBooking for appointment ${appointmentId}:`, error);
    return false;
  }
}

/**
 * Update a DriverTimeSlotBooking record when appointment time changes
 * This recalculates the booking window based on the new time while preserving the driver assignment
 * 
 * @param appointmentId - The appointment being updated
 * @param newDate - The new date of the appointment
 * @param newTime - The new time of the appointment
 * @param unitNumber - The unit number for staggered timing calculation
 * @returns Object with success status and optional error message
 */
export async function updateDriverTimeSlotBooking(
  appointmentId: number,
  newDate: Date,
  newTime: Date,
  unitNumber: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find existing booking
    const existingBooking = await prisma.driverTimeSlotBooking.findUnique({
      where: { appointmentId },
      include: {
        driverAvailability: {
          select: { driverId: true }
        }
      }
    });

    if (!existingBooking) {
      console.log(`📅 No DriverTimeSlotBooking found for appointment ${appointmentId} - skipping update`);
      return { success: true };
    }

    const driverId = existingBooking.driverAvailability.driverId;

    // Calculate the new booking window
    const bookingStart = getUnitSpecificStartTime(newTime, unitNumber);
    const bookingEnd = getUnitCompletionTime(newTime, unitNumber);

    // Get the day of week for the new date (in PST)
    const dayOfWeek = newDate.toLocaleDateString("en-US", { weekday: "long", timeZone: TIME_ZONE });

    // Format time for availability lookup (HH:MM) - convert to PST
    const pstNewTime = toZonedTime(newTime, TIME_ZONE);
    const hours = pstNewTime.getHours();
    const minutes = pstNewTime.getMinutes();
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Find the driver's availability slot for the new day/time
    const availabilitySlot = await prisma.driverAvailability.findFirst({
      where: {
        driverId,
        dayOfWeek,
        startTime: { lte: formattedTime },
        endTime: { gte: formattedTime },
        isBlocked: false
      }
    });

    if (!availabilitySlot) {
      console.warn(`⚠️ No availability slot found for driver ${driverId} on ${dayOfWeek} at ${formattedTime}. Driver may need to reconfirm.`);
      // Delete the existing booking since driver may not be available at new time
      await prisma.driverTimeSlotBooking.delete({
        where: { appointmentId }
      });
      return { 
        success: true, 
        error: `Driver ${driverId} has no availability slot for ${dayOfWeek} at ${formattedTime}` 
      };
    }

    // Update the booking with new times and potentially new availability slot
    await prisma.driverTimeSlotBooking.update({
      where: { appointmentId },
      data: {
        driverAvailabilityId: availabilitySlot.id,
        bookingDate: bookingStart,
        endDate: bookingEnd
      }
    });

    console.log(`📅 Updated DriverTimeSlotBooking for appointment ${appointmentId}: ${bookingStart.toISOString()} - ${bookingEnd.toISOString()}`);
    return { success: true };
  } catch (error: any) {
    console.error(`❌ Error updating DriverTimeSlotBooking for appointment ${appointmentId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 
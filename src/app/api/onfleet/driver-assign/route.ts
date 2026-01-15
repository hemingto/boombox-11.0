/**
 * @fileoverview Driver assignment orchestration for Onfleet tasks
 * @source boombox-10.0/src/app/api/driver-assign/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that handles comprehensive driver assignment logic for appointments.
 * Supports Full Service Plan (moving partner + boombox drivers) and DIY Plan (boombox drivers only).
 * Manages driver actions: assign, accept, decline, retry, cancel, reconfirm.
 * Implements unit-specific staggered timing system for multi-unit appointments.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/admin/driver-assignment-modal.tsx (line 45: appointment driver assignment)
 * - src/app/api/driver-assign/cron/route.ts (line 23: retry expired assignments)
 * - src/app/components/driver/job-response-handler.tsx (line 78: driver accept/decline actions)
 * - src/app/api/appointments/[appointmentId]/assign-driver/route.ts (line 12: manual driver assignment)
 *
 * INTEGRATION NOTES:
 * - Critical Onfleet integration - maintains exact task assignment logic
 * - Complex business rules for Full Service vs DIY plans  
 * - Unit-specific timing calculations with 45-minute staggering
 * - Moving partner auto-assignment with fallback to Boombox drivers
 * - Driver availability checking with 1-hour buffer windows
 *
 * @refactor Extracted complex logic into utilities, centralized messaging, improved error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { getOnfleetClient } from '@/lib/integrations/onfleetClient';
import { DriverAssignmentRequestSchema, DriverAssignmentResponseSchema } from '@/lib/validations/api.validations';
import { 
  findAvailableDrivers,
  findAndNotifyNextDriverForUnit,
  generateDriverToken,
  getUnitSpecificStartTime,
  notifyDriverAboutJob,
  notifyAdminNoDrivers,
  notifyMovingPartner,
  createDriverTimeSlotBooking,
  deleteDriverTimeSlotBooking,
  DRIVER_ACCEPTANCE_WINDOW,
  type DriverAssignmentResult
} from '@/lib/utils/driverAssignmentUtils';
import { calculateDriverPayment, calculateMovingPartnerPayment, getShortAddress } from '@/lib/services/payment-calculator';
import { revalidatePath } from 'next/cache';
import { NotificationService } from '@/lib/services/NotificationService';
import { MessageService } from '@/lib/messaging/MessageService';
import { driverJobAcceptedSms, driverJobDeclinedSms, movingPartnerNewJobManualAssignSms } from '@/lib/messaging/templates/sms/booking';
import { formatTime, formatDate } from '@/lib/utils/dateUtils';
import { DriverAssignmentMode } from '@prisma/client';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // DEBUG: Log incoming request
    console.log('=== DRIVER-ASSIGN API DEBUG ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const validated = DriverAssignmentRequestSchema.parse(body);
    
    const { appointmentId, onfleetTaskId, driverId, action, source } = validated;
    console.log('DEBUG: Validated params - action:', action, 'appointmentId:', appointmentId, 'driverId:', driverId, 'onfleetTaskId:', onfleetTaskId, 'source:', source);

    // Get appointment details with related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        onfleetTasks: true,
        user: true,
      },
    });

    if (!appointment) {
      console.log('DEBUG: Appointment not found for ID:', appointmentId);
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    
    console.log('DEBUG: Appointment found:', {
      id: appointment.id,
      appointmentType: appointment.appointmentType,
      planType: appointment.planType,
      taskCount: appointment.onfleetTasks?.length || 0
    });
    console.log('DEBUG: OnfleetTasks:', appointment.onfleetTasks.map((t: any) => ({
      id: t.id,
      taskId: t.taskId,
      unitNumber: t.unitNumber,
      driverId: t.driverId,
      lastNotifiedDriverId: t.lastNotifiedDriverId,
      driverNotificationStatus: t.driverNotificationStatus
    })));

    // Route to appropriate handler based on action
    console.log('DEBUG: Routing to handler for action:', action);
    switch (action) {
      case 'assign':
        return await handleInitialAssignment(appointment);
      
      case 'accept':
        if (!driverId || !onfleetTaskId) {
          console.log('DEBUG: Missing required params for accept - driverId:', driverId, 'onfleetTaskId:', onfleetTaskId);
          return NextResponse.json({ error: 'Driver ID and task ID required for acceptance' }, { status: 400 });
        }
        console.log('DEBUG: Calling handleDriverAcceptance with driverId:', driverId, 'onfleetTaskId:', onfleetTaskId, 'source:', source);
        return await handleDriverAcceptance(appointment, driverId, onfleetTaskId, source);
      
      case 'reconfirm':
        if (!driverId) {
          return NextResponse.json({ error: 'Driver ID required for reconfirmation' }, { status: 400 });
        }
        console.log('DEBUG: Calling handleDriverReconfirmation with driverId:', driverId);
        return await handleDriverReconfirmation(appointment, driverId);
      
      case 'decline':
        if (!driverId || !onfleetTaskId) {
          console.log('DEBUG: Missing required params for decline - driverId:', driverId, 'onfleetTaskId:', onfleetTaskId);
          return NextResponse.json({ error: 'Driver ID and task ID required for decline' }, { status: 400 });
        }
        console.log('DEBUG: Calling handleDriverDecline with driverId:', driverId, 'onfleetTaskId:', onfleetTaskId);
        return await handleDriverDecline(appointment, driverId, onfleetTaskId);
      
      case 'retry':
        return await handleRetryAssignment(appointment);
      
      case 'cancel':
        if (!driverId) {
          return NextResponse.json({ error: 'Driver ID required for cancellation' }, { status: 400 });
        }
        return await handleDriverCancellation(appointment, driverId);
      
      default:
        console.log('DEBUG: Invalid action received:', action);
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in driver assignment:', error);
    console.error('DEBUG: Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json(
      { error: error.message || 'Failed to process driver assignment' },
      { status: error.status || 500 }
    );
  }
}

/**
 * Handle initial assignment of tasks to appropriate drivers/teams
 */
export async function handleInitialAssignment(appointment: any) {
  const onfleetClient = await getOnfleetClient();
  const unitResults: DriverAssignmentResult[] = [];
  let notifiedDriverIdsForThisAppointment: number[] = [];

  if (appointment.planType === 'Full Service Plan') {
    // Handle Full Service Plan with moving partner for unit 1
    if (appointment.movingPartnerId) {
      console.log(`Full Service Plan: Processing moving partner assignment for appointment ${appointment.id}`);
      
      const movingPartnerResult = await handleMovingPartnerAssignment(appointment, onfleetClient);
      if (movingPartnerResult) {
        unitResults.push(movingPartnerResult);
        
        // Only notify moving partner for AUTO assignment mode (MANUAL mode already sends its own notification)
        // Skip notification if this was a manual assignment (notification already sent in handleMovingPartnerAssignment)
        const autoAssignmentSuccessful = movingPartnerResult.status === 'assigned_mp_driver_auto';
        const isManualAssignment = movingPartnerResult.status === 'pending_manual_assignment';
        const assignedDriverName = autoAssignmentSuccessful ? 
          await getDriverNameById(movingPartnerResult.driverId) : undefined;
        
        const isAdditionalUnitsOnly = appointment.onfleetTasks.some((task: any) => 
          task.unitNumber === 1 && task.driverId
        );
        
        // Don't send duplicate notification for manual assignment - already handled in handleMovingPartnerAssignment
        if (!isAdditionalUnitsOnly && !isManualAssignment) {
          await notifyMovingPartner(appointment, assignedDriverName);
        }
      }
    } else {
      console.log(`FSP: No moving partner ID for appointment ${appointment.id}`);
      unitResults.push({
        unitNumber: 1,
        status: 'no_moving_partner_for_fsp_unit1'
      });
    }

    // Handle additional units (unit > 1) for Boombox Delivery Network
    const additionalUnitsResults = await handleAdditionalUnits(appointment, onfleetClient, notifiedDriverIdsForThisAppointment);
    unitResults.push(...additionalUnitsResults.results);
    notifiedDriverIdsForThisAppointment = additionalUnitsResults.notifiedDriverIds;
    
  } else if (appointment.planType === 'Do It Yourself Plan') {
    // Handle DIY Plan - all units go to Boombox Delivery Network
    console.log(`DIY Plan: Processing all units for Boombox Delivery Network`);
    
    const diyResults = await handleDIYPlanAssignment(appointment, onfleetClient, notifiedDriverIdsForThisAppointment);
    unitResults.push(...diyResults.results);
    
  } else {
    return NextResponse.json({ 
      message: `Plan type ${appointment.planType} does not require initial driver assignment.`,
      appointmentId: appointment.id 
    });
  }

  // Revalidate relevant paths for admin dashboard
  revalidatePath('/admin');
  revalidatePath(`/admin/appointments/${appointment.id}`);

  return NextResponse.json({ 
    message: 'Initial assignment process completed',
    appointmentId: appointment.id,
    unitResults
  });
}

/**
 * Handle moving partner assignment for Full Service Plan unit 1
 * Checks driverAssignmentMode to determine if auto-assignment or manual notification is needed
 */
async function handleMovingPartnerAssignment(appointment: any, onfleetClient: any): Promise<DriverAssignmentResult | null> {
  const movingPartner = await prisma.movingPartner.findUnique({
    where: { id: appointment.movingPartnerId },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      email: true,
      onfleetTeamId: true,
      driverAssignmentMode: true,
      approvedDrivers: {
        where: { isActive: true },
        include: {
          driver: {
            include: {
              assignedTasks: {
                where: {
                  appointment: {
                    date: new Date(new Date(appointment.date).toDateString())
                  },
                },
                include: {
                  appointment: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!movingPartner || movingPartner.approvedDrivers.length === 0) {
    return {
      unitNumber: 1,
      status: 'notified_moving_partner_no_drivers_setup',
      movingPartnerId: appointment.movingPartnerId
    };
  }

  const unit1Tasks = appointment.onfleetTasks.filter((task: any) => task.unitNumber === 1 && task.taskId);

  if (unit1Tasks.length === 0) {
    return {
      unitNumber: 1,
      status: 'notified_moving_partner_no_task_found',
      movingPartnerId: appointment.movingPartnerId
    };
  }

  // Check if unit 1 tasks are already assigned to a driver - skip notifications if so
  // This prevents duplicate "new job" notifications when unit count is reduced
  const alreadyAssigned = unit1Tasks.every((task: any) => task.driverId !== null);
  if (alreadyAssigned) {
    console.log(`Unit 1 tasks already have driver assigned, skipping notification for appointment ${appointment.id}`);
    return {
      unitNumber: 1,
      status: 'already_assigned',
      movingPartnerId: appointment.movingPartnerId
    };
  }

  // Check if moving partner uses MANUAL assignment mode
  if (movingPartner.driverAssignmentMode === DriverAssignmentMode.MANUAL) {
    console.log(`Moving partner ${movingPartner.id} uses MANUAL driver assignment mode`);
    
    // Assign tasks to moving partner team only (not to a specific driver)
    try {
      for (const task of unit1Tasks) {
        if (movingPartner.onfleetTeamId) {
          await (onfleetClient as any).tasks.update(task.taskId, {
            container: { type: "TEAM", team: movingPartner.onfleetTeamId }
          });
        }
        
        await prisma.onfleetTask.update({
          where: { id: task.id },
          data: {
            driverNotificationStatus: 'pending_manual_assignment',
          },
        });
      }

      // Send SMS to moving partner to assign a driver through their Boombox account
      if (movingPartner.phoneNumber) {
        try {
          const normalizedPhone = normalizePhoneNumberToE164(movingPartner.phoneNumber);
          const appointmentDateFmt = formatDate(new Date(appointment.date), 'full-date');
          const originalAppointmentTime = new Date(appointment.time);
          const notificationAppointmentTime = new Date(originalAppointmentTime.getTime() - (60 * 60 * 1000));
          const appointmentTimeFmt = formatTime(notificationAppointmentTime, '12-hour-padded');
          const customerName = `${appointment.user?.firstName || ''} ${appointment.user?.lastName || ''}`.trim() || 'Customer';

          await MessageService.sendSms(normalizedPhone, movingPartnerNewJobManualAssignSms, {
            appointmentType: appointment.appointmentType,
            appointmentDate: appointmentDateFmt,
            appointmentTime: appointmentTimeFmt,
            customerName,
            address: appointment.address,
          });
          console.log(`Manual assignment SMS sent to moving partner ${movingPartner.id}`);
        } catch (smsError) {
          console.error('Error sending manual assignment SMS to moving partner:', smsError);
        }
      }

      // Create internal notification for moving partner
      try {
        await NotificationService.createNotification({
          recipientId: movingPartner.id,
          recipientType: 'MOVER',
          type: 'NEW_JOB_AVAILABLE',
          data: {
            appointmentId: appointment.id,
            jobType: appointment.appointmentType,
            date: appointment.date,
            time: appointment.time,
            address: appointment.address,
            customerName: `${appointment.user?.firstName || ''} ${appointment.user?.lastName || ''}`.trim(),
          },
          appointmentId: appointment.id,
          movingPartnerId: movingPartner.id,
        });
        console.log(`Internal notification sent to moving partner ${movingPartner.id}`);
      } catch (notifError) {
        console.error('Error creating moving partner notification:', notifError);
      }

      return {
        unitNumber: 1,
        status: 'pending_manual_assignment',
        movingPartnerId: appointment.movingPartnerId,
        message: 'Moving partner notified to manually assign a driver'
      };
    } catch (error: any) {
      console.error(`Error handling manual assignment mode:`, error);
      return {
        unitNumber: 1,
        status: 'error_manual_assignment_notification',
        message: error.message,
        movingPartnerId: appointment.movingPartnerId
      };
    }
  }

  // AUTO assignment mode - continue with existing auto-assignment logic
  // Find available moving partner drivers using utility
  // Pass appointment.id to excludeAppointmentId to prevent false conflicts during edits
  const availableDrivers = await findAvailableDrivers(
    appointment, 
    { unitNumber: 1 }, 
    [], 
    appointment.movingPartnerId,
    appointment.id
  );

  if (availableDrivers.length === 0) {
    return {
      unitNumber: 1,
      status: 'notified_moving_partner_no_driver_found',
      movingPartnerId: appointment.movingPartnerId
    };
  }

  const selectedDriver = availableDrivers[0];

  // Assign tasks to moving partner driver
  try {
    for (const task of unit1Tasks) {
      // Assign to moving partner team first
      if (movingPartner.onfleetTeamId) {
        await (onfleetClient as any).tasks.update(task.taskId, {
          container: { type: "TEAM", team: movingPartner.onfleetTeamId }
        });
      }
      
      // Then assign to specific driver
      await (onfleetClient as any).tasks.update(task.taskId, {
        container: { type: "WORKER", worker: selectedDriver.onfleetWorkerId }
      });
      
      await prisma.onfleetTask.update({
        where: { id: task.id },
        data: {
          driverId: selectedDriver.id,
          driverAcceptedAt: new Date(),
          driverNotificationStatus: 'assigned_mp_auto',
          workerType: 'moving_partner'
        },
      });
    }

    // Do NOT send job offer SMS to moving partner drivers.
    // The job offer SMS (notifyDriverAboutJob) is only for Boombox Delivery Network (DIY appointments).
    // For Full Service Plan, the moving partner handles coordination with their own drivers.
    // The moving partner will be notified via notifyMovingPartner (in handleInitialAssignment).

    return {
      unitNumber: 1,
      status: 'assigned_mp_driver_auto',
      driverId: selectedDriver.id,
      movingPartnerId: appointment.movingPartnerId
    };
    
  } catch (error: any) {
    console.error(`Error auto-assigning MP driver:`, error);
    return {
      unitNumber: 1,
      status: 'error_assigning_mp_driver_auto',
      message: error.message,
      movingPartnerId: appointment.movingPartnerId
    };
  }
}

/**
 * Handle additional units (unitNumber > 1) for Boombox Delivery Network
 */
async function handleAdditionalUnits(
  appointment: any, 
  onfleetClient: any, 
  notifiedDriverIds: number[]
): Promise<{ results: DriverAssignmentResult[], notifiedDriverIds: number[] }> {
  // Skip tasks that already have a driver OR are pending reconfirmation
  const additionalUnitsTasks = appointment.onfleetTasks.filter((task: any) => 
    !task.driverId && 
    task.taskId && 
    task.unitNumber > 1 &&
    task.driverNotificationStatus !== 'pending_reconfirmation'
  );

  if (additionalUnitsTasks.length === 0) {
    return { results: [], notifiedDriverIds };
  }

  const results: DriverAssignmentResult[] = [];
  const tasksByUnit: { [unitNumber: number]: any[] } = {};
  
  // Group tasks by unit
  for (const task of additionalUnitsTasks) {
    if (!tasksByUnit[task.unitNumber]) {
      tasksByUnit[task.unitNumber] = [];
    }
    tasksByUnit[task.unitNumber].push(task);
  }

  // Assign each unit to Boombox Delivery Network team and find drivers
  for (const [unitNumberStr, unitTasks] of Object.entries(tasksByUnit)) {
    const unitNumber = parseInt(unitNumberStr);
    
    // Assign tasks to Boombox team
    for (const task of unitTasks) {
      try {
        await (onfleetClient as any).tasks.update(task.taskId, {
          container: { type: "TEAM", team: process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID }
        });
      } catch (error) {
        console.error(`Error assigning task ${task.taskId} to Boombox team:`, error);
      }
    }
    
    // Find and notify driver for this unit
    const driverNotificationResult = await findAndNotifyNextDriverForUnit(
      appointment, 
      unitTasks, 
      unitNumber, 
      onfleetClient, 
      notifiedDriverIds
    );
    
    if (driverNotificationResult.status === 'notified_boombox_driver' && driverNotificationResult.driverId) {
      notifiedDriverIds.push(driverNotificationResult.driverId);
    }
    
    results.push(driverNotificationResult);
  }

  return { results, notifiedDriverIds };
}

/**
 * Handle DIY Plan assignment - all units to Boombox Delivery Network
 */
async function handleDIYPlanAssignment(
  appointment: any,
  onfleetClient: any,
  notifiedDriverIds: number[]
): Promise<{ results: DriverAssignmentResult[] }> {
  // Skip tasks that already have a driver OR are pending reconfirmation
  const tasks = appointment.onfleetTasks.filter((task: any) => 
    !task.driverId && 
    task.taskId &&
    task.driverNotificationStatus !== 'pending_reconfirmation'
  );

  if (tasks.length === 0) {
    return { results: [] };
  }

  const results: DriverAssignmentResult[] = [];
  const tasksByUnit: { [unitNumber: number]: any[] } = {};
  
  // Group tasks by unit
  for (const task of tasks) {
    if (!tasksByUnit[task.unitNumber]) {
      tasksByUnit[task.unitNumber] = [];
    }
    tasksByUnit[task.unitNumber].push(task);
  }

  // Assign all tasks to Boombox Delivery Network team
  for (const task of tasks) {
    try {
      await (onfleetClient as any).tasks.update(task.taskId, {
        container: { type: "TEAM", team: process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID }
      });
    } catch (error) {
      console.error(`Error assigning task ${task.taskId} to Boombox team for DIY:`, error);
    }
  }
  
  // Find and notify drivers for each unit
  for (const [unitNumberStr, unitTasks] of Object.entries(tasksByUnit)) {
    const unitNumber = parseInt(unitNumberStr);
    
    const driverNotificationResult = await findAndNotifyNextDriverForUnit(
      appointment, 
      unitTasks, 
      unitNumber, 
      onfleetClient, 
      notifiedDriverIds
    );
    
    if (driverNotificationResult.status === 'notified_boombox_driver' && driverNotificationResult.driverId) {
      notifiedDriverIds.push(driverNotificationResult.driverId);
    }
    
    results.push(driverNotificationResult);
  }

  return { results };
}

/**
 * Handle driver acceptance of a task
 * @param source - Optional source of the request. When 'inbound_sms', skips sending SMS confirmation
 *                 since DriverResponseHandler will send its own confirmation message.
 */
async function handleDriverAcceptance(appointment: any, driverId: number, onfleetTaskId: string, source?: string) {
  console.log('--- handleDriverAcceptance DEBUG ---');
  console.log('Input - appointmentId:', appointment.id, 'driverId:', driverId, 'onfleetTaskId:', onfleetTaskId, 'source:', source);
  
  const driver = await prisma.driver.findUnique({
    where: { id: driverId }
  });
  
  if (!driver) {
    console.log('DEBUG: Driver not found for ID:', driverId);
    return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
  }
  console.log('DEBUG: Driver found:', driver.firstName, driver.lastName, 'onfleetWorkerId:', driver.onfleetWorkerId);
  
  // Determine unit number from task or use fallback
  let unitNumber = 0;
  if (onfleetTaskId && onfleetTaskId !== "0") {
    const task = appointment.onfleetTasks.find((t: any) => t.taskId === onfleetTaskId);
    if (task) {
      unitNumber = task.unitNumber;
      console.log('DEBUG: Found task for onfleetTaskId, unitNumber:', unitNumber);
    } else {
      console.log('DEBUG: No task found matching onfleetTaskId:', onfleetTaskId);
      console.log('DEBUG: Available task IDs:', appointment.onfleetTasks.map((t: any) => t.taskId));
    }
  }
  
  // Find all unassigned tasks for this unit
  const tasksToAssign = appointment.onfleetTasks.filter((t: any) => 
    !t.driverId && t.unitNumber === unitNumber
  );
  console.log('DEBUG: Tasks to assign (unassigned for unit', unitNumber, '):', tasksToAssign.length);
  
  if (tasksToAssign.length === 0) {
    console.log('DEBUG: No tasks to assign - all already assigned or wrong unit number');
    console.log('DEBUG: All tasks for reference:', appointment.onfleetTasks.map((t: any) => ({
      id: t.id,
      taskId: t.taskId,
      unitNumber: t.unitNumber,
      driverId: t.driverId
    })));
    return NextResponse.json({ 
      message: 'All tasks for this unit are already assigned',
      appointmentId: appointment.id,
      unitNumber
    });
  }
  
  const onfleetClient = await getOnfleetClient();
  
  try {
    if (!driver.onfleetWorkerId) {
      console.log('DEBUG: Driver missing onfleetWorkerId');
      return NextResponse.json({ error: 'Driver does not have an Onfleet worker ID' }, { status: 400 });
    }
    
    const assignedTasks = [];
    console.log('DEBUG: Beginning Onfleet task assignment for', tasksToAssign.length, 'tasks');
    
    // Assign all tasks for this unit to the driver
    for (const task of tasksToAssign) {
      console.log('DEBUG: Assigning task', task.taskId, 'to worker', driver.onfleetWorkerId);
      await (onfleetClient as any).tasks.update(task.taskId, {
        container: { type: "WORKER", worker: driver.onfleetWorkerId }
      });
      console.log('DEBUG: Onfleet assignment successful for task', task.taskId);
      
      await prisma.onfleetTask.update({
        where: { id: task.id },
        data: {
          driverId: driverId,
          driverAcceptedAt: new Date(),
          driverNotificationStatus: 'accepted',
          workerType: 'boombox_driver'
        }
      });
      console.log('DEBUG: Database update successful for task ID', task.id);
      
      assignedTasks.push(task.id);
    }
    console.log('DEBUG: All tasks assigned successfully:', assignedTasks);
    
    // Create in-app notification for job assignment
    try {
      await NotificationService.notifyJobAssigned(
        driverId,
        {
          appointmentId: appointment.id,
          jobType: appointment.appointmentType,
          date: appointment.date,
          time: appointment.time,
          address: appointment.address || '',
          customerName: appointment.user ? `${appointment.user.firstName} ${appointment.user.lastName}` : undefined
        }
      );
    } catch (notificationError) {
      console.error('Error creating in-app job assigned notification:', notificationError);
      // Don't fail the assignment if notification fails
    }
    
    // Create DriverTimeSlotBooking to formally reserve the time slot and prevent overbooking
    try {
      await createDriverTimeSlotBooking(
        driverId,
        appointment.id,
        new Date(appointment.date),
        new Date(appointment.time),
        unitNumber
      );
    } catch (bookingError) {
      console.error('Error creating driver time slot booking:', bookingError);
      // Don't fail the assignment if booking creation fails - OnfleetTask.driverId is the primary record
    }
    
    // Send SMS confirmation to driver
    // Skip SMS when source is 'inbound_sms' - the DriverResponseHandler will send its own confirmation
    if (driver.phoneNumber && source !== 'inbound_sms') {
      try {
        await MessageService.sendSms(
          driver.phoneNumber,
          driverJobAcceptedSms,
          {
            appointmentType: appointment.appointmentType,
            formattedDate: formatDate(new Date(appointment.date), 'full-date'),
            formattedTime: formatTime(new Date(appointment.time)),
            address: getShortAddress(appointment.address),
          }
        );
      } catch (smsError) {
        console.error('Error sending driver acceptance SMS:', smsError);
        // Don't fail the assignment if SMS fails
      }
    } else if (source === 'inbound_sms') {
      console.log('DEBUG: Skipping SMS confirmation - source is inbound_sms, DriverResponseHandler will send confirmation');
    }
    
    return NextResponse.json({ 
      message: 'Driver successfully assigned to all tasks for this unit',
      appointmentId: appointment.id,
      unitNumber,
      tasksAssigned: assignedTasks,
      driverId: driverId
    });
  } catch (error) {
    console.error(`Error assigning driver to Onfleet tasks:`, error);
    return NextResponse.json({ 
      error: 'Failed to assign driver in Onfleet'
    }, { status: 500 });
  }
}

/**
 * Handle driver reconfirmation after appointment changes
 * 
 * Reconfirmation scenarios:
 * 1. Schedule change: Driver is already assigned (driverId = driverId), but appointment 
 *    date/time changed, so they need to reconfirm their availability.
 * 2. Unit shift: Driver is shifted from one unit to another. Tasks may have:
 *    - driverId: null (new tasks not yet assigned)
 *    - driverId: driverId (existing tasks being reconfirmed)
 * 
 * In both cases:
 * - lastNotifiedDriverId: driverId (the driver who was sent the reconfirmation SMS)
 * - driverNotificationStatus: 'pending_reconfirmation'
 */
async function handleDriverReconfirmation(appointment: any, driverId: number) {
  console.log('--- handleDriverReconfirmation DEBUG ---');
  console.log('Input - appointmentId:', appointment.id, 'driverId:', driverId);
  
  const driver = await prisma.driver.findUnique({
    where: { id: driverId }
  });
  
  if (!driver) {
    console.log('DEBUG: Driver not found for ID:', driverId);
    return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
  }
  console.log('DEBUG: Driver found:', driver.firstName, driver.lastName);
  
  // Find tasks where:
  // 1. lastNotifiedDriverId matches this driver (they were sent the reconfirmation request)
  // 2. driverNotificationStatus is 'pending_reconfirmation'
  // 3. driverId is null OR matches this driver (handles both new assignments and existing assignments)
  const tasksToReconfirm = appointment.onfleetTasks.filter((t: any) => {
    const matches = t.lastNotifiedDriverId === driverId && 
                    t.driverNotificationStatus === 'pending_reconfirmation' &&
                    (t.driverId === null || t.driverId === driverId);
    console.log(`DEBUG: Task ${t.id} - lastNotifiedDriverId: ${t.lastNotifiedDriverId}, status: ${t.driverNotificationStatus}, driverId: ${t.driverId}, matches: ${matches}`);
    return matches;
  });
  
  console.log('DEBUG: Tasks to reconfirm:', tasksToReconfirm.length);
  
  if (tasksToReconfirm.length === 0) {
    console.log('DEBUG: No tasks found pending reconfirmation for driver', driverId);
    return NextResponse.json({ 
      message: 'No tasks pending reconfirmation for this driver',
      appointmentId: appointment.id,
      driverId
    });
  }
  
  const onfleetClient = await getOnfleetClient();
  
  if (!driver.onfleetWorkerId) {
    return NextResponse.json({ error: 'Driver does not have an Onfleet worker ID' }, { status: 400 });
  }
  
  try {
    // Get the unit number from the first task (all tasks in reconfirmation are for the same unit)
    const unitNumber = tasksToReconfirm[0]?.unitNumber || 1;
    
    for (const task of tasksToReconfirm) {
      console.log(`DEBUG: Assigning task ${task.id} (Onfleet: ${task.taskId}) to driver ${driverId}`);
      
      // Assign task to driver in Onfleet
      await (onfleetClient as any).tasks.update(task.taskId, {
        container: { type: "WORKER", worker: driver.onfleetWorkerId }
      });
      
      // Update database with driver assignment and acceptance status
      await prisma.onfleetTask.update({
        where: { id: task.id },
        data: {
          driverId: driverId,  // CRITICAL: Set the driver ID!
          driverNotificationStatus: 'accepted',
          driverAcceptedAt: new Date()
        }
      });
      
      console.log(`DEBUG: Task ${task.id} successfully assigned to driver ${driverId}`);
    }
    
    // Create DriverTimeSlotBooking to formally reserve the time slot
    try {
      await createDriverTimeSlotBooking(
        driverId,
        appointment.id,
        new Date(appointment.date),
        new Date(appointment.time),
        unitNumber
      );
      console.log(`DEBUG: Created time slot booking for driver ${driverId}, unit ${unitNumber}`);
    } catch (bookingError) {
      console.error('Error creating driver time slot booking:', bookingError);
      // Don't fail the reconfirmation if booking creation fails
    }
    
    // Create in-app notification for job assignment
    try {
      await NotificationService.notifyJobAssigned(
        driverId,
        {
          appointmentId: appointment.id,
          jobType: appointment.appointmentType,
          date: appointment.date,
          time: appointment.time,
          address: appointment.address || '',
          customerName: appointment.user ? `${appointment.user.firstName} ${appointment.user.lastName}` : undefined
        }
      );
      console.log(`DEBUG: Created in-app notification for driver ${driverId}`);
    } catch (notificationError) {
      console.error('Error creating in-app job assigned notification:', notificationError);
    }
    
    const taskIds = tasksToReconfirm.map((task: { id: number }) => task.id);
    console.log(`DEBUG: Reconfirmation complete - ${taskIds.length} tasks assigned to driver ${driverId}`);
    
    return NextResponse.json({ 
      message: 'Driver successfully reconfirmed all tasks',
      appointmentId: appointment.id,
      tasksReconfirmed: taskIds,
      driverId: driverId
    });
  } catch (error) {
    console.error(`Error reconfirming tasks for driver ${driverId}:`, error);
    return NextResponse.json({ 
      error: 'Failed to reconfirm tasks'
    }, { status: 500 });
  }
}

/**
 * Handle driver decline and find next available driver
 */
async function handleDriverDecline(appointment: any, driverId: number, onfleetTaskId: string) {
  // Get the driver first to send them a confirmation SMS
  const driver = await prisma.driver.findUnique({
    where: { id: driverId }
  });
  
  // Determine unit number from task
  let unitNumber = 0;
  if (onfleetTaskId && onfleetTaskId !== "0") {
    const task = appointment.onfleetTasks.find((t: any) => t.taskId === onfleetTaskId);
    if (task) {
      unitNumber = task.unitNumber;
    }
  }
  
  const unassignedTasks = appointment.onfleetTasks.filter((t: any) => 
    !t.driverId && t.unitNumber === unitNumber
  );
  
  if (unassignedTasks.length === 0) {
    return NextResponse.json({ 
      message: 'No unassigned tasks found for this unit',
      appointmentId: appointment.id,
      unitNumber
    });
  }
  
  // Record the decline
  for (const task of unassignedTasks) {
    await prisma.onfleetTask.update({
      where: { id: task.id },
      data: {
        driverDeclinedAt: new Date(),
        declinedDriverIds: { push: driverId },
        driverNotificationStatus: 'declined'
      }
    });
  }
  
  // Send SMS confirmation to driver who declined
  if (driver?.phoneNumber) {
    try {
      await MessageService.sendSms(
        driver.phoneNumber,
        driverJobDeclinedSms,
        {}
      );
    } catch (smsError) {
      console.error('Error sending driver decline SMS:', smsError);
      // Don't fail the decline if SMS fails
    }
  }
  
  // Find next available driver
  // Pass appointment.id to excludeAppointmentId to prevent false conflicts during edits
  const movingPartnerId = appointment.planType === 'Full Service Plan' ? appointment.movingPartnerId : undefined;
  const availableDrivers = await findAvailableDrivers(appointment, unassignedTasks[0], [driverId], movingPartnerId, appointment.id);
  
  if (availableDrivers.length === 0) {
    await notifyAdminNoDrivers(appointment, unassignedTasks[0]);
    return NextResponse.json({ 
      message: 'No more available drivers for this unit, admin notified',
      appointmentId: appointment.id,
      unitNumber
    });
  }
  
  const nextDriver = availableDrivers[0];
  
  if (!nextDriver.phoneNumber) {
    return NextResponse.json({ 
      error: 'Selected driver has no phone number',
      appointmentId: appointment.id,
      unitNumber
    }, { status: 400 });
  }
  
  // Notify next driver
  const notificationSuccess = await notifyDriverAboutJob(nextDriver, appointment, unassignedTasks[0]);
  
  if (notificationSuccess) {
    // Update tasks with new notified driver
    for (const task of unassignedTasks) {
      await prisma.onfleetTask.update({
        where: { id: task.id },
        data: {
          driverNotificationSentAt: new Date(),
          driverNotificationStatus: 'sent',
          lastNotifiedDriverId: nextDriver.id
        }
      });
    }
    
    return NextResponse.json({ 
      message: 'Previous driver declined, next driver notified for this unit',
      appointmentId: appointment.id,
      unitNumber,
      nextDriverId: nextDriver.id
    });
  } else {
    return NextResponse.json({ 
      error: 'Failed to send notification to next driver',
      appointmentId: appointment.id,
      unitNumber
    }, { status: 500 });
  }
}

/**
 * Handle retry assignment for expired notifications
 */
async function handleRetryAssignment(appointment: any) {
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
    // Pass appointment.id to excludeAppointmentId to prevent false conflicts during edits
    const movingPartnerId = appointment.planType === 'Full Service Plan' ? appointment.movingPartnerId : undefined;
    const availableDrivers = await findAvailableDrivers(appointment, unassignedTasks[0], excludeDriverIds, movingPartnerId, appointment.id);
    
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
      unitResults.push({
        unitNumber: numericUnitNumber,
        status: 'error',
        message: 'Selected driver has no phone number'
      });
      continue;
    }
    
    // Send notification to next driver
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
  
  return NextResponse.json({ 
    message: 'Retry process completed for appointment units',
    appointmentId: appointment.id,
    unitResults
  });
}

/**
 * Handle driver cancellation of already accepted tasks
 */
async function handleDriverCancellation(appointment: any, driverId: number) {
  const driverTasks = appointment.onfleetTasks.filter((task: any) => task.driverId === driverId);
  
  if (driverTasks.length === 0) {
    return NextResponse.json({ 
      message: 'No tasks assigned to this driver',
      appointmentId: appointment.id,
      driverId: driverId
    });
  }
  
  const onfleetClient = await getOnfleetClient();
  
  // Record the cancellation
  await prisma.driverCancellation.create({
    data: {
      driverId: driverId,
      appointmentId: appointment.id,
      cancellationReason: 'Driver cancelled',
      cancellationDate: new Date()
    }
  });
  
  // Delete the DriverTimeSlotBooking to free up the time slot
  try {
    await deleteDriverTimeSlotBooking(appointment.id);
  } catch (bookingError) {
    console.error('Error deleting driver time slot booking:', bookingError);
    // Don't fail the cancellation if booking deletion fails
  }
  
  // Process each task
  for (const task of driverTasks) {
    try {
      // Unassign the driver in Onfleet
      await (onfleetClient as any).tasks.update(task.taskId, {
        container: { type: "ORGANIZATION" }
      });
      
      // Update task in database
      await prisma.onfleetTask.update({
        where: { id: task.id },
        data: {
          driverId: null,
          driverNotificationStatus: 'cancelled',
          declinedDriverIds: { push: driverId }
        }
      });
      
      // Find next available driver
      // Pass appointment.id to excludeAppointmentId to prevent false conflicts during edits
      const excludeDriverIds = [...(task.declinedDriverIds || []), driverId];
      const movingPartnerId = appointment.planType === 'Full Service Plan' ? appointment.movingPartnerId : undefined;
      const availableDrivers = await findAvailableDrivers(appointment, task, excludeDriverIds, movingPartnerId, appointment.id);
      
      if (availableDrivers.length === 0) {
        await notifyAdminNoDrivers(appointment, task);
        continue;
      }
      
      // Notify the next driver
      const nextDriver = availableDrivers[0];
      const notificationSuccess = await notifyDriverAboutJob(nextDriver, appointment, task);
      
      if (notificationSuccess) {
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
    } catch (error) {
      console.error(`Error handling cancellation for task ${task.taskId}:`, error);
    }
  }
  
  return NextResponse.json({ 
    message: 'Driver cancellation processed',
    appointmentId: appointment.id,
    driverId: driverId,
    tasksReassigned: driverTasks.length
  });
}

/**
 * Helper function to get driver name by ID
 */
async function getDriverNameById(driverId?: number): Promise<string | undefined> {
  if (!driverId) return undefined;
  
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: { firstName: true, lastName: true }
  });
  
  return driver ? `${driver.firstName} ${driver.lastName}` : undefined;
} 
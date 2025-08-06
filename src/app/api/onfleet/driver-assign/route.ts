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
  DRIVER_ACCEPTANCE_WINDOW,
  type DriverAssignmentResult
} from '@/lib/utils/driverAssignmentUtils';
import { calculateDriverPayment, calculateMovingPartnerPayment } from '@/lib/services/payment-calculator';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = DriverAssignmentRequestSchema.parse(body);
    
    const { appointmentId, onfleetTaskId, driverId, action } = validated;

    // Get appointment details with related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        onfleetTasks: true,
        user: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Route to appropriate handler based on action
    switch (action) {
      case 'assign':
        return await handleInitialAssignment(appointment);
      
      case 'accept':
        if (!driverId || !onfleetTaskId) {
          return NextResponse.json({ error: 'Driver ID and task ID required for acceptance' }, { status: 400 });
        }
        return await handleDriverAcceptance(appointment, driverId, onfleetTaskId);
      
      case 'reconfirm':
        if (!driverId) {
          return NextResponse.json({ error: 'Driver ID required for reconfirmation' }, { status: 400 });
        }
        return await handleDriverReconfirmation(appointment, driverId);
      
      case 'decline':
        if (!driverId || !onfleetTaskId) {
          return NextResponse.json({ error: 'Driver ID and task ID required for decline' }, { status: 400 });
        }
        return await handleDriverDecline(appointment, driverId, onfleetTaskId);
      
      case 'retry':
        return await handleRetryAssignment(appointment);
      
      case 'cancel':
        if (!driverId) {
          return NextResponse.json({ error: 'Driver ID required for cancellation' }, { status: 400 });
        }
        return await handleDriverCancellation(appointment, driverId);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in driver assignment:', error);
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
        
        // Notify moving partner if assignment was successful
        const autoAssignmentSuccessful = movingPartnerResult.status === 'assigned_mp_driver_auto';
        const assignedDriverName = autoAssignmentSuccessful ? 
          await getDriverNameById(movingPartnerResult.driverId) : undefined;
        
        const isAdditionalUnitsOnly = appointment.onfleetTasks.some((task: any) => 
          task.unitNumber === 1 && task.driverId
        );
        
        if (!isAdditionalUnitsOnly) {
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
 */
async function handleMovingPartnerAssignment(appointment: any, onfleetClient: any): Promise<DriverAssignmentResult | null> {
  const movingPartner = await prisma.movingPartner.findUnique({
    where: { id: appointment.movingPartnerId },
    include: {
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

  // Find available moving partner drivers using utility
  const availableDrivers = await findAvailableDrivers(
    appointment, 
    { unitNumber: 1 }, 
    [], 
    appointment.movingPartnerId
  );

  if (availableDrivers.length === 0) {
    return {
      unitNumber: 1,
      status: 'notified_moving_partner_no_driver_found',
      movingPartnerId: appointment.movingPartnerId
    };
  }

  const selectedDriver = availableDrivers[0];
  const unit1Tasks = appointment.onfleetTasks.filter((task: any) => task.unitNumber === 1 && task.taskId);

  if (unit1Tasks.length === 0) {
    return {
      unitNumber: 1,
      status: 'notified_moving_partner_no_task_found',
      movingPartnerId: appointment.movingPartnerId
    };
  }

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
        },
      });
    }

    // Send notification to moving partner driver using utility
    if (selectedDriver.phoneNumber) {
      await notifyDriverAboutJob(selectedDriver, appointment, unit1Tasks[0]);
    }

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
  const additionalUnitsTasks = appointment.onfleetTasks.filter((task: any) => 
    !task.driverId && task.taskId && task.unitNumber > 1
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
  const tasks = appointment.onfleetTasks.filter((task: any) => 
    !task.driverId && task.taskId 
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
 */
async function handleDriverAcceptance(appointment: any, driverId: number, onfleetTaskId: string) {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId }
  });
  
  if (!driver) {
    return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
  }
  
  // Determine unit number from task or use fallback
  let unitNumber = 0;
  if (onfleetTaskId && onfleetTaskId !== "0") {
    const task = appointment.onfleetTasks.find((t: any) => t.taskId === onfleetTaskId);
    if (task) {
      unitNumber = task.unitNumber;
    }
  }
  
  // Find all unassigned tasks for this unit
  const tasksToAssign = appointment.onfleetTasks.filter((t: any) => 
    !t.driverId && t.unitNumber === unitNumber
  );
  
  if (tasksToAssign.length === 0) {
    return NextResponse.json({ 
      message: 'All tasks for this unit are already assigned',
      appointmentId: appointment.id,
      unitNumber
    });
  }
  
  const onfleetClient = await getOnfleetClient();
  
  try {
    if (!driver.onfleetWorkerId) {
      return NextResponse.json({ error: 'Driver does not have an Onfleet worker ID' }, { status: 400 });
    }
    
    const assignedTasks = [];
    
    // Assign all tasks for this unit to the driver
    for (const task of tasksToAssign) {
      await (onfleetClient as any).tasks.update(task.taskId, {
        container: { type: "WORKER", worker: driver.onfleetWorkerId }
      });
      
      await prisma.onfleetTask.update({
        where: { id: task.id },
        data: {
          driverId: driverId,
          driverAcceptedAt: new Date(),
          driverNotificationStatus: 'accepted'
        }
      });
      
      assignedTasks.push(task.id);
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
 */
async function handleDriverReconfirmation(appointment: any, driverId: number) {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId }
  });
  
  if (!driver) {
    return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
  }
  
  const tasksToReconfirm = appointment.onfleetTasks.filter((t: any) => {
    return t.driverId === driverId && t.driverNotificationStatus === 'pending_reconfirmation';
  });
  
  if (tasksToReconfirm.length === 0) {
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
    for (const task of tasksToReconfirm) {
      await (onfleetClient as any).tasks.update(task.taskId, {
        container: { type: "WORKER", worker: driver.onfleetWorkerId }
      });
      
      await prisma.onfleetTask.update({
        where: { id: task.id },
        data: {
          driverNotificationStatus: 'accepted',
          driverAcceptedAt: new Date()
        }
      });
    }
    
    const taskIds = tasksToReconfirm.map((task: { id: number }) => task.id);
    
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
  
  // Find next available driver
  const movingPartnerId = appointment.planType === 'Full Service Plan' ? appointment.movingPartnerId : undefined;
  const availableDrivers = await findAvailableDrivers(appointment, unassignedTasks[0], [driverId], movingPartnerId);
  
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
      const excludeDriverIds = [...(task.declinedDriverIds || []), driverId];
      const movingPartnerId = appointment.planType === 'Full Service Plan' ? appointment.movingPartnerId : undefined;
      const availableDrivers = await findAvailableDrivers(appointment, task, excludeDriverIds, movingPartnerId);
      
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
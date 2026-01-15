/**
 * @fileoverview Task costing service for calculating actual costs from webhook data
 * @source boombox-10.0/src/app/lib/driver-payments/task-costing.ts
 * @refactor Migrated to boombox-11.0 service architecture
 */

import { prisma } from '@/lib/database/prismaClient';
import { PAYMENT_STRUCTURE } from '@/lib/services/payment-calculator';

/**
 * Update actual costs based on real drive time from webhooks
 * For Steps 1 & 3: uses actual drive time from webhook completion
 * For Step 2: uses actual service time
 * 
 * Drive Time Pay Rules:
 * - Step 1: NO drive time pay (driver travels from home to warehouse on their own)
 * - Step 2: YES drive time pay (Warehouse → Customer)
 * - Step 3: YES drive time pay (Customer → Warehouse)
 */
export async function updateTaskActualCostFromWebhook(
  taskShortId: string,
  webhookCompletionDetails: any
): Promise<void> {
  const task = await prisma.onfleetTask.findUnique({
    where: { shortId: taskShortId },
    include: {
      appointment: {
        include: {
          movingPartner: true
        }
      }
    }
  });

  if (!task || !task.appointment) {
    console.error(`Task ${taskShortId} not found`);
    return;
  }

  // Extract Onfleet's actual distance from completion details (for auditing only)
  // This is different from Google Maps estimated distance which we use for calculation
  let onfleetActualDistanceMiles: number | null = null;
  if (webhookCompletionDetails?.distance) {
    // Onfleet reports distance in meters
    onfleetActualDistanceMiles = webhookCompletionDetails.distance * 0.000621371;
    console.log(`Onfleet reported actual distance: ${onfleetActualDistanceMiles.toFixed(2)} miles (for auditing)`);
  }

  let actualCost: number = 0;
  let actualHours: number = 0;
  let actualDriveTimeMinutes: number = 0;
  
  // Breakdown fields to save
  let fixedFeePay: number = 0;
  let mileagePay: number = 0;
  let driveTimePay: number = 0;
  let serviceTimePay: number = 0;

  // Use Google Maps distance (estimated) for calculation, NOT Onfleet distance
  const distanceMiles = task.estimatedDistanceMiles || 10; // Fallback if not set

  if (task.stepNumber === 1) {
    // Step 1: ONLY fixed fee - NO mileage, NO drive time
    // Driver is NOT paid for traveling from home to warehouse
    if (task.workerType === 'moving_partner') {
      // Moving partners don't get paid for Step 1
      actualCost = 0;
    } else {
      // Boombox driver Step 1: only fixed fee
      fixedFeePay = PAYMENT_STRUCTURE.fixed;
      actualCost = fixedFeePay;
    }

    console.log(`Step 1 actual cost for ${taskShortId}: $${actualCost.toFixed(2)} (fixed fee only, NO drive time pay)`);

  } else if (task.stepNumber === 2) {
    // Step 2: Drive time (warehouse→customer) + Service time + Mileage
    
    if (task.workerType === 'moving_partner') {
      // Moving partner Step 2: only service time
      const serviceStartTimeMs = parseInt(task.appointment.serviceStartTime || "0");
      const completionTimeMs = webhookCompletionDetails?.time || 0;
      
      const serviceTimeMinutes = completionTimeMs && serviceStartTimeMs
        ? (completionTimeMs - serviceStartTimeMs) / (60 * 1000)
        : 0;

      if (serviceTimeMinutes <= 0) {
        console.log(`No valid service time for Step 2 task ${taskShortId}, using estimated`);
        // Use estimated service hours if actual not available
        actualHours = task.estimatedServiceHours || 1;
      } else {
        actualHours = serviceTimeMinutes / 60;
      }

      const hourlyRate = task.appointment.movingPartner?.hourlyRate || 25;
      const billedHours = Math.max(1, actualHours);
      serviceTimePay = billedHours * hourlyRate;
      actualCost = serviceTimePay;
    } else {
      // Boombox driver Step 2: drive time + service time + mileage
      const events = webhookCompletionDetails?.events || [];
      const startEvent = events.find((e: any) => e.name === 'start');
      const arrivalTimeMs = parseInt(task.appointment.serviceStartTime || "0");
      const completionTimeMs = webhookCompletionDetails?.time;

      // Calculate drive time
      if (startEvent && arrivalTimeMs && arrivalTimeMs > startEvent.time) {
        const driveMinutes = (arrivalTimeMs - startEvent.time) / (60 * 1000);
        actualDriveTimeMinutes = driveMinutes;
        driveTimePay = (driveMinutes / 60) * PAYMENT_STRUCTURE.driveTime;
      } else {
        // Fall back to estimated drive time
        actualDriveTimeMinutes = task.estimatedDriveTimeMinutes || 20;
        driveTimePay = (actualDriveTimeMinutes / 60) * PAYMENT_STRUCTURE.driveTime;
        console.log(`Using estimated drive time for Step 2: ${actualDriveTimeMinutes} min`);
      }

      // Calculate service time
      if (arrivalTimeMs && completionTimeMs && completionTimeMs > arrivalTimeMs) {
        const serviceMinutes = (completionTimeMs - arrivalTimeMs) / (60 * 1000);
        actualHours = serviceMinutes / 60;
        serviceTimePay = actualHours * PAYMENT_STRUCTURE.serviceTime;
      } else {
        // Fall back to estimated service time
        actualHours = task.estimatedServiceHours || 1.5;
        serviceTimePay = actualHours * PAYMENT_STRUCTURE.serviceTime;
        console.log(`Using estimated service time for Step 2: ${actualHours} hrs`);
      }

      // Calculate mileage (using Google Maps estimated distance)
      mileagePay = distanceMiles * PAYMENT_STRUCTURE.mileage;

      actualCost = driveTimePay + serviceTimePay + mileagePay;

      console.log(`Step 2 actual cost for ${taskShortId}: $${actualCost.toFixed(2)} (drive: $${driveTimePay.toFixed(2)}, service: $${serviceTimePay.toFixed(2)}, mileage: $${mileagePay.toFixed(2)} for ${distanceMiles.toFixed(1)}mi)`);
    }

  } else if (task.stepNumber === 3) {
    // Step 3: Drive time (customer→warehouse) + Mileage
    const events = webhookCompletionDetails?.events || [];
    const startEvent = events.find((e: any) => e.name === 'start');
    const completionTime = webhookCompletionDetails?.time;

    if (startEvent && completionTime && completionTime > startEvent.time) {
      actualDriveTimeMinutes = (completionTime - startEvent.time) / (60 * 1000);
      actualHours = actualDriveTimeMinutes / 60;
    } else {
      // Fall back to estimated drive time
      actualDriveTimeMinutes = task.estimatedDriveTimeMinutes || 20;
      actualHours = actualDriveTimeMinutes / 60;
      console.log(`Using estimated drive time for Step 3: ${actualDriveTimeMinutes} min`);
    }

    if (task.workerType === 'moving_partner') {
      // Moving partners don't get paid for Step 3
      actualCost = 0;
    } else {
      // Boombox driver Step 3: drive time + mileage
      mileagePay = distanceMiles * PAYMENT_STRUCTURE.mileage;
      driveTimePay = actualHours * PAYMENT_STRUCTURE.driveTime;
      
      actualCost = driveTimePay + mileagePay;
    }

    console.log(`Step 3 actual cost for ${taskShortId}: $${actualCost.toFixed(2)} (drive: $${driveTimePay.toFixed(2)}, mileage: $${mileagePay.toFixed(2)} for ${distanceMiles.toFixed(1)}mi)`);

  } else {
    console.log(`Unknown step number ${task.stepNumber} for task ${taskShortId}`);
    return;
  }

  // Round all values to 2 decimal places
  actualCost = Math.round(actualCost * 100) / 100;
  fixedFeePay = Math.round(fixedFeePay * 100) / 100;
  mileagePay = Math.round(mileagePay * 100) / 100;
  driveTimePay = Math.round(driveTimePay * 100) / 100;
  serviceTimePay = Math.round(serviceTimePay * 100) / 100;

  // Update task with actual cost and breakdown fields
  await prisma.onfleetTask.update({
    where: { shortId: taskShortId },
    data: {
      actualCost,
      actualServiceHours: Math.round(actualHours * 100) / 100,
      actualDriveTimeMinutes: Math.round(actualDriveTimeMinutes * 100) / 100,
      actualDistanceMiles: onfleetActualDistanceMiles ? Math.round(onfleetActualDistanceMiles * 100) / 100 : null,
      // Save breakdown fields
      fixedFeePay: fixedFeePay > 0 ? fixedFeePay : null,
      mileagePay: mileagePay > 0 ? mileagePay : null,
      driveTimePay: driveTimePay > 0 ? driveTimePay : null,
      serviceTimePay: serviceTimePay > 0 ? serviceTimePay : null,
      costCalculatedAt: new Date()
    }
  });

  console.log(`Updated Step ${task.stepNumber} task ${taskShortId}: actualCost=$${actualCost.toFixed(2)}, fixed=$${fixedFeePay}, mileage=$${mileagePay}, driveTime=$${driveTimePay}, serviceTime=$${serviceTimePay}`);

  // Only recalculate appointment total actual cost after Step 3 completion
  if (task.stepNumber === 3) {
    await recalculateAppointmentActualCost(task.appointmentId);
    console.log(`Recalculated total actual cost for appointment ${task.appointmentId} after Step 3 completion`);
  }
}

/**
 * Recalculate the total actual cost for an appointment
 */
export async function recalculateAppointmentActualCost(appointmentId: number): Promise<void> {
  const tasks = await prisma.onfleetTask.findMany({
    where: { 
      appointmentId,
      actualCost: { not: null }
    }
  });

  const totalActualCost = tasks.reduce((sum, task) => sum + (task.actualCost || 0), 0);

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      totalActualCost: totalActualCost > 0 ? totalActualCost : null,
      costLastUpdatedAt: new Date()
    }
  });
}

/**
 * Get cost summary for an appointment
 */
export async function getAppointmentCostSummary(appointmentId: number): Promise<{
  totalEstimatedCost: number;
  totalActualCost?: number;
  taskCosts: {
    taskId: string;
    unitNumber: number;
    estimatedCost: number;
    actualCost?: number;
    workerType: string;
  }[];
}> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      onfleetTasks: {
        select: {
          taskId: true,
          unitNumber: true,
          estimatedCost: true,
          actualCost: true,
          workerType: true
        }
      }
    }
  });

  if (!appointment) {
    throw new Error(`Appointment ${appointmentId} not found`);
  }

  const taskCosts = appointment.onfleetTasks.map(task => ({
    taskId: task.taskId,
    unitNumber: task.unitNumber,
    estimatedCost: task.estimatedCost || 0,
    actualCost: task.actualCost || undefined,
    workerType: task.workerType || 'unknown'
  }));

  return {
    totalEstimatedCost: appointment.totalEstimatedCost || 0,
    totalActualCost: appointment.totalActualCost || undefined,
    taskCosts
  };
}

// Export as a service class for consistency with other services
export const TaskCostingService = {
  updateTaskActualCostFromWebhook,
  recalculateAppointmentActualCost,
  getAppointmentCostSummary
};

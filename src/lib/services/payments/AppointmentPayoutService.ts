/**
 * @fileoverview Appointment payout service for processing driver/mover payments
 * @source boombox-10.0/src/app/lib/driver-payments/payout-service.ts
 * @refactor Migrated to boombox-11.0 service architecture
 */

import { prisma } from '@/lib/database/prismaClient';
import { stripe } from '@/lib/integrations/stripeClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { driverPayoutNotificationTemplate } from '@/lib/messaging/templates/sms/payment';
import { formatCurrency } from '@/lib/utils/currencyUtils';

export interface PayoutResult {
  success: boolean;
  transferId?: string;
  error?: string;
  amount?: number;
}

export interface PayoutSummary {
  taskId: string;
  workerType: 'boombox_driver' | 'moving_partner';
  workerId: number;
  amount: number;
  status: string;
  transferId?: string;
  error?: string;
}

/**
 * Calculate platform fee (3% with $0.30 minimum)
 */
function calculatePlatformFee(amount: number): number {
  const percentageFee = amount * 0.03;
  const minimumFee = 0.30;
  return Math.max(percentageFee, minimumFee);
}

/**
 * Helper function to update payout status for multiple tasks
 */
async function updateAllTaskPayoutStatus(
  tasks: any[], 
  status: string, 
  failureReason?: string
): Promise<void> {
  for (const task of tasks) {
    await prisma.onfleetTask.update({
      where: { id: task.id },
      data: {
        payoutStatus: status,
        payoutFailureReason: failureReason || null,
        payoutRetryCount: status === 'failed' ? { increment: 1 } : undefined,
        payoutLastAttemptAt: new Date()
      }
    });
  }
}

/**
 * Process payout for all tasks in an appointment when job is complete (Step 3)
 * Aggregates all task costs and pays the worker once for the complete job
 */
export async function processAppointmentPayout(appointmentId: number): Promise<PayoutResult> {
  try {
    console.log(`Processing appointment payout for appointment ${appointmentId}`);
    
    // Get all tasks for this appointment with their costs
    const tasks = await prisma.onfleetTask.findMany({
      where: { appointmentId },
      include: {
        appointment: {
          include: {
            movingPartner: true
          }
        },
        driver: true
      }
    });

    if (tasks.length === 0) {
      return {
        success: false,
        error: 'No tasks found for appointment'
      };
    }

    // Check if any task already has a completed payout
    const completedPayout = tasks.find(task => task.payoutStatus === 'completed');
    if (completedPayout) {
      return {
        success: true,
        transferId: completedPayout.payoutTransferId!,
        amount: completedPayout.payoutAmount!,
        error: 'Payout already completed for this appointment'
      };
    }

    // Get the first task to determine worker type and details
    const firstTask = tasks[0];
    
    // Calculate total payout amount by summing all task costs
    // Also calculate breakdown totals for logging and metadata
    let totalPayoutAmount = 0;
    let totalFixedFee = 0;
    let totalMileage = 0;
    let totalDriveTime = 0;
    let totalServiceTime = 0;
    let costsCalculated = 0;
    
    for (const task of tasks) {
      // Use actualCost if available, otherwise use estimatedCost
      const taskCost = task.actualCost || task.estimatedCost || 0;
      totalPayoutAmount += taskCost;
      
      // Aggregate breakdown components (use actual breakdown if available, otherwise use estimated)
      totalFixedFee += task.fixedFeePay || 0;
      totalMileage += task.mileagePay || 0;
      totalDriveTime += task.driveTimePay || 0;
      totalServiceTime += task.serviceTimePay || 0;
      
      if (taskCost > 0) costsCalculated++;
      
      console.log(`Task ${task.shortId} (Step ${task.stepNumber}): $${taskCost.toFixed(2)} [fixed: $${task.fixedFeePay || 0}, mileage: $${task.mileagePay || 0}, drive: $${task.driveTimePay || 0}, service: $${task.serviceTimePay || 0}] (${task.actualCost ? 'actual' : 'estimated'})`);
    }

    if (costsCalculated === 0) {
      return {
        success: false,
        error: 'No costs calculated for any tasks in appointment'
      };
    }

    console.log(`=== Payout Summary for Appointment ${appointmentId} ===`);
    console.log(`  Fixed Fee:    $${totalFixedFee.toFixed(2)}`);
    console.log(`  Mileage:      $${totalMileage.toFixed(2)}`);
    console.log(`  Drive Time:   $${totalDriveTime.toFixed(2)}`);
    console.log(`  Service Time: $${totalServiceTime.toFixed(2)}`);
    console.log(`  TOTAL:        $${totalPayoutAmount.toFixed(2)}`);

    // Determine worker and Stripe Connect account
    let stripeConnectAccountId: string | null = null;
    let workerName: string = '';
    let workerPhone: string | null = null;

    if (firstTask.workerType === 'moving_partner' && firstTask.appointment.movingPartner) {
      stripeConnectAccountId = firstTask.appointment.movingPartner.stripeConnectAccountId;
      workerName = firstTask.appointment.movingPartner.name;
      workerPhone = firstTask.appointment.movingPartner.phoneNumber;
      
      // Verify moving partner account is ready for payouts
      if (!firstTask.appointment.movingPartner.stripeConnectPayoutsEnabled) {
        await updateAllTaskPayoutStatus(tasks, 'failed', 'Moving partner Stripe account not enabled for payouts');
        return {
          success: false,
          error: 'Moving partner Stripe account not enabled for payouts'
        };
      }
    } else if (firstTask.workerType === 'boombox_driver' && firstTask.driver) {
      stripeConnectAccountId = firstTask.driver.stripeConnectAccountId;
      workerName = `${firstTask.driver.firstName} ${firstTask.driver.lastName}`;
      workerPhone = firstTask.driver.phoneNumber;
      
      // Verify driver account is ready for payouts
      if (!firstTask.driver.stripeConnectPayoutsEnabled) {
        await updateAllTaskPayoutStatus(tasks, 'failed', 'Driver Stripe account not enabled for payouts');
        return {
          success: false,
          error: 'Driver Stripe account not enabled for payouts'
        };
      }
    } else {
      await updateAllTaskPayoutStatus(tasks, 'failed', 'No worker found or worker type not recognized');
      return {
        success: false,
        error: 'No worker found or worker type not recognized'
      };
    }

    if (!stripeConnectAccountId) {
      await updateAllTaskPayoutStatus(tasks, 'failed', 'Worker does not have a Stripe Connect account');
      return {
        success: false,
        error: 'Worker does not have a Stripe Connect account'
      };
    }

    // Update all tasks to processing status
    await updateAllTaskPayoutStatus(tasks, 'processing');

    // Calculate platform fee and net payout
    const platformFeeAmount = calculatePlatformFee(totalPayoutAmount);
    const netPayoutAmount = totalPayoutAmount - platformFeeAmount;

    console.log(`Platform fee: $${platformFeeAmount}, Net payout: $${netPayoutAmount}`);

    // Create Stripe Connect transfer for the entire job
    // Using idempotency key to prevent duplicate payouts on retries
    const transfer = await stripe.transfers.create({
      amount: Math.round(netPayoutAmount * 100), // Convert to cents
      currency: 'usd',
      destination: stripeConnectAccountId,
      description: `Payment for Appointment ${appointmentId} - ${firstTask.appointment.appointmentType}`,
      metadata: {
        appointmentId: appointmentId.toString(),
        workerType: firstTask.workerType || 'unknown',
        totalTasks: tasks.length.toString(),
        appointmentType: firstTask.appointment.appointmentType,
        // Payout breakdown for auditing
        grossAmount: totalPayoutAmount.toFixed(2),
        platformFee: platformFeeAmount.toFixed(2),
        fixedFee: totalFixedFee.toFixed(2),
        mileage: totalMileage.toFixed(2),
        driveTime: totalDriveTime.toFixed(2),
        serviceTime: totalServiceTime.toFixed(2)
      }
    }, {
      idempotencyKey: `appointment-payout-${appointmentId}`
    });

    // Update all tasks with successful payout details
    for (const task of tasks) {
      await prisma.onfleetTask.update({
        where: { id: task.id },
        data: {
          payoutAmount: netPayoutAmount, // Same amount for all tasks (represents the full job)
          payoutStatus: 'completed',
          payoutTransferId: transfer.id,
          payoutProcessedAt: new Date(),
          payoutFailureReason: null,
          payoutLastAttemptAt: new Date()
        }
      });
    }

    console.log(`Appointment payout completed: $${netPayoutAmount} to ${workerName} (${firstTask.workerType}) for ${tasks.length} tasks`);

    // Send SMS notification to worker
    if (workerPhone) {
      try {
        const jobCode = firstTask.appointment.jobCode || appointmentId;
        await MessageService.sendSms(
          workerPhone,
          driverPayoutNotificationTemplate,
          { 
            payoutAmount: formatCurrency(netPayoutAmount), 
            jobCode: jobCode.toString()
          }
        );
        console.log(`Payout SMS sent to ${workerName} (${workerPhone}): ${formatCurrency(netPayoutAmount)}`);
      } catch (smsError) {
        console.error('Error sending payout SMS:', smsError);
        // Don't fail the payout if SMS fails
      }
    }

    return {
      success: true,
      transferId: transfer.id,
      amount: netPayoutAmount
    };

  } catch (error: any) {
    console.error(`Appointment payout failed for appointment ${appointmentId}:`, error);
    
    // Update all tasks with failure
    const tasks = await prisma.onfleetTask.findMany({
      where: { appointmentId }
    });
    
    await updateAllTaskPayoutStatus(tasks, 'failed', error.message || 'Unknown error');

    return {
      success: false,
      error: error.message || 'Unknown error occurred during appointment payout'
    };
  }
}

/**
 * Get payout summary for an appointment with detailed breakdown
 */
export async function getAppointmentPayoutSummary(appointmentId: number) {
  const tasks = await prisma.onfleetTask.findMany({
    where: { appointmentId },
    select: {
      shortId: true,
      stepNumber: true,
      unitNumber: true,
      estimatedCost: true,
      actualCost: true,
      // Breakdown fields
      fixedFeePay: true,
      mileagePay: true,
      driveTimePay: true,
      serviceTimePay: true,
      estimatedDistanceMiles: true,
      estimatedDriveTimeMinutes: true,
      estimatedServiceHours: true,
      actualDistanceMiles: true,
      actualDriveTimeMinutes: true,
      actualServiceHours: true,
      // Payout fields
      payoutAmount: true,
      payoutStatus: true,
      payoutTransferId: true,
      payoutProcessedAt: true,
      payoutFailureReason: true,
      workerType: true
    }
  });

  // Calculate totals
  const totalCost = tasks.reduce((sum, task) => sum + (task.actualCost || task.estimatedCost || 0), 0);
  const totalPayouts = tasks.reduce((sum, task) => sum + (task.payoutAmount || 0), 0);
  const completedPayouts = tasks.filter(task => task.payoutStatus === 'completed').length;
  const failedPayouts = tasks.filter(task => task.payoutStatus === 'failed').length;

  // Calculate breakdown totals
  const breakdown = {
    fixedFee: tasks.reduce((sum, task) => sum + (task.fixedFeePay || 0), 0),
    mileage: tasks.reduce((sum, task) => sum + (task.mileagePay || 0), 0),
    driveTime: tasks.reduce((sum, task) => sum + (task.driveTimePay || 0), 0),
    serviceTime: tasks.reduce((sum, task) => sum + (task.serviceTimePay || 0), 0),
  };

  return {
    appointmentId,
    totalTasks: tasks.length,
    totalCost,
    totalPayouts,
    breakdown,
    completedPayouts,
    failedPayouts,
    pendingPayouts: tasks.length - completedPayouts - failedPayouts,
    tasks: tasks.map(task => ({
      taskId: task.shortId,
      stepNumber: task.stepNumber,
      unitNumber: task.unitNumber,
      estimatedCost: task.estimatedCost,
      actualCost: task.actualCost,
      // Breakdown
      fixedFeePay: task.fixedFeePay,
      mileagePay: task.mileagePay,
      driveTimePay: task.driveTimePay,
      serviceTimePay: task.serviceTimePay,
      // Metrics
      estimatedDistanceMiles: task.estimatedDistanceMiles,
      estimatedDriveTimeMinutes: task.estimatedDriveTimeMinutes,
      estimatedServiceHours: task.estimatedServiceHours,
      actualDistanceMiles: task.actualDistanceMiles,
      actualDriveTimeMinutes: task.actualDriveTimeMinutes,
      actualServiceHours: task.actualServiceHours,
      // Payout
      payoutAmount: task.payoutAmount,
      status: task.payoutStatus,
      transferId: task.payoutTransferId,
      processedAt: task.payoutProcessedAt,
      failureReason: task.payoutFailureReason,
      workerType: task.workerType
    }))
  };
}

/**
 * Retry failed payouts for appointments
 */
export async function retryFailedAppointmentPayouts(maxRetries: number = 10): Promise<PayoutSummary[]> {
  const failedTasks = await prisma.onfleetTask.findMany({
    where: {
      payoutStatus: 'failed',
      payoutRetryCount: { lt: 3 },
      actualCost: { not: null }
    },
    take: maxRetries,
    orderBy: { payoutLastAttemptAt: 'asc' },
    select: {
      appointmentId: true
    },
    distinct: ['appointmentId']
  });

  const results: PayoutSummary[] = [];
  const processedAppointments = new Set<number>();

  for (const task of failedTasks) {
    if (processedAppointments.has(task.appointmentId)) continue;
    processedAppointments.add(task.appointmentId);

    const result = await processAppointmentPayout(task.appointmentId);
    
    results.push({
      taskId: `appointment-${task.appointmentId}`,
      workerType: 'boombox_driver',
      workerId: 0,
      amount: result.amount || 0,
      status: result.success ? 'completed' : 'failed',
      transferId: result.transferId,
      error: result.error
    });
  }

  return results;
}

// Export as a service class for consistency with other services
export const AppointmentPayoutService = {
  processAppointmentPayout,
  getAppointmentPayoutSummary,
  retryFailedAppointmentPayouts
};

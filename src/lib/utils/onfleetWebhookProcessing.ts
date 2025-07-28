/**
 * @fileoverview Main webhook processing utilities and payout notifications
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts
 * @refactor Extracted main webhook processing logic and payout notifications
 */

import { prisma } from '@/lib/database/prismaClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { driverPayoutNotificationTemplate } from '@/lib/messaging/templates/sms/payment';
import { formatCurrency } from '@/lib/utils/currencyUtils';
import { OnfleetWebhookPayload } from '@/lib/validations/api.validations';
import { getMetadataValue } from './onfleetWebhookUtils';
import {
  handlePackingSupplyTaskStarted,
  handlePackingSupplyTaskArrival, 
  handlePackingSupplyTaskCompleted,
  handlePackingSupplyTaskFailed
} from './packingSupplyWebhookHandlers';

// @REFACTOR-P9-TEMP: Replace with actual implementations when API migrations complete
// Priority: High | Est: 2h | Dependencies: API_005_DRIVERS_DOMAIN
const processAppointmentPayout = async (appointmentId: number) => {
  console.log('PLACEHOLDER: processAppointmentPayout called for appointment', appointmentId);
  return { success: false, error: 'Placeholder implementation' };
};

// @REFACTOR-P9-TEMP: Replace with migrated task costing service when API_008 completes
// Priority: High | Est: 45min | Dependencies: API_008_ADMIN_SYSTEM_DOMAIN
const updateTaskActualCostFromWebhook = async (shortId: string, completionDetails: any) => {
  console.log('PLACEHOLDER: updateTaskActualCostFromWebhook called for', shortId);
};

/**
 * Sends SMS notification to worker about their earnings after payout completion
 */
export async function sendPayoutNotificationSMS(appointmentId: number, payoutAmount: number, appointment: any) {
  try {
    // Find completed task to get worker information
    const task = await prisma.onfleetTask.findFirst({
      where: { 
        appointmentId: appointmentId,
        payoutStatus: 'completed'
      },
      include: {
        driver: true,
        appointment: {
          include: {
            movingPartner: true
          }
        }
      }
    });

    if (!task) {
      console.error('No completed task found for payout SMS:', appointmentId);
      return;
    }

    let workerPhone: string | null = null;
    let workerName: string = '';

    if (task.workerType === 'moving_partner' && task.appointment.movingPartner) {
      workerPhone = task.appointment.movingPartner.phoneNumber;
      workerName = task.appointment.movingPartner.name;
    } else if (task.workerType === 'boombox_driver' && task.driver) {
      workerPhone = task.driver.phoneNumber;
      workerName = `${task.driver.firstName} ${task.driver.lastName}`;
    }

    if (!workerPhone) {
      console.log(`No phone number found for worker on appointment ${appointmentId}`);
      return;
    }

    const jobCode = appointment.jobCode || appointment.id;
    
    await MessageService.sendSms(
      workerPhone,
      driverPayoutNotificationTemplate,
      { 
        payoutAmount: formatCurrency(payoutAmount), 
        jobCode: jobCode.toString()
      }
    );

    console.log(`Payout SMS sent to ${workerName} (${workerPhone}): ${formatCurrency(payoutAmount)}`);
  } catch (error) {
    console.error('Error sending payout SMS:', error);
  }
}

/**
 * Main handler for packing supply webhook events
 * Routes webhook events to appropriate handlers based on trigger type
 */
export async function handlePackingSupplyWebhook(webhookData: OnfleetWebhookPayload) {
  try {
    const { taskId, time, triggerName, data } = webhookData;
    const taskDetails = data?.task;
    const metadata = taskDetails?.metadata;
    const worker = data?.worker;

    console.log(`Processing packing supply webhook - Trigger: ${triggerName}, Task: ${taskDetails?.shortId}`);

    // Extract order ID from metadata
    const orderId = getMetadataValue(metadata, 'order_id');

    if (!orderId) {
      console.error('No order ID found in packing supply task metadata:', metadata);
      return { error: 'No order ID found', status: 400 };
    }

    console.log(`Processing packing supply webhook: ${triggerName} for order ${orderId}`);

    // Get the packing supply order
    const order = await prisma.packingSupplyOrder.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        orderDetails: {
          include: {
            product: true,
          },
        },
        assignedDriver: true,
        user: true,
      },
    });

    if (!order) {
      console.error(`Packing supply order ${orderId} not found`);
      return { error: 'Order not found', status: 404 };
    }

    console.log(`Found order ${order.id}, current status: ${order.status}, route: ${order.routeId}`);

    // Handle different webhook triggers
    if (taskDetails) {
      // Provide default worker data if undefined
      const workerData = worker || { name: 'Driver' };
      
      switch (triggerName) {
        case 'taskStarted':
          console.log(`Handling taskStarted for order ${order.id}`);
          await handlePackingSupplyTaskStarted(order, taskDetails, workerData, time);
          break;
        case 'taskArrival':
          console.log(`Handling taskArrival for order ${order.id}`);
          await handlePackingSupplyTaskArrival(order, taskDetails, workerData, time);
          break;
        case 'taskCompleted':
          console.log(`Handling taskCompleted for order ${order.id}`);
          await handlePackingSupplyTaskCompleted(order, taskDetails, workerData, time);
          break;
        case 'taskFailed':
          console.log(`Handling taskFailed for order ${order.id}`);
          await handlePackingSupplyTaskFailed(order, taskDetails, workerData, time);
          break;
        default:
          console.log(`Unhandled packing supply webhook trigger: ${triggerName}`);
      }
    }

    console.log(`Successfully processed packing supply webhook: ${triggerName} for order ${orderId}`);
    return { success: true, message: 'Packing supply webhook processed' };

  } catch (error) {
    console.error('Error processing packing supply webhook:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return { error: 'Webhook processing failed', status: 500 };
  }
}

/**
 * Processes storage unit webhook events for appointments
 * Handles appointment status updates, payments, and notifications
 */
export async function processStorageUnitWebhook(
  taskDetails: any, 
  triggerName: string, 
  time: number, 
  step: string | null,
  worker: any
) {
  // Find the OnfleetTask to get the unitNumber and check webhookTime
  const onfleetTask = await prisma.onfleetTask.findUnique({
    where: {
      shortId: taskDetails.shortId
    }
  });

  // Only update webhookTime for taskStarted triggers
  if (triggerName === 'taskStarted' && [1, 2, 3, 4].includes(Number(step))) {
    await prisma.onfleetTask.update({
      where: { shortId: taskDetails.shortId },
      data: { webhookTime: time.toString() }
    });
  }

  // Save completion photo for ALL completed tasks (steps 1, 2, 3, 4) 
  if (triggerName === 'taskCompleted' && [1, 2, 3, 4].includes(Number(step))) {
    const { updateTaskCompletionPhoto } = await import('./onfleetWebhookUtils');
    await updateTaskCompletionPhoto(taskDetails);
  }

  // Calculate actual costs for ALL completed tasks (steps 1, 2, 3, 4)
  if (triggerName === 'taskCompleted' && [1, 2, 3, 4].includes(Number(step))) {
    try {
      await updateTaskActualCostFromWebhook(taskDetails.shortId, taskDetails.completionDetails);
      console.log('Updated actual cost for completed task:', taskDetails.shortId);
    } catch (error) {
      console.error('Error updating actual cost for task:', taskDetails.shortId, error);
      // Don't fail the entire webhook if cost calculation fails
    }
  }

  return { onfleetTask, processed: true };
}

/**
 * Processes appointment-level webhook events (Step 3 completion payouts)
 * Handles job completion payouts and worker notifications
 */
export async function processAppointmentCompletion(appointmentId: number, appointment: any) {
  try {
    // Update appointment status
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'Awaiting Admin Check In'
      }
    });
    
    console.log('Updated appointment status to Awaiting Admin Check In');

    // Process payout for the completed task (full job compensation)
    try {
      console.log(`Processing payout for completed job - Appointment: ${appointment.id}`);
      const payoutResult = await processAppointmentPayout(appointment.id);
      
      if (payoutResult.success) {
        console.log(`Payout completed for appointment ${appointment.id}: $${(payoutResult as any).amount} (Transfer ID: ${(payoutResult as any).transferId})`);
        
        // Send SMS notification to worker with earnings
        await sendPayoutNotificationSMS(appointment.id, (payoutResult as any).amount!, appointment);
      } else {
        console.error(`Payout failed for appointment ${appointment.id}:`, payoutResult.error);
      }
    } catch (payoutError) {
      console.error('Error processing payout for completed job:', appointment.id, payoutError);
      // Don't fail the entire webhook if payout fails
    }
  } catch (error) {
    console.error('Error processing appointment completion:', error);
    throw error;
  }
} 
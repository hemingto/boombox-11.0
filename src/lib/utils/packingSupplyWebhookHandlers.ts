/**
 * @fileoverview Packing supply webhook event handlers
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts
 * @refactor Extracted packing supply webhook handlers into dedicated utility module
 */

import { prisma } from '@/lib/database/prismaClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { formatCurrency } from '@/lib/utils/currencyUtils';
import {
  packingSupplyStartedTemplate,
  packingSupplyArrivalTemplate,
  packingSupplyCompletedTemplate,
  packingSupplyFailedTemplate
} from '@/lib/messaging/templates/sms/booking';
import {
  WebhookTaskDetails,
  WebhookWorkerData,
  extractDeliveryPhotoUrl,
  createFeedbackToken,
  ensurePackingSupplyTrackingToken,
  calculateIndividualTaskMetrics,
  convertWebhookTimestamp,
  getWorkerName,
  buildTrackingUrl,
  buildFeedbackUrl
} from './onfleetWebhookUtils';

// @REFACTOR-P9-TEMP: Replace with actual implementations when API migrations complete
// Priority: High | Est: 2h | Dependencies: API_005_DRIVERS_DOMAIN, API_006_MOVING_PARTNERS_DOMAIN, API_008_ADMIN_SYSTEM_DOMAIN
const processPackingSupplyPayout = async (orderId: number) => {
  console.log('PLACEHOLDER: processPackingSupplyPayout called for order', orderId);
  return { success: false, error: 'Placeholder implementation' };
};

const calculatePackingSupplyPayout = (routeMetrics: any) => {
  console.log('PLACEHOLDER: calculatePackingSupplyPayout called');
  return { totalPayout: 0 };
};

const checkRouteCompletion = async (routeId: string) => {
  console.log('PLACEHOLDER: checkRouteCompletion called for route', routeId);
  return { isComplete: false, pendingOrders: [] };
};

const calculateRouteMetrics = async (routeId: string) => {
  console.log('PLACEHOLDER: calculateRouteMetrics called for route', routeId);
  return null;
};

const completeRoute = async (routeId: string, metrics: any) => {
  console.log('PLACEHOLDER: completeRoute called for route', routeId);
};

const processRoutePayout = async (routeId: string) => {
  console.log('PLACEHOLDER: processRoutePayout called for route', routeId);
  return { success: false, error: 'Placeholder implementation' };
};

/**
 * Handles packing supply task started webhook event
 * Updates order status and sends tracking SMS to customer
 */
export async function handlePackingSupplyTaskStarted(order: any, taskDetails: WebhookTaskDetails, worker: WebhookWorkerData, time: number) {
  try {
    console.log(`Packing supply delivery started for order ${order.id} with task ${taskDetails.shortId}`);
    
    // Update order status
    await prisma.packingSupplyOrder.update({
      where: { id: order.id },
      data: { status: 'In Transit' },
    });

    // Ensure tracking token exists
    const trackingToken = await ensurePackingSupplyTrackingToken(order.id);
    const trackingUrl = buildTrackingUrl(trackingToken, 'packing-supply');

    // Update task short ID for tracking
    await prisma.packingSupplyOrder.update({
      where: { id: order.id },
      data: { onfleetTaskShortId: taskDetails.shortId }
    });

    // Send SMS notification using centralized template
    const driverName = getWorkerName(worker, order.assignedDriver);
    
    await MessageService.sendSms(
      order.contactPhone,
      packingSupplyStartedTemplate,
      { driverName, trackingUrl }
    );

    console.log(`Tracking SMS sent for packing supply order ${order.id} using task ${taskDetails.shortId}`);
  } catch (error) {
    console.error('Error handling packing supply task started:', error);
    throw error;
  }
}

/**
 * Handles packing supply task arrival webhook event
 * Updates order status and sends arrival SMS to customer
 */
export async function handlePackingSupplyTaskArrival(order: any, taskDetails: WebhookTaskDetails, worker: WebhookWorkerData, time: number) {
  try {
    console.log(`Driver arrived for packing supply order ${order.id}`);
    
    // Update order status
    await prisma.packingSupplyOrder.update({
      where: { id: order.id },
      data: { status: 'Driver Arrived' },
    });

    // Send arrival SMS using centralized template
    const driverName = getWorkerName(worker);
    
    await MessageService.sendSms(
      order.contactPhone,
      packingSupplyArrivalTemplate,
      { driverName }
    );

    console.log(`Arrival SMS sent for packing supply order ${order.id}`);
  } catch (error) {
    console.error('Error handling packing supply task arrival:', error);
    throw error;
  }
}

/**
 * Handles packing supply task completed webhook event
 * Updates order status, processes photos, handles payouts, and sends completion SMS
 */
export async function handlePackingSupplyTaskCompleted(order: any, taskDetails: WebhookTaskDetails, worker: WebhookWorkerData, time: number) {
  try {
    console.log(`Packing supply delivery completed for order ${order.id} with task ${taskDetails.shortId}`);
    
    // Convert timestamp and extract photo
    const completionTime = convertWebhookTimestamp(time);
    const individualTaskMetrics = calculateIndividualTaskMetrics(taskDetails);
    const deliveryPhotoUrl = extractDeliveryPhotoUrl(taskDetails);
    
    console.log(`Individual task metrics:`, individualTaskMetrics);
    console.log(`Delivery photo URL: ${deliveryPhotoUrl}`);
    
    // Update individual order status and completion time
    const updateResult = await prisma.packingSupplyOrder.update({
      where: { id: order.id },
      data: { 
        status: 'Delivered',
        actualDeliveryTime: completionTime,
        routeMetrics: individualTaskMetrics,
        deliveryPhotoUrl: deliveryPhotoUrl,
      },
    });
    
    console.log(`Order ${order.id} updated successfully:`, {
      status: updateResult.status,
      actualDeliveryTime: updateResult.actualDeliveryTime,
      routeMetrics: updateResult.routeMetrics,
      deliveryPhotoUrl: updateResult.deliveryPhotoUrl
    });

    // Handle route completion or individual payout
    if (order.routeId) {
      console.log(`Order ${order.id} is part of route ${order.routeId}, checking route completion...`);
      
      const routeCompletion = await checkRouteCompletion(order.routeId);
      console.log(`Route completion status:`, routeCompletion);
      
      if (routeCompletion.isComplete) {
        console.log(`Route ${order.routeId} is complete! Processing route-based payout...`);
        
        const routeMetrics = await calculateRouteMetrics(order.routeId);
        
        if (routeMetrics) {
          await completeRoute(order.routeId, routeMetrics);
          const payoutResult = await processRoutePayout(order.routeId);
          
          if (payoutResult.success) {
            console.log(`Route payout processed successfully for ${order.routeId}: $${(payoutResult as any).amount}`);
          } else {
            console.error(`Route payout processing failed for ${order.routeId}: ${payoutResult.error}`);
          }
        } else {
          console.error(`Could not calculate route metrics for ${order.routeId}`);
        }
      } else {
        console.log(`Route ${order.routeId} still has ${routeCompletion.pendingOrders.length} pending orders`);
      }
    } else {
      // Individual order payout
      console.log(`Order ${order.id} is not part of a route, processing individual payout...`);
      await processPackingSupplyPayoutFromWebhook(order, taskDetails);
    }

    // Generate feedback token and send completion SMS
    const feedbackToken = createFeedbackToken(taskDetails.shortId);
    const feedbackUrl = buildFeedbackUrl(feedbackToken, 'packing-supply');

    try {
      await MessageService.sendSms(
        order.contactPhone,
        packingSupplyCompletedTemplate,
        { feedbackUrl }
      );

      console.log(`Completion SMS sent successfully for packing supply order ${order.id}`);
    } catch (smsError) {
      console.error(`Failed to send completion SMS for order ${order.id}:`, smsError);
    }

    console.log(`Completion processing finished for packing supply order ${order.id}`);
  } catch (error) {
    console.error('Error handling packing supply task completed:', error);
    throw error;
  }
}

/**
 * Handles packing supply task failed webhook event
 * Updates order status and sends failure notification SMS
 */
export async function handlePackingSupplyTaskFailed(order: any, taskDetails: WebhookTaskDetails, worker: WebhookWorkerData, time: number) {
  try {
    console.log(`Packing supply delivery failed for order ${order.id}`);
    
    // Update order status
    await prisma.packingSupplyOrder.update({
      where: { id: order.id },
      data: { status: 'Failed' },
    });

    // Send failure notification SMS using centralized template
    await MessageService.sendSms(
      order.contactPhone,
      packingSupplyFailedTemplate,
      {}
    );

    console.log(`Failure SMS sent for packing supply order ${order.id}`);
  } catch (error) {
    console.error('Error handling packing supply task failed:', error);
    throw error;
  }
}

/**
 * Processes packing supply driver payout from webhook
 * Calculates payout and processes Stripe Connect transfer
 */
export async function processPackingSupplyPayoutFromWebhook(order: any, taskDetails: WebhookTaskDetails) {
  try {
    const routeMetrics = calculateIndividualTaskMetrics(taskDetails);
    const payoutCalculation = calculatePackingSupplyPayout(routeMetrics);

    // Update order with payout information
    await prisma.packingSupplyOrder.update({
      where: { id: order.id },
      data: {
        driverPayoutAmount: payoutCalculation.totalPayout,
        driverPayoutStatus: 'pending',
        routeMetrics: {
          ...routeMetrics,
          ...payoutCalculation,
        },
      },
    });

    console.log(`Payout calculated for order ${order.id}: ${formatCurrency(payoutCalculation.totalPayout)}`);
    
    // Process the actual Stripe Connect payout
    const payoutResult = await processPackingSupplyPayout(order.id);
    
    if (payoutResult.success) {
      console.log(`Payout processed successfully for order ${order.id}: $${(payoutResult as any).amount}`);
    } else {
      console.error(`Payout processing failed for order ${order.id}: ${payoutResult.error}`);
    }
  } catch (error) {
    console.error('Error processing packing supply payout from webhook:', error);
    throw error;
  }
} 
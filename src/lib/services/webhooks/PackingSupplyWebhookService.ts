/**
 * @fileoverview Packing supply webhook service for delivery operations
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (packing supply logic)
 * @refactor Extracted packing supply webhook processing into dedicated service
 */

import { MessageService } from '@/lib/messaging/MessageService';
import {
  packingSupplyStartedTemplate,
  packingSupplyArrivalTemplate,
  packingSupplyCompletedTemplate,
  packingSupplyFailedTemplate
} from '@/lib/messaging/templates/sms/booking';
import {
  getMetadataValue,
  getWorkerName,
  ensurePackingSupplyTrackingToken,
  buildTrackingUrl
} from '@/lib/utils/onfleetWebhookUtils';
import {
  findPackingSupplyOrderById,
  updatePackingSupplyOrderStatus
} from '@/lib/utils/webhookQueries';
import type { OnfleetWebhookPayload } from '@/lib/validations/api.validations';

// @REFACTOR-P9-TEMP: Replace with migrated packing supply payout when API_006 completes
// Priority: High | Est: 4h | Dependencies: API_006_MOVING_PARTNERS_DOMAIN
const processPackingSupplyPayout = async (orderId: number) => {
  console.log('PLACEHOLDER: processPackingSupplyPayout called for order', orderId);
  return { success: false, error: 'Placeholder implementation' };
};

export class PackingSupplyWebhookService {
  /**
   * Handle packing supply delivery webhook events
   */
  static async handle(webhookData: OnfleetWebhookPayload): Promise<{ 
    success: boolean; 
    message?: string; 
    status?: number; 
    error?: string;
    processed?: {
      triggerName: string;
      orderId: string;
      orderStatus: string;
    };
  }> {
    try {
      const { taskId, time, triggerName, data } = webhookData;
      const taskDetails = data?.task;
      const metadata = taskDetails?.metadata;

      console.log(`Processing packing supply webhook - Trigger: ${triggerName}, Task: ${taskDetails?.shortId}`);

      // Extract order ID from metadata
      const orderId = getMetadataValue(metadata, 'order_id');

      if (!orderId) {
        console.error('No order ID found in packing supply task metadata:', metadata);
        return { 
          success: false, 
          error: 'No order ID found',
          status: 400
        };
      }

      // Get the packing supply order with all includes
      const order = await findPackingSupplyOrderById(parseInt(orderId));

      if (!order) {
        console.error(`Packing supply order ${orderId} not found`);
        return { 
          success: false, 
          error: 'Order not found',
          status: 404
        };
      }

      console.log(`Found order ${order.id}, current status: ${order.status}`);

      // Handle different webhook triggers
      switch (triggerName) {
        case 'taskStarted':
          await this.handleTaskStarted(order, taskDetails, data?.worker);
          break;

        case 'taskArrival':
          await this.handleTaskArrival(order, taskDetails, data?.worker);
          break;

        case 'taskCompleted':
          await this.handleTaskCompleted(order, taskDetails, data?.worker);
          break;

        case 'taskFailed':
          await this.handleTaskFailed(order, taskDetails, data?.worker);
          break;

        default:
          console.log(`Unhandled packing supply webhook trigger: ${triggerName}`);
      }

      return { 
        success: true, 
        message: 'Packing supply webhook processed successfully',
        processed: {
          triggerName,
          orderId,
          orderStatus: order.status
        }
      };

    } catch (error) {
      console.error('Error processing packing supply webhook:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500
      };
    }
  }

  /**
   * Handle taskStarted event for packing supply delivery
   */
  private static async handleTaskStarted(order: any, taskDetails: any, worker: any): Promise<void> {
    // Update order status
    await updatePackingSupplyOrderStatus(order.id, 'In Transit');

    // Generate tracking token and URL
    const trackingToken = await ensurePackingSupplyTrackingToken(order.id);
    const trackingUrl = buildTrackingUrl(trackingToken, 'packing-supply');
    const driverName = getWorkerName(worker, order.assignedDriver);

    // Send SMS notification
    const smsResult = await MessageService.sendSms(
      order.contactPhone, 
      packingSupplyStartedTemplate, 
      {
        driverName,
        trackingUrl
      }
    );

    if (smsResult.success) {
      console.log(`Started SMS sent for packing supply order ${order.id}`);
    } else {
      console.error(`Failed to send SMS for order ${order.id}:`, smsResult.error);
    }
  }

  /**
   * Handle taskArrival event for packing supply delivery
   */
  private static async handleTaskArrival(order: any, taskDetails: any, worker: any): Promise<void> {
    const driverName = getWorkerName(worker, order.assignedDriver);

    // Send arrival notification
    const smsResult = await MessageService.sendSms(
      order.contactPhone,
      packingSupplyArrivalTemplate,
      { driverName }
    );

    if (smsResult.success) {
      console.log(`Arrival SMS sent for packing supply order ${order.id}`);
    } else {
      console.error(`Failed to send arrival SMS for order ${order.id}:`, smsResult.error);
    }
  }

  /**
   * Handle taskCompleted event for packing supply delivery
   * @REFACTOR-P9-TEMP: Full payout processing will be restored when API_006 completes
   */
  private static async handleTaskCompleted(order: any, taskDetails: any, worker: any): Promise<void> {
    // Update order status
    await updatePackingSupplyOrderStatus(order.id, 'Delivered');

    // Send completion notification
    const driverName = getWorkerName(worker, order.assignedDriver);
    const feedbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/feedback/packing-supply/${order.trackingToken}`;

    const smsResult = await MessageService.sendSms(
      order.contactPhone,
      packingSupplyCompletedTemplate,
      { 
        driverName, 
        feedbackUrl 
      }
    );

    if (smsResult.success) {
      console.log(`Completion SMS sent for packing supply order ${order.id}`);
    } else {
      console.error(`Failed to send completion SMS for order ${order.id}:`, smsResult.error);
    }

    // Process payout (placeholder implementation)
    try {
      console.log(`Processing payout for completed packing supply order ${order.id}`);
      const payoutResult = await processPackingSupplyPayout(order.id);
      
      if (payoutResult.success) {
        console.log(`Payout processed for packing supply order ${order.id}`);
      } else {
        console.error(`Payout failed for order ${order.id}:`, payoutResult.error);
      }
    } catch (payoutError) {
      console.error('Error processing packing supply payout:', order.id, payoutError);
      // Don't fail the entire webhook if payout fails
    }
  }

  /**
   * Handle taskFailed event for packing supply delivery
   */
  private static async handleTaskFailed(order: any, taskDetails: any, worker: any): Promise<void> {
    // Update order status
    await updatePackingSupplyOrderStatus(order.id, 'Failed');

    // Send failure notification
    const driverName = getWorkerName(worker, order.assignedDriver);
    const supportPhone = process.env.SUPPORT_PHONE_NUMBER || '(555) 123-4567';

    const smsResult = await MessageService.sendSms(
      order.contactPhone,
      packingSupplyFailedTemplate,
      { 
        driverName, 
        supportPhone 
      }
    );

    if (smsResult.success) {
      console.log(`Failure SMS sent for packing supply order ${order.id}`);
    } else {
      console.error(`Failed to send failure SMS for order ${order.id}:`, smsResult.error);
    }
  }
} 
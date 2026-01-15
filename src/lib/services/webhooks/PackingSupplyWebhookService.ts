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
import { systemFailureTemplate } from '@/lib/messaging/templates/email/admin';
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
import { PackingSupplyPayoutService } from '@/lib/services/payments/PackingSupplyPayoutService';
import type { OnfleetWebhookPayload } from '@/lib/validations/api.validations';

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
    console.log('=== [PackingSupplyWebhook] Starting processing ===');
    
    try {
      const { taskId, time, triggerName, data } = webhookData;
      const taskDetails = data?.task;
      const metadata = taskDetails?.metadata;

      console.log(`[PackingSupplyWebhook] triggerName: ${triggerName}`);
      console.log(`[PackingSupplyWebhook] taskId: ${taskId}`);
      console.log(`[PackingSupplyWebhook] Task shortId: ${taskDetails?.shortId}`);
      console.log(`[PackingSupplyWebhook] Metadata:`, JSON.stringify(metadata, null, 2));

      // Extract order ID from metadata
      const orderId = getMetadataValue(metadata, 'order_id');
      console.log(`[PackingSupplyWebhook] Extracted order_id: ${orderId}`);

      if (!orderId) {
        console.error('[PackingSupplyWebhook] ERROR: No order ID found in packing supply task metadata');
        return { 
          success: false, 
          error: 'No order ID found',
          status: 400
        };
      }

      // Get the packing supply order with all includes
      console.log(`[PackingSupplyWebhook] Looking up PackingSupplyOrder: ${orderId}`);
      const order = await findPackingSupplyOrderById(parseInt(orderId));

      if (!order) {
        console.error(`[PackingSupplyWebhook] ERROR: Packing supply order ${orderId} not found`);
        return { 
          success: false, 
          error: 'Order not found',
          status: 404
        };
      }

      console.log(`[PackingSupplyWebhook] Order found:`, {
        id: order.id,
        status: order.status,
        contactPhone: order.contactPhone,
        assignedDriverId: order.assignedDriver?.id
      });

      // Handle different webhook triggers
      console.log(`[PackingSupplyWebhook] Routing to handler for trigger: ${triggerName}`);
      
      switch (triggerName) {
        case 'taskStarted':
          console.log('[PackingSupplyWebhook] >>> Calling handleTaskStarted()');
          await this.handleTaskStarted(order, taskDetails, data?.worker);
          console.log('[PackingSupplyWebhook] handleTaskStarted() completed');
          break;

        case 'taskArrival':
          console.log('[PackingSupplyWebhook] >>> Calling handleTaskArrival()');
          await this.handleTaskArrival(order, taskDetails, data?.worker);
          console.log('[PackingSupplyWebhook] handleTaskArrival() completed');
          break;

        case 'taskCompleted':
          console.log('[PackingSupplyWebhook] >>> Calling handleTaskCompleted()');
          await this.handleTaskCompleted(order, taskDetails, data?.worker);
          console.log('[PackingSupplyWebhook] handleTaskCompleted() completed');
          break;

        case 'taskFailed':
          console.log('[PackingSupplyWebhook] >>> Calling handleTaskFailed()');
          await this.handleTaskFailed(order, taskDetails, data?.worker);
          console.log('[PackingSupplyWebhook] handleTaskFailed() completed');
          break;

        default:
          console.log(`[PackingSupplyWebhook] Unhandled trigger: ${triggerName}`);
      }

      console.log('=== [PackingSupplyWebhook] Processing complete - SUCCESS ===');
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
      console.error('[PackingSupplyWebhook] ERROR during processing:', error);
      console.error('[PackingSupplyWebhook] Error stack:', error instanceof Error ? error.stack : 'No stack');
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
   * Processes customer notification and driver payout
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

    // Process payout using PackingSupplyPayoutService
    try {
      console.log(`Processing payout for completed packing supply order ${order.id}`);
      const payoutResult = await PackingSupplyPayoutService.processPackingSupplyPayout(order.id);
      
      if (payoutResult.success) {
        console.log(`Payout processed for packing supply order ${order.id}: $${payoutResult.amount}`);
      } else {
        console.error(`Payout failed for order ${order.id}:`, payoutResult.error);
        // Send admin email notification on payout failure
        await this.sendPayoutFailureNotification(order, driverName, payoutResult.error || 'Unknown error');
      }
    } catch (payoutError) {
      console.error('Error processing packing supply payout:', order.id, payoutError);
      // Send admin email notification on payout exception
      const errorMessage = payoutError instanceof Error ? payoutError.message : 'Unknown error';
      await this.sendPayoutFailureNotification(order, driverName, errorMessage);
      // Don't fail the entire webhook if payout fails
    }
  }

  /**
   * Send admin email notification when payout fails
   */
  private static async sendPayoutFailureNotification(
    order: any,
    driverName: string,
    errorMessage: string
  ): Promise<void> {
    try {
      console.log(`Sending payout failure notification for order ${order.id}`);

      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [
        'admin@boomboxstorage.com',
      ];

      const payoutAmount = order.driverPayoutAmount 
        ? `$${parseFloat(order.driverPayoutAmount).toFixed(2)}` 
        : 'Unknown';

      const templateVariables = {
        systemName: 'Packing Supply Driver Payout',
        formattedDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        timestamp: new Date().toLocaleString(),
        errorMessage: `Payout failed for order #${order.id}. Driver: ${driverName}. Amount: ${payoutAmount}. Error: ${errorMessage}`,
        impactDescription: `The driver payout for packing supply order #${order.id} failed to process. The driver has not been paid for this delivery and manual intervention is required.`,
        nextStepsText: `1. Review the order in the admin dashboard
2. Check Stripe Connect account status for the driver
3. Manually process the payout via Stripe dashboard
4. Contact the driver if there are issues with their payment setup`,
        nextStepsSection: `<ol style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 6px;">Review the order in the admin dashboard</li>
          <li style="margin-bottom: 6px;">Check Stripe Connect account status for driver: ${driverName}</li>
          <li style="margin-bottom: 6px;">Manually process the payout (${payoutAmount}) via Stripe dashboard</li>
          <li style="margin-bottom: 6px;">Contact the driver if there are issues with their payment setup</li>
        </ol>`,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/packing-supply-orders/${order.id}`,
        executionTime: 'N/A',
      };

      for (const email of adminEmails) {
        const result = await MessageService.sendEmail(
          email.trim(),
          systemFailureTemplate,
          templateVariables
        );

        if (!result.success) {
          console.error(
            `Failed to send payout failure notification to ${email}:`,
            result.error
          );
        }
      }

      console.log(
        `Payout failure notification sent to ${adminEmails.length} admin recipients for order ${order.id}`
      );
    } catch (error) {
      console.error('Failed to send payout failure notification:', error);
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
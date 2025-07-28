/**
 * @fileoverview SIMPLIFIED Onfleet webhook endpoint - demonstrates migration pattern
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint: Onfleet webhook validation and manual testing
 * POST endpoint: Processes Onfleet webhook events (simplified version)
 *
 * USED BY (boombox-10.0 files):
 * - Onfleet API webhook configuration (external system)
 * - Manual testing and validation endpoints
 *
 * INTEGRATION NOTES:
 * - CRITICAL: Onfleet integration - complex business logic deferred to future migration phases
 * - This simplified version demonstrates the refactoring pattern with centralized utilities
 * - Full functionality will be restored when dependencies are migrated in API_005-API_008
 *
 * @refactor Extracted messaging templates, utility functions, and validation schemas
 */

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

// Centralized utilities and templates
import { MessageService } from '@/lib/messaging/MessageService';
import {
  packingSupplyStartedTemplate,
  packingSupplyArrivalTemplate,
  packingSupplyCompletedTemplate,
  packingSupplyFailedTemplate,
  storagePickupStartedTemplate,
  storageDeliveryStartedTemplate,
  storageServiceArrivalTemplate
} from '@/lib/messaging/templates/sms/booking';
import { driverPayoutNotificationTemplate } from '@/lib/messaging/templates/sms/payment';
import {
  WebhookTaskDetails,
  WebhookWorkerData,
  extractDeliveryPhotoUrl,
  createTrackingToken,
  createFeedbackToken,
  ensurePackingSupplyTrackingToken,
  calculateIndividualTaskMetrics,
  convertWebhookTimestamp,
  getWorkerName,
  getMetadataValue,
  updateTaskCompletionPhoto,
  buildTrackingUrl,
  buildFeedbackUrl
} from '@/lib/utils/onfleetWebhookUtils';
import { 
  OnfleetWebhookPayloadSchema,
  OnfleetWebhookGetRequestSchema,
  type OnfleetWebhookPayload,
  type OnfleetWebhookGetRequest
} from '@/lib/validations/api.validations';

// GET handler for Onfleet validation and manual testing
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params: OnfleetWebhookGetRequest = {
      check: url.searchParams.get('check') || undefined,
      testOrderId: url.searchParams.get('testOrderId') || undefined,
      testPhotoUrl: url.searchParams.get('testPhotoUrl') || undefined
    };

    // Validate parameters
    const validationResult = OnfleetWebhookGetRequestSchema.safeParse(params);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid request parameters',
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const { check, testOrderId, testPhotoUrl } = validationResult.data;
    
    if (check) {
      // Onfleet webhook validation - return with minimal headers and explicit encoding
      return new Response(check, {
        status: 200,
        headers: { 
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
    }

    // Manual testing endpoints (simplified)
    if (testOrderId && testPhotoUrl) {
      console.log(`Manual test: Adding photo URL to order ${testOrderId}`);
      
      const updatedOrder = await prisma.packingSupplyOrder.update({
        where: { id: parseInt(testOrderId) },
        data: { 
          deliveryPhotoUrl: testPhotoUrl 
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: `Photo URL added to order ${testOrderId}`,
        photoUrl: updatedOrder.deliveryPhotoUrl
      });
    }

    if (testOrderId) {
      console.log(`Manual test: Processing completion for order ${testOrderId}`);
      
      const order = await prisma.packingSupplyOrder.findUnique({
        where: { id: parseInt(testOrderId) },
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
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Simple test response - complex logic deferred to future phases
      return NextResponse.json({ 
        success: true, 
        message: `Manual completion test queued for order ${testOrderId}`,
        note: 'Full functionality available after API migration phases',
        orderStatus: 'Test completed'
      });
    }

    return new Response('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });

  } catch (error) {
    console.error('GET request error:', error);
    return NextResponse.json({ 
      error: 'Request processing failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST handler for webhook processing (simplified)
export async function POST(req: NextRequest) {
  try {
    const webhookData = await req.json();
    
    // Validate webhook payload
    const validationResult = OnfleetWebhookPayloadSchema.safeParse(webhookData);
    if (!validationResult.success) {
      console.error('Invalid webhook payload:', validationResult.error.issues);
      return NextResponse.json({ 
        error: 'Invalid webhook payload',
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const { taskId, time, triggerName, data } = validationResult.data;
    
    const taskDetails = data?.task;
    const metadata = taskDetails?.metadata;
    const step = getMetadataValue(metadata, 'step');
    const worker = taskDetails?.worker;

    // Enhanced logging for debugging
    console.log(`Webhook received: ${triggerName} for task ${taskDetails?.shortId}`);
    console.log(`Task metadata:`, metadata);
    console.log(`Step: ${step}`);

    // Check if this is a packing supply delivery task
    const jobType = getMetadataValue(metadata, 'job_type');
    const isPackingSupplyTask = jobType === 'packing_supply_delivery';

    console.log(`Job type: ${jobType}`);
    console.log(`Is packing supply task: ${isPackingSupplyTask}`);

    if (isPackingSupplyTask) {
      console.log(`Processing packing supply webhook: ${triggerName} for task ${taskDetails?.shortId}`);
      return handlePackingSupplyWebhook(validationResult.data);
    }

    // Storage unit logic (simplified)
    console.log(`Processing storage unit webhook: ${triggerName} for task ${taskDetails?.shortId}, step ${step}`);

    if (!taskDetails) {
      console.error('No task details in webhook data');
      return NextResponse.json({ error: 'No task details found' }, { status: 400 });
    }

    // Save completion photos using centralized utilities
    if (triggerName === 'taskCompleted' && [1, 2, 3, 4].includes(Number(step))) {
      await updateTaskCompletionPhoto(taskDetails);
      console.log(`Photo processing completed for task ${taskDetails.shortId}`);
    }

    // Simplified response - complex business logic deferred to future phases
    console.log(`Webhook processing completed for ${triggerName} step ${step}`);
    console.log('NOTE: Full business logic will be restored in API migration phases API_005-API_008');

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      note: 'Simplified version - full functionality available after API migration phases',
      processed: {
        triggerName,
        step,
        taskId: taskDetails?.shortId,
        isPackingSupply: isPackingSupplyTask
      }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Simplified packing supply webhook handler
async function handlePackingSupplyWebhook(webhookData: OnfleetWebhookPayload) {
  try {
    const { taskId, time, triggerName, data } = webhookData;
    const taskDetails = data?.task;
    const metadata = taskDetails?.metadata;

    console.log(`Processing packing supply webhook - Trigger: ${triggerName}, Task: ${taskDetails?.shortId}`);

    // Extract order ID from metadata using centralized utility
    const orderId = getMetadataValue(metadata, 'order_id');

    if (!orderId) {
      console.error('No order ID found in packing supply task metadata:', metadata);
      return NextResponse.json({ error: 'No order ID found' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log(`Found order ${order.id}, current status: ${order.status}`);

    // Handle different webhook triggers with centralized templates
    if (taskDetails && triggerName === 'taskStarted') {
      // Update order status
      await prisma.packingSupplyOrder.update({
        where: { id: order.id },
        data: { status: 'In Transit' },
      });

      // Generate tracking token and URL using centralized utilities
      const trackingToken = await ensurePackingSupplyTrackingToken(order.id);
      const trackingUrl = buildTrackingUrl(trackingToken, 'packing-supply');
      const driverName = getWorkerName(data?.worker, order.assignedDriver);

      // Send SMS using centralized MessageService
      try {
        const result = await MessageService.sendSms(order.contactPhone, packingSupplyStartedTemplate, {
          driverName,
          trackingUrl
        });
        if (result.success) {
          console.log(`Started SMS sent for packing supply order ${order.id}`);
        } else {
          console.error(`Failed to send SMS for order ${order.id}:`, result.error);
        }
      } catch (smsError) {
        console.error(`Failed to send SMS for order ${order.id}:`, smsError);
      }
    }

    // @REFACTOR-P9-TEMP: Implement full packing supply webhook handlers when payout services are migrated
    // Priority: High | Est: 4h | Dependencies: API_005_DRIVERS_DOMAIN, API_006_MOVING_PARTNERS_DOMAIN
    // Other triggers simplified - full implementation in future phases
    console.log(`Packing supply webhook ${triggerName} processed for order ${orderId}`);
    console.log('NOTE: Full payout and completion logic will be restored in future API migration phases');

    return NextResponse.json({ 
      success: true, 
      message: 'Packing supply webhook processed',
      note: 'Simplified version - full functionality available after API migration phases',
      processed: {
        triggerName,
        orderId,
        orderStatus: order.status
      }
    });

  } catch (error) {
    console.error('Error processing packing supply webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 
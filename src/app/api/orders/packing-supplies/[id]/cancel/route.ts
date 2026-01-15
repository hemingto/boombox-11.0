/**
 * @fileoverview Cancel packing supply orders with Onfleet task cleanup and inventory restoration
 * @source boombox-10.0/src/app/api/packing-supplies/orders/[orderId]/cancel/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that handles customer-initiated packing supply order cancellations.
 * Validates order ownership, cancellation eligibility (only "Pending Batch" status),
 * deletes associated Onfleet tasks, restores product inventory, and creates cancellation records.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/user-page/packingsupplydeliverycard.tsx (line 65: Cancel order button)
 *
 * INTEGRATION NOTES:
 * - Uses centralized cancelPackingSupplyOrderWithOnfleetCleanup utility function
 * - Preserves exact business logic for cancellation eligibility and refund processing
 * - Onfleet task deletion with error handling and fallback mechanisms
 * - Inventory restoration to maintain stock accuracy
 * - Comprehensive cancellation record creation for audit trail
 *
 * @refactor Moved from /api/packing-supplies/orders/[orderId]/cancel/ to /api/orders/packing-supplies/[id]/cancel/
 * @refactor Uses centralized Onfleet cancellation utility from onfleetClient
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { formatCurrency } from '@/lib/utils/currencyUtils';
import { cancelPackingSupplyOrderWithOnfleetCleanup } from '@/lib/integrations/onfleetClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { packingSupplyOrderCancellationSms } from '@/lib/messaging/templates/sms/booking/packingSupplyOrderCancellation';
import { NotificationService } from '@/lib/services/NotificationService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderIdNum = parseInt(id, 10);
    
    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request with Zod schema
    const validationResult = {
      orderId: id,
      cancellationReason: body.cancellationReason,
      userId: body.userId,
    };

    if (!validationResult.cancellationReason || !validationResult.userId) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: 'cancellationReason and userId are required' },
        { status: 400 }
      );
    }

    const { cancellationReason, userId } = validationResult;

    // Check if the order exists and belongs to the user
    const order = await prisma.packingSupplyOrder.findFirst({
      where: {
        id: orderIdNum,
        userId: parseInt(String(userId), 10),
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Check if order can be cancelled (only Pending Batch status)
    if (order.status !== 'Pending Batch') {
      return NextResponse.json(
        { error: 'Order cannot be cancelled in its current status' },
        { status: 400 }
      );
    }

    // Use the centralized utility function to cancel the order and clean up Onfleet task
    const cancellationResult = await cancelPackingSupplyOrderWithOnfleetCleanup(
      orderIdNum,
      cancellationReason,
      parseInt(String(userId), 10)
    );

    if (!cancellationResult.success) {
      return NextResponse.json(
        { error: cancellationResult.error || 'Failed to cancel order' },
        { status: 500 }
      );
    }

    // Send cancellation confirmation SMS
    try {
      await MessageService.sendSms(
        order.contactPhone,
        packingSupplyOrderCancellationSms,
        {
          orderId: orderIdNum.toString(),
          cancellationReason: cancellationReason,
          refundAmount: formatCurrency(order.totalPrice),
          refundStatus: 'pending',
        }
      );
      console.log(`✅ Cancellation confirmation SMS sent for order ${orderIdNum}`);
      
      // Create in-app notification for order cancellation
      if (order.userId) {
        try {
          await NotificationService.createNotification({
            recipientId: order.userId,
            recipientType: 'USER',
            type: 'ORDER_CANCELLED',
            data: {
              orderId: orderIdNum
            },
            orderId: orderIdNum
          });
        } catch (notificationError) {
          console.error('Error creating in-app order cancelled notification:', notificationError);
          // Don't fail if notification fails
        }
      }
    } catch (smsError) {
      console.error(`⚠️ Failed to send cancellation SMS for order ${orderIdNum}:`, smsError);
      // Continue with cancellation even if SMS fails
    }

    // Prepare response with Onfleet deletion status
    const response: any = {
      message: 'Order cancelled successfully',
    };

    // Include Onfleet deletion status in response for debugging
    if (order.onfleetTaskId) {
      response.onfleetTaskDeletion = {
        attempted: true,
        success: cancellationResult.onfleetDeletionResult?.success || false,
        taskId: order.onfleetTaskId,
        error: cancellationResult.onfleetDeletionResult?.error || null,
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
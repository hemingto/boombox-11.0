/**
 * @fileoverview Create packing supply delivery orders with Stripe payment processing and Onfleet integration
 * @source boombox-10.0/src/app/api/packing-supplies/create-order/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that creates packing supply delivery orders with comprehensive workflow:
 * - Validates order data and calculates delivery time windows (12 PM PST cutoff for same-day)
 * - Processes Stripe payments with error handling for card declines and authentication
 * - Creates database records with inventory management and stock validation
 * - Creates Onfleet tasks assigned to packing supply delivery team
 * - Generates secure tracking tokens and URLs for customer order tracking
 * - Sends order confirmation via SMS and email using centralized messaging system
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/packing-supplies/placeorder.tsx (line 156: Order submission form)
 * - src/app/components/packing-supplies/packingsupplieslayout.tsx (order creation workflow)
 *
 * INTEGRATION NOTES:
 * - Critical Stripe payment integration - preserves exact payment logic and error handling
 * - Onfleet task creation with team assignment and metadata for batch optimization
 * - Inventory management with stock validation and rollback on failures
 * - Complex delivery time window calculation based on PST timezone and cutoff times
 * - Route optimization metadata for daily batch processing at 12 PM PST
 *
 * @refactor Moved from /api/packing-supplies/create-order/ to /api/orders/packing-supplies/create/
 * @refactor Extracted messaging logic to centralized templates and MessageService
 * @refactor Extracted utility functions to packingSupplyUtils for reusability
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { formatCurrency } from '@/lib/utils/currencyUtils';
import { createPackingSupplyTask } from '@/lib/integrations/onfleetClient';
import { stripe } from '@/lib/integrations/stripeClient';
import { getStripeCustomerId } from '@/lib/utils/stripeUtils';
import { MessageService } from '@/lib/messaging/MessageService';
import { packingSupplyOrderConfirmationSms } from '@/lib/messaging/templates/sms/orders/packingSupplyOrderConfirmation';
import { packingSupplyOrderConfirmationEmail } from '@/lib/messaging/templates/email/orders/packingSupplyOrderConfirmation';
import { CreatePackingSupplyOrderRequestSchema } from '@/lib/validations/api.validations';
import {
  calculateDeliveryTimeWindow,
  calculateOrderCapacity,
  validateOrderRequest,
  generateTrackingToken,
  createTrackingUrl,
  formatOrderItemsForNotes,
  type CreateOrderRequest,
  type CreateOrderResponse,
} from '@/lib/utils/packingSupplyUtils';
import { NotificationService } from '@/lib/services/NotificationService';

export async function POST(request: NextRequest) {
  let createdOrderId: number | null = null;
  let createdTaskId: string | null = null;

  try {
    const body: CreateOrderRequest = await request.json();
    console.log('📦 Received order request body:', JSON.stringify(body, null, 2));

    // Validate request with Zod schema
    const validationResult =
      CreatePackingSupplyOrderRequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('❌ Zod validation failed:', JSON.stringify(validationResult.error.errors, null, 2));
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        } as CreateOrderResponse,
        { status: 400 }
      );
    }

    // Additional business logic validation
    const businessValidation = validateOrderRequest(body);
    if (!businessValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: businessValidation.errors,
        } as CreateOrderResponse,
        { status: 400 }
      );
    }

    // Calculate delivery time window using centralized utility
    const timeWindow = calculateDeliveryTimeWindow();

    // Calculate order capacity for route optimization
    const capacity = calculateOrderCapacity(body.cartItems);

    // Process Stripe payment if payment method ID is provided
    let paymentIntentId: string | null = null;
    let paymentStatus = 'pending';

    if (body.stripePaymentMethodId) {
      try {
        const paymentIntentData: any = {
          amount: Math.round(body.totalPrice * 100), // Convert to cents
          currency: 'usd',
          payment_method: body.stripePaymentMethodId,
          confirmation_method: 'manual',
          confirm: true,
          receipt_email: body.customerEmail,
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/packing-supplies/order-confirmation`,
          metadata: {
            order_type: 'packing_supply_delivery',
            customer_name: body.customerName,
            customer_email: body.customerEmail,
            delivery_address: body.deliveryAddress,
            item_count: capacity.itemCount.toString(),
            total_weight: capacity.totalWeight.toString(),
          },
        };

        // Associate with Stripe customer if user is logged in
        if (body.userId) {
          const stripeCustomerId = await getStripeCustomerId(
            body.userId.toString()
          );
          if (stripeCustomerId) {
            paymentIntentData.customer = stripeCustomerId;
          }
        }

        const paymentIntent =
          await stripe.paymentIntents.create(paymentIntentData);
        paymentIntentId = paymentIntent.id;
        paymentStatus = paymentIntent.status;

        // Handle payment authentication requirements
        if (paymentIntent.status === 'requires_action') {
          return NextResponse.json(
            {
              success: false,
              error: 'Payment requires additional authentication',
              details: {
                paymentIntentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                requiresAction: true,
              },
            } as CreateOrderResponse,
            { status: 402 }
          );
        }

        // Handle payment failures
        if (paymentIntent.status !== 'succeeded') {
          throw new Error(
            `Payment failed with status: ${paymentIntent.status}`
          );
        }

        console.log(`✅ Payment processed successfully: ${paymentIntentId}`);
      } catch (stripeError: any) {
        console.error('❌ Stripe payment error:', stripeError);

        // Handle specific Stripe error codes
        let errorMessage = 'Payment processing failed';
        if (stripeError.code === 'card_declined') {
          errorMessage =
            'Your card was declined. Please try a different payment method.';
        } else if (stripeError.code === 'insufficient_funds') {
          errorMessage =
            'Insufficient funds. Please try a different payment method.';
        } else if (stripeError.code === 'authentication_required') {
          errorMessage = 'Your card requires authentication. Please try again.';
        } else if (stripeError.message) {
          errorMessage = stripeError.message;
        }

        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            details: stripeError.code || 'stripe_error',
          } as CreateOrderResponse,
          { status: 402 }
        );
      }
    }

    // Create order in database
    const createdOrder = await prisma.packingSupplyOrder.create({
      data: {
        userId: body.userId,
        deliveryAddress: body.deliveryAddress,
        contactName: body.customerName,
        contactEmail: body.customerEmail,
        contactPhone: body.customerPhone,
        deliveryDate: new Date(timeWindow.deliveryDate),
        totalPrice: body.totalPrice,
        paymentMethod: body.paymentMethod,
        paymentStatus: paymentStatus,
        stripePaymentIntentId: paymentIntentId,
        deliveryWindowStart: timeWindow.start,
        deliveryWindowEnd: timeWindow.end,
        status: paymentStatus === 'succeeded' ? 'Pending Batch' : 'Pending',
      },
    });
    createdOrderId = createdOrder.id;

    console.log(`✅ Order ${createdOrderId} created in database`);

    // Get packing supply team ID from environment
    const teamId = process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS;
    if (!teamId) {
      throw new Error(
        'BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS environment variable not configured'
      );
    }

    // Create Onfleet task for batch optimization
    console.log('📋 Creating Onfleet task with data:', {
      teamId,
      address: body.deliveryAddress,
      orderId: createdOrder.id,
      timeWindow: {
        start: timeWindow.start.toISOString(),
        end: timeWindow.end.toISOString()
      }
    });

    const taskData = {
      destination: {
        address: {
          unparsed: body.deliveryAddress,
        },
      },
      recipients: [
        {
          name: body.customerName,
          phone: body.customerPhone,
          notes: body.deliveryNotes || '',
        },
      ],
      completeBefore: timeWindow.end.getTime(),
      completeAfter: timeWindow.start.getTime(),
      container: {
        type: 'TEAM',
        team: teamId,
      },
      notes: `Packing Supply Delivery - Order #${createdOrder.id}\n\n${formatOrderItemsForNotes(body.cartItems, body.totalPrice)}`,
      metadata: [
        { name: 'order_id', type: 'number', value: createdOrder.id },
        { name: 'job_type', type: 'string', value: 'packing_supply_delivery' },
        { name: 'total_price', type: 'number', value: body.totalPrice },
        { name: 'item_count', type: 'number', value: capacity.itemCount },
        { name: 'total_weight', type: 'number', value: capacity.totalWeight },
        { name: 'total_volume', type: 'number', value: capacity.totalVolume },
        {
          name: 'capacity_score',
          type: 'number',
          value: capacity.capacityScore,
        },
        { name: 'batch_ready', type: 'boolean', value: true },
      ],
    };

    const task = await createPackingSupplyTask(taskData);
    createdTaskId = task.id;

    console.log(
      `✅ Onfleet task ${task.shortId} created for order ${createdOrderId}`
    );

    // Generate tracking information
    const trackingToken = generateTrackingToken();
    const trackingUrl = createTrackingUrl(trackingToken);

    // Update order with Onfleet task and tracking information
    const updatedOrder = await prisma.packingSupplyOrder.update({
      where: { id: createdOrder.id },
      data: {
        onfleetTaskId: task.id,
        onfleetTaskShortId: task.shortId,
        trackingToken: trackingToken,
        trackingUrl: trackingUrl,
        status: 'Pending Batch',
      },
    });

    console.log(
      `✅ Order ${createdOrderId} updated with Onfleet task and tracking info`
    );

    // Create order details and manage inventory
    await prisma.$transaction(async tx => {
      for (const item of body.cartItems) {
        // Find or create product
        let product = await tx.product.findFirst({
          where: { title: item.name },
        });

        if (!product) {
          // Create product if it doesn't exist
          product = await tx.product.create({
            data: {
              title: item.name,
              price: item.price,
              description: item.name,
              detailedDescription: item.name,
              imageSrc: '/img/default-product.png',
              imageAlt: item.name,
              category: 'Packing Supplies',
              quantity: 1,
              stockCount: 1000,
              isOutOfStock: false,
            },
          });
        } else {
          // Validate stock availability
          const currentStock = product.stockCount ?? 0;
          if (currentStock < item.quantity) {
            throw new Error(
              `Sorry, we don't have enough ${item.name} in stock. We only have ${currentStock} available, but you requested ${item.quantity}. Please reduce the quantity and try again.`
            );
          }

          // Update stock count
          await tx.product.update({
            where: { id: product.id },
            data: {
              stockCount: {
                decrement: item.quantity,
              },
              isOutOfStock: currentStock - item.quantity <= 0,
            },
          });
        }

        // Create order detail record
        await tx.packingSupplyOrderDetails.create({
          data: {
            orderId: createdOrder.id,
            productId: product.id,
            quantity: item.quantity,
            price: item.price,
          },
        });
      }
    });

    console.log(`✅ Order details created for order ${createdOrderId}`);

    // Send order confirmation via centralized messaging system
    try {
      // Format deliveryTimeText to match boombox-10.0 pattern
      const [year, month, day] = timeWindow.deliveryDate.split('-').map(Number);
      const deliveryDate = new Date(year, month - 1, day);
      const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
      const deliveryTimeText = timeWindow.isSameDay 
        ? `Today between 12:00 PM - 7:00 PM`
        : `${formattedDeliveryDate} between 12:00 PM - 7:00 PM`;

      await MessageService.sendSms(
        body.customerPhone,
        packingSupplyOrderConfirmationSms,
        {
          customerName: body.customerName.split(' ')[0], // First name only
          orderId: createdOrder.id.toString(),
          totalPrice: formatCurrency(body.totalPrice),
          deliveryTimeText: deliveryTimeText,
          trackingUrl: `${process.env.NEXT_PUBLIC_BASE_URL}${updatedOrder.trackingUrl}`,
        }
      );
      console.log(`✅ Order confirmation SMS sent for order ${createdOrderId}`);
      
      // Create in-app notification if user is logged in
      if (body.userId) {
        try {
          await NotificationService.notifyOrderConfirmed(
            body.userId,
            {
              orderId: createdOrder.id,
              orderType: 'packing-supplies',
              deliveryDate: timeWindow.deliveryDate,
              deliveryAddress: body.deliveryAddress,
              totalAmount: body.totalPrice,
              itemCount: capacity.itemCount
            }
          );
        } catch (notificationError) {
          console.error('Error creating in-app order confirmed notification:', notificationError);
          // Don't fail if notification fails
        }
      }
    } catch (smsError) {
      console.error(
        `⚠️ Failed to send order confirmation SMS for order ${createdOrderId}:`,
        smsError
      );
      // Continue with order creation even if SMS fails
    }

    // Send order confirmation email
    try {
      // Format deliveryTimeText for display
      const [year, month, day] = timeWindow.deliveryDate.split('-').map(Number);
      const deliveryDate = new Date(year, month - 1, day);
      const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const deliveryTimeText = timeWindow.isSameDay 
        ? `Today between 12:00 PM - 7:00 PM`
        : `${formattedDeliveryDate} between 12:00 PM - 7:00 PM`;

      // Format cart items for email
      const cartItemsText = body.cartItems
        .map(item => `- ${item.quantity}x ${item.name} - ${formatCurrency(item.price * item.quantity)}`)
        .join('\n');

      const itemsHtml = body.cartItems.map(item => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
            <span style="font-weight: 500;">${item.quantity}x</span> ${item.name}
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
            ${formatCurrency(item.price * item.quantity)}
          </td>
        </tr>
      `).join('');

      // Generate Stripe receipt URL if payment intent ID is available
      const stripeReceiptUrl = paymentIntentId 
        ? `https://payments.stripe.com/receipts/${paymentIntentId}/payment_intent_receipt`
        : '';

      const stripeReceiptText = stripeReceiptUrl ? `View receipt: ${stripeReceiptUrl}` : '';
      const stripeReceiptButton = stripeReceiptUrl ? `
        <div>
          <a href="${stripeReceiptUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #ffffff; color: #4a5568; text-decoration: none; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-weight: 500;">
            📄 View Receipt
          </a>
        </div>
      ` : '';

      await MessageService.sendEmail(
        body.customerEmail,
        packingSupplyOrderConfirmationEmail,
        {
          orderId: createdOrder.id.toString(),
          customerName: body.customerName,
          deliveryAddress: body.deliveryAddress,
          totalPrice: formatCurrency(body.totalPrice),
          deliveryTimeText: deliveryTimeText,
          cartItemsText: cartItemsText,
          itemsHtml: itemsHtml,
          trackingUrl: `${process.env.NEXT_PUBLIC_BASE_URL}${updatedOrder.trackingUrl}`,
          stripeReceiptText: stripeReceiptText,
          stripeReceiptButton: stripeReceiptButton
        }
      );
      console.log(`✅ Order confirmation email sent for order ${createdOrderId}`);
    } catch (emailError) {
      console.error(
        `⚠️ Failed to send order confirmation email for order ${createdOrderId}:`,
        emailError
      );
      // Continue with order creation even if email fails
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        orderId: createdOrder.id,
        onfleetTaskId: task.id,
        onfleetTaskShortId: task.shortId,
        trackingUrl: updatedOrder.trackingUrl,
        deliveryWindow: {
          start: timeWindow.start.toISOString(),
          end: timeWindow.end.toISOString(),
          isSameDay: timeWindow.isSameDay,
          deliveryDate: timeWindow.deliveryDate,
        },
        estimatedServiceTime: 60,
        capacityInfo: capacity,
        paymentStatus: paymentStatus,
        paymentIntentId: paymentIntentId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating packing supply order:', error);

    // Rollback: Delete created order and restore inventory if Onfleet task creation failed
    if (createdOrderId && !createdTaskId) {
      try {
        // Restore inventory and delete order
        await prisma.$transaction(async tx => {
          // Get order details to restore inventory
          const orderDetails = await tx.packingSupplyOrderDetails.findMany({
            where: { orderId: createdOrderId! },
            include: { product: true },
          });

          // Restore inventory for each item
          for (const detail of orderDetails) {
            await tx.product.update({
              where: { id: detail.productId },
              data: {
                stockCount: {
                  increment: detail.quantity,
                },
                isOutOfStock: false,
              },
            });
          }

          // Delete order details and order
          await tx.packingSupplyOrderDetails.deleteMany({
            where: { orderId: createdOrderId! },
          });
          await tx.packingSupplyOrder.delete({
            where: { id: createdOrderId! },
          });
        });

        console.log(
          `🔄 Rolled back order ${createdOrderId} due to Onfleet task creation failure`
        );
      } catch (rollbackError) {
        console.error(
          `❌ Failed to rollback order ${createdOrderId}:`,
          rollbackError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create packing supply order',
      } as CreateOrderResponse,
      { status: 500 }
    );
  }
}

/**
 * GET handler for retrieving packing supply order status
 * Allows fetching order by orderId or taskId (Onfleet task ID)
 * 
 * @source boombox-10.0/src/app/api/packing-supplies/create-order/route.ts (lines 588-667)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const taskId = searchParams.get('taskId');

    if (!orderId && !taskId) {
      return NextResponse.json(
        { success: false, error: 'Either orderId or taskId is required' },
        { status: 400 }
      );
    }

    let order;
    if (orderId) {
      order = await prisma.packingSupplyOrder.findUnique({
        where: { id: parseInt(orderId) },
        include: {
          orderDetails: true,
          assignedDriver: {
            select: {
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },
        },
      });
    } else if (taskId) {
      order = await prisma.packingSupplyOrder.findFirst({
        where: { onfleetTaskId: taskId },
        include: {
          orderDetails: true,
          assignedDriver: {
            select: {
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },
        },
      });
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        deliveryAddress: order.deliveryAddress,
        contactName: order.contactName,
        contactEmail: order.contactEmail,
        contactPhone: order.contactPhone,
        deliveryDate: order.deliveryDate,
        totalPrice: order.totalPrice,
        onfleetTaskId: order.onfleetTaskId,
        onfleetTaskShortId: order.onfleetTaskShortId,
        deliveryWindowStart: order.deliveryWindowStart,
        deliveryWindowEnd: order.deliveryWindowEnd,
        actualDeliveryTime: order.actualDeliveryTime,
        assignedDriver: order.assignedDriver,
        orderDetails: order.orderDetails,
      },
    });

  } catch (error) {
    console.error('Error fetching order status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order status' },
      { status: 500 }
    );
  }
}

/**
 * @fileoverview Route payout processing service for packing supply routes
 * @source boombox-10.0/src/lib/payments/route-payout.ts
 * @refactor Updated import paths for boombox-11.0 structure
 */

import { prisma } from '@/lib/database/prismaClient';
import { stripe } from '@/lib/integrations/stripeClient';
import { RouteMetrics } from '@/lib/services/route-manager';
import { twilioClient } from '@/lib/messaging/twilioClient';

export interface RoutePayoutCalculation {
  baseRate: number;
  stopFee: number;
  mileagePay: number;
  timePay: number;
  totalPayout: number;
  breakdown: string;
  routeId: string;
  actualStops: number;
}

export interface RoutePayoutResult {
  success: boolean;
  transferId?: string;
  amount?: number;
  routeId: string;
  error?: string;
}

/**
 * Calculate payout amount for an entire packing supply route
 * Formula: Base Rate ($20) + (Stops × $2) + (Miles × $0.67) + (Hours × $14)
 */
export function calculateRouteBasedPayout(
  routeId: string,
  routeMetrics: RouteMetrics
): RoutePayoutCalculation {
  const baseRate = 20; // $20 per route (regardless of stops)
  const stopFee = 2; // $2 per delivery stop
  const mileageRate = 0.67; // IRS rate per mile
  const timeRate = 14; // $14 per hour

  // Calculate components
  const totalStopFee = stopFee * routeMetrics.actualStops;
  const mileagePay = routeMetrics.totalDistance * mileageRate;
  const timeInHours = routeMetrics.totalTime / 3600; // seconds to hours
  const timePay = timeInHours * timeRate;
  const totalPayout = baseRate + totalStopFee + mileagePay + timePay;

  const breakdown = [
    `Base Rate: $${baseRate.toFixed(2)}`,
    `Stops (${routeMetrics.actualStops}): $${totalStopFee.toFixed(2)}`,
    `Mileage (${routeMetrics.totalDistance.toFixed(1)} mi): $${mileagePay.toFixed(2)}`,
    `Time (${timeInHours.toFixed(1)} hr): $${timePay.toFixed(2)}`,
    `Total: $${totalPayout.toFixed(2)}`
  ].join(' | ');

  return {
    baseRate,
    stopFee: totalStopFee,
    mileagePay,
    timePay,
    totalPayout,
    breakdown,
    routeId,
    actualStops: routeMetrics.actualStops,
  };
}

/**
 * Process payout for an entire completed route
 */
export async function processRoutePayout(
  routeId: string,
  forceRetry: boolean = false
): Promise<RoutePayoutResult> {
  try {
    // Get route with driver and orders
    const route = await prisma.packingSupplyRoute.findUnique({
      where: { routeId },
      include: {
        driver: true,
        orders: {
          include: {
            orderDetails: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!route) {
      return {
        success: false,
        error: 'Route not found',
        routeId
      };
    }

    if (!route.driver) {
      return {
        success: false,
        error: 'No driver assigned to route',
        routeId
      };
    }

    if (route.routeStatus !== 'completed') {
      return {
        success: false,
        error: 'Route not yet completed',
        routeId
      };
    }

    // Check if payout already completed (unless forcing retry)
    if (!forceRetry && route.payoutStatus === 'completed') {
      return {
        success: true,
        transferId: route.payoutTransferId || undefined,
        amount: parseFloat(route.payoutAmount?.toString() || '0'),
        routeId,
        error: 'Payout already completed'
      };
    }

    // Check if driver has Stripe Connect account
    if (!route.driver.stripeConnectAccountId) {
      await updateRoutePayoutStatus(routeId, 'failed', 'Driver does not have a Stripe Connect account');
      return {
        success: false,
        error: 'Driver does not have a Stripe Connect account',
        routeId
      };
    }

    // Verify driver account is ready for payouts
    if (!route.driver.stripeConnectPayoutsEnabled) {
      await updateRoutePayoutStatus(routeId, 'failed', 'Driver Stripe account not enabled for payouts');
      return {
        success: false,
        error: 'Driver Stripe account not enabled for payouts',
        routeId
      };
    }

    // Calculate route payout
    const routeMetrics: RouteMetrics = {
      totalDistance: parseFloat(route.totalDistance?.toString() || '0'),
      totalTime: route.totalTime || 0,
      actualStops: route.completedStops,
      startTime: route.startTime || new Date(),
      endTime: route.endTime || new Date(),
    };

    const payoutCalculation = calculateRouteBasedPayout(routeId, routeMetrics);

    // Update status to processing
    await updateRoutePayoutStatus(routeId, 'processing');

    // Apply platform fee (if any)
    const platformFeeAmount = calculatePlatformFee(payoutCalculation.totalPayout);
    const netPayoutAmount = payoutCalculation.totalPayout - platformFeeAmount;

    // Create Stripe Connect transfer
    const transfer = await stripe.transfers.create({
      amount: Math.round(netPayoutAmount * 100), // Convert to cents
      currency: 'usd',
      destination: route.driver.stripeConnectAccountId,
      description: `Packing Supply Route Payment - ${routeId}`,
      metadata: {
        routeId: routeId,
        orderType: 'packing_supply_route',
        driverId: route.driver.id.toString(),
        deliveryDate: route.deliveryDate.toISOString(),
        totalStops: route.totalStops.toString(),
        completedStops: route.completedStops.toString(),
        payoutBreakdown: payoutCalculation.breakdown
      }
    });

    // Update route with successful payout
    await prisma.packingSupplyRoute.update({
      where: { routeId },
      data: {
        payoutAmount: netPayoutAmount,
        payoutStatus: 'completed',
        payoutTransferId: transfer.id,
        payoutProcessedAt: new Date(),
      }
    });

    // Update all orders in the route with distributed payout amounts
    await updateRouteOrderPayouts(routeId, netPayoutAmount, payoutCalculation);

    // Send SMS notification to driver
    await sendRoutePayoutNotificationSMS(routeId, netPayoutAmount, route.driver);

    console.log(`Route payout completed for ${routeId}: $${netPayoutAmount} to ${route.driver.firstName} ${route.driver.lastName}`);

    return {
      success: true,
      transferId: transfer.id,
      amount: netPayoutAmount,
      routeId
    };

  } catch (error: any) {
    console.error(`Route payout failed for ${routeId}:`, error);
    
    // Update failure status
    await updateRoutePayoutStatus(routeId, 'failed', error.message || 'Unknown error');

    return {
      success: false,
      error: error.message || 'Unknown error occurred during route payout',
      routeId
    };
  }
}

/**
 * Update route payout status
 */
async function updateRoutePayoutStatus(
  routeId: string, 
  status: string, 
  failureReason?: string
): Promise<void> {
  await prisma.packingSupplyRoute.update({
    where: { routeId },
    data: {
      payoutStatus: status,
      payoutFailureReason: failureReason || null,
    },
  });
}

/**
 * Update all orders in route with distributed payout information
 */
async function updateRouteOrderPayouts(
  routeId: string,
  totalPayoutAmount: number,
  payoutCalculation: RoutePayoutCalculation
): Promise<void> {
  const orders = await prisma.packingSupplyOrder.findMany({
    where: { routeId },
  });

  // Distribute payout amount evenly across orders for accounting purposes
  const payoutPerOrder = totalPayoutAmount / orders.length;

  for (const order of orders) {
    await prisma.packingSupplyOrder.update({
      where: { id: order.id },
      data: {
        driverPayoutAmount: payoutPerOrder,
        driverPayoutStatus: 'completed',
        routePayoutTotal: totalPayoutAmount,
        routeMetrics: {
          ...payoutCalculation,
          routeId,
          processedAt: new Date().toISOString(),
          distributedAmount: payoutPerOrder,
        },
      },
    });
  }

  console.log(`Updated ${orders.length} orders with distributed payout of $${payoutPerOrder.toFixed(2)} each`);
}

/**
 * Calculate platform fee (if any)
 */
function calculatePlatformFee(payoutAmount: number): number {
  // Currently no platform fee for packing supply deliveries
  // Could be implemented later if needed
  return 0;
}

/**
 * Send SMS notification to driver about route completion payout
 */
async function sendRoutePayoutNotificationSMS(
  routeId: string,
  payoutAmount: number,
  driver: any
): Promise<void> {
  try {
    if (!driver.phoneNumber) {
      console.log(`No phone number found for driver ${driver.id} on route ${routeId}`);
      return;
    }

    const message = `Boombox: Route completed! You earned $${payoutAmount.toFixed(2)} for completing route ${routeId}. Funds will appear in your account within 1-2 business days. Great work!`;

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: driver.phoneNumber
    });

    console.log(`Route payout SMS sent to ${driver.firstName} ${driver.lastName} (${driver.phoneNumber}): $${payoutAmount.toFixed(2)}`);
  } catch (error) {
    console.error('Error sending route payout SMS:', error);
    // Don't throw - this is just a notification
  }
}

/**
 * Process all pending route payouts (for cron job)
 */
export async function processPendingRoutePayouts(): Promise<{
  processed: number;
  failed: number;
  errors: string[];
}> {
  const pendingRoutes = await prisma.packingSupplyRoute.findMany({
    where: {
      routeStatus: 'completed',
      payoutStatus: 'pending',
    },
    include: {
      driver: true,
    },
  });

  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const route of pendingRoutes) {
    try {
      const result = await processRoutePayout(route.routeId);
      if (result.success) {
        processed++;
      } else {
        failed++;
        errors.push(`${route.routeId}: ${result.error}`);
      }
    } catch (error: any) {
      failed++;
      errors.push(`${route.routeId}: ${error.message}`);
    }
  }

  console.log(`Processed ${processed} route payouts, ${failed} failed`);
  return { processed, failed, errors };
} 
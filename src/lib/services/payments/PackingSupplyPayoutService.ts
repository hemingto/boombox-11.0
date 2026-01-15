/**
 * @fileoverview Packing supply payout service for processing delivery driver payments
 * @source boombox-10.0/src/lib/payments/packing-supply-payout.ts
 * @refactor Migrated to boombox-11.0 service architecture
 */

import { prisma } from '@/lib/database/prismaClient';
import { stripe } from '@/lib/integrations/stripeClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { driverPayoutNotificationTemplate } from '@/lib/messaging/templates/sms/payment';
import { formatCurrency } from '@/lib/utils/currencyUtils';

export interface PackingSupplyPayoutResult {
  success: boolean;
  transferId?: string;
  error?: string;
  amount?: number;
  orderId?: number;
}

export interface PackingSupplyPayoutSummary {
  orderId: number;
  driverId: number;
  driverName: string;
  amount: number;
  status: string;
  transferId?: string;
  error?: string;
  processedAt?: Date;
}

export interface PackingSupplyPayoutCalculation {
  baseRate: number;
  stopFee: number;
  mileagePay: number;
  timePay: number;
  totalPayout: number;
  breakdown: string;
}

/**
 * Calculate payout amount for packing supply delivery
 * Base rate: $20 per route + $2 per stop + mileage + time
 */
export function calculatePackingSupplyPayout(routeMetrics: any): PackingSupplyPayoutCalculation {
  const baseRate = 20; // $20 per route
  const stopFee = 2; // $2 per delivery stop
  const mileageRate = 0.67; // IRS rate per mile
  const timeRate = 14; // $14 per hour

  // Extract metrics from route data
  const drivingDistance = routeMetrics.drivingDistance || 0; // in meters
  const drivingTime = routeMetrics.drivingTime || 0; // in seconds
  const stopsCount = routeMetrics.stopsCount || 1;

  // Convert metrics
  const distanceInMiles = drivingDistance * 0.000621371; // meters to miles
  const timeInHours = drivingTime / 3600; // seconds to hours

  // Calculate components
  const mileagePay = distanceInMiles * mileageRate;
  const timePay = timeInHours * timeRate;
  const totalStopFee = stopFee * stopsCount;
  const totalPayout = baseRate + totalStopFee + mileagePay + timePay;

  const breakdown = [
    `Base Rate: $${baseRate.toFixed(2)}`,
    `Stops (${stopsCount}): $${totalStopFee.toFixed(2)}`,
    `Mileage (${distanceInMiles.toFixed(1)} mi): $${mileagePay.toFixed(2)}`,
    `Time (${timeInHours.toFixed(1)} hr): $${timePay.toFixed(2)}`,
    `Total: $${totalPayout.toFixed(2)}`
  ].join(' | ');

  return {
    baseRate,
    stopFee: totalStopFee,
    mileagePay,
    timePay,
    totalPayout,
    breakdown
  };
}

/**
 * Update payout status for an order
 */
async function updatePayoutStatus(
  orderId: number,
  status: string,
  failureReason?: string
): Promise<void> {
  const updateData: any = {
    driverPayoutStatus: status
  };

  if (failureReason) {
    const currentMetrics = await prisma.packingSupplyOrder.findUnique({
      where: { id: orderId },
      select: { routeMetrics: true }
    });

    updateData.routeMetrics = {
      ...(currentMetrics?.routeMetrics as any || {}),
      failureReason,
      lastAttemptAt: new Date().toISOString()
    };
  }

  await prisma.packingSupplyOrder.update({
    where: { id: orderId },
    data: updateData
  });
}

/**
 * Process payout for a completed packing supply delivery
 */
export async function processPackingSupplyPayout(
  orderId: number,
  forceRetry: boolean = false
): Promise<PackingSupplyPayoutResult> {
  try {
    // Get order with driver information
    const order = await prisma.packingSupplyOrder.findUnique({
      where: { id: orderId },
      include: {
        assignedDriver: true,
      },
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
        orderId
      };
    }

    if (!order.assignedDriver) {
      return {
        success: false,
        error: 'No driver assigned to order',
        orderId
      };
    }

    if (order.status !== 'Delivered') {
      return {
        success: false,
        error: 'Order not yet delivered',
        orderId
      };
    }

    // Check if payout already completed (unless forcing retry)
    if (!forceRetry && order.driverPayoutStatus === 'completed') {
      const routeMetrics = order.routeMetrics as any;
      return {
        success: true,
        transferId: routeMetrics?.transferId,
        amount: parseFloat(order.driverPayoutAmount?.toString() || '0'),
        orderId,
        error: 'Payout already completed'
      };
    }

    // Check if driver has Stripe Connect account
    if (!order.assignedDriver.stripeConnectAccountId) {
      await updatePayoutStatus(orderId, 'failed', 'Driver does not have a Stripe Connect account');
      return {
        success: false,
        error: 'Driver does not have a Stripe Connect account',
        orderId
      };
    }

    // Verify driver account is ready for payouts
    if (!order.assignedDriver.stripeConnectPayoutsEnabled) {
      await updatePayoutStatus(orderId, 'failed', 'Driver Stripe account not enabled for payouts');
      return {
        success: false,
        error: 'Driver Stripe account not enabled for payouts',
        orderId
      };
    }

    // Calculate payout if not already calculated
    let payoutAmount = parseFloat(order.driverPayoutAmount?.toString() || '0');
    let routeMetrics = order.routeMetrics as any;

    if (!payoutAmount || !routeMetrics) {
      // Use default metrics if not available from webhook
      routeMetrics = {
        drivingDistance: 5000, // 5km default
        drivingTime: 1800, // 30 minutes default
        stopsCount: 1,
        baseRate: 20,
        stopFee: 2,
        mileagePay: 0,
        timePay: 0,
        totalPayout: 22 // minimum payout
      };

      const payoutCalculation = calculatePackingSupplyPayout(routeMetrics);
      payoutAmount = payoutCalculation.totalPayout;
      
      // Update route metrics with calculation
      routeMetrics = {
        ...routeMetrics,
        ...payoutCalculation
      };
    }

    // Update status to processing
    await updatePayoutStatus(orderId, 'processing');

    // No platform fee for packing supply deliveries
    const platformFeeAmount = 0;
    const netPayoutAmount = payoutAmount - platformFeeAmount;

    // Create Stripe Connect transfer
    // Using idempotency key to prevent duplicate payouts on retries
    const transfer = await stripe.transfers.create({
      amount: Math.round(netPayoutAmount * 100), // Convert to cents
      currency: 'usd',
      destination: order.assignedDriver.stripeConnectAccountId,
      description: `Packing Supply Delivery Payment - Order #${orderId}`,
      metadata: {
        orderId: orderId.toString(),
        orderType: 'packing_supply_delivery',
        driverId: order.assignedDriver.id.toString(),
        deliveryDate: order.deliveryDate.toISOString(),
        payoutBreakdown: routeMetrics.breakdown || 'Standard packing supply delivery'
      }
    }, {
      idempotencyKey: `packing-supply-payout-${orderId}`
    });

    // Update order with successful payout
    await prisma.packingSupplyOrder.update({
      where: { id: orderId },
      data: {
        driverPayoutAmount: netPayoutAmount,
        driverPayoutStatus: 'completed',
        routeMetrics: {
          ...routeMetrics,
          transferId: transfer.id,
          platformFee: platformFeeAmount,
          netPayout: netPayoutAmount,
          processedAt: new Date().toISOString()
        }
      }
    });

    console.log(`Packing supply payout completed for order ${orderId}: $${netPayoutAmount} to ${order.assignedDriver.firstName} ${order.assignedDriver.lastName}`);

    // Send SMS notification to driver
    if (order.assignedDriver.phoneNumber) {
      try {
        await MessageService.sendSms(
          order.assignedDriver.phoneNumber,
          driverPayoutNotificationTemplate,
          { 
            payoutAmount: formatCurrency(netPayoutAmount), 
            jobCode: `PS-${orderId}`
          }
        );
        console.log(`Payout SMS sent to ${order.assignedDriver.firstName} ${order.assignedDriver.lastName}`);
      } catch (smsError) {
        console.error('Error sending payout SMS:', smsError);
        // Don't fail the payout if SMS fails
      }
    }

    return {
      success: true,
      transferId: transfer.id,
      amount: netPayoutAmount,
      orderId
    };

  } catch (error: any) {
    console.error(`Packing supply payout failed for order ${orderId}:`, error);
    
    // Update failure status
    await updatePayoutStatus(orderId, 'failed', error.message || 'Unknown error');

    return {
      success: false,
      error: error.message || 'Unknown error occurred during payout',
      orderId
    };
  }
}

/**
 * Process payouts for multiple completed orders
 */
export async function processMultiplePackingSupplyPayouts(
  orderIds: number[]
): Promise<PackingSupplyPayoutSummary[]> {
  const results: PackingSupplyPayoutSummary[] = [];

  for (const orderId of orderIds) {
    try {
      const result = await processPackingSupplyPayout(orderId);
      
      // Get order details for summary
      const order = await prisma.packingSupplyOrder.findUnique({
        where: { id: orderId },
        include: { assignedDriver: true }
      });

      if (order && order.assignedDriver) {
        results.push({
          orderId,
          driverId: order.assignedDriver.id,
          driverName: `${order.assignedDriver.firstName} ${order.assignedDriver.lastName}`,
          amount: result.amount || 0,
          status: result.success ? 'completed' : 'failed',
          transferId: result.transferId,
          error: result.error,
          processedAt: result.success ? new Date() : undefined
        });
      }
    } catch (error) {
      console.error(`Error processing payout for order ${orderId}:`, error);
      results.push({
        orderId,
        driverId: 0,
        driverName: 'Unknown',
        amount: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Get pending payouts for packing supply deliveries
 */
export async function getPendingPackingSupplyPayouts(): Promise<{
  orderId: number;
  driverName: string;
  deliveryDate: Date;
  amount: number;
  status: string;
}[]> {
  const pendingOrders = await prisma.packingSupplyOrder.findMany({
    where: {
      status: 'Delivered',
      driverPayoutStatus: { in: ['pending', 'failed'] },
      assignedDriverId: { not: null }
    },
    include: {
      assignedDriver: true
    },
    orderBy: {
      actualDeliveryTime: 'asc'
    }
  });

  return pendingOrders.map(order => ({
    orderId: order.id,
    driverName: order.assignedDriver 
      ? `${order.assignedDriver.firstName} ${order.assignedDriver.lastName}`
      : 'Unknown Driver',
    deliveryDate: order.deliveryDate,
    amount: parseFloat(order.driverPayoutAmount?.toString() || '0'),
    status: order.driverPayoutStatus || 'pending'
  }));
}

/**
 * Retry failed packing supply payouts
 */
export async function retryFailedPackingSupplyPayouts(): Promise<PackingSupplyPayoutSummary[]> {
  const failedOrders = await prisma.packingSupplyOrder.findMany({
    where: {
      status: 'Delivered',
      driverPayoutStatus: 'failed',
      assignedDriverId: { not: null }
    },
    select: { id: true }
  });

  const orderIds = failedOrders.map(order => order.id);
  return processMultiplePackingSupplyPayouts(orderIds);
}

/**
 * Get payout summary for a specific order
 */
export async function getPackingSupplyPayoutSummary(orderId: number): Promise<{
  orderId: number;
  status: string;
  amount: number;
  transferId?: string;
  processedAt?: Date;
  failureReason?: string;
  breakdown?: string;
} | null> {
  const order = await prisma.packingSupplyOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      driverPayoutStatus: true,
      driverPayoutAmount: true,
      routeMetrics: true,
      actualDeliveryTime: true
    }
  });

  if (!order) return null;

  const routeMetrics = order.routeMetrics as any;

  return {
    orderId: order.id,
    status: order.driverPayoutStatus || 'pending',
    amount: parseFloat(order.driverPayoutAmount?.toString() || '0'),
    transferId: routeMetrics?.transferId,
    processedAt: routeMetrics?.processedAt ? new Date(routeMetrics.processedAt) : undefined,
    failureReason: routeMetrics?.failureReason,
    breakdown: routeMetrics?.breakdown
  };
}

// Export as a service class for consistency with other services
export const PackingSupplyPayoutService = {
  calculatePackingSupplyPayout,
  processPackingSupplyPayout,
  processMultiplePackingSupplyPayouts,
  getPendingPackingSupplyPayouts,
  retryFailedPackingSupplyPayouts,
  getPackingSupplyPayoutSummary
};

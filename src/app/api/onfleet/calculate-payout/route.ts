/**
 * @fileoverview Onfleet packing supply delivery payout calculation and processing
 * @source boombox-10.0/src/app/api/onfleet/calculate-payout/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that processes payouts for packing supply deliveries with multiple actions:
 * - process_single: Process payout for single order
 * - process_multiple: Process payouts for multiple orders
 * - retry_failed: Retry failed payout processing
 * - calculate_only: Calculate payout without processing
 * GET endpoint that retrieves payout information, pending payouts, and statistics.
 *
 * USED BY (boombox-10.0 files):
 * - Admin payout management system
 * - Automated payout processing (cron jobs)
 * - Driver payout dashboard
 * - Financial reporting and analytics
 *
 * INTEGRATION NOTES:
 * - Critical Stripe payout integration - DO NOT modify payment logic
 * - Processes driver payouts for completed deliveries
 * - Integrates with packing supply order system
 * - Handles failed payout retries and reconciliation
 *
 * @refactor Moved to /api/onfleet/ structure, added validation and utility extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatCurrency } from '@/lib/utils/currencyUtils';

// Note: These payout functions will need to be copied from boombox-10.0
// For now, creating placeholder implementations to resolve imports
interface PayoutResult {
  success: boolean;
  amount?: number;
  error?: string;
  status: 'completed' | 'failed' | 'pending';
}

interface PayoutSummary {
  orderId: number;
  amount: number;
  status: string;
}

// Placeholder implementations - will be replaced with actual imports once files are copied
const processPackingSupplyPayout = async (orderId: number, forceRetry?: boolean): Promise<PayoutResult> => {
  return { success: false, error: 'Not implemented', status: 'failed' };
};

const processMultiplePackingSupplyPayouts = async (orderIds: number[]): Promise<PayoutResult[]> => {
  return orderIds.map(id => ({ success: false, error: 'Not implemented', status: 'failed' as const }));
};

const getPendingPackingSupplyPayouts = async (): Promise<PayoutSummary[]> => {
  return [];
};

const retryFailedPackingSupplyPayouts = async (): Promise<PayoutResult[]> => {
  return [];
};

const getPackingSupplyPayoutSummary = async (orderId: number): Promise<PayoutSummary | null> => {
  return null;
};

const calculatePackingSupplyPayout = (routeMetrics: any): { totalPayout: number } => {
  return { totalPayout: 0 };
};

import { getPayoutStatistics } from '@/lib/utils/onfleetUtils';
import {
  OnfleetCalculatePayoutRequestSchema,
  type OnfleetCalculatePayoutRequest
} from '@/lib/validations/api.validations';

/**
 * POST /api/onfleet/calculate-payout
 * Process payouts for packing supply deliveries
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = OnfleetCalculatePayoutRequestSchema.parse(body);
    const { action, orderId, orderIds, forceRetry, routeMetrics } = validatedData;

    switch (action) {
      case 'process_single':
        if (!orderId) {
          return NextResponse.json(
            { error: 'Order ID is required for single payout processing' },
            { status: 400 }
          );
        }

        const singleResult = await processPackingSupplyPayout(orderId, forceRetry);
        return NextResponse.json({
          success: singleResult.success,
          result: singleResult,
          message: singleResult.success 
            ? `Payout processed successfully: ${singleResult.amount ? formatCurrency(singleResult.amount) : 'Unknown amount'}`
            : `Payout failed: ${singleResult.error}`
        });

      case 'process_multiple':
        if (!orderIds || !Array.isArray(orderIds)) {
          return NextResponse.json(
            { error: 'Order IDs array is required for multiple payout processing' },
            { status: 400 }
          );
        }

        const multipleResults = await processMultiplePackingSupplyPayouts(orderIds);
        const successCount = multipleResults.filter((r: PayoutResult) => r.status === 'completed').length;
        const totalAmount = multipleResults
          .filter((r: PayoutResult) => r.status === 'completed')
          .reduce((sum: number, r: PayoutResult) => sum + (r.amount || 0), 0);

        return NextResponse.json({
          success: true,
          results: multipleResults,
          summary: {
            total: multipleResults.length,
            successful: successCount,
            failed: multipleResults.length - successCount,
            totalAmount: formatCurrency(totalAmount)
          },
          message: `Processed ${successCount}/${multipleResults.length} payouts successfully`
        });

      case 'retry_failed':
        const retryResults = await retryFailedPackingSupplyPayouts();
        const retrySuccessCount = retryResults.filter((r: PayoutResult) => r.status === 'completed').length;
        const retryTotalAmount = retryResults
          .filter((r: PayoutResult) => r.status === 'completed')
          .reduce((sum: number, r: PayoutResult) => sum + (r.amount || 0), 0);

        return NextResponse.json({
          success: true,
          results: retryResults,
          summary: {
            total: retryResults.length,
            successful: retrySuccessCount,
            failed: retryResults.length - retrySuccessCount,
            totalAmount: formatCurrency(retryTotalAmount)
          },
          message: `Retried ${retrySuccessCount}/${retryResults.length} failed payouts successfully`
        });

      case 'calculate_only':
        if (!routeMetrics) {
          return NextResponse.json(
            { error: 'Route metrics are required for calculation' },
            { status: 400 }
          );
        }

        const calculation = calculatePackingSupplyPayout(routeMetrics);
        return NextResponse.json({
          success: true,
          calculation,
          message: `Calculated payout: ${formatCurrency(calculation.totalPayout)}`
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: process_single, process_multiple, retry_failed, calculate_only' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in payout calculation API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/onfleet/calculate-payout
 * Get payout information and pending payouts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const orderId = searchParams.get('orderId');

    switch (action) {
      case 'pending':
        const pendingPayouts = await getPendingPackingSupplyPayouts();
        return NextResponse.json({
          success: true,
          pendingPayouts,
          count: pendingPayouts.length,
          totalPendingAmount: formatCurrency(pendingPayouts.reduce((sum: number, p: PayoutSummary) => sum + p.amount, 0))
        });

      case 'summary':
        if (!orderId) {
          return NextResponse.json(
            { error: 'Order ID is required for payout summary' },
            { status: 400 }
          );
        }

        const summary = await getPackingSupplyPayoutSummary(parseInt(orderId));
        if (!summary) {
          return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          summary
        });

      case 'stats':
        // Get overall payout statistics using centralized utility
        const stats = await getPayoutStatistics();
        return NextResponse.json({
          success: true,
          stats
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: pending, summary, stats' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in payout calculation API (GET):', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
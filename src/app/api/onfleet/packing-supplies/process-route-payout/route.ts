/**
 * @fileoverview Process payout for completed packing supply routes
 * @source boombox-10.0/src/app/api/packing-supplies/process-route-payout/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST: Process individual route payout or all pending payouts
 * GET: Get route payout details or list all routes with payout status
 *
 * USED BY (boombox-10.0 files):
 * - Admin payout management interface
 * - Cron job for automatic payout processing
 * - Driver payout tracking and reporting
 *
 * INTEGRATION NOTES:
 * - Critical Stripe Connect integration for driver payouts
 * - Database updates for payout tracking and status
 * - Route completion validation before payout processing
 * - Financial reconciliation and reporting
 *
 * @refactor Moved from /api/packing-supplies/ to /api/onfleet/packing-supplies/ structure,
 *           uses centralized routePayoutService, added comprehensive validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { 
  processRoutePayout, 
  processPendingRoutePayouts 
} from '@/lib/services/routePayoutService';
import { 
  ProcessRoutePayoutRequestSchema,
  ProcessRoutePayoutGetSchema 
} from '@/lib/validations/api.validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input using Zod schema
    const validation = ProcessRoutePayoutRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { routeId, action } = validation.data;

    if (action === 'process_all_pending') {
      // Process all pending route payouts using centralized service
      const result = await processPendingRoutePayouts();
      
      return NextResponse.json({
        success: true,
        message: `Processed ${result.processed} route payouts, ${result.failed} failed`,
        details: {
          processed: result.processed,
          failed: result.failed,
          errors: result.errors,
        },
      });
    }

    if (!routeId) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      );
    }

    // Process specific route payout using centralized service
    const result = await processRoutePayout(routeId, true); // Force retry

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Route payout processed successfully`,
        details: {
          routeId: result.routeId,
          transferId: result.transferId,
          amount: result.amount,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          routeId: result.routeId,
        },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Error processing route payout:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const validation = ProcessRoutePayoutGetSchema.safeParse({
      routeId: searchParams.get('routeId')
    });
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { routeId } = validation.data;

    if (routeId) {
      // Get specific route details
      const route = await prisma.packingSupplyRoute.findUnique({
        where: { routeId },
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              stripeConnectAccountId: true,
              stripeConnectPayoutsEnabled: true,
            },
          },
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
        return NextResponse.json(
          { error: 'Route not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        route: {
          ...route,
          payoutAmount: route.payoutAmount ? parseFloat(route.payoutAmount.toString()) : null,
          totalDistance: route.totalDistance ? parseFloat(route.totalDistance.toString()) : null,
        },
      });
    } else {
      // Get all routes with payout status
      const routes = await prisma.packingSupplyRoute.findMany({
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50, // Limit to last 50 routes
      });

      return NextResponse.json({
        success: true,
        routes: routes.map(route => ({
          ...route,
          payoutAmount: route.payoutAmount ? parseFloat(route.payoutAmount.toString()) : null,
          totalDistance: route.totalDistance ? parseFloat(route.totalDistance.toString()) : null,
          orderCount: route._count.orders,
        })),
      });
    }

  } catch (error: any) {
    console.error('Error fetching route data:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 
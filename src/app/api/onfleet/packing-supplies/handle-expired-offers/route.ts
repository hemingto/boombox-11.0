/**
 * @fileoverview Handle expired packing supply route offers (cron job)
 * @source boombox-10.0/src/app/api/packing-supplies/handle-expired-offers/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST: Process all expired route offers, mark as expired, find next drivers
 * GET: Preview expired offers (dry run mode)
 *
 * USED BY (boombox-10.0 files):
 * - Cron job system for automatic cleanup of expired driver offers
 * - Admin tools for monitoring expired offers
 * - Route assignment fallback system
 *
 * INTEGRATION NOTES:
 * - Critical for route assignment reliability 
 * - Prevents routes from being stuck in 'sent' status
 * - Automatically finds next available drivers
 * - Admin notifications when no drivers available
 *
 * @refactor Moved from /api/packing-supplies/ to /api/onfleet/packing-supplies/ structure,
 *           extracted utilities to centralized functions, added validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { 
  findAndNotifyNextDriverForRoute 
} from '@/lib/utils/driverNotificationUtils';
import { 
  HandleExpiredOffersRequestSchema,
  HandleExpiredOffersGetSchema 
} from '@/lib/validations/api.validations';

export async function POST(request: NextRequest) {
  try {
    // Simple API key check to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_API_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request (no body needed, just auth check)
    const validation = HandleExpiredOffersRequestSchema.safeParse({});
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    console.log('Starting expired offer cleanup job...');

    // Find all routes with expired offers
    const currentTime = new Date();
    const expiredOfferRoutes = await prisma.packingSupplyRoute.findMany({
      where: {
        driverOfferStatus: 'sent',
        driverOfferExpiresAt: {
          lt: currentTime, // Offer expiry time is in the past
        },
      },
      include: {
        orders: {
          select: {
            id: true,
            deliveryAddress: true,
            totalPrice: true,
            routeStopNumber: true,
          },
          orderBy: { routeStopNumber: 'asc' },
        },
      },
    });

    if (expiredOfferRoutes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired offers found',
        processedRoutes: 0,
      });
    }

    console.log(`Found ${expiredOfferRoutes.length} expired route offers to process`);

    const results = [];
    for (const route of expiredOfferRoutes) {
      try {
        // Mark route offer as expired
        await prisma.packingSupplyRoute.update({
          where: { routeId: route.routeId },
          data: {
            driverOfferStatus: 'expired',
          },
        });

        console.log(`Marked route ${route.routeId} offer as expired`);

        // Try to find next available driver using centralized utility
        const nextDriverResult = await findAndNotifyNextDriverForRoute({
          deliveryDate: route.deliveryDate,
          routeId: route.routeId,
          context: 'expired',
        });

        results.push({
          routeId: route.routeId,
          status: 'processed',
          nextDriverFound: nextDriverResult.success,
          message: nextDriverResult.message,
        });

      } catch (error: any) {
        console.error(`Error processing expired route ${route.routeId}:`, error);
        results.push({
          routeId: route.routeId,
          status: 'error',
          error: error.message,
        });
      }
    }

    const successfullyProcessed = results.filter(r => r.status === 'processed').length;
    const failedProcessing = results.filter(r => r.status === 'error').length;
    const nextDriversFound = results.filter(r => r.nextDriverFound).length;

    return NextResponse.json({
      success: true,
      message: `Processed ${expiredOfferRoutes.length} expired offers`,
      summary: {
        totalExpired: expiredOfferRoutes.length,
        successfullyProcessed,
        failedProcessing,
        nextDriversFound,
        adminNotifications: expiredOfferRoutes.length - nextDriversFound,
      },
      results,
    });

  } catch (error: any) {
    console.error('Error in expired offer cleanup:', error);
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
    const validation = HandleExpiredOffersGetSchema.safeParse({
      dryRun: searchParams.get('dryRun')
    });
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { dryRun } = validation.data;

    // Get current expired offers for preview
    const currentTime = new Date();
    const expiredOfferRoutes = await prisma.packingSupplyRoute.findMany({
      where: {
        driverOfferStatus: 'sent',
        driverOfferExpiresAt: {
          lt: currentTime,
        },
      },
      include: {
        orders: {
          select: {
            id: true,
            deliveryAddress: true,
            totalPrice: true,
            routeStopNumber: true,
          },
          orderBy: { routeStopNumber: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: dryRun ? 'Dry run - showing expired offers that would be processed' : 'Current expired offers',
      expiredOffersCount: expiredOfferRoutes.length,
      expiredOffers: expiredOfferRoutes.map(route => ({
        routeId: route.routeId,
        deliveryDate: route.deliveryDate,
        totalStops: route.totalStops,
        expiresAt: route.driverOfferExpiresAt,
        minutesExpired: Math.floor((currentTime.getTime() - route.driverOfferExpiresAt!.getTime()) / (1000 * 60)),
      })),
    });

  } catch (error: any) {
    console.error('Error getting expired offers:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 
/**
 * @fileoverview Get packing supply route details for driver offers
 * @source boombox-10.0/src/app/api/packing-supplies/route-details/[routeId]/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET: Retrieve detailed route information for driver offer verification
 *
 * USED BY (boombox-10.0 files):
 * - Driver route offer acceptance flow
 * - Route details display in driver interfaces
 * - Mobile driver app route previews
 *
 * INTEGRATION NOTES:
 * - JWT token verification for secure route access
 * - Route availability and assignment status validation
 * - Payout estimation for driver decision making
 * - Route metrics calculation for display
 *
 * @refactor Moved from /api/packing-supplies/ to /api/onfleet/packing-supplies/ structure,
 *           uses centralized token verification and route metrics utilities,
 *           enhanced parameterized route handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { 
  verifyDriverOfferToken,
  formatRouteMetrics 
} from '@/lib/utils/driverNotificationUtils';
import { 
  RouteDetailsParamsSchema,
  RouteDetailsQuerySchema 
} from '@/lib/validations/api.validations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate route parameters
    const awaitedParams = await params;
    const paramsValidation = RouteDetailsParamsSchema.safeParse({
      routeId: awaitedParams.id
    });
    
    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Invalid route ID parameter', details: paramsValidation.error.issues },
        { status: 400 }
      );
    }

    const { routeId } = paramsValidation.data;
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryValidation = RouteDetailsQuerySchema.safeParse({
      token: searchParams.get('token')
    });
    
    if (!queryValidation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: queryValidation.error.issues },
        { status: 400 }
      );
    }

    const { token } = queryValidation.data;
    
    // Verify JWT token using centralized utility
    const tokenVerification = verifyDriverOfferToken(token);
    if (!tokenVerification.valid) {
      return NextResponse.json(
        { error: tokenVerification.error },
        { status: tokenVerification.error === 'Token has expired' ? 410 : 401 }
      );
    }
    
    const tokenData = tokenVerification.payload!;
    
    // Verify token data matches route
    if (!tokenData.routeId || !tokenData.driverId || tokenData.routeId !== routeId) {
      return NextResponse.json(
        { error: 'Token does not match requested route' },
        { status: 400 }
      );
    }
    
    // Check if token has expired (additional verification)
    const now = Date.now();
    if (tokenData.expiresAt && now > tokenData.expiresAt) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 410 }
      );
    }
    
    // Fetch the route details
    const route = await prisma.packingSupplyRoute.findUnique({
      where: { routeId: routeId },
      include: {
        orders: {
          select: {
            id: true,
            deliveryAddress: true,
            contactName: true,
            totalPrice: true,
          },
          orderBy: { routeStopNumber: 'asc' }
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });
    
    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }
    
    // Check if route is already assigned to a different driver
    if (route.driverOfferStatus === 'accepted' && route.driverId !== tokenData.driverId) {
      return NextResponse.json(
        { error: 'This route has already been accepted by another driver' },
        { status: 409 }
      );
    }
    
    // Check if the offer has expired based on database timestamps
    if (route.driverOfferExpiresAt && now > route.driverOfferExpiresAt.getTime()) {
      return NextResponse.json(
        { error: 'This route offer has expired' },
        { status: 410 }
      );
    }
    
    // Calculate route metrics using centralized utility
    const metrics = formatRouteMetrics(
      route.totalStops,
      route.totalDistance ? parseFloat(route.totalDistance.toString()) : undefined,
      route.totalTime || undefined
    );
    
    const routeOffer = {
      routeId: route.routeId,
      deliveryDate: route.deliveryDate.toISOString(),
      totalStops: route.totalStops,
      estimatedPayout: metrics.estimatedPayout,
      estimatedMiles: metrics.estimatedMiles,
      estimatedDuration: metrics.estimatedDuration,
      orders: route.orders.map(order => ({
        id: order.id,
        deliveryAddress: order.deliveryAddress,
        contactName: order.contactName,
        totalPrice: order.totalPrice,
      }))
    };
    
    return NextResponse.json(routeOffer);
    
  } catch (error: any) {
    console.error('Error fetching route details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route details' },
      { status: 500 }
    );
  }
} 
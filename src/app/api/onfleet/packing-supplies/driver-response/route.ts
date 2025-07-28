/**
 * @fileoverview Driver response to packing supply route offers (accept/decline)
 * @source boombox-10.0/src/app/api/packing-supplies/driver-response/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST: Driver responds to route offer with accept/decline action
 * GET: Driver views route offer details using token
 *
 * USED BY (boombox-10.0 files):
 * - SMS notifications sent to drivers with route offer links
 * - Driver acceptance/decline workflow from mobile interfaces
 * - Route assignment system for packing supply deliveries
 *
 * INTEGRATION NOTES:
 * - Critical Onfleet integration for Route Plan assignment to workers
 * - JWT token validation for secure driver responses
 * - Database updates for route status and driver assignment
 * - Admin notifications when no drivers available
 *
 * @refactor Moved from /api/packing-supplies/ to /api/onfleet/packing-supplies/ structure,
 *           extracted utilities to centralized functions, added comprehensive validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import jwt from 'jsonwebtoken';
import { assignRoutePlanToWorker } from '@/lib/services/onfleet-route-plan';
import { 
  findAndNotifyNextDriverForRoute, 
  verifyDriverOfferToken,
  formatRouteMetrics 
} from '@/lib/utils/driverNotificationUtils';
import { 
  DriverResponseRequestSchema,
  DriverResponseGetSchema 
} from '@/lib/validations/api.validations';

export async function POST(request: NextRequest) {
  console.log('=== DRIVER RESPONSE ENDPOINT START ===');
  console.log('Request method:', request.method);
  console.log('Request URL:', request.url);
  
  try {
    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));
    
    // Validate input using Zod schema
    const validation = DriverResponseRequestSchema.safeParse(body);
    if (!validation.success) {
      console.log('ERROR: Validation failed:', validation.error.issues);
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { token, action } = validation.data;
    console.log('Extracted values:', { token: token ? 'PROVIDED' : 'MISSING', action });

    // Verify and decode the JWT token
    let tokenPayload;
    try {
      console.log('Attempting to verify JWT token...');
      tokenPayload = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      console.log('JWT token verified successfully:', JSON.stringify(tokenPayload, null, 2));
    } catch (error: any) {
      console.log('ERROR: JWT verification failed:', error.message);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { routeId, driverId, expiresAt } = tokenPayload;
    console.log('Token payload extracted:', { routeId, driverId, expiresAt });

    // Check if token has expired
    const now = Date.now();
    console.log('Time check:', { now, expiresAt, isExpired: now > expiresAt });
    if (now > expiresAt) {
      console.log('ERROR: Token has expired');
      return NextResponse.json(
        { error: 'Offer has expired' },
        { status: 410 }
      );
    }

    console.log('Token expiration check passed');

    // Get route details
    console.log('Fetching route details for:', routeId);
    const route = await prisma.packingSupplyRoute.findUnique({
      where: { routeId },
      include: {
        orders: {
          orderBy: { routeStopNumber: 'asc' },
        },
      },
    });

    if (!route) {
      console.log('ERROR: Route not found:', routeId);
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    console.log('Route found:', {
      routeId: route.routeId,
      driverOfferStatus: route.driverOfferStatus,
      currentDriverId: route.driverId,
      totalStops: route.totalStops,
      ordersCount: route.orders.length
    });

    // Check if route is still available for assignment
    if (route.driverOfferStatus !== 'sent') {
      console.log('ERROR: Route not available. Current status:', route.driverOfferStatus);
      return NextResponse.json(
        { error: `Route is no longer available. Current status: ${route.driverOfferStatus}` },
        { status: 400 }
      );
    }

    console.log('Route availability check passed');

    // Get driver details
    console.log('Fetching driver details for:', driverId);
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        onfleetWorkerId: true,
      },
    });

    if (!driver) {
      console.log('ERROR: Driver not found:', driverId);
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    console.log('Driver found:', {
      id: driver.id,
      name: `${driver.firstName} ${driver.lastName}`,
      onfleetWorkerId: driver.onfleetWorkerId
    });

    console.log(`Processing ${action} action for driver ${driver.id} on route ${route.routeId}`);

    if (action === 'accept') {
      console.log('Calling handleDriverAccept...');
      return await handleDriverAccept(route, driver);
    } else {
      console.log('Calling handleDriverDecline...');
      return await handleDriverDecline(route, driver);
    }

  } catch (error: any) {
    console.error('=== CRITICAL ERROR IN DRIVER RESPONSE ENDPOINT ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== END CRITICAL ERROR ===');
    
    return NextResponse.json(
      { error: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Handle driver accepting the route offer
 */
async function handleDriverAccept(route: any, driver: any) {
  try {
    console.log(`Starting driver accept process for route ${route.routeId}, driver ${driver.id}`);
    console.log(`Driver onfleetWorkerId: ${driver.onfleetWorkerId}`);
    console.log(`Route onfleetOptimizationId: ${route.onfleetOptimizationId}`);

    // Assign Route Plan to driver in Onfleet (keeps route intact)
    if (driver.onfleetWorkerId && route.onfleetOptimizationId) {
      try {
        console.log(`Attempting to assign Route Plan ${route.onfleetOptimizationId} to driver ${driver.onfleetWorkerId}`);
        const result = await assignRoutePlanToWorker(route.onfleetOptimizationId, driver.onfleetWorkerId);
        console.log(`Successfully assigned Route Plan to driver:`, result);
      } catch (error: any) {
        console.error(`Failed to assign Route Plan to driver:`, error);
        console.error(`Error details:`, {
          message: error.message,
          stack: error.stack,
          routePlanId: route.onfleetOptimizationId,
          workerId: driver.onfleetWorkerId
        });
        
        // For now, let's continue with database updates even if Onfleet assignment fails
        // This allows us to test the rest of the flow
        console.log(`Continuing with database updates despite Onfleet error...`);
      }
    } else {
      console.warn(`Missing required IDs:`, {
        onfleetWorkerId: driver.onfleetWorkerId,
        onfleetOptimizationId: route.onfleetOptimizationId
      });
    }

    console.log(`Updating database for route ${route.routeId} with driver ${driver.id}`);

    // Update route with driver assignment
    await prisma.packingSupplyRoute.update({
      where: { routeId: route.routeId },
      data: {
        driverId: driver.id,
        routeStatus: 'assigned',
        driverOfferStatus: 'accepted',
        updatedAt: new Date(),
      },
    });

    // Update orders with driver assignment
    await prisma.$transaction([
      prisma.packingSupplyOrder.updateMany({
        where: { routeId: route.routeId },
        data: {
          assignedDriverId: driver.id,
          status: 'Assigned',
        },
      }),
    ]);

    // Update driver's completed jobs counter (for future sorting)
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        completedPackingSupplyJobs: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });

    console.log(`Successfully completed driver accept process for route ${route.routeId}`);

    return NextResponse.json({
      success: true,
      message: `Route accepted successfully`,
      details: {
        routeId: route.routeId,
        driverId: driver.id,
        driverName: `${driver.firstName} ${driver.lastName}`,
        totalStops: route.totalStops,
        orderIds: route.orders.map((o: any) => o.id),
      },
    });

  } catch (error: any) {
    console.error('Error handling driver accept:', error);
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      routeId: route.routeId,
      driverId: driver.id
    });
    throw new Error(`Failed to process acceptance: ${error.message}`);
  }
}

/**
 * Handle driver declining the route offer
 */
async function handleDriverDecline(route: any, driver: any) {
  try {
    // Update route status to declined with tracking
    await prisma.packingSupplyRoute.update({
      where: { routeId: route.routeId },
      data: {
        driverOfferStatus: 'declined',
        // Note: In a more complex system, you might want to track who declined
        // This could be done with a separate table or JSON field
      },
    });

    console.log(`Driver ${driver.id} (${driver.firstName} ${driver.lastName}) declined route ${route.routeId}`);

    // Find next available driver for this route using centralized utility
    const nextDriverResult = await findAndNotifyNextDriverForRoute({
      deliveryDate: route.deliveryDate,
      routeId: route.routeId,
      context: 'decline',
    });

    return NextResponse.json({
      success: true,
      message: 'Route declined, searching for next driver',
      details: {
        routeId: route.routeId,
        declinedBy: `${driver.firstName} ${driver.lastName}`,
        nextDriverStatus: nextDriverResult.success ? 'notified' : 'none_available',
        nextDriverNotified: nextDriverResult.success,
        nextDriverMessage: nextDriverResult.message,
      },
    });

  } catch (error: any) {
    console.error('Error handling driver decline:', error);
    throw new Error(`Failed to process decline: ${error.message}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const validation = DriverResponseGetSchema.safeParse({
      token: searchParams.get('token')
    });
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    // Verify and decode the JWT token using centralized utility
    const tokenVerification = verifyDriverOfferToken(token);
    if (!tokenVerification.valid) {
      return NextResponse.json(
        { error: tokenVerification.error },
        { status: tokenVerification.error === 'Token has expired' ? 410 : 401 }
      );
    }

    const { routeId, driverId } = tokenVerification.payload!;

    // Get route and driver details for display
    const route = await prisma.packingSupplyRoute.findUnique({
      where: { routeId },
      include: {
        orders: {
          include: {
            orderDetails: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { routeStopNumber: 'asc' },
        },
      },
    });

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
      },
    });

    if (!route || !driver) {
      return NextResponse.json(
        { error: 'Route or driver not found' },
        { status: 404 }
      );
    }

    // Format route metrics using centralized utility
    const metrics = formatRouteMetrics(
      route.totalStops,
      route.totalDistance ? parseFloat(route.totalDistance.toString()) : undefined,
      route.totalTime ?? undefined
    );

    return NextResponse.json({
      success: true,
      route: {
        routeId: route.routeId,
        totalStops: route.totalStops,
        deliveryDate: route.deliveryDate,
        status: route.driverOfferStatus,
        payoutEstimate: metrics.estimatedPayout,
        estimatedMiles: metrics.estimatedMiles,
        estimatedDuration: metrics.estimatedDuration,
        orders: route.orders.map((order: any) => ({
          id: order.id,
          address: order.deliveryAddress,
          stopNumber: order.routeStopNumber,
          totalPrice: order.totalPrice,
          items: order.orderDetails.map((detail: any) => ({
            quantity: detail.quantity,
            name: detail.product.title,
            price: detail.price,
          })),
        })),
      },
      driver: {
        id: driver.id,
        name: `${driver.firstName} ${driver.lastName}`,
      },
      tokenValid: true,
      expiresAt: tokenVerification.payload!.expiresAt,
    });

  } catch (error: any) {
    console.error('Error getting offer details:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 
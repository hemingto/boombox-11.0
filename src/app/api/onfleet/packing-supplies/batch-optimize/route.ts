/**
 * @fileoverview Batch optimization for packing supply delivery routes
 * @source boombox-10.0/src/app/api/packing-supplies/batch-optimize/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint: 7-step batch optimization process:
 * 1. Get unassigned orders for target date
 * 2. Get/create Onfleet task IDs for orders without tasks
 * 3. Convert orders to optimization format
 * 4. Use simple route optimizer for geographic clustering
 * 5. Create Route Plans in Onfleet for each optimized route
 * 6. Update orders as batch processed and assign to routes
 * 7. Trigger driver offers for successfully created routes
 * GET endpoint: Fetch optimization summary and status with filtering
 *
 * USED BY (boombox-10.0 files):
 * - src/app/api/packing-supplies/assign-routes/route.ts (trigger_batch_optimization action)
 * - src/app/admin/delivery-routes/page.tsx (Manual batch optimization trigger)
 * - src/cron/daily-batch-optimize.ts (Automated daily optimization)
 *
 * INTEGRATION NOTES:
 * - Critical Onfleet integration for task creation and route plan management
 * - Uses simple-route-optimization service for geographic clustering
 * - Makes internal API calls to driver-offer endpoint for driver assignment
 * - Complex multi-step process with error handling for partial failures
 * - Environment variables: BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS (team ID)
 *
 * @refactor Updated import paths, added Zod validation, preserved exact business logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { routeOptimizer } from '@/lib/services/simple-route-optimization';
import { createRoutePlan } from '@/lib/services/onfleet-route-plan';
import { createPackingSupplyTask } from '@/lib/integrations/onfleetClient';
import { 
  BatchOptimizeRequestSchema, 
  BatchOptimizeGetRequestSchema 
} from '@/lib/validations/api.validations';
import { ApiResponse } from '@/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body with Zod
    const validatedData = BatchOptimizeRequestSchema.parse(body);
    const { targetDate, date, source } = validatedData;
    
    // Use provided date or default to today (support both targetDate and date for compatibility)
    const optimizationDate = targetDate ? new Date(targetDate) : date ? new Date(date) : new Date();
    const startOfDay = new Date(optimizationDate.toDateString());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    console.log(`Starting batch optimization for date: ${optimizationDate.toDateString()}`);

    // Step 1: Get all unassigned orders for the target date
    const unassignedOrders = await prisma.packingSupplyOrder.findMany({
      where: {
        deliveryDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: { in: ['Pending Batch', 'Pending'] }, // Include both statuses
        routeId: null,
        batchProcessedAt: null, // Not already processed in a batch
      },
      include: {
        orderDetails: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { orderDate: 'asc' },
    });

    if (unassignedOrders.length === 0) {
      return NextResponse.json<ApiResponse<{
        targetDate: string;
        ordersProcessed: number;
        routesCreated: number;
      }>>({
        success: true,
        data: {
          targetDate: optimizationDate.toISOString().split('T')[0],
          ordersProcessed: 0,
          routesCreated: 0,
        },
      });
    }

    // Step 2: Get Onfleet task IDs (most orders should already have tasks from creation)
    const taskIds = [];
    const ordersNeedingTasks = [];
    
    for (const order of unassignedOrders) {
      if (!order.onfleetTaskId) {
        ordersNeedingTasks.push(order);
      } else {
        taskIds.push(order.onfleetTaskId);
      }
    }

    // Create tasks for orders that don't have them (fallback for older orders)
    if (ordersNeedingTasks.length > 0) {
      console.log(`Creating Onfleet tasks for ${ordersNeedingTasks.length} orders without tasks`);
      
      for (const order of ordersNeedingTasks) {
        const taskData = {
          destination: {
            address: {
              unparsed: order.deliveryAddress,
            },
          },
          recipients: [{
            name: order.contactName,
            phone: order.contactPhone,
          }],
          // Set delivery window constraints
          completeBefore: order.deliveryWindowEnd ? order.deliveryWindowEnd.getTime() : endOfDay.getTime(),
          completeAfter: order.deliveryWindowStart ? order.deliveryWindowStart.getTime() : startOfDay.getTime(),
          // Assign to packing supply team
          container: {
            type: 'TEAM',
            team: process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS,
          },
          notes: `Packing Supply Delivery - Order #${order.id}\n\nItems:\n${order.orderDetails.map(detail => `- ${detail.quantity}x ${detail.product.title}`).join('\n')}\n\nTotal: $${order.totalPrice.toFixed(2)}`,
          metadata: [
            { name: 'order_id', type: 'number', value: order.id },
            { name: 'job_type', type: 'string', value: 'packing_supply_delivery' },
            { name: 'total_price', type: 'number', value: order.totalPrice },
            { name: 'customer_name', type: 'string', value: order.contactName },
            { name: 'customer_phone', type: 'string', value: order.contactPhone },
            { name: 'batch_optimization', type: 'boolean', value: true },
            { name: 'batch_date', type: 'string', value: optimizationDate.toISOString().split('T')[0] },
            { name: 'optimization_timestamp', type: 'number', value: Date.now() },
          ],
        };

        try {
          const task = await createPackingSupplyTask(taskData);
          
          // Update order with task ID
          await prisma.packingSupplyOrder.update({
            where: { id: order.id },
            data: {
              onfleetTaskId: task.id,
              onfleetTaskShortId: task.shortId,
            },
          });

          taskIds.push(task.id);
          console.log(`Created Onfleet task ${task.shortId} for order ${order.id}`);
        } catch (error) {
          console.error(`Failed to create Onfleet task for order ${order.id}:`, error);
          // Continue with other orders
        }
      }
    }

    if (taskIds.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: 'NO_TASKS_AVAILABLE',
            message: 'No Onfleet tasks available for optimization',
            details: {
              targetDate: optimizationDate.toISOString().split('T')[0],
              ordersFound: unassignedOrders.length,
            }
          }
        },
        { status: 400 }
      );
    }

    // Step 3: Convert orders to optimization format
    const deliveryOrders = unassignedOrders.map(order => ({
      id: order.id,
      onfleetTaskId: order.onfleetTaskId!,
      deliveryAddress: order.deliveryAddress,
      contactName: order.contactName,
      deliveryWindowStart: order.deliveryWindowStart || undefined,
      deliveryWindowEnd: order.deliveryWindowEnd || undefined,
      totalPrice: order.totalPrice,
    }));

    // Step 4: Use our simple route optimizer
    const optimizedRoutes = await routeOptimizer.optimizeOrders(deliveryOrders, optimizationDate);
    console.log(`Simple route optimization created ${optimizedRoutes.length} routes`);
    console.log('Delivery orders passed to optimizer:', JSON.stringify(deliveryOrders, null, 2));
    console.log('Optimized routes returned:', JSON.stringify(optimizedRoutes, null, 2));

    // Step 5: Create Route Plans in Onfleet for each optimized route
    const createdRoutes = [];
    const teamId = process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS;
    
    if (!teamId) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: 'TEAM_ID_NOT_CONFIGURED',
            message: 'BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS team ID is not configured',
            details: {
              targetDate: optimizationDate.toISOString().split('T')[0],
              ordersProcessed: unassignedOrders.length,
            }
          }
        },
        { status: 500 }
      );
    }
    
    console.log(`Environment check:
      - ONFLEET_API_KEY: ${process.env.ONFLEET_API_KEY ? 'Set' : 'Missing'}
      - BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS: ${process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS || 'Missing'}
      - Using team ID: ${teamId}
      - Optimized routes to process: ${optimizedRoutes.length}`);

    for (const route of optimizedRoutes) {
      try {
        // Set start time to 30 minutes from now to ensure it's in the future
        const now = new Date();
        const thirtyMinutesFromNow = new Date(now.getTime() + (30 * 60 * 1000)); // 30 minutes from now
        const startTime = thirtyMinutesFromNow;

        console.log(`Route start time set to 30 minutes from now:
          - Current time (UTC): ${now.toISOString()}
          - Current time (PST): ${now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}
          - Start time (UTC): ${startTime.toISOString()}
          - Start time (PST): ${startTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}
          - Start time (Unix milliseconds): ${startTime.getTime()}`);

        console.log(`About to create Route Plan with parameters:`, {
          name: route.routeId,
          startTime: startTime.getTime(), // milliseconds
          tasks: route.orders.map(o => o.onfleetTaskId),
          team: teamId,
          color: '#28a745',
          vehicleType: 'CAR',
          timezone: 'America/Los_Angeles',
        });

        const routePlan = await createRoutePlan({
          name: route.routeId,
          startTime: startTime.getTime(), // Unix timestamp in milliseconds - correct format
          tasks: route.orders.map(o => o.onfleetTaskId),
          team: teamId, // Assign to team (no specific driver yet)
          color: '#28a745', // Green for packing supply routes
          vehicleType: 'CAR',
          timezone: 'America/Los_Angeles', // This handles PST/PDT automatically
        });

        console.log(`Successfully created Route Plan:`, routePlan);

        // Create database record for this route
        // No driver assigned yet - will be updated when driver accepts
        const dbRoute = await prisma.packingSupplyRoute.create({
          data: {
            routeId: route.routeId,
            driverId: null, // Use null as placeholder (no real driver has ID null)
            deliveryDate: optimizationDate,
            totalStops: route.orders.length,
            totalDistance: route.estimatedDistance,
            totalTime: route.estimatedDuration * 60, // Convert minutes to seconds
            routeStatus: 'optimized',
            onfleetOptimizationId: routePlan.id, // Store Route Plan ID
            driverOfferStatus: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Add order data to the route for processing
        const routeWithOrders = {
          ...dbRoute,
          orders: route.orders,
        };
        
        createdRoutes.push(routeWithOrders);
        console.log(`Created Route Plan ${routePlan.shortId} with ${route.orders.length} stops`);
      } catch (error) {
        console.error(`Failed to create route plan for ${route.routeId}:`, error);
        console.error('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        
        // Add failed route to response for debugging
        createdRoutes.push({
          routeId: route.routeId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          orders: route.orders,
        });
        // Continue with other routes even if one fails
      }
    }

    // Step 6: Update orders to mark as batch processed and assign to routes
    // Only process successfully created routes (not failed ones)
    const successfulRoutes = createdRoutes.filter((route: any) => !route.status || route.status !== 'failed');
    
    for (const route of successfulRoutes) {
      const routeOrderIds = route.orders.map((o: any) => o.id);
      
      await prisma.packingSupplyOrder.updateMany({
        where: {
          id: { in: routeOrderIds },
        },
        data: {
          batchProcessedAt: new Date(),
          routeId: route.routeId,
          status: 'Optimized', // New status to indicate ready for driver assignment
        },
      });

      // Update route stop numbers
      for (let i = 0; i < route.orders.length; i++) {
        await prisma.packingSupplyOrder.update({
          where: { id: route.orders[i].id },
          data: { routeStopNumber: i + 1 },
        });
      }
    }

    // Step 7: Trigger driver offers for successfully created routes
    const driverOfferResults = [];
    for (const route of successfulRoutes) {
      try {
        // Call driver offer endpoint to start the driver selection process
        // @REFACTOR-P9-TEMP: Update URL path when driver-offer route is migrated
        const driverOfferResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/packing-supplies/driver-offer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            routeId: route.routeId,
            source: source || 'batch_optimization',
          }),
        });

        if (driverOfferResponse.ok) {
          const offerResult = await driverOfferResponse.json();
          driverOfferResults.push({
            routeId: route.routeId,
            status: 'offer_sent',
            driverId: offerResult.driverId,
            expiresAt: offerResult.expiresAt,
          });
          console.log(`Driver offer sent for route ${route.routeId}`);
        } else {
          const errorData = await driverOfferResponse.json();
          driverOfferResults.push({
            routeId: route.routeId,
            status: 'offer_failed',
            error: errorData.message,
          });
          console.error(`Failed to send driver offer for route ${route.routeId}:`, errorData.message);
        }
      } catch (error: any) {
        driverOfferResults.push({
          routeId: route.routeId,
          status: 'offer_error',
          error: error.message,
        });
        console.error(`Error sending driver offer for route ${route.routeId}:`, error);
      }
    }

    const failedRoutes = createdRoutes.filter((route: any) => route.status === 'failed');
    
    return NextResponse.json<ApiResponse<{
      targetDate: string;
      ordersProcessed: number;
      routesCreated: number;
      routesFailed: number;
      successfulRouteIds: string[];
      failedRoutes: Array<{ routeId: string; error: string }>;
      driverOffers: any[];
      offersSuccessful: number;
      offersFailed: number;
      message: string;
    }>>({
      success: successfulRoutes.length > 0,
      data: {
        targetDate: optimizationDate.toISOString().split('T')[0],
        ordersProcessed: unassignedOrders.length,
        routesCreated: successfulRoutes.length,
        routesFailed: failedRoutes.length,
        successfulRouteIds: successfulRoutes.map((r: any) => r.routeId),
        failedRoutes: failedRoutes.map((r: any) => ({ routeId: r.routeId, error: r.error })),
        driverOffers: driverOfferResults,
        offersSuccessful: driverOfferResults.filter(r => r.status === 'offer_sent').length,
        offersFailed: driverOfferResults.filter(r => r.status !== 'offer_sent').length,
        message: `Processed ${unassignedOrders.length} orders: ${successfulRoutes.length} successful routes, ${failedRoutes.length} failed routes`,
      },
    });

  } catch (error: any) {
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json<ApiResponse<null>>(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: { errors: error.errors }
          }
        },
        { status: 400 }
      );
    }

    console.error('Error in batch optimization:', error);
    return NextResponse.json<ApiResponse<null>>(
      { 
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Unknown error occurred during optimization'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Create routes based on Onfleet optimization results
 * @REFACTOR-P9-TEMP: This function remains for potential future Onfleet premium optimization features
 */
async function createRoutesFromOptimization(
  optimizationId: string,
  optimizationResult: any,
  orders: any[],
  deliveryDate: Date
): Promise<any[]> {
  const routes = [];

  // Parse optimization results and create routes
  // Note: This is a simplified implementation - actual Onfleet optimization results
  // structure may vary and need to be adapted based on their API response
  const optimizedRoutes = optimizationResult.routes || [];

  for (let i = 0; i < optimizedRoutes.length; i++) {
    const optimizedRoute = optimizedRoutes[i];
    const routeId = `BATCH_${deliveryDate.toISOString().split('T')[0].replace(/-/g, '_')}_${String(i + 1).padStart(3, '0')}`;

    // Extract route metrics from optimization result
    const routeDistance = optimizedRoute.distance || 0; // in miles
    const routeTime = optimizedRoute.duration || 0; // in seconds
    const taskCount = optimizedRoute.tasks?.length || 0;

    // Create route record with optimization metadata
    const route = await prisma.packingSupplyRoute.create({
      data: {
        routeId,
        driverId: null, // Placeholder - will be assigned when driver accepts
        deliveryDate,
        totalStops: taskCount,
        totalDistance: routeDistance, // Store optimization distance
        totalTime: routeTime, // Store optimization time
        routeStatus: 'optimized', // New status for optimized but unassigned routes
        onfleetOptimizationId: optimizationId,
        driverOfferStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Update orders to link to this route with enhanced metadata
    if (optimizedRoute.tasks) {
      for (let taskIndex = 0; taskIndex < optimizedRoute.tasks.length; taskIndex++) {
        const taskId = optimizedRoute.tasks[taskIndex];
        const order = orders.find(o => o.onfleetTaskId === taskId);
        
        if (order) {
          await prisma.packingSupplyOrder.update({
            where: { id: order.id },
            data: {
              routeId: routeId,
              routeStopNumber: taskIndex + 1,
              status: 'Ready for Assignment', // Ready for driver assignment
              batchProcessedAt: new Date(),
              optimizationJobId: optimizationId,
            },
          });
        }
      }
    }

    routes.push(route);
    console.log(`Created route ${routeId} with ${taskCount} stops, ${routeDistance}mi, ${Math.round(routeTime/60)}min`);
  }

  return routes;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      targetDate: searchParams.get('targetDate'),
      status: searchParams.get('status')
    };

    // Validate query parameters
    const validatedParams = BatchOptimizeGetRequestSchema.parse(queryParams);
    const { targetDate, status } = validatedParams;

    const today = targetDate ? new Date(targetDate) : new Date();
    const startOfDay = new Date(today.toDateString());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    let whereClause: any = {
      deliveryDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    };

    if (status) {
      whereClause.status = status;
    }

    // Get optimization summary for the date
    const orders = await prisma.packingSupplyOrder.findMany({
      where: whereClause,
      include: {
        route: {
          select: {
            routeId: true,
            routeStatus: true,
            driverOfferStatus: true,
            onfleetOptimizationId: true,
          },
        },
      },
      orderBy: { orderDate: 'desc' },
    });

    const summary = {
      date: today.toISOString().split('T')[0],
      total: orders.length,
      pending: orders.filter(o => o.status === 'Pending').length,
      optimized: orders.filter(o => o.status === 'Optimized' || o.status === 'Ready for Assignment').length,
      assigned: orders.filter(o => o.assignedDriverId).length,
      batchProcessed: orders.filter(o => o.batchProcessedAt).length,
    };

    return NextResponse.json<ApiResponse<{
      summary: typeof summary;
      orders: typeof orders;
    }>>({
      success: true,
      data: {
        summary,
        orders,
      },
    });

  } catch (error: any) {
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json<ApiResponse<null>>(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: { errors: error.errors }
          }
        },
        { status: 400 }
      );
    }

    console.error('Error fetching optimization status:', error);
    return NextResponse.json<ApiResponse<null>>(
      { 
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Unknown error occurred'
        }
      },
      { status: 500 }
    );
  }
} 
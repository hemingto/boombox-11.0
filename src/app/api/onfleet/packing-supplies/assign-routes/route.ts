/**
 * @fileoverview Packing supply route assignment API - Manual assignment and batch optimization
 * @source boombox-10.0/src/app/api/packing-supplies/assign-routes/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint supporting two actions:
 * 1. assign_orders_to_route: Manually assign specific orders to a driver
 * 2. trigger_batch_optimization: Trigger automated batch optimization for a delivery date
 * GET endpoint: Fetch route assignment status with filtering options
 *
 * USED BY (boombox-10.0 files):
 * - src/app/admin/delivery-routes/page.tsx (Admin dashboard for route management)
 * - src/app/components/admin/delivery-routes/* (Route assignment UI components)
 * - src/app/admin/packing-supplies/* (Packing supply management interface)
 *
 * INTEGRATION NOTES:
 * - Uses route-manager service for route creation and order assignment
 * - Makes internal API calls to batch-optimize endpoint for automated optimization
 * - Critical Onfleet integration through route management system
 * - Database operations on PackingSupplyOrder and Driver tables
 *
 * @refactor Updated import paths, added Zod validation, preserved exact business logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateRouteForOrders } from '@/lib/services/route-manager';
import { prisma } from '@/lib/database/prismaClient';
import {
  AssignRoutesRequestSchema,
  AssignRoutesGetRequestSchema,
} from '@/lib/validations/api.validations';
import { ApiResponse } from '@/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validatedData = AssignRoutesRequestSchema.parse(body);
    const { action } = validatedData;

    if (action === 'assign_orders_to_route') {
      const { driverId, deliveryDate, orderIds } = validatedData;

      // Verify all orders exist and are in a state that can be manually assigned
      const orders = await prisma.packingSupplyOrder.findMany({
        where: {
          id: { in: orderIds },
          status: { in: ['Pending', 'Pending Batch'] }, // Allow both pending states
          routeId: null, // Not already assigned to a route
        },
      });

      if (orders.length !== orderIds.length) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: {
              code: 'ORDERS_NOT_AVAILABLE',
              message:
                'Some orders are not found, not available for assignment, or already assigned to routes',
            },
          },
          { status: 400 }
        );
      }

      // Verify driver exists
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { id: true, firstName: true, lastName: true },
      });

      if (!driver) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: {
              code: 'DRIVER_NOT_FOUND',
              message: 'Driver not found',
            },
          },
          { status: 404 }
        );
      }

      // Create or find route for these orders
      const routeId = await findOrCreateRouteForOrders(
        driverId,
        new Date(deliveryDate),
        orderIds
      );

      // Update orders with assigned driver and status
      await prisma.packingSupplyOrder.updateMany({
        where: { id: { in: orderIds } },
        data: {
          assignedDriverId: driverId,
          status: 'Assigned', // Update status to indicate manual assignment
        },
      });

      return NextResponse.json<
        ApiResponse<{
          routeId: string;
          driverId: number;
          driverName: string;
          orderIds: number[];
          deliveryDate: string;
          assignmentType: string;
          message: string;
        }>
      >({
        success: true,
        data: {
          routeId,
          driverId,
          driverName: `${driver.firstName} ${driver.lastName}`,
          orderIds,
          deliveryDate,
          assignmentType: 'manual',
          message: `Manually assigned ${orderIds.length} orders to route ${routeId}`,
        },
      });
    }

    if (action === 'trigger_batch_optimization') {
      const { deliveryDate } = validatedData;
      // Trigger the batch optimization process manually
      const targetDate = deliveryDate ? new Date(deliveryDate) : new Date();

      try {
        // Call the batch optimization endpoint
        const batchOptimizeResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/onfleet/packing-supplies/batch-optimize`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deliveryDate: targetDate.toISOString().split('T')[0],
              source: 'manual_trigger',
            }),
          }
        );

        if (!batchOptimizeResponse.ok) {
          const errorData = await batchOptimizeResponse.json();
          throw new Error(errorData.message || 'Batch optimization failed');
        }

        const batchOptimizeResult = await batchOptimizeResponse.json();

        return NextResponse.json<
          ApiResponse<{
            targetDate: string;
            optimizationResult: any;
            assignmentType: string;
            message: string;
          }>
        >({
          success: true,
          data: {
            targetDate: targetDate.toISOString().split('T')[0],
            optimizationResult: batchOptimizeResult,
            assignmentType: 'batch_optimization',
            message: 'Batch optimization triggered successfully',
          },
        });
      } catch (error: any) {
        console.error('Error triggering batch optimization:', error);
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: {
              code: 'BATCH_OPTIMIZATION_FAILED',
              message: 'Failed to trigger batch optimization',
              details: { originalError: error.message },
            },
          },
          { status: 500 }
        );
      }
    }

    // This should never be reached due to Zod validation, but keeping for safety
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message:
            'Invalid action. Use "assign_orders_to_route" or "trigger_batch_optimization"',
        },
      },
      { status: 400 }
    );
  } catch (error: any) {
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: { errors: error.errors },
          },
        },
        { status: 400 }
      );
    }

    console.error('Error assigning routes:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Unknown error occurred',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      deliveryDate: searchParams.get('deliveryDate'),
      status: searchParams.get('status'),
    };

    // Validate query parameters
    const validatedParams = AssignRoutesGetRequestSchema.parse(queryParams);
    const { deliveryDate, status } = validatedParams;

    const whereClause: any = {};

    if (deliveryDate) {
      const targetDate = new Date(deliveryDate);
      whereClause.deliveryDate = {
        gte: new Date(targetDate.toDateString()),
        lt: new Date(
          new Date(targetDate.toDateString()).getTime() + 24 * 60 * 60 * 1000
        ),
      };
    }

    if (status) {
      whereClause.status = status;
    }

    // Get orders with route assignment status
    const orders = await prisma.packingSupplyOrder.findMany({
      where: whereClause,
      include: {
        assignedDriver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        route: {
          select: {
            routeId: true,
            routeStatus: true,
            totalStops: true,
            completedStops: true,
          },
        },
      },
      orderBy: { orderDate: 'desc' },
    });

    // Group orders by route assignment status
    const unassignedOrders = orders.filter(order => !order.routeId);
    const assignedOrders = orders.filter(order => order.routeId);
    const pendingBatchOrders = orders.filter(
      order => order.status === 'Pending Batch'
    );

    return NextResponse.json<
      ApiResponse<{
        summary: {
          total: number;
          unassigned: number;
          assigned: number;
          pendingBatch: number;
        };
        orders: {
          unassigned: any[];
          assigned: any[];
          pendingBatch: any[];
        };
      }>
    >({
      success: true,
      data: {
        summary: {
          total: orders.length,
          unassigned: unassignedOrders.length,
          assigned: assignedOrders.length,
          pendingBatch: pendingBatchOrders.length,
        },
        orders: {
          unassigned: unassignedOrders,
          assigned: assignedOrders,
          pendingBatch: pendingBatchOrders,
        },
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
            details: { errors: error.errors },
          },
        },
        { status: 400 }
      );
    }

    console.error('Error fetching route assignment data:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Unknown error occurred',
        },
      },
      { status: 500 }
    );
  }
}

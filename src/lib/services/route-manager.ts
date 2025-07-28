/**
 * @fileoverview Packing supply route management service
 * @source boombox-10.0/src/lib/services/route-manager.ts
 * @refactor Updated import paths for boombox-11.0 structure
 */

import { prisma } from '@/lib/database/prismaClient';
import { PackingSupplyOrder, PackingSupplyRoute, Driver } from '@prisma/client';

export interface RouteCreationData {
  driverId: number;
  deliveryDate: Date;
  orders: {
    orderId: number;
    stopNumber: number;
  }[];
}

export interface RouteMetrics {
  totalDistance: number;    // in miles
  totalTime: number;        // in seconds
  actualStops: number;      // completed deliveries
  startTime: Date;
  endTime: Date;
}

export interface RouteCompletion {
  routeId: string;
  driverId: number;
  completedTasks: string[];
  totalStops: number;
  routeMetrics: RouteMetrics;
}

/**
 * Generate a human-readable route ID
 */
export function generateRouteId(deliveryDate: Date, driverId: number): string {
  const dateStr = deliveryDate.toISOString().split('T')[0].replace(/-/g, '_');
  const timeStr = Date.now().toString().slice(-4); // Last 4 digits for uniqueness
  return `ROUTE_${dateStr}_D${driverId}_${timeStr}`;
}

/**
 * Create a new packing supply route
 */
export async function createPackingSupplyRoute(data: RouteCreationData): Promise<PackingSupplyRoute> {
  const routeId = generateRouteId(data.deliveryDate, data.driverId);
  
  // Create the route
  const route = await prisma.packingSupplyRoute.create({
    data: {
      routeId,
      driverId: data.driverId,
      deliveryDate: data.deliveryDate,
      totalStops: data.orders.length,
      routeStatus: 'in_progress',
    },
  });

  // Update orders to be part of this route
  for (const orderData of data.orders) {
    await prisma.packingSupplyOrder.update({
      where: { id: orderData.orderId },
      data: {
        routeId: routeId,
        routeStopNumber: orderData.stopNumber,
      },
    });
  }

  console.log(`Created route ${routeId} with ${data.orders.length} stops for driver ${data.driverId}`);
  return route;
}

/**
 * Get route by route ID with all orders
 */
export async function getRouteWithOrders(routeId: string) {
  return await prisma.packingSupplyRoute.findUnique({
    where: { routeId },
    include: {
      driver: true,
      orders: {
        orderBy: { routeStopNumber: 'asc' },
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
}

/**
 * Check if a route is complete (all tasks finished)
 */
export async function checkRouteCompletion(routeId: string): Promise<{
  isComplete: boolean;
  completedStops: number;
  totalStops: number;
  pendingOrders: number[];
}> {
  const route = await prisma.packingSupplyRoute.findUnique({
    where: { routeId },
    include: {
      orders: {
        select: {
          id: true,
          status: true,
          actualDeliveryTime: true,
        },
      },
    },
  });

  if (!route) {
    throw new Error(`Route ${routeId} not found`);
  }

  const completedOrders = route.orders.filter(order => 
    order.status === 'Delivered' && order.actualDeliveryTime
  );
  const pendingOrders = route.orders
    .filter(order => order.status !== 'Delivered')
    .map(order => order.id);

  const isComplete = completedOrders.length === route.totalStops;

  return {
    isComplete,
    completedStops: completedOrders.length,
    totalStops: route.totalStops,
    pendingOrders,
  };
}

/**
 * Calculate total route metrics from completed tasks
 */
export async function calculateRouteMetrics(routeId: string): Promise<RouteMetrics | null> {
  const route = await getRouteWithOrders(routeId);
  
  if (!route) {
    throw new Error(`Route ${routeId} not found`);
  }

  const completedOrders = route.orders.filter(order => 
    order.status === 'Delivered' && order.actualDeliveryTime && order.routeMetrics
  );

  if (completedOrders.length === 0) {
    return null;
  }

  // Aggregate metrics from all completed orders
  let totalDistance = 0;
  let totalDrivingTime = 0;
  let earliestStart: Date | null = null;
  let latestEnd: Date | null = null;

  for (const order of completedOrders) {
    const metrics = order.routeMetrics as any;
    
    if (metrics?.drivingDistance) {
      // Convert meters to miles
      totalDistance += (metrics.drivingDistance * 0.000621371);
    }
    
    if (metrics?.drivingTime) {
      totalDrivingTime += metrics.drivingTime;
    }

    if (order.actualDeliveryTime) {
      if (!latestEnd || order.actualDeliveryTime > latestEnd) {
        latestEnd = order.actualDeliveryTime;
      }
      
      // For start time, we need to estimate based on delivery time and driving time
      const estimatedStartTime = new Date(
        order.actualDeliveryTime.getTime() - (metrics?.drivingTime || 1800) * 1000
      );
      
      if (!earliestStart || estimatedStartTime < earliestStart) {
        earliestStart = estimatedStartTime;
      }
    }
  }

  // Calculate total route time (from first start to last completion)
  const totalTime = earliestStart && latestEnd 
    ? Math.floor((latestEnd.getTime() - earliestStart.getTime()) / 1000)
    : totalDrivingTime;

  return {
    totalDistance,
    totalTime,
    actualStops: completedOrders.length,
    startTime: earliestStart || new Date(),
    endTime: latestEnd || new Date(),
  };
}

/**
 * Mark route as completed and update metrics
 */
export async function completeRoute(routeId: string, metrics: RouteMetrics): Promise<void> {
  await prisma.packingSupplyRoute.update({
    where: { routeId },
    data: {
      routeStatus: 'completed',
      completedStops: metrics.actualStops,
      totalDistance: metrics.totalDistance,
      totalTime: metrics.totalTime,
      startTime: metrics.startTime,
      endTime: metrics.endTime,
    },
  });

  console.log(`Route ${routeId} marked as completed with ${metrics.actualStops} stops`);
}

/**
 * Get all orders in a route by route ID
 */
export async function getOrdersInRoute(routeId: string): Promise<PackingSupplyOrder[]> {
  return await prisma.packingSupplyOrder.findMany({
    where: { routeId },
    orderBy: { routeStopNumber: 'asc' },
    include: {
      assignedDriver: true,
      orderDetails: {
        include: {
          product: true,
        },
      },
    },
  });
}

/**
 * Find or create route for orders on the same day/driver
 */
export async function findOrCreateRouteForOrders(
  driverId: number,
  deliveryDate: Date,
  orderIds: number[]
): Promise<string> {
  // Check if there's an existing in-progress route for this driver on this date
  const existingRoute = await prisma.packingSupplyRoute.findFirst({
    where: {
      driverId,
      deliveryDate: {
        gte: new Date(deliveryDate.toDateString()), // Start of day
        lt: new Date(new Date(deliveryDate.toDateString()).getTime() + 24 * 60 * 60 * 1000), // End of day
      },
      routeStatus: 'in_progress',
    },
    include: {
      orders: true,
    },
  });

  if (existingRoute) {
    // Add orders to existing route
    const nextStopNumber = existingRoute.orders.length + 1;
    
    for (let i = 0; i < orderIds.length; i++) {
      await prisma.packingSupplyOrder.update({
        where: { id: orderIds[i] },
        data: {
          routeId: existingRoute.routeId,
          routeStopNumber: nextStopNumber + i,
        },
      });
    }

    // Update total stops count
    await prisma.packingSupplyRoute.update({
      where: { routeId: existingRoute.routeId },
      data: {
        totalStops: existingRoute.totalStops + orderIds.length,
      },
    });

    console.log(`Added ${orderIds.length} orders to existing route ${existingRoute.routeId}`);
    return existingRoute.routeId;
  } else {
    // Create new route
    const routeData: RouteCreationData = {
      driverId,
      deliveryDate,
      orders: orderIds.map((orderId, index) => ({
        orderId,
        stopNumber: index + 1,
      })),
    };

    const newRoute = await createPackingSupplyRoute(routeData);
    return newRoute.routeId;
  }
} 
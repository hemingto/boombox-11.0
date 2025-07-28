/**
 * @fileoverview Onfleet integration utility functions
 * @source boombox-10.0/src/app/api/onfleet/dispatch-team/route.ts (dispatch functions)
 * @source boombox-10.0/src/app/api/onfleet/test-connection/route.ts (connection testing)
 * @source boombox-10.0/src/app/api/onfleet/calculate-payout/route.ts (payout calculations)
 * @refactor Consolidated Onfleet utilities from multiple API routes
 */

import { prisma } from '@/lib/database/prismaClient';

// Types and interfaces
export interface OnfleetDispatchResult {
  routeId: string;
  orderIds: number[];
  assignedDriverId?: number | null;
  estimatedServiceTime: number;
  totalCapacity: {
    weight: number;
    volume: number;
    itemCount: number;
  };
  onfleetDispatchResult?: any;
}

export interface OnfleetDispatchSummary {
  totalOrders: number;
  dispatchedOrders: number;
  overflowOrders: number;
  availableDrivers: number;
  routesCreated: number;
}

export interface PayoutStatistics {
  allTime: {
    totalPayouts: number;
    totalAmount: number;
    averageAmount: number;
  };
  last30Days: {
    totalPayouts: number;
    totalAmount: number;
    averageAmount: number;
  };
  pending: {
    count: number;
    needsAttention: boolean;
  };
  failed: {
    count: number;
    needsAttention: boolean;
  };
}

/**
 * Check if current time allows dispatch (12 PM PST or later)
 */
export function isValidDispatchTime(): boolean {
  const now = new Date();
  const pstTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  return pstTime.getHours() >= 12;
}

/**
 * Execute team auto-dispatch for a specific route
 */
export async function executeTeamDispatch(
  route: any,
  onfleetClient: any,
  dispatchId: string
): Promise<OnfleetDispatchResult> {
  const teamId = process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS;
  
  if (!teamId) {
    throw new Error('Team ID not configured');
  }

  // Get task IDs for the orders in this route
  const taskIds = await prisma.packingSupplyOrder.findMany({
    where: {
      id: {
        in: route.orders.map((o: any) => o.orderId),
      },
    },
    select: {
      id: true,
      onfleetTaskId: true,
    },
  });

  const validTaskIds = taskIds
    .filter((task: { id: number; onfleetTaskId: string | null }) => task.onfleetTaskId)
    .map((task: { id: number; onfleetTaskId: string | null }) => task.onfleetTaskId!);

  if (validTaskIds.length === 0) {
    throw new Error('No valid Onfleet tasks found for route');
  }

  // Execute team auto-dispatch
  const dispatchResult = await onfleetClient.autoDispatchTeam(teamId, {
    taskIds: validTaskIds,
    mode: 'load', // Load balancing mode
    considerDependencies: false,
    restrictAutoAssignmentToTeam: true,
  });

  console.log(`📋 Dispatched ${validTaskIds.length} tasks to team ${teamId}`);

  return {
    routeId: `route_${dispatchId}_${Date.now()}`,
    orderIds: route.orders.map((o: any) => o.orderId),
    assignedDriverId: dispatchResult.assignedWorkers?.[0]?.id || null,
    estimatedServiceTime: route.orders.reduce((sum: number, o: any) => sum + o.estimatedServiceTime, 0),
    totalCapacity: {
      weight: route.totalCapacity.totalWeight,
      volume: route.totalCapacity.totalVolume,
      itemCount: route.totalCapacity.itemCount,
    },
    onfleetDispatchResult: dispatchResult,
  };
}

/**
 * Update order statuses after dispatch
 */
export async function updateOrdersAfterDispatch(
  orderIds: number[],
  status: string,
  assignedDriverId?: number | null,
  newDeliveryDate?: Date
): Promise<void> {
  await prisma.packingSupplyOrder.updateMany({
    where: {
      id: {
        in: orderIds,
      },
    },
    data: {
      status,
      assignedDriverId,
      ...(newDeliveryDate && { deliveryDate: newDeliveryDate }),
    },
  });
}

/**
 * Log dispatch results for monitoring and analytics
 */
export async function logDispatchResults(
  dispatchId: string,
  targetDate: string,
  summary: OnfleetDispatchSummary,
  results: any
): Promise<void> {
  // This could be enhanced to store in a dedicated dispatch log table
  console.log(`📊 Dispatch Log ${dispatchId}:`, {
    targetDate,
    summary,
    routeCount: results.routes.length,
    overflowCount: results.overflow.length,
    warningCount: results.warnings.length,
    errorCount: results.errors.length,
  });
  
  // TODO: Store in database dispatch log table for analytics
}

/**
 * Get overall payout statistics
 */
export async function getPayoutStatistics(): Promise<PayoutStatistics> {
  const [totalStats, recentStats] = await Promise.all([
    // All time stats
    prisma.packingSupplyOrder.aggregate({
      where: {
        status: 'Delivered',
        driverPayoutStatus: 'completed'
      },
      _sum: {
        driverPayoutAmount: true
      },
      _count: {
        id: true
      }
    }),
    
    // Last 30 days stats
    prisma.packingSupplyOrder.aggregate({
      where: {
        status: 'Delivered',
        driverPayoutStatus: 'completed',
        actualDeliveryTime: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        }
      },
      _sum: {
        driverPayoutAmount: true
      },
      _count: {
        id: true
      }
    })
  ]);

  const [pendingCount, failedCount] = await Promise.all([
    prisma.packingSupplyOrder.count({
      where: {
        status: 'Delivered',
        driverPayoutStatus: 'pending'
      }
    }),
    
    prisma.packingSupplyOrder.count({
      where: {
        status: 'Delivered',
        driverPayoutStatus: 'failed'
      }
    })
  ]);

  return {
    allTime: {
      totalPayouts: totalStats._count.id,
      totalAmount: parseFloat(totalStats._sum.driverPayoutAmount?.toString() || '0'),
      averageAmount: totalStats._count.id > 0 
        ? parseFloat(totalStats._sum.driverPayoutAmount?.toString() || '0') / totalStats._count.id
        : 0
    },
    last30Days: {
      totalPayouts: recentStats._count.id,
      totalAmount: parseFloat(recentStats._sum.driverPayoutAmount?.toString() || '0'),
      averageAmount: recentStats._count.id > 0 
        ? parseFloat(recentStats._sum.driverPayoutAmount?.toString() || '0') / recentStats._count.id
        : 0
    },
    pending: {
      count: pendingCount,
      needsAttention: pendingCount > 0
    },
    failed: {
      count: failedCount,
      needsAttention: failedCount > 0
    }
  };
}

/**
 * Get recent dispatch history
 */
export async function getRecentDispatchHistory(limit: number = 10) {
  return await prisma.packingSupplyOrder.groupBy({
    by: ['deliveryDate', 'status'],
    where: {
      deliveryDate: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      deliveryDate: 'desc',
    },
  });
}

/**
 * Get dispatch details by date
 */
export async function getDispatchDetailsByDate(date: string, limit: number = 10) {
  return await prisma.packingSupplyOrder.findMany({
    where: {
      deliveryDate: {
        gte: new Date(date),
      },
    },
    include: {
      assignedDriver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { orderDate: 'desc' },
    take: limit,
  });
}

// Constants
export const ONFLEET_DISPATCH_CONSTANTS = {
  PST_DISPATCH_HOUR: 12,
  DEFAULT_DISPATCH_MODE: 'load',
  ROUTE_PREFIX: 'route_',
} as const; 
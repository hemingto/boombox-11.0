/**
 * @fileoverview Driver notification utilities for packing supply routes
 * @source boombox-10.0/src/app/api/packing-supplies/driver-response/route.ts (findAndNotifyNextDriver, notifyAdminNoDrivers)
 * @source boombox-10.0/src/app/api/packing-supplies/handle-expired-offers/route.ts (findAndNotifyNextDriverForExpiredRoute, notifyAdminNoDriversForExpiredRoute)
 * @refactor Consolidated driver notification and admin notification utilities
 */

import { prisma } from '@/lib/database/prismaClient';

// Types for driver notification functionality
export interface DriverNotificationResult {
  success: boolean;
  message: string;
  driverName?: string;
}

export interface RouteDriverNotificationOptions {
  excludeDriverIds?: number[];
  deliveryDate: Date;
  routeId: string;
  context: 'decline' | 'expired' | 'failed';
}

export interface AdminNotificationOptions {
  routeId: string;
  deliveryDate: Date;
  totalStops: number;
  reason: string;
  source?: string;
}

/**
 * Find and notify the next available driver for a packing supply route
 * Consolidates findAndNotifyNextDriver and findAndNotifyNextDriverForExpiredRoute
 */
export async function findAndNotifyNextDriverForRoute(options: RouteDriverNotificationOptions): Promise<DriverNotificationResult> {
  try {
    const { deliveryDate, routeId, excludeDriverIds = [], context } = options;
    const dayOfWeek = deliveryDate.toLocaleDateString('en-US', { weekday: 'long' });
    const startOfDay = new Date(deliveryDate.toDateString());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Find available drivers (excluding previously notified)
    const availableDrivers = await prisma.driver.findMany({
      where: {
        isApproved: true,
        status: 'Active',
        applicationComplete: true,
        stripeConnectPayoutsEnabled: true,
        phoneNumber: { not: null },
        onfleetWorkerId: { not: null },
        onfleetTeamIds: {
          has: process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS || '',
        },
        id: excludeDriverIds.length > 0 ? { notIn: excludeDriverIds } : undefined,
        availability: {
          some: {
            dayOfWeek,
            isBlocked: false,
            startTime: { lte: '12:00' },
            endTime: { gte: '19:00' },
          },
        },
        packingSupplyRoutes: {
          none: {
            deliveryDate: {
              gte: startOfDay,
              lt: endOfDay,
            },
            routeStatus: { in: ['optimized', 'in_progress', 'assigned'] },
            driverOfferStatus: { in: ['pending', 'sent', 'accepted'] },
          },
        },
      },
      orderBy: [
        { averageRating: 'desc' },
        { completedPackingSupplyJobs: 'desc' },
      ],
    });

    if (availableDrivers.length === 0) {
      // No more drivers available - notify admin
      await notifyAdminNoDriversForRoute({
        routeId,
        deliveryDate,
        totalStops: 0, // Will be fetched by admin notification
        reason: getNoDriverReason(context),
        source: context === 'expired' ? 'expired_offer_cleanup' : 'driver_response',
      });

      return {
        success: false,
        message: 'No more available drivers found. Admin has been notified.',
      };
    }

    // Send offer to next driver by calling the API endpoint
    const nextDriver = availableDrivers[0];
    try {
      const driverOfferResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/onfleet/packing-supplies/driver-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeId,
          targetDate: deliveryDate.toISOString(),
        }),
      });

      if (driverOfferResponse.ok) {
        const offerResult = await driverOfferResponse.json();
        return {
          success: true,
          message: `Offer sent to ${nextDriver.firstName} ${nextDriver.lastName}`,
          driverName: `${nextDriver.firstName} ${nextDriver.lastName}`,
        };
      } else {
        const errorData = await driverOfferResponse.json();
        return {
          success: false,
          message: `Failed to send offer: ${errorData.error}`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Error sending offer: ${error.message}`,
      };
    }

  } catch (error: any) {
    console.error('Error finding next driver for route:', error);
    return {
      success: false,
      message: `Error finding next driver: ${error.message}`,
    };
  }
}

/**
 * Notify admin that no drivers are available for a route
 * Consolidates notifyAdminNoDrivers and notifyAdminNoDriversForExpiredRoute
 */
export async function notifyAdminNoDriversForRoute(options: AdminNotificationOptions): Promise<void> {
  try {
    const { routeId, deliveryDate, totalStops, reason, source } = options;

    // If totalStops is 0, fetch it from the route
    let actualTotalStops = totalStops;
    if (totalStops === 0) {
      const route = await prisma.packingSupplyRoute.findUnique({
        where: { routeId },
        select: { totalStops: true },
      });
      actualTotalStops = route?.totalStops || 0;
    }

    // Call admin notification endpoint
    const adminNotifyResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/notify-no-driver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routeId,
        deliveryDate,
        totalStops: actualTotalStops,
        reason,
        source,
      }),
    });

    if (!adminNotifyResponse.ok) {
      console.error('Failed to notify admin about route:', await adminNotifyResponse.text());
    } else {
      console.log(`Admin notified about unassigned route ${routeId} (${reason})`);
    }
  } catch (error) {
    console.error('Error notifying admin about route:', error);
  }
}

/**
 * Verify JWT token for driver route offers
 */
export function verifyDriverOfferToken(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return { valid: false, error: 'Invalid JWT format' };
    }
    
    // Decode the payload (second part)
    const payload = tokenParts[1];
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = JSON.parse(atob(paddedPayload));
    
    // Check if token has expired
    const now = Date.now();
    if (decoded.expiresAt && now > decoded.expiresAt) {
      return { valid: false, error: 'Token has expired' };
    }
    
    return { valid: true, payload: decoded };
  } catch (error) {
    return { valid: false, error: 'Invalid token format' };
  }
}

/**
 * Format route metrics for display
 */
export function formatRouteMetrics(
  totalStops: number,
  totalDistance?: number,
  totalTime?: number
): {
  estimatedMiles: number;
  estimatedDuration: string;
  estimatedPayout: string;
} {
  const estimatedMiles = totalDistance ? Math.round(parseFloat(totalDistance.toString())) : 0;
  const estimatedDurationMinutes = totalTime ? Math.ceil(totalTime / 60) : (totalStops * 15); // 15 min per stop fallback
  const estimatedDuration = `${Math.floor(estimatedDurationMinutes / 60)}h ${estimatedDurationMinutes % 60}m`;
  
  // Calculate payout estimate ($15 per stop + $0.50 per mile)
  const basePayPerStop = 15;
  const mileageRate = 0.50;
  const estimatedPayout = `$${Math.round((totalStops * basePayPerStop) + (estimatedMiles * mileageRate))}`;
  
  return {
    estimatedMiles,
    estimatedDuration,
    estimatedPayout,
  };
}

/**
 * Helper function to generate appropriate reason message for no driver situations
 */
function getNoDriverReason(context: 'decline' | 'expired' | 'failed'): string {
  switch (context) {
    case 'decline':
      return 'All drivers declined the route offer';
    case 'expired':
      return 'Driver offer expired and no more drivers available';
    case 'failed':
      return 'Driver assignment failed and no more drivers available';
    default:
      return 'No drivers available for route';
  }
} 
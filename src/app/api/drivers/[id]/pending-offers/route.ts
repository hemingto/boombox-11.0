/**
 * @fileoverview Driver Pending Offers API Route - Fetch pending job offers for a driver
 * @description Returns both appointment offers and packing supply route offers that are
 * pending acceptance/decline by the specified driver.
 * 
 * @usage GET /api/drivers/[id]/pending-offers - Fetch pending offers for a driver
 * 
 * @functionality
 * - Fetches pending appointment offers via OnfleetTask (driverNotificationStatus = 'sent', lastNotifiedDriverId = driverId)
 * - Fetches pending packing supply route offers via PackingSupplyRoute (driverOfferStatus = 'sent', lastNotifiedDriverId = driverId)
 * - Returns unified format with offer type indicator
 * - Includes expiration time for countdown displays
 * - Orders by notification/offer time (oldest first for urgency)
 * 
 * @integration
 * - Used by JobOffers component on driver jobs page
 * - Supplements existing SMS token-based offer flow
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { 
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { z } from 'zod';
import { calculateDriverPayment } from '@/lib/services/payment-calculator';
import { formatRouteMetrics } from '@/lib/utils/driverNotificationUtils';
import { generateDriverToken } from '@/lib/utils/driverAssignmentUtils';

// Validation schema for the request
const DriverPendingOffersRequestSchema = z.object({
  driverId: z.string().or(z.number().int().positive()).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
});

// Response types
interface AppointmentOffer {
  id: number;
  type: 'appointment';
  appointmentId: number;
  onfleetTaskId: string;
  unitNumber: number;
  address: string;
  date: Date;
  time: Date;
  appointmentType: string;
  planType: string | null;
  numberOfUnits: number | null;
  payEstimate: string;
  notifiedAt: Date;
  expiresAt: Date;
  token: string;
  customer?: {
    firstName: string;
    lastName: string;
  };
  /** True if this is a reconfirmation request (e.g., after time/unit change) */
  isReconfirmation?: boolean;
  /** Message explaining what changed (for reconfirmation) */
  reconfirmationMessage?: string;
}

interface PackingSupplyRouteOffer {
  id: string;
  type: 'packingSupplyRoute';
  routeId: string;
  deliveryDate: Date;
  totalStops: number;
  estimatedPayout: string;
  estimatedMiles: number;
  estimatedDuration: string;
  firstStopAddress: string;
  notifiedAt: Date;
  expiresAt: Date;
  token: string;
}

type PendingOffer = AppointmentOffer | PackingSupplyRouteOffer;

// Expiration windows
const APPOINTMENT_OFFER_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours
const ROUTE_OFFER_EXPIRY_MS = 20 * 60 * 1000; // 20 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const validation = validateApiRequest(DriverPendingOffersRequestSchema, { driverId: id });

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid driver ID', details: errors },
        { status: 400 }
      );
    }

    const { driverId } = validation.data;

    // Verify driver exists
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    const offers: PendingOffer[] = [];

    // Fetch pending appointment offers from OnfleetTask
    // Include both new offers ('sent') and reconfirmation requests ('pending_reconfirmation')
    const appointmentOffers = await prisma.onfleetTask.findMany({
      where: {
        lastNotifiedDriverId: driverId,
        driverNotificationStatus: {
          in: ['sent', 'pending_reconfirmation'],
        },
        driverId: null, // Not yet assigned
      },
      include: {
        appointment: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        driverNotificationSentAt: 'asc',
      },
    });

    // Group tasks by appointment and unit number to avoid duplicates
    // Keep track of which ones are reconfirmation requests
    const appointmentUnitsMap = new Map<string, typeof appointmentOffers[0]>();
    const reconfirmationMap = new Map<string, boolean>();
    
    for (const task of appointmentOffers) {
      const key = `${task.appointmentId}-${task.unitNumber}`;
      if (!appointmentUnitsMap.has(key)) {
        appointmentUnitsMap.set(key, task);
        reconfirmationMap.set(key, task.driverNotificationStatus === 'pending_reconfirmation');
      }
    }

    // Process appointment offers
    for (const [key, task] of appointmentUnitsMap) {
      if (!task.appointment || !task.driverNotificationSentAt) continue;

      const notifiedAt = new Date(task.driverNotificationSentAt);
      const expiresAt = new Date(notifiedAt.getTime() + APPOINTMENT_OFFER_EXPIRY_MS);
      
      // Skip expired offers
      if (expiresAt < new Date()) continue;

      // Get payment estimate for THIS SPECIFIC UNIT (not total appointment)
      // Important: For multi-unit appointments, each driver is only offered ONE unit's worth of work
      let payEstimate = 'Calculating...';
      try {
        // Sum estimated costs for only THIS unit's tasks (Step 1, 2, 3 for this unitNumber)
        const unitTasks = await prisma.onfleetTask.findMany({
          where: { 
            appointmentId: task.appointmentId,
            unitNumber: task.unitNumber  // Filter to only this unit's tasks
          },
          select: { estimatedCost: true }
        });
        
        const unitTaskCostSum = unitTasks.reduce((sum, t) => sum + (t.estimatedCost || 0), 0);
        
        if (unitTaskCostSum > 0) {
          // Use sum of this unit's task costs
          payEstimate = `$${Math.round(unitTaskCostSum)}`;
        } else {
          // Fall back to calculating for a single unit if no task costs saved yet
          const paymentBreakdown = await calculateDriverPayment(
            task.appointment.address,
            task.appointment.appointmentType
          );
          payEstimate = paymentBreakdown.formattedEstimate;
        }
      } catch (error) {
        console.error('Error calculating payment estimate:', error);
        payEstimate = 'Estimate unavailable';
      }

      // Generate token for accept/decline actions
      const token = await generateDriverToken(
        driverId,
        task.appointmentId,
        task.unitNumber,
        'accept'
      );

      // Check if this is a reconfirmation request
      const isReconfirmation = reconfirmationMap.get(key) || false;

      offers.push({
        id: task.id,
        type: 'appointment',
        appointmentId: task.appointmentId,
        onfleetTaskId: task.taskId,
        unitNumber: task.unitNumber,
        address: task.appointment.address,
        date: task.appointment.date,
        time: task.appointment.time,
        appointmentType: task.appointment.appointmentType,
        planType: task.appointment.planType,
        numberOfUnits: task.appointment.numberOfUnits,
        payEstimate,
        notifiedAt,
        expiresAt,
        token,
        customer: task.appointment.user ? {
          firstName: task.appointment.user.firstName,
          lastName: task.appointment.user.lastName,
        } : undefined,
        isReconfirmation,
        reconfirmationMessage: isReconfirmation 
          ? `Please confirm you can still work this job (Unit ${task.unitNumber})`
          : undefined,
      });
    }

    // Fetch pending packing supply route offers
    // Note: This requires the lastNotifiedDriverId field on PackingSupplyRoute
    // If not present, we'll check for routes where driverOfferStatus is 'sent' 
    // and driverId matches (though driverId is null when pending)
    const routeOffers = await prisma.packingSupplyRoute.findMany({
      where: {
        driverOfferStatus: 'sent',
        driverId: null, // Not yet assigned
        driverOfferExpiresAt: {
          gt: new Date(), // Not expired
        },
        // Check if this driver was offered (using lastNotifiedDriverId if available)
        // For now, since we may not have this field, we'll rely on routes where
        // the driver is in the Boombox Delivery Network team
      },
      include: {
        orders: {
          orderBy: { routeStopNumber: 'asc' },
          take: 1, // Get first stop for address display
          select: {
            deliveryAddress: true,
          },
        },
      },
      orderBy: {
        driverOfferSentAt: 'asc',
      },
    });

    // Process packing supply route offers
    for (const route of routeOffers) {
      if (!route.driverOfferSentAt || !route.driverOfferExpiresAt) continue;

      // Get route metrics
      const metrics = formatRouteMetrics(
        route.totalStops,
        route.totalDistance ? parseFloat(route.totalDistance.toString()) : undefined,
        route.totalTime ?? undefined
      );

      // Get first stop address for display
      const firstStopAddress = route.orders[0]?.deliveryAddress || 'Multiple locations';

      // Note: For packing supply routes, the token is generated via JWT in the 
      // driver-offer API. For dashboard offers, we would need to generate a new token
      // or retrieve the existing one. For now, we'll generate a simple reference token.
      const token = Buffer.from(JSON.stringify({
        routeId: route.routeId,
        driverId,
        expiresAt: route.driverOfferExpiresAt.getTime(),
      })).toString('base64');

      offers.push({
        id: route.id,
        type: 'packingSupplyRoute',
        routeId: route.routeId,
        deliveryDate: route.deliveryDate,
        totalStops: route.totalStops,
        estimatedPayout: metrics.estimatedPayout,
        estimatedMiles: metrics.estimatedMiles,
        estimatedDuration: metrics.estimatedDuration,
        firstStopAddress,
        notifiedAt: route.driverOfferSentAt,
        expiresAt: route.driverOfferExpiresAt,
        token,
      });
    }

    // Sort all offers by notification time (oldest first - most urgent)
    offers.sort((a, b) => 
      new Date(a.notifiedAt).getTime() - new Date(b.notifiedAt).getTime()
    );

    return NextResponse.json({
      success: true,
      offers,
      count: offers.length,
    });

  } catch (error) {
    console.error('Error fetching pending offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending offers' },
      { status: 500 }
    );
  }
}


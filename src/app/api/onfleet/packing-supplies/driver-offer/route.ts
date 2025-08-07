/**
 * @fileoverview Driver offer system for packing supply routes
 * @source boombox-10.0/src/app/api/packing-supplies/driver-offer/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint: Complex driver selection and SMS offer system:
 * 1. Validate route and check offer status
 * 2. Find available drivers with comprehensive filtering (approval, team, availability, conflicts)
 * 3. Score and rank drivers based on rating, experience, and recent activity
 * 4. Generate JWT offer tokens with expiration
 * 5. Send SMS offers using Twilio with route details and payout estimates
 * 6. Update route status and track offer expiration
 * GET endpoint: Fetch driver offer status and route summaries with filtering
 *
 * USED BY (boombox-10.0 files):
 * - src/app/api/packing-supplies/batch-optimize/route.ts (Step 7: automatic driver offers)
 * - src/app/admin/delivery-routes/page.tsx (Manual driver offer triggering)
 * - src/cron/daily-dispatch.ts (Automated daily driver assignment)
 *
 * INTEGRATION NOTES:
 * - Critical Twilio SMS integration for driver notifications
 * - JWT token system for secure offer acceptance/decline
 * - Complex driver scoring algorithm with multiple criteria
 * - Onfleet team filtering for packing supply drivers
 * - Environment variables: BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS, JWT_SECRET, TWILIO_PHONE_NUMBER
 *
 * @refactor Updated import paths, extracted utilities, added messaging templates, preserved business logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { driverOfferTemplate } from '@/lib/messaging/templates/sms/packing-supply';
import {
  calculateRoutePayoutEstimate,
  calculateEstimatedDuration,
  // formatRouteSummary, // Not exported from packingSupplyUtils
  getDeliveryArea,
} from '@/lib/utils/packingSupplyUtils';
import {
  DriverOfferRequestSchema,
  DriverOfferGetRequestSchema,
} from '@/lib/validations/api.validations';
import { ApiResponse } from '@/types/api.types';
import jwt from 'jsonwebtoken';

const OFFER_TIMEOUT_MINUTES = 20;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validatedData = DriverOfferRequestSchema.parse(body);
    const { routeId, targetDate, source } = validatedData;

    // Get the route details
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

    if (!route) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: 'ROUTE_NOT_FOUND',
            message: 'Route not found',
          },
        },
        { status: 404 }
      );
    }

    if (route.driverOfferStatus !== 'pending') {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: 'ROUTE_OFFER_NOT_PENDING',
            message: `Route already has offer status: ${route.driverOfferStatus}`,
          },
        },
        { status: 400 }
      );
    }

    // Find available drivers for packing supply deliveries with enhanced filtering
    const deliveryDate = targetDate ? new Date(targetDate) : route.deliveryDate;
    // Fix timezone issue - use UTC methods to get correct day of week
    const dayOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ][deliveryDate.getUTCDay()];
    const startOfDay = new Date(deliveryDate.toDateString());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Get candidate drivers with comprehensive filtering
    const candidateDrivers = await prisma.driver.findMany({
      where: {
        isApproved: true,
        status: 'Active',
        applicationComplete: true,
        // stripeConnectPayoutsEnabled: true, // Temporarily disabled for testing
        phoneNumber: { not: null }, // Must have phone number
        onfleetWorkerId: { not: null }, // Must have Onfleet worker ID
        onfleetTeamIds: {
          has: process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS || '',
        },
        availability: {
          some: {
            dayOfWeek,
            isBlocked: false,
            // Ensure they're available during some delivery hours (flexible scheduling)
            startTime: { lte: '12:00' }, // Start by 12 PM
            endTime: { gte: '15:00' }, // Available until at least 3 PM
          },
        },
        // Exclude drivers with conflicting routes
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
      include: {
        availability: {
          where: {
            dayOfWeek,
            isBlocked: false,
          },
        },
        packingSupplyRoutes: {
          where: {
            deliveryDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
            routeStatus: 'completed',
          },
          select: {
            routeId: true,
            deliveryDate: true,
            totalStops: true,
          },
        },
      },
    });

    // DEBUG: Log what we found
    console.log(
      `DEBUG: Found ${candidateDrivers.length} candidate drivers for ${dayOfWeek}`
    );
    console.log(
      `DEBUG: Team ID being searched: ${process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS}`
    );

    // Let's also get ALL drivers to see what's in the system
    const allDrivers = await prisma.driver.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isApproved: true,
        status: true,
        applicationComplete: true,
        phoneNumber: true,
        onfleetWorkerId: true,
        onfleetTeamIds: true,
      },
    });

    console.log(`DEBUG: Total drivers in system: ${allDrivers.length}`);
    allDrivers.forEach(driver => {
      console.log(
        `DEBUG: Driver ${driver.id} (${driver.firstName} ${driver.lastName}):`,
        {
          isApproved: driver.isApproved,
          status: driver.status,
          applicationComplete: driver.applicationComplete,
          hasPhone: !!driver.phoneNumber,
          hasOnfleetWorker: !!driver.onfleetWorkerId,
          teamIds: driver.onfleetTeamIds,
          hasTargetTeam: driver.onfleetTeamIds?.includes(
            process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS || ''
          ),
        }
      );
    });

    // Enhanced driver sorting with multiple criteria
    const availableDrivers = candidateDrivers
      .map(driver => {
        // Calculate recent performance metrics
        const recentRoutes = driver.packingSupplyRoutes.length;
        const totalRecentStops = driver.packingSupplyRoutes.reduce(
          (sum, route) => sum + route.totalStops,
          0
        );
        const avgStopsPerRoute =
          recentRoutes > 0 ? totalRecentStops / recentRoutes : 0;

        // Calculate availability score (more available hours = higher score)
        const availabilityScore = driver.availability.reduce((score, avail) => {
          const start = parseInt(avail.startTime.split(':')[0]);
          const end = parseInt(avail.endTime.split(':')[0]);
          return score + (end - start);
        }, 0);

        // Calculate overall score for ranking
        const ratingScore = (driver.averageRating || 0) * 20; // Max 100 points
        const experienceScore = Math.min(
          driver.completedPackingSupplyJobs * 2,
          50
        ); // Max 50 points
        const recentActivityScore = Math.min(recentRoutes * 5, 30); // Max 30 points
        const availabilityBonus = Math.min(availabilityScore * 2, 20); // Max 20 points

        const totalScore =
          ratingScore +
          experienceScore +
          recentActivityScore +
          availabilityBonus;

        return {
          ...driver,
          recentRoutes,
          avgStopsPerRoute,
          availabilityScore,
          totalScore,
        };
      })
      .sort((a, b) => {
        // Primary sort: Total score (highest first)
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        // Secondary sort: Average rating (highest first)
        if ((b.averageRating || 0) !== (a.averageRating || 0)) {
          return (b.averageRating || 0) - (a.averageRating || 0);
        }
        // Tertiary sort: Experience (most experienced first)
        return b.completedPackingSupplyJobs - a.completedPackingSupplyJobs;
      });

    if (availableDrivers.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: 'NO_AVAILABLE_DRIVERS',
            message: 'No available drivers found for this route',
          },
        },
        { status: 400 }
      );
    }

    // Calculate payout estimate for the route
    const payoutEstimate = calculateRoutePayoutEstimate(route);

    // Get the first available driver
    const selectedDriver = availableDrivers[0];

    if (!selectedDriver.phoneNumber) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: 'DRIVER_NO_PHONE',
            message: 'Selected driver has no phone number',
          },
        },
        { status: 400 }
      );
    }

    // Generate secure offer token
    const tokenPayload = {
      routeId: route.routeId,
      driverId: selectedDriver.id,
      action: 'packing_supply_route_offer',
      timestamp: Date.now(),
      expiresAt: Date.now() + OFFER_TIMEOUT_MINUTES * 60 * 1000,
    };

    const offerToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: `${OFFER_TIMEOUT_MINUTES}m` }
    );

    // Create offer URLs
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://app.boomboxstorage.com';
    const offerUrl = `${baseUrl}/driver/packing-supply-offer/${offerToken}`;

    // Format route summary and delivery area using extracted utilities
    // Extract delivery area from route data - use a fallback since address structure varies
    const firstOrderAddress =
      route.orders?.[0]?.deliveryAddress || 'Unknown Area';
    const deliveryArea = getDeliveryArea(firstOrderAddress);
    const estimatedDuration = calculateEstimatedDuration(route);
    const formattedDate = deliveryDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
    });

    // Send SMS using centralized messaging template
    const templateVariables = {
      totalStops: route.totalStops.toString(),
      deliveryArea,
      formattedDate,
      payoutEstimate,
      estimatedDuration,
      offerUrl,
      timeoutMinutes: OFFER_TIMEOUT_MINUTES.toString(),
    };

    console.log(
      `Sending SMS to ${selectedDriver.firstName} ${selectedDriver.lastName} (${selectedDriver.phoneNumber})`
    );

    try {
      await MessageService.sendSms(
        selectedDriver.phoneNumber,
        driverOfferTemplate,
        templateVariables
      );

      console.log(`SMS sent successfully to ${selectedDriver.phoneNumber}`);
    } catch (smsError: any) {
      console.error(
        `Failed to send SMS to ${selectedDriver.phoneNumber}:`,
        smsError
      );
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: 'SMS_DELIVERY_FAILED',
            message: `SMS delivery failed: ${smsError.message}`,
          },
        },
        { status: 500 }
      );
    }

    // Update route with offer details
    const expiresAt = new Date(Date.now() + OFFER_TIMEOUT_MINUTES * 60 * 1000);
    await prisma.packingSupplyRoute.update({
      where: { routeId },
      data: {
        driverOfferSentAt: new Date(),
        driverOfferExpiresAt: expiresAt,
        driverOfferStatus: 'sent',
      },
    });

    console.log(
      `Sent route offer to driver ${selectedDriver.id} for route ${routeId}`
    );

    return NextResponse.json<
      ApiResponse<{
        routeId: string;
        driverId: number;
        driverName: string;
        payoutEstimate: string;
        expiresAt: string;
        totalStops: number;
        deliveryArea: string;
        message: string;
      }>
    >({
      success: true,
      data: {
        routeId,
        driverId: selectedDriver.id,
        driverName: `${selectedDriver.firstName} ${selectedDriver.lastName}`,
        payoutEstimate: payoutEstimate.toString(),
        expiresAt: expiresAt.toISOString(),
        totalStops: route.totalStops,
        deliveryArea,
        message: `Route offer sent to ${selectedDriver.firstName} ${selectedDriver.lastName}`,
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
            details: { errors: error.errors },
          },
        },
        { status: 400 }
      );
    }

    console.error('Error sending driver offer:', error);
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
      status: searchParams.get('status'),
      date: searchParams.get('date'),
    };

    // Validate query parameters
    const validatedParams = DriverOfferGetRequestSchema.parse(queryParams);
    const { status, date } = validatedParams;

    const whereClause: any = {};

    if (date) {
      const targetDate = new Date(date);
      whereClause.deliveryDate = {
        gte: new Date(targetDate.toDateString()),
        lt: new Date(
          new Date(targetDate.toDateString()).getTime() + 24 * 60 * 60 * 1000
        ),
      };
    }

    if (status) {
      whereClause.driverOfferStatus = status;
    }

    const routes = await prisma.packingSupplyRoute.findMany({
      where: whereClause,
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
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
      orderBy: { driverOfferSentAt: 'desc' },
    });

    const summary = {
      total: routes.length,
      pending: routes.filter(r => r.driverOfferStatus === 'pending').length,
      sent: routes.filter(r => r.driverOfferStatus === 'sent').length,
      accepted: routes.filter(r => r.driverOfferStatus === 'accepted').length,
      declined: routes.filter(r => r.driverOfferStatus === 'declined').length,
      expired: routes.filter(r => r.driverOfferStatus === 'expired').length,
    };

    return NextResponse.json<
      ApiResponse<{
        summary: typeof summary;
        routes: typeof routes;
      }>
    >({
      success: true,
      data: {
        summary,
        routes,
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

    console.error('Error fetching driver offers:', error);
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

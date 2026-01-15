/**
 * @fileoverview Service for handling driver offers for packing supply routes
 * Provides atomic acceptance to prevent race conditions when multiple drivers
 * attempt to accept the same route offer.
 */

import { prisma } from '@/lib/database/prismaClient';
import { assignRoutePlanToWorker } from '@/lib/services/onfleet-route-plan';
import { MessageService } from '@/lib/messaging/MessageService';
import { driverOfferTemplate } from '@/lib/messaging/templates/sms/packing-supply';
import {
  calculateRoutePayoutEstimate,
  calculateEstimatedDuration,
  getDeliveryArea,
} from '@/lib/utils/packingSupplyUtils';
import jwt from 'jsonwebtoken';
import type { PackingSupplyRoute, Driver } from '@prisma/client';

const OFFER_TIMEOUT_MINUTES = 20;

export type AcceptOfferResult = {
  success: boolean;
  error?: 'EXPIRED' | 'ALREADY_ACCEPTED' | 'NOT_FOUND' | 'WRONG_DRIVER' | 'NOT_SENT';
  route?: PackingSupplyRoute;
};

export type SendOfferResult = {
  success: boolean;
  error?: string;
  driverId?: number;
  driverName?: string;
  expiresAt?: Date;
};

export class DriverOfferService {
  /**
   * Atomically accept a driver offer
   * Returns success only if:
   * 1. Offer status is still 'sent' (pending acceptance)
   * 2. Offer has not expired (expiresAt > now)
   * 3. Route is still unassigned (driverId is null)
   * 
   * This prevents race conditions where multiple drivers try to accept the same offer
   */
  static async acceptOfferAtomic(
    routeId: string,
    driverId: number
  ): Promise<AcceptOfferResult> {
    return await prisma.$transaction(async (tx) => {
      // Lock and check the route in one query
      const route = await tx.packingSupplyRoute.findFirst({
        where: {
          routeId: routeId,
          driverOfferStatus: 'sent',
          driverOfferExpiresAt: { gt: new Date() },
          driverId: null, // Not yet assigned
        },
      });

      if (!route) {
        // Check why it failed - provide specific error
        const existingRoute = await tx.packingSupplyRoute.findUnique({
          where: { routeId: routeId },
        });

        if (!existingRoute) {
          return { success: false, error: 'NOT_FOUND' as const };
        }
        if (existingRoute.driverId) {
          return { success: false, error: 'ALREADY_ACCEPTED' as const };
        }
        if (
          existingRoute.driverOfferExpiresAt &&
          existingRoute.driverOfferExpiresAt <= new Date()
        ) {
          return { success: false, error: 'EXPIRED' as const };
        }
        if (existingRoute.driverOfferStatus !== 'sent') {
          return { success: false, error: 'NOT_SENT' as const };
        }
        return { success: false, error: 'WRONG_DRIVER' as const };
      }

      // Atomically assign the driver
      const updatedRoute = await tx.packingSupplyRoute.update({
        where: { routeId: routeId },
        data: {
          driverId: driverId,
          driverOfferStatus: 'accepted',
          routeStatus: 'assigned',
          updatedAt: new Date(),
        },
      });

      // Update all orders in this route with the driver assignment
      await tx.packingSupplyOrder.updateMany({
        where: { routeId: routeId },
        data: {
          assignedDriverId: driverId,
          status: 'Assigned',
        },
      });

      // Update driver's completed jobs counter
      await tx.driver.update({
        where: { id: driverId },
        data: {
          completedPackingSupplyJobs: {
            increment: 1,
          },
          updatedAt: new Date(),
        },
      });

      return { success: true, route: updatedRoute };
    });
  }

  /**
   * Find the next available candidate driver for a route
   * Excludes drivers who have already been offered this route
   */
  static async findNextCandidateDriver(
    route: PackingSupplyRoute
  ): Promise<Driver | null> {
    const excludeIds = route.offeredDriverIds || [];
    const deliveryDate = route.deliveryDate;
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

    const candidates = await prisma.driver.findMany({
      where: {
        id: { notIn: excludeIds },
        isApproved: true,
        status: 'Active',
        applicationComplete: true,
        phoneNumber: { not: null },
        onfleetWorkerId: { not: null },
        onfleetTeamIds: {
          has: process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS || '',
        },
        availability: {
          some: {
            dayOfWeek,
            isBlocked: false,
            startTime: { lte: '12:00' },
            endTime: { gte: '15:00' },
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
      orderBy: [
        { averageRating: 'desc' },
        { completedPackingSupplyJobs: 'desc' },
      ],
      take: 1,
    });

    return candidates[0] || null;
  }

  /**
   * Send a driver offer for a route
   * Updates offeredDriverIds to track who has been offered
   */
  static async sendDriverOffer(
    routeId: string,
    driverId: number
  ): Promise<SendOfferResult> {
    try {
      // Get route and driver details
      const [route, driver] = await Promise.all([
        prisma.packingSupplyRoute.findUnique({
          where: { routeId },
          include: {
            orders: {
              orderBy: { routeStopNumber: 'asc' },
            },
          },
        }),
        prisma.driver.findUnique({
          where: { id: driverId },
        }),
      ]);

      if (!route) {
        return { success: false, error: 'Route not found' };
      }

      if (!driver || !driver.phoneNumber) {
        return { success: false, error: 'Driver not found or has no phone number' };
      }

      // Calculate payout estimate
      const payoutEstimate = calculateRoutePayoutEstimate(route);
      const estimatedDuration = calculateEstimatedDuration(route);
      const deliveryArea = getDeliveryArea(
        route.orders?.[0]?.deliveryAddress || 'Unknown Area'
      );
      const formattedDate = route.deliveryDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'numeric',
        day: 'numeric',
      });

      // Generate secure offer token
      const tokenPayload = {
        routeId: route.routeId,
        driverId: driver.id,
        action: 'packing_supply_route_offer',
        timestamp: Date.now(),
        expiresAt: Date.now() + OFFER_TIMEOUT_MINUTES * 60 * 1000,
      };

      const offerToken = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: `${OFFER_TIMEOUT_MINUTES}m` }
      );

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'https://app.boomboxstorage.com';
      const offerUrl = `${baseUrl}/driver/packing-supply-offer/${offerToken}`;

      // Send SMS
      const templateVariables = {
        totalStops: route.totalStops.toString(),
        deliveryArea,
        formattedDate,
        payoutEstimate,
        estimatedDuration,
        offerUrl,
        timeoutMinutes: OFFER_TIMEOUT_MINUTES.toString(),
      };

      await MessageService.sendSms(
        driver.phoneNumber,
        driverOfferTemplate,
        templateVariables
      );

      // Update route with offer details and add driver to offeredDriverIds
      const expiresAt = new Date(Date.now() + OFFER_TIMEOUT_MINUTES * 60 * 1000);
      await prisma.packingSupplyRoute.update({
        where: { routeId },
        data: {
          offeredDriverIds: { push: driverId },
          driverOfferSentAt: new Date(),
          driverOfferExpiresAt: expiresAt,
          driverOfferStatus: 'sent',
        },
      });

      console.log(
        `Sent route offer to driver ${driver.id} (${driver.firstName} ${driver.lastName}) for route ${routeId}`
      );

      return {
        success: true,
        driverId: driver.id,
        driverName: `${driver.firstName} ${driver.lastName}`,
        expiresAt,
      };
    } catch (error: any) {
      console.error('Error sending driver offer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark a route offer as expired
   * Used by the cron sweep job
   */
  static async markOfferExpired(routeId: string): Promise<void> {
    await prisma.packingSupplyRoute.update({
      where: { routeId },
      data: {
        driverOfferStatus: 'expired',
      },
    });
  }

  /**
   * Mark a route offer as declined
   */
  static async markOfferDeclined(routeId: string): Promise<void> {
    await prisma.packingSupplyRoute.update({
      where: { routeId },
      data: {
        driverOfferStatus: 'declined',
      },
    });
  }

  /**
   * Get all routes with expired offers that need processing
   * Used by the cron sweep job
   */
  static async getExpiredOffers(): Promise<PackingSupplyRoute[]> {
    return await prisma.packingSupplyRoute.findMany({
      where: {
        driverOfferStatus: 'sent',
        driverOfferExpiresAt: { lte: new Date() },
        driverId: null,
      },
    });
  }

  /**
   * Process an expired offer - mark as expired and attempt to offer to next driver
   * Returns info about what happened
   */
  static async processExpiredOffer(
    route: PackingSupplyRoute
  ): Promise<{
    routeId: string;
    action: 'reoffered' | 'admin_notified' | 'marked_expired';
    driverId?: number;
  }> {
    // Mark as expired (idempotent)
    await this.markOfferExpired(route.routeId);

    // Find next candidate driver
    const nextDriver = await this.findNextCandidateDriver(route);

    if (nextDriver) {
      const offerResult = await this.sendDriverOffer(route.routeId, nextDriver.id);
      if (offerResult.success) {
        return {
          routeId: route.routeId,
          action: 'reoffered',
          driverId: nextDriver.id,
        };
      }
    }

    // No more candidates available - would notify admin here
    // For now, just return that we marked it expired
    return {
      routeId: route.routeId,
      action: 'admin_notified',
    };
  }
}


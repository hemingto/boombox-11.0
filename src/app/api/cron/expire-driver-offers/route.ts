/**
 * @fileoverview Cron job to sweep expired driver offers and re-offer to next candidate
 * Schedule: Every 5 minutes via Vercel Cron
 *
 * Flow:
 * 1. Find all offers where status = 'sent' AND expiresAt <= now AND driverId is null
 * 2. Mark each as 'expired'
 * 3. For routes still unassigned, find next candidate driver and send new offer
 * 4. Send admin notification if no candidates left
 */

import { NextRequest, NextResponse } from 'next/server';
import { DriverOfferService } from '@/lib/services/DriverOfferService';
import { MessageService } from '@/lib/messaging/MessageService';
import { systemFailureTemplate } from '@/lib/messaging/templates/email/admin';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');

    // Skip auth check in development
    if (
      process.env.NODE_ENV === 'production' &&
      authHeader !== `Bearer ${process.env.CRON_API_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting expired driver offers sweep...');

    // Get all expired offers
    const expiredOffers = await DriverOfferService.getExpiredOffers();

    if (expiredOffers.length === 0) {
      console.log('No expired offers found');
      return NextResponse.json({
        success: true,
        message: 'No expired offers to process',
        processed: 0,
        results: [],
      });
    }

    console.log(`Found ${expiredOffers.length} expired offers to process`);

    const results: Array<{
      routeId: string;
      action: 'reoffered' | 'admin_notified' | 'marked_expired';
      driverId?: number;
      driverName?: string;
    }> = [];

    const routesNeedingAdminAttention: string[] = [];

    for (const route of expiredOffers) {
      try {
        const result = await DriverOfferService.processExpiredOffer(route);
        
        if (result.action === 'reoffered' && result.driverId) {
          console.log(
            `Route ${route.routeId}: Re-offered to driver ${result.driverId}`
          );
        } else if (result.action === 'admin_notified') {
          console.log(
            `Route ${route.routeId}: No more candidates, admin notification needed`
          );
          routesNeedingAdminAttention.push(route.routeId);
        }

        results.push(result);
      } catch (error: any) {
        console.error(
          `Error processing expired offer for route ${route.routeId}:`,
          error
        );
        results.push({
          routeId: route.routeId,
          action: 'marked_expired',
        });
      }
    }

    // Send admin notification if there are routes with no available drivers
    if (routesNeedingAdminAttention.length > 0) {
      await notifyAdminNoDriversAvailable(routesNeedingAdminAttention);
    }

    const summary = {
      processed: expiredOffers.length,
      reoffered: results.filter(r => r.action === 'reoffered').length,
      adminNotified: results.filter(r => r.action === 'admin_notified').length,
    };

    console.log('Expired offers sweep completed:', summary);

    return NextResponse.json({
      success: true,
      message: `Processed ${expiredOffers.length} expired offers`,
      summary,
      results,
    });
  } catch (error: any) {
    console.error('Error in expire-driver-offers cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * Send notification to admin when routes have no available drivers
 */
async function notifyAdminNoDriversAvailable(routeIds: string[]): Promise<void> {
  try {
    console.log(
      `Sending admin notification for ${routeIds.length} routes with no available drivers`
    );

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [
      'admin@boomboxstorage.com',
    ];

    const templateVariables = {
      systemName: 'Packing Supply Driver Assignment',
      formattedDate: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      timestamp: new Date().toLocaleString(),
      errorMessage: `${routeIds.length} packing supply route(s) have no available drivers after all offers expired.`,
      impactDescription: `The following routes need manual driver assignment: ${routeIds.join(', ')}`,
      nextStepsText: `1. Review the routes in the admin dashboard
2. Manually assign available drivers
3. Consider expanding the driver pool for packing supply deliveries
4. Check if drivers have the correct team assignment`,
      nextStepsSection: `<ol style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 6px;">Review the routes in the admin dashboard</li>
        <li style="margin-bottom: 6px;">Manually assign available drivers</li>
        <li style="margin-bottom: 6px;">Consider expanding the driver pool for packing supply deliveries</li>
        <li style="margin-bottom: 6px;">Check if drivers have the correct team assignment (BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS)</li>
      </ol>`,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/packing-supply-routes`,
      executionTime: 'N/A',
    };

    for (const email of adminEmails) {
      const result = await MessageService.sendEmail(
        email.trim(),
        systemFailureTemplate,
        templateVariables
      );

      if (!result.success) {
        console.error(
          `Failed to send admin notification to ${email}:`,
          result.error
        );
      }
    }

    console.log(
      `Admin notification sent to ${adminEmails.length} recipients for ${routeIds.length} routes`
    );
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
}


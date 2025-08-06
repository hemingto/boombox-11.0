/**
 * @fileoverview Cron job for daily packing supply route optimization and driver assignments
 * @source boombox-10.0/src/app/api/cron/daily-batch-optimize/route.ts
 * @refactor Migrated to domain-based API structure with centralized messaging and utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { MessageService } from '@/lib/messaging/MessageService';
import {
  systemFailureTemplate,
  dailySummaryTemplate,
} from '@/lib/messaging/templates/email/admin';
import {
  validateApiRequest,
  // PackingSupplyRouteAssignmentCronRequestSchema - not exported from route files
} from '@/lib/validations/api.validations';

// ===== ROUTE HANDLER =====

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

    console.log('Starting daily packing supply route assignment cron job...');

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      targetDate: url.searchParams.get('targetDate') || undefined,
      dryRun: url.searchParams.get('dryRun') === 'true',
      forceOptimization: url.searchParams.get('forceOptimization') === 'true',
    };

    const validation = validateApiRequest(
      PackingSupplyRouteAssignmentCronRequestSchema,
      queryParams
    );
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { targetDate, dryRun, forceOptimization } = validation.data;

    // Get current date for optimization if not specified
    const today = new Date();
    const optimizationDate = targetDate || today.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(
      `Processing packing supply route assignment for date: ${optimizationDate}`
    );
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No actual changes will be made');
    }

    // Call the batch optimization endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const optimizationResponse = await fetch(
      `${baseUrl}/api/packing-supplies/batch-optimize`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`, // Internal authentication
        },
        body: JSON.stringify({
          targetDate: optimizationDate,
          dryRun,
          forceOptimization,
        }),
      }
    );

    const optimizationResult = await optimizationResponse.json();

    if (!optimizationResponse.ok) {
      console.error('Batch optimization failed:', optimizationResult.error);

      // Send admin notification about the failure
      await sendFailureNotification(optimizationDate, optimizationResult.error);

      return NextResponse.json(
        {
          success: false,
          error: optimizationResult.error,
          targetDate: optimizationDate,
          dryRun,
        },
        { status: 500 }
      );
    }

    console.log('Batch optimization completed:', optimizationResult.details);

    // If optimization was successful and not a dry run, send offers to drivers
    const routesCreated = optimizationResult.details?.routeIds || [];
    const driverOfferResults: Array<{
      routeId: string;
      success: boolean;
      driverName?: string;
      message?: string;
      error?: string;
    }> = [];

    if (!dryRun && routesCreated.length > 0) {
      console.log(
        `Sending driver offers for ${routesCreated.length} routes...`
      );

      for (const routeId of routesCreated) {
        try {
          console.log(`Sending driver offer for route: ${routeId}`);

          const offerResponse = await fetch(
            `${baseUrl}/api/packing-supplies/driver-offer`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
              },
              body: JSON.stringify({
                routeId,
                targetDate: optimizationDate,
              }),
            }
          );

          const offerResult = await offerResponse.json();

          if (offerResponse.ok) {
            driverOfferResults.push({
              routeId,
              success: true,
              driverName: offerResult.details?.driverName,
              message: offerResult.message,
            });
            console.log(
              `Driver offer sent for ${routeId}: ${offerResult.details?.driverName}`
            );
          } else {
            driverOfferResults.push({
              routeId,
              success: false,
              error: offerResult.error,
            });
            console.error(
              `Failed to send driver offer for ${routeId}:`,
              offerResult.error
            );
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          driverOfferResults.push({
            routeId,
            success: false,
            error: errorMessage,
          });
          console.error(`Error sending driver offer for ${routeId}:`, error);
        }
      }
    } else if (dryRun) {
      console.log('🔍 DRY RUN: Skipping driver offer sending');
    } else {
      console.log('No routes created, skipping driver offer phase');
    }

    // Send summary email to admin (skip in dry run mode)
    if (!dryRun) {
      await sendSummaryNotification(
        optimizationResult,
        driverOfferResults,
        optimizationDate
      );
    } else {
      console.log('🔍 DRY RUN: Skipping admin summary notification');
    }

    // Prepare response summary
    const summary = {
      targetDate: optimizationDate,
      dryRun,
      ordersProcessed: optimizationResult.details?.ordersProcessed || 0,
      routesCreated: routesCreated.length,
      driverOffersSuccessful: driverOfferResults.filter(r => r.success).length,
      driverOffersFailed: driverOfferResults.filter(r => !r.success).length,
    };

    return NextResponse.json({
      success: true,
      message: dryRun
        ? 'Daily packing supply route assignment simulation completed'
        : 'Daily packing supply route assignment completed',
      summary,
      details: {
        optimization: optimizationResult,
        driverOffers: driverOfferResults,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in packing supply route assignment cron:', error);

    // Send failure notification (skip in dry run scenarios)
    const url = new URL(request.url);
    const isDryRun = url.searchParams.get('dryRun') === 'true';

    if (!isDryRun) {
      const targetDate =
        url.searchParams.get('targetDate') ||
        new Date().toISOString().split('T')[0];
      await sendFailureNotification(targetDate, errorMessage);
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        dryRun: isDryRun,
      },
      { status: 500 }
    );
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Send failure notification to admin using centralized messaging service
 */
async function sendFailureNotification(
  targetDate: string,
  errorMessage: string
): Promise<void> {
  try {
    console.log('Sending failure notification to admin...');

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [
      'admin@boomboxstorage.com',
    ];
    const formattedDate = new Date(targetDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Use the systemFailureTemplate for failure notifications
    const templateVariables = {
      systemName: 'Packing Supply Route Assignment',
      formattedDate,
      timestamp: new Date().toLocaleString(),
      errorMessage,
      impactDescription:
        'The automated batch optimization process failed to complete. This may result in delayed packing supply deliveries and require manual intervention to assign routes to drivers.',
      nextStepsText: `1. Check the batch optimization endpoint
2. Verify Onfleet integration status
3. Review pending packing supply orders
4. Consider manual route assignment
5. Retry the optimization process if needed`,
      nextStepsSection: `<ol style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 6px;">Check the batch optimization endpoint: /api/packing-supplies/batch-optimize</li>
        <li style="margin-bottom: 6px;">Verify Onfleet integration status and API keys</li>
        <li style="margin-bottom: 6px;">Review pending packing supply orders requiring assignment</li>
        <li style="margin-bottom: 6px;">Consider manual route assignment for urgent deliveries</li>
        <li style="margin-bottom: 6px;">Retry the optimization process once issues are resolved</li>
      </ol>`,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard`,
      executionTime: 'N/A',
    };

    // Send notification to all admin emails
    for (const email of adminEmails) {
      const result = await MessageService.sendEmail(
        email.trim(),
        systemFailureTemplate,
        templateVariables
      );

      if (!result.success) {
        console.error(
          `Failed to send failure notification to ${email}:`,
          result.error
        );
      }
    }

    console.log(
      `Failure notification sent to ${adminEmails.length} admin recipients`
    );
  } catch (error) {
    console.error('Failed to send failure notification:', error);
  }
}

/**
 * Send daily summary notification to admin using centralized messaging
 */
async function sendSummaryNotification(
  optimizationResult: any,
  driverOfferResults: Array<{
    routeId: string;
    success: boolean;
    driverName?: string;
    message?: string;
    error?: string;
  }>,
  targetDate: string
): Promise<void> {
  try {
    console.log('Sending daily summary notification to admin...');

    const successfulOffers = driverOfferResults.filter(r => r.success);
    const failedOffers = driverOfferResults.filter(r => !r.success);

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [
      'admin@boomboxstorage.com',
    ];
    const formattedDate = new Date(targetDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Prepare successful offers content
    const successfulOffersText =
      successfulOffers.length > 0
        ? `SUCCESSFUL DRIVER OFFERS:\n${successfulOffers.map(offer => `- ${offer.routeId} → ${offer.driverName}`).join('\n')}`
        : '';

    const successfulOffersSection =
      successfulOffers.length > 0
        ? `
      <h4 style="color: #28a745;">✅ Driver Offers Sent Successfully:</h4>
      <ul>
        ${successfulOffers
          .map(
            offer => `
          <li>${offer.routeId} → ${offer.driverName}</li>
        `
          )
          .join('')}
      </ul>
    `
        : '';

    // Prepare failed offers content
    const failedOffersText =
      failedOffers.length > 0
        ? `FAILED DRIVER OFFERS:\n${failedOffers.map(offer => `- ${offer.routeId}: ${offer.error}`).join('\n')}\n\nACTION REQUIRED: Please manually assign drivers to the failed routes.`
        : '';

    const failedOffersSection =
      failedOffers.length > 0
        ? `
      <h4 style="color: #dc3545;">❌ Failed Driver Offers:</h4>
      <ul>
        ${failedOffers
          .map(
            offer => `
          <li>${offer.routeId}: ${offer.error}</li>
        `
          )
          .join('')}
      </ul>
      <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545; margin-top: 15px;">
        <p style="margin: 0; color: #721c24;">
          <strong>Action Required:</strong> Please manually assign drivers to the failed routes.
        </p>
      </div>
    `
        : '';

    // Use the dailySummaryTemplate for summary notifications
    const templateVariables = {
      formattedDate,
      ordersProcessed: String(optimizationResult.details?.ordersProcessed || 0),
      routesCreated: String(optimizationResult.details?.routesCreated || 0),
      driverOffersSuccessful: String(successfulOffers.length),
      driverOffersFailed: String(failedOffers.length),
      successfulOffersText,
      failedOffersText,
      successfulOffersSection,
      failedOffersSection,
      timestamp: new Date().toLocaleString(),
    };

    // Send notification to all admin emails using centralized MessageService
    for (const email of adminEmails) {
      const result = await MessageService.sendEmail(
        email.trim(),
        dailySummaryTemplate,
        templateVariables
      );

      if (!result.success) {
        console.error(
          `Failed to send daily summary to ${email}:`,
          result.error
        );
      }
    }

    console.log(`Daily summary sent to ${adminEmails.length} admin recipients`);
  } catch (error) {
    console.error('Failed to send summary notification:', error);
  }
}

// Note: PackingSupplyRouteAssignmentCronRequestSchema not exported from route files

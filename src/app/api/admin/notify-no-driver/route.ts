/**
 * @fileoverview Admin API endpoint for sending notifications when no driver is available for route assignment
 * @source boombox-10.0/src/app/api/admin/notify-no-driver/route.ts
 * @refactor PHASE 4 - Admin Domain
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that sends email notifications to all admin and superadmin users when no driver
 * is available for a packing supply route assignment. Includes route details, urgency assessment,
 * and action items for manual driver assignment.
 * 
 * GET endpoint for testing notification functionality with sample data.
 * 
 * USED BY (boombox-10.0 files):
 * - Packing supply route assignment system
 * - Driver availability automation
 * - Route dispatch management
 * - Admin notification systems
 * 
 * INTEGRATION NOTES:
 * - Fetches admin/superadmin emails from Prisma database instead of environment variables
 * - Uses centralized MessageService for email sending with templates
 * - Includes enhanced route information retrieval with order details
 * - Maintains urgency level assessment and mobile-optimized email formatting
 * - Preserves exact business logic while extracting into reusable utilities
 * 
 * @refactor Migrated to centralized messaging system, extracted inline functions to utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { MessageService } from '@/lib/messaging/MessageService';
import { notifyNoDriverTemplate } from '@/lib/messaging/templates/email/admin';
import { prisma } from '@/lib/database/prismaClient';
import { AdminNotifyNoDriverRequestSchema } from '@/lib/validations/api.validations';
import {
  getAdminEmails,
  getUrgencyLevel,
  getUrgencyColors,
  getUrgencyEmoji,
  generateOrdersSection,
  generateSourceContext,
  generateSourceText,
  generateAdditionalInfoSection,
  calculateEstimatedPayout
} from '@/lib/utils/adminNotificationUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = AdminNotifyNoDriverRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { routeId, deliveryDate, totalStops, reason, source, additionalInfo } = validationResult.data;

    // Enhanced route information retrieval
    let routeDetails = null;
    try {
      routeDetails = await prisma.packingSupplyRoute.findUnique({
        where: { routeId },
        include: {
          orders: {
            select: {
              id: true,
              deliveryAddress: true,
              contactName: true,
              contactPhone: true,
              totalPrice: true,
              routeStopNumber: true,
            },
            orderBy: { routeStopNumber: 'asc' },
          },
        },
      });
    } catch (dbError) {
      console.log('Could not fetch route details from database:', dbError);
    }

    // Get admin email addresses from database
    const adminEmails = await getAdminEmails();
    
    // Format dates
    const deliveryDateTime = new Date(deliveryDate);
    const formattedDate = deliveryDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = deliveryDateTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    // Calculate urgency and styling
    const urgencyLevel = getUrgencyLevel(deliveryDateTime);
    const urgencyColors = getUrgencyColors(urgencyLevel);
    const urgencyEmoji = getUrgencyEmoji(urgencyLevel);
    
    // Generate template variables
    const templateVariables = {
      routeId,
      urgencyLevel: urgencyLevel.toUpperCase(),
      urgencyEmoji,
      urgencyBg: urgencyColors.bg,
      urgencyBorder: urgencyColors.border,
      urgencyText: urgencyColors.text,
      formattedDate,
      formattedTime,
      totalStops: totalStops?.toString() || '?',
      reason: reason || 'No drivers available for route assignment',
      estimatedPayout: calculateEstimatedPayout(totalStops || 0),
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/routes`,
      timestamp: new Date().toLocaleString(),
      sourceText: generateSourceText(source),
      sourceContext: generateSourceContext(source),
      ordersSection: generateOrdersSection(routeDetails),
      additionalInfoSection: generateAdditionalInfoSection(additionalInfo)
    };

    // Send emails to all admin addresses
    const emailPromises = adminEmails.map(email => 
      MessageService.sendEmail(email.trim(), notifyNoDriverTemplate, templateVariables)
    );

    const emailResults = await Promise.allSettled(emailPromises);
    
    // Count successful sends
    const successfulSends = emailResults.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    const failedSends = emailResults.filter(result => 
      result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
    ).length;

    console.log(`Admin notification sent for route ${routeId}: ${successfulSends} successful, ${failedSends} failed`);

    if (successfulSends === 0) {
      throw new Error('Failed to send notifications to any admin recipients');
    }

    return NextResponse.json({
      success: true,
      message: `Admin notification sent successfully to ${successfulSends} recipients`,
      details: {
        routeId,
        recipients: {
          successful: successfulSends,
          failed: failedSends,
          total: adminEmails.length
        },
        deliveryDate: formattedDate,
        reason: reason || 'No drivers available for route assignment',
        urgencyLevel
      },
    });

  } catch (error: any) {
    console.error('Error sending admin notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send admin notification' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testMode = searchParams.get('test') === 'true';

    if (!testMode) {
      return NextResponse.json(
        { error: 'This endpoint is for testing admin notifications only' },
        { status: 400 }
      );
    }

    // Send test notification with enhanced data
    const testData = {
      routeId: 'TEST_ROUTE_001',
      deliveryDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      totalStops: 5,
      reason: 'Test notification - no action required',
      source: 'test_system',
      additionalInfo: 'This is a test notification to verify email formatting and delivery',
    };

    const testRequest = new Request(request.url, {
      method: 'POST',
      body: JSON.stringify(testData),
      headers: { 'Content-Type': 'application/json' },
    });

    return await POST(testRequest as NextRequest);

  } catch (error: any) {
    console.error('Error in test notification:', error);
    return NextResponse.json(
      { error: error.message || 'Test notification failed' },
      { status: 500 }
    );
  }
}
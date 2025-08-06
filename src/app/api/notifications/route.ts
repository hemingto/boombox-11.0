/**
 * @fileoverview Notifications API route - handles notification retrieval and creation
 * @source boombox-10.0/src/app/api/notifications/route.ts (complete migration)
 * @refactor Migrated to use centralized utilities, validation schemas, and proper error handling
 * 
 * Routes:
 * - GET  /api/notifications - Retrieve notifications with pagination and filtering
 * - POST /api/notifications - Create new notifications with optional grouping
 * 
 * Business Logic:
 * - Supports pagination and filtering by status
 * - Handles notification grouping via groupKey
 * - Returns unread count capped at 25
 * - Excludes archived notifications from results
 * - Includes related appointment and packing supply order data
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getNotifications,
  createNotification,
  parseNotificationParams,
  validateCreateNotificationData
} from '@/lib/utils/notificationUtils';
import { 
  GetNotificationsRequestSchema,
  CreateNotificationRequestSchema,
  GetNotificationsResponseSchema,
  validateApiRequest
} from '@/lib/validations/api.validations';

export async function GET(request: NextRequest) {
  try {
    // Parse and validate request parameters using utility (already validates)
    const searchParams = request.nextUrl.searchParams;
    const params = parseNotificationParams(searchParams);

    // Get notifications using centralized utility
    const result = await getNotifications({
      recipientId: params.recipientId,
      recipientType: params.recipientType,
      status: params.status || undefined,
      page: params.page,
      limit: params.limit
    });

    // Validate response structure
    const responseValidation = validateApiRequest(GetNotificationsResponseSchema, result);
    if (!responseValidation.success) {
      console.error('Response validation failed:', responseValidation.error);
      // Continue anyway but log the issue
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching notifications:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body with schema
    const validation = validateApiRequest(CreateNotificationRequestSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Parse and validate notification data
    const notificationData = validateCreateNotificationData(body);
    
    // Create notification using centralized utility
    const notification = await createNotification(notificationData);

    return NextResponse.json(notification);

  } catch (error) {
    console.error('Error creating notification:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
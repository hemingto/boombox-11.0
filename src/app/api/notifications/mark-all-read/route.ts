/**
 * @fileoverview API endpoint to mark all notifications as read for a recipient
 * @source boombox-10.0/src/app/api/notifications/mark-all-read/route.ts
 * @refactor PHASE 4 - System/Utility Routes
 * 
 * ROUTE FUNCTIONALITY:
 * PATCH endpoint that marks all unread notifications as read for a specific recipient.
 * Supports different recipient types (USER, DRIVER, MOVER, ADMIN) and updates read status.
 * 
 * USED BY (boombox-10.0 files):
 * - Notification management interfaces
 * - User dashboard notification systems
 * - Admin notification management
 * - Mobile app notification clearing
 * 
 * INTEGRATION NOTES:
 * - Requires recipientId and recipientType in request body
 * - Validates recipient type against allowed values
 * - Updates all UNREAD notifications to READ status
 * - Sets readAt timestamp on successful update
 * - Returns count of updated notifications
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientId, recipientType } = body;

    if (!recipientId || !recipientType) {
      return NextResponse.json(
        { error: 'recipientId and recipientType are required' },
        { status: 400 }
      );
    }

    // Validate recipientType
    const validTypes = ['USER', 'DRIVER', 'MOVER', 'ADMIN'];
    if (!validTypes.includes(recipientType.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid recipientType' },
        { status: 400 }
      );
    }

    // Mark all unread notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        recipientId: parseInt(recipientId),
        recipientType: recipientType.toUpperCase(),
        status: 'UNREAD'
      },
      data: {
        status: 'READ',
        readAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
} 
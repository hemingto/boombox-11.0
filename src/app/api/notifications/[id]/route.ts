/**
 * @fileoverview API endpoint to manage individual notifications
 * @source boombox-10.0/src/app/api/notifications/[id]/route.ts
 * @refactor PHASE 4 - System/Utility Routes
 * 
 * ROUTE FUNCTIONALITY:
 * PATCH/DELETE endpoint for individual notification management.
 * PATCH: Updates notification status (READ, UNREAD, ARCHIVED) with timestamps
 * DELETE: Removes notification from database
 * 
 * USED BY (boombox-10.0 files):
 * - Notification management interfaces
 * - User notification centers
 * - Admin notification oversight
 * - Mobile app notification actions
 * 
 * INTEGRATION NOTES:
 * - PATCH: Requires { status } in request body with valid status values
 * - Automatically sets readAt timestamp when marking as READ
 * - Automatically sets archivedAt timestamp when archiving
 * - DELETE: Simple notification removal by ID
 * - Validates status values against allowed enum values
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const notificationId = parseInt((await params).id);
    const body = await request.json();
    const { status } = body;

    if (!status || !['READ', 'UNREAD', 'ARCHIVED'].includes(status.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid status. Must be READ, UNREAD, or ARCHIVED' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status: status.toUpperCase()
    };

    // Set readAt timestamp when marking as read
    if (status.toUpperCase() === 'READ') {
      updateData.readAt = new Date();
    }

    // Set archivedAt timestamp when archiving
    if (status.toUpperCase() === 'ARCHIVED') {
      updateData.archivedAt = new Date();
    }

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: updateData
    });

    return NextResponse.json(notification);

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const notificationId = parseInt((await params).id);

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
} 
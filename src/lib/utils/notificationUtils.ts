/**
 * @fileoverview Notification utility functions for managing notification operations
 * @source boombox-10.0/src/app/api/notifications/route.ts (extracted business logic)
 * @refactor Extracted notification creation, querying, and grouping logic into reusable utilities
 */

import { prisma } from '@/lib/database/prismaClient';
import { UserType, NotificationType } from '@prisma/client';

/**
 * Types for notification functionality
 */
export interface NotificationFilters {
  recipientId: number;
  recipientType: UserType;
  status?: string;
  page?: number;
  limit?: number;
}

export interface NotificationResult {
  notifications: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  unreadCount: number;
}

export interface CreateNotificationData {
  recipientId: number;
  recipientType: UserType;
  type: NotificationType;
  title: string;
  message: string;
  appointmentId?: number;
  orderId?: number;
  routeId?: string;
  taskId?: string;
  driverId?: number;
  movingPartnerId?: number;
  groupKey?: string;
}

/**
 * Validate recipient type against allowed values
 */
export function validateRecipientType(recipientType: string): boolean {
  const validTypes = ['USER', 'DRIVER', 'MOVER', 'ADMIN'];
  return validTypes.includes(recipientType.toUpperCase());
}

/**
 * Build notification where clause for database queries
 */
export function buildNotificationWhereClause(filters: NotificationFilters) {
  const whereClause: any = {
    recipientId: filters.recipientId,
    recipientType: filters.recipientType,
    status: {
      not: 'ARCHIVED' // Don't show archived notifications
    }
  };

  if (filters.status) {
    whereClause.status = filters.status.toUpperCase();
  }

  return whereClause;
}

/**
 * Get notifications with pagination and filtering
 */
export async function getNotifications(filters: NotificationFilters): Promise<NotificationResult> {
  const page = filters.page || 1;
  const limit = filters.limit || 5;
  const skip = (page - 1) * limit;

  const whereClause = buildNotificationWhereClause(filters);

  // Fetch notifications with related data
  const notifications = await prisma.notification.findMany({
    where: whereClause,
    orderBy: {
      createdAt: 'desc'
    },
    skip,
    take: limit,
    include: {
      appointment: {
        select: {
          id: true,
          appointmentType: true,
          date: true,
          address: true
        }
      },
      packingSupplyOrder: {
        select: {
          id: true,
          deliveryAddress: true,
          deliveryDate: true
        }
      }
    }
  });

  // Get total count for pagination
  const totalCount = await prisma.notification.count({
    where: whereClause
  });

  // Get unread count
  const unreadCount = await prisma.notification.count({
    where: {
      recipientId: filters.recipientId,
      recipientType: filters.recipientType,
      status: 'UNREAD'
    }
  });

  return {
    notifications,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: totalCount > page * limit
    },
    unreadCount: Math.min(unreadCount, 25) // Cap at 25 as requested
  };
}

/**
 * Create a new notification with optional grouping
 */
export async function createNotification(data: CreateNotificationData) {
  let notification;

  if (data.groupKey) {
    // Check if a notification with this groupKey already exists
    const existingNotification = await prisma.notification.findFirst({
      where: {
        recipientId: data.recipientId,
        recipientType: data.recipientType,
        groupKey: data.groupKey,
        status: 'UNREAD'
      }
    });

    if (existingNotification) {
      // Update existing grouped notification
      notification = await prisma.notification.update({
        where: { id: existingNotification.id },
        data: {
          groupCount: { increment: 1 },
          message: data.message, // Update with latest message
          createdAt: new Date() // Update timestamp
        }
      });
    } else {
      // Create new grouped notification
      notification = await prisma.notification.create({
        data: {
          recipientId: data.recipientId,
          recipientType: data.recipientType,
          type: data.type,
          title: data.title,
          message: data.message,
          appointmentId: data.appointmentId,
          orderId: data.orderId,
          routeId: data.routeId,
          taskId: data.taskId,
          driverId: data.driverId,
          movingPartnerId: data.movingPartnerId,
          groupKey: data.groupKey,
          groupCount: 1
        }
      });
    }
  } else {
    // Create individual notification
    notification = await prisma.notification.create({
      data: {
        recipientId: data.recipientId,
        recipientType: data.recipientType,
        type: data.type,
        title: data.title,
        message: data.message,
        appointmentId: data.appointmentId,
        orderId: data.orderId,
        routeId: data.routeId,
        taskId: data.taskId,
        driverId: data.driverId,
        movingPartnerId: data.movingPartnerId
      }
    });
  }

  return notification;
}

/**
 * Parse and validate notification request parameters
 */
export function parseNotificationParams(searchParams: URLSearchParams) {
  const recipientId = searchParams.get('recipientId');
  const recipientType = searchParams.get('recipientType');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '5');
  const status = searchParams.get('status');

  if (!recipientId || !recipientType) {
    throw new Error('recipientId and recipientType are required');
  }

  if (!validateRecipientType(recipientType)) {
    throw new Error('Invalid recipientType');
  }

  return {
    recipientId: parseInt(recipientId),
    recipientType: recipientType.toUpperCase() as UserType,
    page,
    limit,
    status
  };
}

/**
 * Validate required fields for notification creation
 */
export function validateCreateNotificationData(data: any): CreateNotificationData {
  const {
    recipientId,
    recipientType,
    type,
    title,
    message,
    appointmentId,
    orderId,
    routeId,
    taskId,
    driverId,
    movingPartnerId,
    groupKey
  } = data;

  if (!recipientId || !recipientType || !type || !title || !message) {
    throw new Error('Missing required fields: recipientId, recipientType, type, title, message');
  }

  return {
    recipientId: parseInt(recipientId),
    recipientType: recipientType.toUpperCase() as UserType,
    type: type as NotificationType,
    title,
    message,
    appointmentId,
    orderId,
    routeId: routeId?.toString(),
    taskId: taskId?.toString(),
    driverId,
    movingPartnerId,
    groupKey
  };
}
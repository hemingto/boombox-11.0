/**
 * @fileoverview NotificationService - Centralized notification creation and management
 * @source New service for boombox-11.0 notification system
 * 
 * SERVICE FUNCTIONALITY:
 * Provides centralized notification creation using template-based system.
 * Handles notification grouping, variable validation, and template rendering.
 * Integrates with database for persistence and supports batch operations.
 * 
 * FEATURES:
 * - Template-based notification creation with variable validation
 * - Automatic notification grouping for similar notifications
 * - Batch notification creation for multiple recipients
 * - Helper methods for common notification patterns
 * - Transaction support for atomic operations
 * 
 * INTEGRATION:
 * - Uses notification templates from /templates directory
 * - Integrates with Prisma for database operations
 * - Supports all notification types from Prisma schema
 */

import { prisma } from '@/lib/database/prismaClient';
import { NotificationType as PrismaNotificationType, UserType } from '@prisma/client';
import {
  CreateNotificationParams,
  BatchCreateNotificationParams,
  NotificationTemplate,
  AppointmentNotificationData,
  JobNotificationData,
  OrderNotificationData,
  RouteNotificationData,
  PaymentNotificationData,
  FeedbackNotificationData,
  AccountNotificationData
} from '../notifications/types';
import { getNotificationTemplate } from '../notifications/index';

export class NotificationService {
  /**
   * Create a notification using a template
   */
  static async createNotification(params: CreateNotificationParams) {
    const { recipientId, recipientType, type, data, appointmentId, orderId, routeId, taskId, driverId, movingPartnerId } = params;

    // Get the template
    const template = getNotificationTemplate(type);
    
    if (!template) {
      throw new Error(`No template found for notification type: ${type}`);
    }

    // Validate required variables
    const missingVariables = template.requiredVariables.filter(
      (variable: string) => data[variable] === undefined || data[variable] === null
    );

    if (missingVariables.length > 0) {
      throw new Error(`Missing required variables for ${type}: ${missingVariables.join(', ')}`);
    }

    // Generate title and message from template
    const title = template.getTitle(data);
    const message = template.getMessage(data);

    // Check if this notification type supports grouping
    if (template.supportsGrouping && template.getGroupKey) {
      const groupKey = template.getGroupKey(data);
      
      // Check if a similar unread notification exists
      const existingNotification = await prisma.notification.findFirst({
        where: {
          recipientId,
          recipientType,
          groupKey,
          status: 'UNREAD'
        }
      });

      if (existingNotification) {
        // Update existing grouped notification
        return await prisma.notification.update({
          where: { id: existingNotification.id },
          data: {
            groupCount: { increment: 1 },
            message, // Update with latest message
            createdAt: new Date() // Update timestamp
          }
        });
      }

      // Create new grouped notification
      return await prisma.notification.create({
        data: {
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
          groupKey,
          groupCount: 1
        }
      });
    }

    // Create individual notification (no grouping)
    return await prisma.notification.create({
      data: {
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
        movingPartnerId
      }
    });
  }

  /**
   * Create notifications for multiple recipients
   */
  static async batchCreateNotifications(params: BatchCreateNotificationParams) {
    const { recipients, type, data, appointmentId, orderId, routeId, taskId, driverId, movingPartnerId } = params;

    const notifications = await Promise.allSettled(
      recipients.map((recipient: { recipientId: number; recipientType: UserType }) =>
        this.createNotification({
          recipientId: recipient.recipientId,
          recipientType: recipient.recipientType,
          type,
          data,
          appointmentId,
          orderId,
          routeId,
          taskId,
          driverId,
          movingPartnerId
        })
      )
    );

    // Return successful notifications and log errors
    const successful = notifications
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map((result: PromiseFulfilledResult<any>) => result.value);

    const failed = notifications.filter((result: PromiseSettledResult<any>) => result.status === 'rejected');
    
    if (failed.length > 0) {
      console.error(`Failed to create ${failed.length} notifications:`, failed);
    }

    return successful;
  }

  /**
   * Helper: Notify appointment confirmed
   */
  static async notifyAppointmentConfirmed(
    userId: number,
    data: AppointmentNotificationData
  ) {
    return this.createNotification({
      recipientId: userId,
      recipientType: 'USER',
      type: 'APPOINTMENT_CONFIRMED',
      data,
      appointmentId: data.appointmentId
    });
  }

  /**
   * Helper: Notify appointment updated
   */
  static async notifyAppointmentUpdated(
    userId: number,
    data: AppointmentNotificationData
  ) {
    return this.createNotification({
      recipientId: userId,
      recipientType: 'USER',
      type: 'APPOINTMENT_UPDATED',
      data,
      appointmentId: data.appointmentId
    });
  }

  /**
   * Helper: Notify appointment cancelled
   */
  static async notifyAppointmentCancelled(
    userId: number,
    data: AppointmentNotificationData
  ) {
    return this.createNotification({
      recipientId: userId,
      recipientType: 'USER',
      type: 'APPOINTMENT_CANCELLED',
      data,
      appointmentId: data.appointmentId
    });
  }

  /**
   * Helper: Notify driver of job offer
   */
  static async notifyJobOffer(
    driverId: number,
    data: JobNotificationData
  ) {
    return this.createNotification({
      recipientId: driverId,
      recipientType: 'DRIVER',
      type: 'JOB_OFFER_RECEIVED',
      data,
      appointmentId: data.appointmentId,
      driverId
    });
  }

  /**
   * Helper: Notify driver of job assignment
   */
  static async notifyJobAssigned(
    driverId: number,
    data: JobNotificationData
  ) {
    return this.createNotification({
      recipientId: driverId,
      recipientType: 'DRIVER',
      type: 'JOB_ASSIGNED',
      data,
      appointmentId: data.appointmentId,
      driverId
    });
  }

  /**
   * Helper: Notify driver of job cancellation
   */
  static async notifyJobCancelled(
    driverId: number,
    data: JobNotificationData
  ) {
    return this.createNotification({
      recipientId: driverId,
      recipientType: 'DRIVER',
      type: 'JOB_CANCELLED',
      data,
      appointmentId: data.appointmentId,
      driverId
    });
  }

  /**
   * Helper: Notify mover of new job
   */
  static async notifyNewJobAvailable(
    moverId: number,
    data: JobNotificationData
  ) {
    return this.createNotification({
      recipientId: moverId,
      recipientType: 'MOVER',
      type: 'NEW_JOB_AVAILABLE',
      data,
      appointmentId: data.appointmentId,
      movingPartnerId: moverId
    });
  }

  /**
   * Helper: Notify order confirmed
   */
  static async notifyOrderConfirmed(
    userId: number,
    data: OrderNotificationData
  ) {
    return this.createNotification({
      recipientId: userId,
      recipientType: 'USER',
      type: 'ORDER_CONFIRMED',
      data,
      orderId: data.orderId
    });
  }

  /**
   * Helper: Notify delivery completed
   */
  static async notifyDeliveryCompleted(
    userId: number,
    data: OrderNotificationData
  ) {
    return this.createNotification({
      recipientId: userId,
      recipientType: 'USER',
      type: 'DELIVERY_COMPLETED',
      data,
      orderId: data.orderId
    });
  }

  /**
   * Helper: Notify driver of route offer
   */
  static async notifyRouteOffer(
    driverId: number,
    data: RouteNotificationData
  ) {
    return this.createNotification({
      recipientId: driverId,
      recipientType: 'DRIVER',
      type: 'ROUTE_OFFER',
      data,
      routeId: data.routeId,
      driverId
    });
  }

  /**
   * Helper: Notify driver of route assignment
   */
  static async notifyRouteAssigned(
    driverId: number,
    data: RouteNotificationData
  ) {
    return this.createNotification({
      recipientId: driverId,
      recipientType: 'DRIVER',
      type: 'ROUTE_ASSIGNED',
      data,
      routeId: data.routeId,
      driverId
    });
  }

  /**
   * Helper: Notify payment failed
   */
  static async notifyPaymentFailed(
    userId: number,
    data: PaymentNotificationData
  ) {
    return this.createNotification({
      recipientId: userId,
      recipientType: 'USER',
      type: 'PAYMENT_FAILED',
      data
    });
  }

  /**
   * Helper: Notify payout processed
   */
  static async notifyPayoutProcessed(
    recipientId: number,
    recipientType: 'DRIVER' | 'MOVER',
    data: PaymentNotificationData
  ) {
    return this.createNotification({
      recipientId,
      recipientType,
      type: 'PAYOUT_PROCESSED',
      data
    });
  }

  /**
   * Helper: Notify tip received
   */
  static async notifyTipReceived(
    recipientId: number,
    recipientType: 'DRIVER' | 'MOVER',
    data: PaymentNotificationData
  ) {
    return this.createNotification({
      recipientId,
      recipientType,
      type: 'TIP_RECEIVED',
      data
    });
  }

  /**
   * Helper: Notify feedback received
   */
  static async notifyFeedbackReceived(
    recipientId: number,
    recipientType: 'DRIVER' | 'MOVER',
    data: FeedbackNotificationData
  ) {
    return this.createNotification({
      recipientId,
      recipientType,
      type: 'FEEDBACK_RECEIVED',
      data,
      appointmentId: data.appointmentId,
      orderId: data.orderId
    });
  }

  /**
   * Helper: Notify account approved
   */
  static async notifyAccountApproved(
    recipientId: number,
    recipientType: 'DRIVER' | 'MOVER',
    data: AccountNotificationData
  ) {
    return this.createNotification({
      recipientId,
      recipientType,
      type: 'ACCOUNT_APPROVED',
      data
    });
  }

  /**
   * Helper: Notify vehicle approved
   * @param recipientId - The driver or mover ID
   * @param recipientType - Either 'DRIVER' or 'MOVER'
   * @param data - Account notification data including vehicle details
   */
  static async notifyVehicleApproved(
    recipientId: number,
    recipientType: 'DRIVER' | 'MOVER',
    data: AccountNotificationData
  ) {
    return this.createNotification({
      recipientId,
      recipientType,
      type: 'VEHICLE_APPROVED',
      data,
      driverId: recipientType === 'DRIVER' ? recipientId : undefined,
      movingPartnerId: recipientType === 'MOVER' ? recipientId : undefined
    });
  }

  /**
   * Helper: Notify vehicle rejected
   */
  static async notifyVehicleRejected(
    driverId: number,
    data: AccountNotificationData
  ) {
    return this.createNotification({
      recipientId: driverId,
      recipientType: 'DRIVER',
      type: 'VEHICLE_REJECTED',
      data
    });
  }

  /**
   * Helper: Notify admin that driver assignment failed for a unit
   * Creates a direct notification without using templates
   */
  static async notifyDriverAssignmentFailed(
    adminId: number,
    data: {
      appointmentId: number;
      unitNumber: number;
      appointmentType: string;
      date: Date;
      time: Date;
      address: string;
    }
  ) {
    // Create notification directly since we don't have a specific template
    return await prisma.notification.create({
      data: {
        recipientId: adminId,
        recipientType: 'ADMIN',
        type: 'COMPLIANCE_ISSUE',
        title: 'Driver Assignment Failed',
        message: `No drivers available for ${data.appointmentType} Unit ${data.unitNumber} at ${data.address}`,
        appointmentId: data.appointmentId
      }
    });
  }
}


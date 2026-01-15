/**
 * @fileoverview Notification system types and interfaces
 * @source New types for boombox-11.0 notification system
 * 
 * Provides comprehensive type definitions for:
 * - Notification templates with variable validation
 * - Notification creation and trigger data
 * - Recipient types and notification routing
 * - Template variable validation
 */

import { NotificationType as PrismaNotificationType, UserType } from '@prisma/client';

/**
 * Notification recipient types (matches Prisma enum)
 */
export type NotificationRecipientType = UserType;

/**
 * Notification template interface
 */
export interface NotificationTemplate {
  type: PrismaNotificationType;
  category: 'appointments' | 'jobs' | 'packing-supplies' | 'payments' | 'feedback' | 'account';
  
  /**
   * Function to generate notification title
   */
  getTitle: (data: Record<string, any>) => string;
  
  /**
   * Function to generate notification message
   */
  getMessage: (data: Record<string, any>) => string;
  
  /**
   * Recipient types that can receive this notification
   */
  recipientTypes: NotificationRecipientType[];
  
  /**
   * Required variables for template rendering
   */
  requiredVariables: string[];
  
  /**
   * Optional variables for template rendering
   */
  optionalVariables?: string[];
  
  /**
   * Whether this notification type supports grouping
   */
  supportsGrouping?: boolean;
  
  /**
   * Function to generate group key for grouping similar notifications
   */
  getGroupKey?: (data: Record<string, any>) => string;
}

/**
 * Notification creation parameters
 */
export interface CreateNotificationParams {
  recipientId: number;
  recipientType: NotificationRecipientType;
  type: PrismaNotificationType;
  data: Record<string, any>;
  appointmentId?: number;
  orderId?: number;
  routeId?: string;
  taskId?: string;
  driverId?: number;
  movingPartnerId?: number;
}

/**
 * Batch notification creation parameters
 */
export interface BatchCreateNotificationParams {
  recipients: Array<{
    recipientId: number;
    recipientType: NotificationRecipientType;
  }>;
  type: PrismaNotificationType;
  data: Record<string, any>;
  appointmentId?: number;
  orderId?: number;
  routeId?: string;
  taskId?: string;
  driverId?: number;
  movingPartnerId?: number;
}

/**
 * Appointment notification data
 */
export interface AppointmentNotificationData {
  appointmentId: number;
  appointmentType: string;
  date: Date | string;
  time?: Date | string;
  address: string;
  zipCode?: string;
  numberOfUnits?: number;
  customerName?: string;
  driverName?: string;
  movingPartnerName?: string;
  cancellationReason?: string;
}

/**
 * Job notification data
 */
export interface JobNotificationData {
  appointmentId: number;
  jobType: string;
  date: Date | string;
  time?: Date | string;
  address: string;
  customerName?: string;
  driverName?: string;
  movingPartnerName?: string;
  estimatedPayout?: number;
  details?: string;
}

/**
 * Order notification data
 */
export interface OrderNotificationData {
  orderId: number;
  orderType: 'packing-supplies';
  deliveryDate: Date | string;
  deliveryAddress: string;
  totalAmount?: number;
  itemCount?: number;
  driverName?: string;
}

/**
 * Route notification data
 */
export interface RouteNotificationData {
  routeId: string;
  deliveryDate: Date | string;
  stopCount: number;
  estimatedPayout: number;
  startTime?: string;
  endTime?: string;
}

/**
 * Payment notification data
 */
export interface PaymentNotificationData {
  amount: number;
  currency?: string;
  transactionId?: string;
  date?: Date | string;
  description?: string;
  failureReason?: string;
  payoutMethod?: string;
}

/**
 * Feedback notification data
 */
export interface FeedbackNotificationData {
  rating: number;
  feedbackText?: string;
  customerName?: string;
  appointmentId?: number;
  orderId?: number;
  tipAmount?: number;
}

/**
 * Account notification data
 */
export interface AccountNotificationData {
  accountType: 'driver' | 'mover' | 'customer';
  userName?: string;
  vehicleType?: string;
  vehicleId?: number;
  rejectionReason?: string;
  approvalDate?: Date | string;
  suspensionReason?: string;
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  isValid: boolean;
  missingVariables?: string[];
  errors?: string[];
}


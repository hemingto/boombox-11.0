/**
 * @fileoverview Notification templates barrel export
 * @source New barrel file for boombox-11.0 notification system
 * 
 * Exports all notification templates organized by domain
 */

import { NotificationTemplate } from './types';

// Appointment templates
import {
  appointmentConfirmedTemplate,
  appointmentUpdatedTemplate,
  appointmentCancelledTemplate
} from './templates/appointments';

// Job templates
import {
  jobOfferReceivedTemplate,
  jobAssignedTemplate,
  jobDetailsUpdatedTemplate,
  jobCancelledTemplate,
  reconfirmationRequiredTemplate,
  newJobAvailableTemplate,
  customerCancellationTemplate
} from './templates/jobs';

// Packing supply templates
import {
  orderConfirmedTemplate,
  deliveryCompletedTemplate,
  orderCancelledTemplate,
  routeOfferTemplate,
  routeAssignedTemplate,
  routeCancelledTemplate
} from './templates/packing-supplies';

// Payment templates
import {
  paymentFailedTemplate,
  refundProcessedTemplate,
  payoutProcessedTemplate,
  payoutFailedTemplate,
  tipReceivedTemplate,
  storagePaymentDueTemplate
} from './templates/payments';

// Feedback templates
import { feedbackReceivedTemplate } from './templates/feedback';

// Account templates
import {
  accountApprovedTemplate,
  accountSuspendedTemplate,
  vehicleApprovedTemplate,
  vehicleRejectedTemplate,
  driverApprovedTemplate,
  moverPendingDriversTemplate,
  moverActivatedTemplate
} from './templates/account';

/**
 * Template registry - maps notification types to their templates
 */
export const notificationTemplates: Record<string, NotificationTemplate> = {
  // Appointments (3)
  APPOINTMENT_CONFIRMED: appointmentConfirmedTemplate,
  APPOINTMENT_UPDATED: appointmentUpdatedTemplate,
  APPOINTMENT_CANCELLED: appointmentCancelledTemplate,
  
  // Jobs (7)
  JOB_OFFER_RECEIVED: jobOfferReceivedTemplate,
  JOB_ASSIGNED: jobAssignedTemplate,
  JOB_DETAILS_UPDATED: jobDetailsUpdatedTemplate,
  JOB_CANCELLED: jobCancelledTemplate,
  RECONFIRMATION_REQUIRED: reconfirmationRequiredTemplate,
  NEW_JOB_AVAILABLE: newJobAvailableTemplate,
  CUSTOMER_CANCELLATION: customerCancellationTemplate,
  
  // Packing Supplies (6)
  ORDER_CONFIRMED: orderConfirmedTemplate,
  DELIVERY_COMPLETED: deliveryCompletedTemplate,
  ORDER_CANCELLED: orderCancelledTemplate,
  ROUTE_OFFER: routeOfferTemplate,
  ROUTE_ASSIGNED: routeAssignedTemplate,
  ROUTE_CANCELLED: routeCancelledTemplate,
  
  // Payments (6)
  PAYMENT_FAILED: paymentFailedTemplate,
  REFUND_PROCESSED: refundProcessedTemplate,
  PAYOUT_PROCESSED: payoutProcessedTemplate,
  PAYOUT_FAILED: payoutFailedTemplate,
  TIP_RECEIVED: tipReceivedTemplate,
  STORAGE_PAYMENT_DUE: storagePaymentDueTemplate,
  
  // Feedback (1)
  FEEDBACK_RECEIVED: feedbackReceivedTemplate,
  
  // Account (7)
  ACCOUNT_APPROVED: accountApprovedTemplate,
  ACCOUNT_SUSPENDED: accountSuspendedTemplate,
  VEHICLE_APPROVED: vehicleApprovedTemplate,
  VEHICLE_REJECTED: vehicleRejectedTemplate,
  DRIVER_APPROVED: driverApprovedTemplate,
  MOVER_PENDING_DRIVERS: moverPendingDriversTemplate,
  MOVER_ACTIVATED: moverActivatedTemplate
};

/**
 * Get template by notification type
 */
export function getNotificationTemplate(type: string): NotificationTemplate | null {
  return notificationTemplates[type] || null;
}

/**
 * Get all templates for a specific category
 */
export function getTemplatesByCategory(category: string): NotificationTemplate[] {
  return Object.values(notificationTemplates).filter(
    template => template.category === category
  );
}

/**
 * Get all templates for a specific recipient type
 */
export function getTemplatesByRecipientType(recipientType: string): NotificationTemplate[] {
  return Object.values(notificationTemplates).filter(
    template => template.recipientTypes.includes(recipientType as any)
  );
}

// Export types
export * from './types';


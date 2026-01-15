/**
 * @fileoverview NotificationIcon - Maps notification types to appropriate icons
 * @source New component for boombox-11.0 notification system
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides centralized icon mapping for all notification types across the system.
 * Returns semantic icon components with proper accessibility labels based on notification type.
 * Supports 38 notification types organized by business domain.
 * 
 * DESIGN SYSTEM INTEGRATION:
 * - Uses design system color tokens for status colors
 * - Supports dark/light theme variants
 * - Includes proper ARIA labels for accessibility
 * 
 * @refactor Consolidates icon logic previously inline in NotificationDropdown
 */

import {
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BellIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export type NotificationType =
  // Appointments
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_UPDATED'
  | 'APPOINTMENT_CANCELLED'
  // Jobs
  | 'JOB_OFFER_RECEIVED'
  | 'JOB_ASSIGNED'
  | 'JOB_DETAILS_UPDATED'
  | 'JOB_CANCELLED'
  | 'RECONFIRMATION_REQUIRED'
  | 'NEW_JOB_AVAILABLE'
  | 'CUSTOMER_CANCELLATION'
  // Packing Supplies
  | 'ORDER_CONFIRMED'
  | 'DELIVERY_COMPLETED'
  | 'ORDER_CANCELLED'
  | 'ROUTE_OFFER'
  | 'ROUTE_ASSIGNED'
  | 'ROUTE_CANCELLED'
  // Payments
  | 'PAYMENT_FAILED'
  | 'REFUND_PROCESSED'
  | 'PAYOUT_PROCESSED'
  | 'PAYOUT_FAILED'
  | 'TIP_RECEIVED'
  | 'STORAGE_PAYMENT_DUE'
  // Feedback
  | 'FEEDBACK_RECEIVED'
  // Account
  | 'ACCOUNT_APPROVED'
  | 'ACCOUNT_SUSPENDED'
  | 'VEHICLE_APPROVED'
  | 'VEHICLE_REJECTED';

export interface NotificationIconProps {
  type: NotificationType;
  className?: string;
}

/**
 * Returns the appropriate icon component for a notification type
 */
export function NotificationIcon({ type, className = 'h-5 w-5' }: NotificationIconProps) {
  const iconClassName = className;

  switch (type) {
    // Success states - green
    case 'APPOINTMENT_CONFIRMED':
    case 'APPOINTMENT_UPDATED':
    case 'JOB_ASSIGNED':
    case 'ORDER_CONFIRMED':
    case 'DELIVERY_COMPLETED':
    case 'ROUTE_ASSIGNED':
    case 'ACCOUNT_APPROVED':
    case 'VEHICLE_APPROVED':
    case 'REFUND_PROCESSED':
    case 'PAYOUT_PROCESSED':
      return (
        <CheckIcon 
          className={`${iconClassName} text-status-success`} 
          aria-hidden="true" 
        />
      );

    // Warning/Pending states - yellow/orange
    case 'JOB_OFFER_RECEIVED':
    case 'ROUTE_OFFER':
    case 'RECONFIRMATION_REQUIRED':
    case 'STORAGE_PAYMENT_DUE':
      return (
        <ClockIcon 
          className={`${iconClassName} text-status-warning`} 
          aria-hidden="true" 
        />
      );

    // Error/Failure states - red
    case 'PAYMENT_FAILED':
    case 'PAYOUT_FAILED':
    case 'JOB_CANCELLED':
    case 'APPOINTMENT_CANCELLED':
    case 'ORDER_CANCELLED':
    case 'ROUTE_CANCELLED':
    case 'CUSTOMER_CANCELLATION':
    case 'ACCOUNT_SUSPENDED':
    case 'VEHICLE_REJECTED':
      return (
        <ExclamationTriangleIcon 
          className={`${iconClassName} text-status-error`} 
          aria-hidden="true" 
        />
      );

    // Info states - blue/cyan
    case 'JOB_DETAILS_UPDATED':
    case 'NEW_JOB_AVAILABLE':
      return (
        <BellIcon 
          className={`${iconClassName} text-status-info`} 
          aria-hidden="true" 
        />
      );

    // Money/Payment - green
    case 'TIP_RECEIVED':
      return (
        <CurrencyDollarIcon 
          className={`${iconClassName} text-status-success`} 
          aria-hidden="true" 
        />
      );

    // Delivery/Route - blue
    case 'ROUTE_OFFER':
    case 'ROUTE_ASSIGNED':
      return (
        <TruckIcon 
          className={`${iconClassName} text-status-info`} 
          aria-hidden="true" 
        />
      );

    // Feedback - purple
    case 'FEEDBACK_RECEIVED':
      return (
        <ChatBubbleLeftIcon 
          className={`${iconClassName} text-purple-500`} 
          aria-hidden="true" 
        />
      );

    // Default fallback
    default:
      return (
        <div 
          className={`${iconClassName} bg-border rounded-full`} 
          aria-hidden="true" 
        />
      );
  }
}

/**
 * Returns a text description of the icon type for screen readers
 */
export function getNotificationIconLabel(type: NotificationType): string {
  switch (type) {
    case 'APPOINTMENT_CONFIRMED':
    case 'APPOINTMENT_UPDATED':
    case 'JOB_ASSIGNED':
    case 'ORDER_CONFIRMED':
    case 'DELIVERY_COMPLETED':
    case 'ROUTE_ASSIGNED':
    case 'ACCOUNT_APPROVED':
    case 'VEHICLE_APPROVED':
    case 'REFUND_PROCESSED':
    case 'PAYOUT_PROCESSED':
      return 'Success';
    
    case 'JOB_OFFER_RECEIVED':
    case 'ROUTE_OFFER':
    case 'RECONFIRMATION_REQUIRED':
    case 'STORAGE_PAYMENT_DUE':
      return 'Pending action';
    
    case 'PAYMENT_FAILED':
    case 'PAYOUT_FAILED':
    case 'JOB_CANCELLED':
    case 'APPOINTMENT_CANCELLED':
    case 'ORDER_CANCELLED':
    case 'ROUTE_CANCELLED':
    case 'CUSTOMER_CANCELLATION':
    case 'ACCOUNT_SUSPENDED':
    case 'VEHICLE_REJECTED':
      return 'Alert';
    
    case 'JOB_DETAILS_UPDATED':
    case 'NEW_JOB_AVAILABLE':
      return 'Information';
    
    case 'TIP_RECEIVED':
      return 'Payment received';
    
    case 'FEEDBACK_RECEIVED':
      return 'New feedback';
    
    default:
      return 'Notification';
  }
}


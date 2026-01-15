/**
 * @fileoverview NotificationContent - Renders notification-specific content and deep linking
 * @source New component for boombox-11.0 notification system
 * 
 * COMPONENT FUNCTIONALITY:
 * Handles notification content formatting, message rendering, and deep linking logic.
 * Provides specialized rendering for different notification types with proper formatting.
 * Manages navigation to related entities based on notification context.
 * 
 * DEEP LINKING PATTERNS:
 * - Appointments: /customer/{userId}?tab=appointments&id={appointmentId}
 * - Orders: /customer/{userId}?tab=orders&id={orderId}
 * - Routes (Driver): /service-provider/driver/{userId}?tab=routes&id={routeId}
 * - Jobs (Mover): /service-provider/mover/{userId}?tab=jobs
 * 
 * @refactor Extracted from NotificationDropdown to centralize content logic
 */

'use client';

import { NotificationType } from './NotificationIcon';

export interface NotificationContentProps {
  type: NotificationType;
  title: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  groupCount?: number;
  appointmentId?: number;
  orderId?: number;
  routeId?: string;
  recipientId: number;
  recipientType: 'USER' | 'DRIVER' | 'MOVER' | 'ADMIN';
  onClick?: () => void;
}

/**
 * Generates the deep link URL for a notification
 */
export function getNotificationDeepLink(
  notification: NotificationContentProps
): string | null {
  const { appointmentId, orderId, routeId, recipientId, recipientType } = notification;

  // Appointments - direct to appointment detail
  if (appointmentId) {
    if (recipientType === 'USER') {
      return `/customer/${recipientId}?tab=appointments&id=${appointmentId}`;
    } else if (recipientType === 'DRIVER') {
      return `/service-provider/driver/${recipientId}?tab=jobs&appointmentId=${appointmentId}`;
    } else if (recipientType === 'MOVER') {
      return `/service-provider/mover/${recipientId}?tab=jobs&appointmentId=${appointmentId}`;
    }
  }

  // Packing supply orders - direct to order detail
  if (orderId) {
    if (recipientType === 'USER') {
      return `/customer/${recipientId}?tab=orders&id=${orderId}`;
    }
  }

  // Routes - direct to route detail (drivers only)
  if (routeId && recipientType === 'DRIVER') {
    return `/service-provider/driver/${recipientId}?tab=routes&routeId=${routeId}`;
  }

  // Default fallbacks based on recipient type
  if (recipientType === 'USER') {
    return `/customer/${recipientId}`;
  } else if (recipientType === 'DRIVER') {
    return `/service-provider/driver/${recipientId}`;
  } else if (recipientType === 'MOVER') {
    return `/service-provider/mover/${recipientId}`;
  } else if (recipientType === 'ADMIN') {
    return `/admin/dashboard`;
  }

  return null;
}

/**
 * Notification content component with deep linking
 */
export function NotificationContent(props: NotificationContentProps) {
  const { title, message, status, groupCount, onClick } = props;

  const handleClick = () => {
    const deepLink = getNotificationDeepLink(props);
    
    // Call parent onClick handler (for marking as read)
    if (onClick) {
      onClick();
    }

    // Navigate to deep link
    if (deepLink) {
      window.location.href = deepLink;
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left p-4 cursor-pointer transition-colors ${
        status === 'UNREAD' 
          ? 'bg-surface-tertiary hover:bg-surface-disabled' 
          : 'hover:bg-surface-secondary'
      }`}
      aria-label={`${title}. ${message}. ${status === 'UNREAD' ? 'Unread.' : 'Read.'}`}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-text-primary ${
          status === 'UNREAD' ? 'font-semibold' : ''
        }`}>
          {title}
          {groupCount && groupCount > 1 && (
            <span 
              className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-status-bg-info text-status-info"
              aria-label={`${groupCount} notifications grouped`}
            >
              {groupCount}
            </span>
          )}
        </p>
        <p className="text-sm text-text-secondary mt-1 line-clamp-2">
          {message}
        </p>
      </div>
    </button>
  );
}


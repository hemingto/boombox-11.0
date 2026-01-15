/**
 * @fileoverview NotificationList - Reusable notification list component with states
 * @source New component for boombox-11.0 notification system
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a reusable notification list component with loading, empty, and error states.
 * Used in dropdown, full-page notification views, and potential mobile apps.
 * Handles notification rendering, interaction, and state management.
 * 
 * FEATURES:
 * - Loading skeleton states
 * - Empty state messaging
 * - Notification grouping display
 * - Deep linking support
 * - Accessible keyboard navigation
 * 
 * @refactor Extracted reusable list logic from NotificationDropdown
 */

'use client';

import { CheckIcon } from '@heroicons/react/24/outline';
import { NotificationIcon, NotificationType } from './NotificationIcon';
import { NotificationContent } from './NotificationContent';
import { formatRelativeTime } from '@/lib/utils/dateUtils';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  createdAt: string;
  groupCount?: number;
  appointmentId?: number;
  orderId?: number;
  routeId?: string;
}

export interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  recipientId: number;
  recipientType: 'USER' | 'DRIVER' | 'MOVER' | 'ADMIN';
  onNotificationClick: (notification: Notification) => void;
}

/**
 * Loading skeleton for notifications
 */
function NotificationListSkeleton() {
  return (
    <div className="p-4 space-y-3" role="status" aria-label="Loading notifications">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex space-x-3">
            <div className="w-5 h-5 bg-surface-disabled rounded" aria-hidden="true"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-disabled rounded w-3/4" aria-hidden="true"></div>
              <div className="h-3 bg-surface-disabled rounded w-1/2" aria-hidden="true"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state for notifications
 */
function NotificationListEmpty() {
  return (
    <div className="p-8 text-center text-text-secondary" role="status">
      <div className="w-12 h-12 bg-surface-tertiary rounded-full mx-auto mb-3 flex items-center justify-center">
        <CheckIcon className="h-6 w-6 text-text-tertiary" aria-hidden="true" />
      </div>
      <p className="text-sm">You&apos;re all caught up!</p>
      <p className="text-xs text-text-tertiary mt-1">No new notifications</p>
    </div>
  );
}

/**
 * Main notification list component
 */
export function NotificationList({
  notifications,
  isLoading,
  recipientId,
  recipientType,
  onNotificationClick
}: NotificationListProps) {
  // Loading state
  if (isLoading) {
    return <NotificationListSkeleton />;
  }

  // Empty state
  if (notifications.length === 0) {
    return <NotificationListEmpty />;
  }

  // Notifications list
  return (
    <div className="divide-y divide-border-subtle">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="flex space-x-3 p-4"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNotificationClick(notification);
            }
          }}
        >
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <NotificationIcon type={notification.type} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <NotificationContent
              type={notification.type}
              title={notification.title}
              message={notification.message}
              status={notification.status}
              groupCount={notification.groupCount}
              appointmentId={notification.appointmentId}
              orderId={notification.orderId}
              routeId={notification.routeId}
              recipientId={recipientId}
              recipientType={recipientType}
              onClick={() => onNotificationClick(notification)}
            />
          </div>

          {/* Timestamp */}
          <div className="flex-shrink-0 inline-flex items-center">
            <span className="text-xs text-text-tertiary">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}


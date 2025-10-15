/**
 * @fileoverview NotificationDropdown - Full-featured notification dropdown with pagination
 * @source boombox-10.0/src/app/components/notifications/notification-dropdown.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a dropdown/modal with paginated notifications. Fetches notifications from API
 * with pagination support, allows marking individual or all notifications as read, includes
 * deep linking to related entities (appointments, orders, routes), and handles body scroll
 * lock on mobile. Provides loading states, empty states, and relative time formatting.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/notifications → New: /api/notifications (no change, already migrated)
 * - Old: /api/notifications/[id] → New: /api/notifications/[id] (no change, already migrated)
 * - Old: /api/notifications/mark-all-read → New: /api/notifications/mark-all-read (no change)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design tokens
 * - Changed bg-slate-100 → bg-surface-tertiary
 * - Changed bg-slate-200 → bg-surface-disabled
 * - Changed text-zinc-950 → text-text-primary
 * - Changed text-zinc-600 → text-text-secondary
 * - Changed text-zinc-400 → text-text-tertiary
 * - Changed text-red-500 → text-status-error
 * - Changed text-emerald-500 → text-status-success
 * - Changed text-cyan-500 → text-status-info
 * - Changed border-slate-200 → border-border
 * - Changed border-slate-100 → border-border-subtle
 * - Applied consistent hover states with design system colors
 * 
 * ACCESSIBILITY ENHANCEMENTS:
 * - Added proper ARIA labels for interactive elements
 * - Improved button accessibility with descriptive labels
 * - Added role="dialog" for modal behavior
 * - Proper keyboard navigation support
 * - Screen reader friendly notification states
 * 
 * UTILITY EXTRACTION:
 * - Extracted formatRelativeTime to centralized dateUtils
 * 
 * @refactor Replaced inline formatRelativeTime with centralized utility, replaced hardcoded
 * colors with design system tokens, improved accessibility with comprehensive ARIA labels
 */

'use client';

import { useState, useEffect } from 'react';
import { formatRelativeTime } from '@/lib/utils/dateUtils';
import { 
  CheckIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  createdAt: string;
  groupCount?: number;
  appointmentId?: number;
  orderId?: number;
  routeId?: string;
}

export interface NotificationDropdownProps {
  recipientId: number;
  recipientType: 'USER' | 'DRIVER' | 'MOVER' | 'ADMIN';
  onClose: () => void;
  onNotificationRead: () => void;
  onMarkAllRead: () => void;
}

export function NotificationDropdown({
  recipientId,
  recipientType,
  onClose,
  onNotificationRead,
  onMarkAllRead
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const limit = 5;

  // Handle body scroll lock when dropdown is open (mobile only)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // Mobile breakpoint
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/notifications?recipientId=${recipientId}&recipientType=${recipientType}&page=${currentPage}&limit=${limit}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalCount(data.pagination?.total || 0);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [recipientId, recipientType, currentPage]);

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, status: 'READ' as const }
              : notification
          )
        );
        onNotificationRead();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipientId, 
          recipientType 
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ 
            ...notification, 
            status: 'READ' as const 
          }))
        );
        setUnreadCount(0);
        onMarkAllRead();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (notification.status === 'UNREAD') {
      markAsRead(notification.id);
    }
    
    // Handle deep linking based on notification type
    if (notification.appointmentId) {
      // Navigate to appointment details
      window.location.href = `/user-page/${recipientId}?tab=appointments&appointmentId=${notification.appointmentId}`;
    } else if (notification.orderId) {
      // Navigate to order details
      window.location.href = `/user-page/${recipientId}?tab=orders&orderId=${notification.orderId}`;
    } else if (notification.routeId) {
      // Navigate to route details
      window.location.href = `/driver-account-page/${recipientId}?tab=routes&routeId=${notification.routeId}`;
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT_CONFIRMED':
      case 'APPOINTMENT_UPDATED':
      case 'JOB_ASSIGNED':
        return <CheckIcon className="h-5 w-5 text-status-success" aria-hidden="true" />;
      case 'JOB_OFFER_RECEIVED':
      case 'ROUTE_OFFER':
        return <ClockIcon className="h-5 w-5 text-status-info" aria-hidden="true" />;
      case 'PAYMENT_FAILED':
      case 'PAYOUT_FAILED':
        return <ExclamationTriangleIcon className="h-5 w-5 text-status-error" aria-hidden="true" />;
      default:
        return <div className="h-5 w-5 bg-border rounded-full" aria-hidden="true" />;
    }
  };

  return (
    <div 
      className="md:absolute md:right-0 md:top-12 md:w-screen md:max-w-sm md:border md:border-border md:rounded-lg md:shadow-lg fixed inset-0 top-16 md:inset-auto md:top-12 bg-surface-primary z-50 transition-all duration-500 overflow-hidden max-h-screen md:max-h-96 md:flex md:flex-col"
      role="dialog"
      aria-label="Notifications"
      aria-modal="true"
    >
      {/* Header */}
      <div className="p-4 border-b border-border-subtle md:flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Notifications</h3>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-text-primary hover:bg-surface-tertiary rounded-full px-3 py-2 font-medium transition-colors"
                aria-label="Mark all notifications as read"
              >
                Mark all as Read
              </button>
            )}
            <button
              onClick={onClose}
              className="md:hidden p-2 text-text-primary hover:bg-surface-tertiary rounded-full transition-colors"
              aria-label="Close notifications"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 md:flex-1 md:min-h-0 overflow-y-auto">
        {isLoading ? (
          // Loading skeleton
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
        ) : notifications.length === 0 ? (
          // Empty state
          <div className="p-8 text-center text-text-secondary" role="status">
            <div className="w-12 h-12 bg-surface-tertiary rounded-full mx-auto mb-3 flex items-center justify-center">
              <CheckIcon className="h-6 w-6 text-text-tertiary" aria-hidden="true" />
            </div>
            <p className="text-sm">You&apos;re all caught up!</p>
            <p className="text-xs text-text-tertiary mt-1">No new notifications</p>
          </div>
        ) : (
          // Notifications list
          <div className="divide-y divide-border-subtle">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 cursor-pointer transition-colors ${
                  notification.status === 'UNREAD' 
                    ? 'bg-surface-tertiary hover:bg-surface-disabled' 
                    : 'hover:bg-surface-secondary'
                }`}
                role="button"
                tabIndex={0}
                aria-label={`${notification.title}. ${notification.message}. ${
                  notification.status === 'UNREAD' ? 'Unread.' : 'Read.'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNotificationClick(notification);
                  }
                }}
              >
                <div className="flex space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium text-text-primary ${
                          notification.status === 'UNREAD' ? 'font-semibold' : ''
                        }`}>
                          {notification.title}
                          {notification.groupCount && notification.groupCount > 1 && (
                            <span 
                              className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-status-bg-info text-status-info"
                              aria-label={`${notification.groupCount} notifications grouped`}
                            >
                              {notification.groupCount}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex-shrink-0 inline-flex items-center">
                        <span className="text-xs text-text-tertiary">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-border-subtle flex items-center justify-between md:flex-shrink-0">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-full hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          </button>
          
          <span className="text-xs text-text-secondary" aria-live="polite">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-full hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}


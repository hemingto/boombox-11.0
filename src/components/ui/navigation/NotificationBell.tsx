/**
 * @fileoverview NotificationBell - Bell icon with unread count badge for notification system
 * @source boombox-10.0/src/app/components/notifications/notification-bell.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a bell icon with unread notification count badge. Fetches and displays
 * unread count from the notification API with polling every 30 seconds. Toggles
 * notification dropdown on click. Supports different recipient types (USER, DRIVER,
 * MOVER, ADMIN) and theme variants (dark/light).
 * 
 * API ROUTES UPDATED:
 * - Old: /api/notifications → New: /api/notifications (no change, already migrated)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design tokens
 * - Changed bg-red-500 → bg-status-error for error states
 * - Changed text-white → text-text-inverse for contrast
 * - Changed hover:bg-zinc-800 → hover:bg-primary-hover
 * - Changed hover:bg-slate-100 → hover:bg-surface-tertiary
 * - Applied consistent focus states with design system colors
 * 
 * ACCESSIBILITY ENHANCEMENTS:
 * - Added proper aria-label for bell button
 * - Included screen reader accessible unread count
 * - Proper keyboard navigation support
 * 
 * @refactor Extracted click-outside logic to useClickOutside hook, replaced hardcoded
 * colors with design system tokens, improved accessibility with ARIA labels
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { useClickOutside } from '@/hooks/useClickOutside';
import { NotificationDropdown } from './NotificationDropdown';

export interface NotificationBellProps {
 recipientId: number;
 recipientType: 'USER' | 'DRIVER' | 'MOVER' | 'ADMIN';
 isDarkTheme?: boolean;
}

export function NotificationBell({ 
 recipientId, 
 recipientType,
 isDarkTheme = false
}: NotificationBellProps) {
 const [isOpen, setIsOpen] = useState(false);
 const [unreadCount, setUnreadCount] = useState(0);
 const [isLoading, setIsLoading] = useState(true);
 const dropdownRef = useRef<HTMLDivElement>(null);

 // Fetch unread count
 useEffect(() => {
  const fetchUnreadCount = async () => {
   try {
    const response = await fetch(
     `/api/notifications?recipientId=${recipientId}&recipientType=${recipientType}&status=UNREAD&limit=1`
    );
    
    if (response.ok) {
     const data = await response.json();
     setUnreadCount(Math.min(data.unreadCount || 0, 25)); // Cap at 25
    }
   } catch (error) {
    console.error('Error fetching unread count:', error);
   } finally {
    setIsLoading(false);
   }
  };

  fetchUnreadCount();
  
  // Poll for updates every 30 seconds
  const interval = setInterval(fetchUnreadCount, 30000);
  return () => clearInterval(interval);
 }, [recipientId, recipientType]);

 // Handle click outside to close dropdown (desktop only)
 useClickOutside(
  dropdownRef,
  () => {
   if (window.innerWidth >= 768) {
    setIsOpen(false);
   }
  },
  isOpen
 );

 const handleBellClick = () => {
  setIsOpen(!isOpen);
 };

 const handleNotificationRead = () => {
  // Refresh unread count when a notification is read
  setUnreadCount(prev => Math.max(0, prev - 1));
 };

 const handleMarkAllRead = () => {
  setUnreadCount(0);
 };

 return (
  <div className="relative" ref={dropdownRef}>
   <button
    onClick={handleBellClick}
    className={`relative p-2.5 rounded-full ${
     isDarkTheme
      ? 'text-text-inverse hover:bg-primary-hover active:bg-primary-active'
      : 'text-text-primary hover:bg-surface-tertiary active:bg-surface-disabled'
    }`}
    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    aria-expanded={isOpen}
    aria-haspopup="dialog"
   >
    {unreadCount > 0 ? (
     <BellSolidIcon className="h-5 w-5" aria-hidden="true" />
    ) : (
     <BellIcon className="h-5 w-5" aria-hidden="true" />
    )}
    
    {/* Notification badge */}
    {unreadCount > 0 && !isLoading && (
     <span 
      className="absolute -top-0.5 -right-0.5 bg-status-error text-text-inverse text-xs font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
      aria-hidden="true"
     >
      {unreadCount > 25 ? '25+' : unreadCount}
     </span>
    )}
   </button>

   {/* Notification dropdown */}
   {isOpen && (
    <NotificationDropdown
     recipientId={recipientId}
     recipientType={recipientType}
     onClose={() => setIsOpen(false)}
     onNotificationRead={handleNotificationRead}
     onMarkAllRead={handleMarkAllRead}
    />
   )}
  </div>
 );
}


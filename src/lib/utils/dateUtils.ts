/**
 * @fileoverview Date and time utility functions
 * @source boombox-10.0/src/app/components/reusablecomponents/customdatepicker.tsx (formatDate)
 * @source boombox-10.0/src/app/admin/delivery-routes/page.tsx (formatDateTime, formatTime)
 * @source boombox-10.0/src/app/api/availability/route.ts (formatTime, formatTimeLocal)
 * @source boombox-10.0/src/app/api/driver-assign/route.ts (getUnitSpecificStartTime)
 * @source boombox-10.0/src/app/components/edit-appointment/* (getAppointmentDateTime)
 * @source boombox-10.0/src/lib/utils/timeWindows.ts (calculateDeliveryWindow)
 * @source boombox-10.0/src/app/components/notifications/notification-dropdown.tsx (formatRelativeTime)
 * @refactor Consolidated all date/time formatting and calculation utilities
 */

import { format, addMinutes, set, addDays, isAfter } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TIME_ZONE = 'America/Los_Angeles';
const CUTOFF_HOUR = 12; // 12:00 PM PST
const WINDOW_START_HOUR = 12; // 12:00 PM PST
const WINDOW_END_HOUR = 19; // 7:00 PM PST

export interface DeliveryWindow {
  /** UTC timestamp at 12:00 PM PST for the calculated delivery date */
  start: Date;
  /** UTC timestamp at 7:00 PM PST for the calculated delivery date */
  end: Date;
}

/**
 * Format date as MM/DD/YYYY for display in input fields
 */
export function formatDateForInput(date: Date): string {
  return date.toLocaleDateString('en-US'); // Format as MM/DD/YYYY
}

/**
 * Format date as "Monday, January 1, 2024" for display
 */
export function formatDateForDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'EEEE, MMMM d, yyyy');
}

/**
 * Format date in verbose format for quote displays (e.g., "Thursday, September 19")
 * @source boombox-10.0/src/app/components/getquote/myquote.tsx (formatVerboseDate)
 * @source boombox-10.0/src/app/components/getquote/mobilemyquote.tsx (formatVerboseDate)
 */
export function formatVerboseDate(date: Date | null): string {
  if (!date) return '---';
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format date as "Jan 1, 2024" for compact display
 */
export function formatDateCompact(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d, yyyy');
}

/**
 * Format date and time for admin displays
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format time as "h:mm AM/PM" or with specified format
 */
export function formatTime(date: Date, formatType?: string): string {
  if (formatType === '12-hour-padded') {
    return format(date, 'hh:mm a');
  }
  return format(date, 'h:mm a');
}

/**
 * Format date with specified format type
 */
export function formatDate(date: Date, formatType: string): string {
  switch (formatType) {
    case 'weekday-month-day':
      return format(date, 'EEEE, MMMM d');
    case 'full-date':
      return format(date, 'EEEE, MMMM d, yyyy');
    default:
      return formatDateForDisplay(date);
  }
}

/**
 * Format time as "HH:mm" (24-hour format)
 */
export function formatTime24Hour(date: Date): string {
  return format(date, 'HH:mm');
}

/**
 * Format time duration from seconds to "Xh Ym"
 */
export function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Format timestamp (Unix seconds) to readable date
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Parse appointment time from time slot string (e.g., "2:00 PM - 4:00 PM")
 * Returns Date object with parsed time, or null if parsing fails
 */
export function parseAppointmentTime(
  scheduledDate: Date | string,
  timeSlot: string
): Date | null {
  const date =
    typeof scheduledDate === 'string'
      ? new Date(scheduledDate)
      : new Date(scheduledDate);
  const [timeSlotStartDirty] = timeSlot.split('-');
  const timeSlotStart = timeSlotStartDirty ? timeSlotStartDirty.trim() : '';

  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
  const timeMatch = timeSlotStart.match(timeRegex);

  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3].toLowerCase();

    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  return null;
}

/**
 * Calculate unit-specific start time with staggered intervals
 * Used for multiple storage unit appointments
 */
export function getUnitSpecificStartTime(
  originalAppointmentTime: Date,
  unitNumber: number
): Date {
  const staggerMinutes = (unitNumber - 1) * 15; // 15-minute intervals per unit
  return addMinutes(originalAppointmentTime, staggerMinutes);
}

/**
 * Format time minus one hour (used for display adjustments)
 */
export function formatTimeMinusOneHour(date: Date): string {
  const adjustedTime = new Date(date.getTime() - 60 * 60 * 1000);
  return format(adjustedTime, 'h:mm a');
}

/**
 * Check if a date is in the past (used for date picker validation)
 */
export function isPastDate(
  date: Date,
  allowPastDates: boolean = false
): boolean {
  if (allowPastDates) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
}

/**
 * Calculate the delivery window (12 PM – 7 PM PST) for a given order date.
 * Business rules:
 * - Orders placed before 12 PM PST are delivered the same day
 * - Orders placed at/after 12 PM PST are delivered the next day
 * - Deliveries run 7 days a week (weekends included)
 * Returns dates in UTC for database storage
 */
export function calculateDeliveryWindow(orderDate: Date): DeliveryWindow {
  // Convert order date to the target timezone (PST)
  const zonedOrderDate = toZonedTime(orderDate, TIME_ZONE);

  // Build a Date representing today at 12:00 PM in the target zone
  const cutoffToday = set(zonedOrderDate, {
    hours: CUTOFF_HOUR,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });

  // Determine if the order was placed after the cutoff
  const isAfterCutoff =
    isAfter(zonedOrderDate, cutoffToday) ||
    zonedOrderDate.getTime() === cutoffToday.getTime();

  // Decide which day the delivery will occur on
  const deliveryDateLocal = isAfterCutoff
    ? addDays(zonedOrderDate, 1)
    : zonedOrderDate;

  // Build start & end of window in the local timezone
  const windowStartLocal = set(deliveryDateLocal, {
    hours: WINDOW_START_HOUR,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const windowEndLocal = set(deliveryDateLocal, {
    hours: WINDOW_END_HOUR,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });

  // Convert the window bounds back to UTC before returning
  return {
    start: fromZonedTime(windowStartLocal, TIME_ZONE),
    end: fromZonedTime(windowEndLocal, TIME_ZONE),
  };
}

/**
 * Get current PST time for dispatch validations
 */
export function getPSTTime(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: TIME_ZONE }));
}

/**
 * Check if current time is valid for dispatch (used in cron jobs)
 */
export function isValidDispatchTime(): boolean {
  const pstTime = getPSTTime();
  const hour = pstTime.getHours();
  return hour >= 9 && hour <= 17; // 9 AM - 5 PM PST
}

/**
 * Get next dispatch time for scheduling
 */
export function getNextDispatchTime(): Date {
  const pstNow = getPSTTime();
  const nextDispatch = new Date(pstNow);
  nextDispatch.setHours(9, 0, 0, 0); // 9 AM PST

  // If already past 9 AM, schedule for next day
  if (pstNow.getHours() >= 9) {
    nextDispatch.setDate(nextDispatch.getDate() + 1);
  }

  return nextDispatch;
}

/**
 * Calculate service duration between two timestamps with 2-hour minimum
 * @source boombox-10.0/src/app/components/mover-account/job-history-popup.tsx
 * @param startTime Unix timestamp in milliseconds as string
 * @param endTime Unix timestamp in milliseconds as string
 * @returns Formatted duration string (e.g., "2h 30m" or "1h 45m (2 hr min)")
 */
export function calculateServiceDuration(startTime?: string, endTime?: string): string | null {
  if (!startTime || !endTime) return null;

  const start = new Date(parseInt(startTime));
  const end = new Date(parseInt(endTime));
  
  // Calculate difference using date-fns
  const durationInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;

  let durationText = '';
  if (hours > 0) durationText += `${hours}h `;
  if (minutes > 0) durationText += `${minutes}m`;

  return durationInMinutes < 120 ? `${durationText.trim()} (2 hr min)` : durationText.trim();
}

/**
 * Format date as relative time for notifications and activity feeds
 * @source boombox-10.0/src/app/components/notifications/notification-dropdown.tsx (formatRelativeTime)
 * @param dateString ISO date string or Date object
 * @returns Relative time string (e.g., "Just now", "5m ago", "2h ago", "3d ago", "Jan 15")
 * 
 * @example
 * ```tsx
 * formatRelativeTime('2024-01-15T10:30:00Z') // "5m ago"
 * formatRelativeTime('2024-01-01T10:30:00Z') // "Jan 1"
 * ```
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
  return format(date, 'MMM d');
}

/**
 * Check if an appointment date is within 24 hours from now
 * @source boombox-10.0/src/app/components/user-page/appointmentcard.tsx (isWithin24Hours logic)
 * @param appointmentDate - The appointment date/time to check
 * @returns True if appointment is within 24 hours and in the future
 * 
 * @example
 * ```tsx
 * const appointment = new Date('2024-01-15T14:00:00Z');
 * if (isAppointmentWithin24Hours(appointment)) {
 *   // Show cancellation fee warning
 * }
 * ```
 */
export function isAppointmentWithin24Hours(appointmentDate: Date | string): boolean {
  const currentTime = new Date();
  const appointmentDateTime = typeof appointmentDate === 'string' 
    ? new Date(appointmentDate) 
    : appointmentDate;
  
  const timeDiff = appointmentDateTime.getTime() - currentTime.getTime();
  const hours24InMs = 24 * 60 * 60 * 1000;
  
  return timeDiff <= hours24InMs && timeDiff > 0;
}

/**
 * Add ordinal suffix to day number (1st, 2nd, 3rd, 4th, etc.)
 * @source boombox-10.0/src/app/components/user-page/upcomingappointment.tsx (addDateSuffix)
 * @param day - Day of the month (1-31)
 * @returns Day with ordinal suffix (e.g., "1st", "2nd", "3rd", "21st")
 * 
 * @example
 * ```tsx
 * addDateSuffix(1)  // "1st"
 * addDateSuffix(2)  // "2nd"
 * addDateSuffix(3)  // "3rd"
 * addDateSuffix(11) // "11th"
 * addDateSuffix(21) // "21st"
 * ```
 */
export function addDateSuffix(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`; // Special case for 11th, 12th, 13th
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

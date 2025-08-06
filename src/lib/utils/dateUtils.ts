/**
 * @fileoverview Date and time utility functions
 * @source boombox-10.0/src/app/components/reusablecomponents/customdatepicker.tsx (formatDate)
 * @source boombox-10.0/src/app/admin/delivery-routes/page.tsx (formatDateTime, formatTime)
 * @source boombox-10.0/src/app/api/availability/route.ts (formatTime, formatTimeLocal)
 * @source boombox-10.0/src/app/api/driver-assign/route.ts (getUnitSpecificStartTime)
 * @source boombox-10.0/src/app/components/edit-appointment/* (getAppointmentDateTime)
 * @source boombox-10.0/src/lib/utils/timeWindows.ts (calculateDeliveryWindow)
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

  const timeRegex = /(\d{1,2})(?::(\d{2}))?(am|pm)/i;
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

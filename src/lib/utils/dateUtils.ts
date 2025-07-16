/**
 * @fileoverview Date and time utilities
 * @source Multiple date formatting functions from boombox-10.0
 * @refactor Consolidated date/time utilities
 */

import { format, addMinutes } from 'date-fns';

/**
 * Format date for input fields (MM/DD/YYYY)
 */
export function formatDateForInput(date: Date): string {
  return date.toLocaleDateString('en-US');
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'EEEE, MMMM d, yyyy');
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
 * Format time as h:mm AM/PM
 */
export function formatTime(date: Date): string {
  return format(date, 'h:mm a');
}

/**
 * Calculate unit-specific start time with staggered intervals
 */
export function getUnitSpecificStartTime(
  originalAppointmentTime: Date,
  unitNumber: number
): Date {
  const staggerMinutes = (unitNumber - 1) * 15;
  return addMinutes(originalAppointmentTime, staggerMinutes);
}

/**
 * Check if date is in the past
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

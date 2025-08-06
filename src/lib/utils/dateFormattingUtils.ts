/**
 * @fileoverview Date formatting utilities for appointment display
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (lines 447-458)
 * @refactor Extracted inline date formatting logic to centralized utilities
 */

/**
 * Format appointment date for display in SMS messages
 * @param date - Date object or string
 * @returns Formatted date string (e.g., "Monday, January 15")
 */
export function formatAppointmentDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Format appointment time for display in SMS messages
 * @param time - Time Date object or string
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatAppointmentTime(time: Date | string): string {
  const timeObj = typeof time === 'string' ? new Date(time) : time;
  return timeObj.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
}
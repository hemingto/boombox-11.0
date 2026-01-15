/**
 * @fileoverview Date formatting utilities for admin pages
 * 
 * FUNCTIONALITY:
 * - PST timezone date/time formatting
 * - Consistent date display formats across admin portal
 * - Duration and time formatting helpers
 * 
 * DESIGN:
 * - All dates formatted in PST (America/Los_Angeles)
 * - Format: "Weekday, Month Day at Time"
 * - Consistent with boombox-10.0 patterns
 */

/**
 * Format date/time in PST timezone
 * Format: "Mon, Nov 24 at 2:30 PM"
 * 
 * @param date - Date string or Date object
 * @returns Formatted date string in PST
 */
export const formatDateTimePST = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const pstDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  
  const formattedDate = pstDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  
  const formattedTime = pstDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Los_Angeles'
  });
  
  return `${formattedDate} at ${formattedTime}`;
};

/**
 * Format date/time with full details (includes year)
 * Format: "Mon, Nov 24, 2024 at 2:30 PM"
 * 
 * @param date - Date string or Date object
 * @returns Formatted date string with year
 */
export const formatDateTimeFullPST = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Los_Angeles'
  });
};

/**
 * Format date only (no time)
 * Format: "11/24/2024"
 * 
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export const formatDateShort = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US');
};

/**
 * Format time duration from seconds
 * Format: "2h 30m"
 * 
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export const formatTime = (seconds: number | null): string => {
  if (!seconds) return '-';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

/**
 * Format distance in miles
 * Format: "12.5 mi"
 * 
 * @param miles - Distance value (can be number or object)
 * @returns Formatted distance string
 */
export const formatDistance = (miles: any): string => {
  if (!miles) return '-';
  const numericMiles = typeof miles === 'object' && miles !== null ? Number(miles) : Number(miles);
  if (isNaN(numericMiles)) return '-';
  return `${numericMiles.toFixed(1)} mi`;
};

/**
 * Format currency (dollars and cents)
 * Format: "$12.50"
 * 
 * @param amount - Amount in dollars
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '-';
  return `$${amount.toFixed(2)}`;
};

/**
 * Format price from cents to dollars
 * Format: "$12.50"
 * 
 * @param cents - Amount in cents
 * @returns Formatted currency string
 */
export const formatPriceFromCents = (cents: number | null | undefined): string => {
  if (cents === null || cents === undefined) return '-';
  return `$${(cents / 100).toFixed(2)}`;
};


/**
 * @fileoverview Session utility functions for calculating expiry and formatting time
 * @source Created for boombox-11.0 session expiration handling
 */

/**
 * Calculate when a session will expire
 * 
 * @param sessionCreated - Timestamp when session was created (milliseconds)
 * @param maxAge - Session max age in seconds
 * @returns Date object representing when session expires
 */
export function calculateSessionExpiry(sessionCreated: number, maxAge: number): Date {
  return new Date(sessionCreated + maxAge * 1000);
}

/**
 * Format seconds remaining into MM:SS format
 * 
 * @param seconds - Number of seconds to format
 * @returns Formatted string like "4:32" or "0:45"
 */
export function formatTimeRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check if session is expiring soon based on warning threshold
 * 
 * @param sessionCreated - Timestamp when session was created (milliseconds)
 * @param maxAge - Session max age in seconds
 * @param warningThreshold - How many seconds before expiry to warn (default: 300 = 5 minutes)
 * @returns Object with expiring status and seconds remaining
 */
export function isSessionExpiringSoon(
  sessionCreated: number,
  maxAge: number,
  warningThreshold: number = 300
): { isExpiring: boolean; secondsRemaining: number; isExpired: boolean } {
  const expiryTime = calculateSessionExpiry(sessionCreated, maxAge);
  const now = Date.now();
  const secondsRemaining = Math.floor((expiryTime.getTime() - now) / 1000);
  
  return {
    isExpiring: secondsRemaining <= warningThreshold && secondsRemaining > 0,
    secondsRemaining: Math.max(0, secondsRemaining),
    isExpired: secondsRemaining <= 0,
  };
}

/**
 * Get session max age from NextAuth config
 * Currently set to 24 hours (86400 seconds)
 */
export const SESSION_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

/**
 * Warning threshold - show modal this many seconds before expiry
 * Currently set to 5 minutes (300 seconds)
 */
export const SESSION_WARNING_THRESHOLD = 5 * 60; // 5 minutes in seconds


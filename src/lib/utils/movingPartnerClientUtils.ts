/**
 * @fileoverview Client-safe moving partner utility functions
 * @source boombox-11.0/src/lib/utils/movingPartnerUtils.ts
 * @refactor Split from movingPartnerUtils.ts to separate client-safe utilities from server-only utilities
 * 
 * This file contains utilities that can be safely imported by client components.
 * Server-only utilities (those requiring Node.js modules like cloudinary, fs, etc.) 
 * are in movingPartnerServerUtils.ts
 */

/**
 * Employee count range to representative number mapping
 * @source boombox-11.0/src/components/features/moving-partners/MoverSignUpForm.tsx
 * @refactor Extracted from component for reusability and maintainability
 * 
 * Maps employee count range strings to representative midpoint values
 * for database storage as integers. The API validation schema expects
 * a positive integer, so we convert the user-friendly ranges to numbers.
 */
export const EMPLOYEE_COUNT_MAP: Record<string, number> = {
  '1-5': 3,
  '6-10': 8,
  '11-20': 15,
  '21-50': 35,
  '50+': 75,
} as const;

/**
 * Convert employee count range string to representative number
 * @param rangeString - Employee count range (e.g., "1-5", "6-10")
 * @returns Representative midpoint number for the range, defaults to 1 if unknown
 */
export function convertEmployeeCountToNumber(rangeString: string): number {
  return EMPLOYEE_COUNT_MAP[rangeString] || 1;
}

/**
 * Helper function to parse HH:mm time string to minutes since midnight
 * @source boombox-10.0/src/app/api/moving-partners/route.ts (parseTimeToMinutes)
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0; // Basic validation
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Helper function to get day of week string
 * @source boombox-10.0/src/app/api/moving-partners/route.ts (getDayOfWeekString)
 */
export function getDayOfWeekString(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getUTCDay()];
}


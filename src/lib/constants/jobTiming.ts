/**
 * @fileoverview Centralized job timing constants for driver availability and scheduling
 * 
 * These constants define how long each job takes and the buffer times needed.
 * Used by both:
 * - AvailabilityService (customer-facing slot availability)
 * - driverAssignmentUtils (driver conflict detection)
 * 
 * This ensures customers can only book times when drivers are actually available.
 */

/**
 * Job timing configuration in minutes
 * 
 * A job blocks the driver for:
 * - BUFFER_BEFORE: Time before appointment (driver travel to customer)
 * - SERVICE_DURATION: Time at customer location
 * - BUFFER_AFTER: Time after appointment (driver return/travel to next)
 * 
 * Example: 9am appointment blocks 8:00am - 11:00am
 *   - 8:00-9:00: Buffer before (travel to customer)
 *   - 9:00-10:00: Service time at customer
 *   - 10:00-11:00: Buffer after (return/travel to next)
 * 
 * This allows a driver to take up to 3 jobs per day:
 *   - 8am-11am (9am customer time)
 *   - 11am-2pm (12pm customer time)
 *   - 2pm-5pm (3pm customer time)
 */
export const JOB_TIMING = {
  /** Time before appointment start for driver to travel to customer (minutes) */
  BUFFER_BEFORE_MINUTES: 60, // 1 hour
  
  /** Time at customer location for service (minutes) */
  SERVICE_DURATION_MINUTES: 60, // 1 hour
  
  /** Time after service for driver to return/travel to next job (minutes) */
  BUFFER_AFTER_MINUTES: 60, // 1 hour
  
  /** Total blocked time per job (minutes) */
  get TOTAL_BLOCKED_MINUTES(): number {
    return this.BUFFER_BEFORE_MINUTES + this.SERVICE_DURATION_MINUTES + this.BUFFER_AFTER_MINUTES;
  },
  
  /** Total blocked time in hours */
  get TOTAL_BLOCKED_HOURS(): number {
    return this.TOTAL_BLOCKED_MINUTES / 60; // 3 hours
  },
  
  /** Stagger time between units in multi-unit appointments (minutes) */
  STAGGER_TIME_MINUTES: 45,
} as const;

/**
 * Calculate the blocked time window for a job
 * @param appointmentTime - The scheduled appointment start time
 * @param unitNumber - Unit number (1-based) for staggered timing
 * @returns { blockedStart, blockedEnd } - The full blocked window
 */
export function calculateJobBlockedWindow(
  appointmentTime: Date,
  unitNumber: number = 1
): { blockedStart: Date; blockedEnd: Date; serviceStart: Date; serviceEnd: Date } {
  // Calculate unit-specific start time with staggering
  const staggerOffset = (unitNumber - 1) * JOB_TIMING.STAGGER_TIME_MINUTES * 60 * 1000;
  const serviceStart = new Date(appointmentTime.getTime() + staggerOffset);
  
  // Service end time
  const serviceEnd = new Date(serviceStart.getTime() + JOB_TIMING.SERVICE_DURATION_MINUTES * 60 * 1000);
  
  // Blocked window includes buffers
  const blockedStart = new Date(serviceStart.getTime() - JOB_TIMING.BUFFER_BEFORE_MINUTES * 60 * 1000);
  const blockedEnd = new Date(serviceEnd.getTime() + JOB_TIMING.BUFFER_AFTER_MINUTES * 60 * 1000);
  
  return { blockedStart, blockedEnd, serviceStart, serviceEnd };
}

/**
 * Check if two time windows overlap
 * Uses the efficient overlap detection formula: (StartA < EndB) and (EndA > StartB)
 */
export function doWindowsOverlap(
  window1Start: Date,
  window1End: Date,
  window2Start: Date,
  window2End: Date
): boolean {
  return window1Start < window2End && window1End > window2Start;
}


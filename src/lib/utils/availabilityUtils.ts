/**
 * @fileoverview Availability calculation and business logic utilities
 * @source boombox-10.0/src/app/api/availability/route.ts (utility functions)
 * @refactor Extracted and enhanced utility functions for availability calculations
 */

import { 
  PlanType, 
  DriverRequirement, 
  TimeConflict, 
  ConflictCheckResult,
  AvailabilityLevel,
  BusinessHoursConfig,
  GeneratedSlot,
  DriverWithAvailability,
  PartnerWithAvailability
} from '@/types/availability.types';
import { MovingPartnerAvailability, DriverAvailability } from '@prisma/client';
import { formatTime24Hour } from '@/lib/utils/dateUtils';
import { JOB_TIMING, doWindowsOverlap } from '@/lib/constants/jobTiming';

// Business Configuration
export const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  startHour: 9,
  endHour: 18,
  slotDurationMinutes: 60,
  timezone: 'America/Los_Angeles'
};

/**
 * Calculate driver requirements based on plan type and number of units
 * @source Original complex inline logic
 */
export function calculateDriverRequirements(
  planType: PlanType,
  numberOfUnits: number,
  hasMoverAvailable: boolean = false
): DriverRequirement {
  if (planType === 'DIY') {
    return {
      driversNeeded: numberOfUnits,
      reason: 'diy_all_units'
    };
  }

  // FULL_SERVICE plan
  if (!hasMoverAvailable) {
    return {
      driversNeeded: 0,
      reason: 'none'
    };
  }

  const extraUnits = Math.max(0, numberOfUnits - 1);
  return {
    driversNeeded: extraUnits,
    reason: 'full_service_extra_units'
  };
}

/**
 * Get day of week string from Date object
 * @source getDayOfWeekString function
 */
export function getDayOfWeekString(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getUTCDay()];
}

/**
 * Format time for display (local format)
 * @source formatTimeLocal function
 */
export function formatTimeLocal(hour: number): string {
  const startHour = hour;
  const endHour = hour + 1;
  
  const formatHour = (h: number) => {
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
  };
  
  return `${formatHour(startHour)}-${formatHour(endHour)}`;
}

/**
 * Generate potential time slots for a given date
 * @source generatePotentialSlots function
 */
export function generateBusinessHourSlots(
  dateString: string,
  config: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS
): GeneratedSlot[] {
  const slots: GeneratedSlot[] = [];
  const [year, month, day] = dateString.split('-').map(Number);
  
  for (let hour = config.startHour; hour < config.endHour; hour++) {
    // Create local time slot
    const localSlotStart = new Date(year, month - 1, day, hour, 0, 0, 0);
    const localSlotEnd = new Date(year, month - 1, day, hour + (config.slotDurationMinutes / 60), 0, 0, 0);
    
    // Convert to UTC for comparison with stored appointment times
    const slotStart = new Date(localSlotStart.getTime());
    const slotEnd = new Date(localSlotEnd.getTime());
    
    // Skip slots that extend beyond business hours
    if (slotEnd.getHours() > config.endHour) {
      continue;
    }
    if (slotStart.getHours() >= config.endHour) continue;

    const startTime = new Date();
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date();
    endTime.setHours(hour + 1, 0, 0, 0);
    
    const startTimeStr = formatTime24Hour(startTime);
    const endTimeStr = formatTime24Hour(endTime);
    
    slots.push({
      slotStart,
      slotEnd,
      display: formatTimeLocal(hour),
      startTimeStr,
      endTimeStr,
    });
  }
  
  return slots;
}

/**
 * Check if there's a time conflict between two time ranges
 */
export function hasTimeConflict(
  slot1Start: Date,
  slot1End: Date,
  slot2Start: Date,
  slot2End: Date
): boolean {
  // Check for overlap: (StartA < EndB) and (EndA > StartB)
  return slot1Start < slot2End && slot1End > slot2Start;
}

/**
 * Check if a resource is available during a specific time slot
 */
export function isResourceAvailableInSlot(
  availability: MovingPartnerAvailability[] | DriverAvailability[],
  dayOfWeek: string,
  startTimeStr: string,
  endTimeStr: string
): boolean {
  return availability.some(avail => 
    avail.dayOfWeek === dayOfWeek &&
    !avail.isBlocked &&
    startTimeStr >= avail.startTime &&
    endTimeStr <= avail.endTime
  );
}

/**
 * Create time conflict object
 */
export function createTimeConflict(
  startTime: Date,
  endTime: Date,
  type: 'booking' | 'onfleet_task' | 'blocked_date',
  resourceId?: number,
  details?: string
): TimeConflict {
  return {
    startTime,
    endTime,
    type,
    resourceId,
    details
  };
}

/**
 * Check for Onfleet task conflicts using centralized job timing
 * 
 * Uses JOB_TIMING constants for consistent blocking:
 * - 1 hour buffer before
 * - 1 hour service time
 * - 1 hour buffer after
 * = 3 hours total blocked per job
 * 
 * This checks if a NEW job booked at slotStart would conflict with existing tasks
 */
export function checkOnfleetTaskConflicts(
  slotStart: Date,
  slotEnd: Date,
  driverTasks: { appointment: { time: Date } }[],
  _bufferHours?: number // Deprecated, kept for backwards compatibility
): ConflictCheckResult {
  const conflicts: TimeConflict[] = [];
  
  // Calculate the potential new job's blocked window if booked at slotStart
  const potentialJobBlockedStart = new Date(
    slotStart.getTime() - JOB_TIMING.BUFFER_BEFORE_MINUTES * 60 * 1000
  );
  const potentialJobBlockedEnd = new Date(
    slotStart.getTime() + 
    (JOB_TIMING.SERVICE_DURATION_MINUTES + JOB_TIMING.BUFFER_AFTER_MINUTES) * 60 * 1000
  );
  
  for (const task of driverTasks) {
    const taskStart = new Date(task.appointment.time);
    
    // Calculate existing task's blocked window
    const existingBlockedStart = new Date(
      taskStart.getTime() - JOB_TIMING.BUFFER_BEFORE_MINUTES * 60 * 1000
    );
    const existingBlockedEnd = new Date(
      taskStart.getTime() + 
      (JOB_TIMING.SERVICE_DURATION_MINUTES + JOB_TIMING.BUFFER_AFTER_MINUTES) * 60 * 1000
    );

    // Check if potential new job's blocked window overlaps with existing task
    if (doWindowsOverlap(potentialJobBlockedStart, potentialJobBlockedEnd, existingBlockedStart, existingBlockedEnd)) {
      conflicts.push(createTimeConflict(
        existingBlockedStart,
        existingBlockedEnd,
        'onfleet_task',
        undefined,
        `Task at ${taskStart.toISOString()} blocks ${JOB_TIMING.TOTAL_BLOCKED_HOURS}h`
      ));
    }
  }
  
  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}

/**
 * Determine availability level based on resource counts
 */
export function determineAvailabilityLevel(
  availableMovers: number,
  availableDrivers: number,
  requiredMovers: number,
  requiredDrivers: number
): AvailabilityLevel {
  const moverRatio = requiredMovers > 0 ? availableMovers / requiredMovers : 1;
  const driverRatio = requiredDrivers > 0 ? availableDrivers / requiredDrivers : 1;
  
  const minRatio = Math.min(moverRatio, driverRatio);
  
  if (minRatio >= 3) return 'high';
  if (minRatio >= 1.5) return 'medium';
  return 'low';
}

/**
 * Get distinct days of week for a given month
 */
export function getDistinctDaysOfWeekInMonth(year: number, month: number): string[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const distinctDays: string[] = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = getDayOfWeekString(new Date(Date.UTC(year, month - 1, day)));
    if (!distinctDays.includes(dayOfWeek)) {
      distinctDays.push(dayOfWeek);
    }
  }
  
  return distinctDays;
}

/**
 * Group array by key
 */
export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Check if date is in the past
 */
export function isDateInPast(dateString: string): boolean {
  const date = new Date(dateString + 'T00:00:00Z');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Generate cache key for availability data
 */
export function generateCacheKey(
  type: 'monthly' | 'daily' | 'resources',
  params: Record<string, any>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {} as Record<string, any>);
  
  const paramString = Object.entries(sortedParams)
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
    
  return `availability:${type}:${paramString}`;
}

/**
 * Calculate time difference in minutes
 */
export function getMinutesDifference(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Validate time slot format
 */
export function isValidTimeSlot(timeStr: string): boolean {
  return /^\d{2}:\d{2}$/.test(timeStr);
}

/**
 * Convert time string to minutes since midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
} 
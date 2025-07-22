/**
 * @fileoverview Availability system type definitions
 * @source boombox-10.0/src/app/api/availability/route.ts
 * @refactor Extracted and enhanced types for availability system with caching support
 */

import { MovingPartner, Driver, MovingPartnerAvailability, DriverAvailability } from '@prisma/client';

// Core Plan Types
export type PlanType = 'DIY' | 'FULL_SERVICE';
export type AvailabilityLevel = 'high' | 'medium' | 'low';

// Time Slot Definitions
export interface TimeSlot {
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  display: string;   // "8AM-9AM" format
  available: boolean;
}

export interface EnhancedTimeSlot extends TimeSlot {
  availabilityLevel?: AvailabilityLevel;
  resourceCounts?: {
    availableMovers: number;
    availableDrivers: number;
  };
}

// API Request Parameters
export interface MonthlyAvailabilityParams {
  planType: PlanType;
  year: number;
  month: number; // 1-12
  numberOfUnits: number;
}

export interface DailyAvailabilityParams {
  planType: PlanType;
  date: string; // YYYY-MM-DD
  numberOfUnits: number;
}

export interface AvailabilityQueryParams {
  planType: PlanType;
  year?: string;
  month?: string;
  date?: string; // YYYY-MM-DD
  type: 'month' | 'date';
  numberOfUnits: number;
}

// API Response Types
export interface MonthlyAvailabilityDate {
  date: string; // YYYY-MM-DD
  hasAvailability: boolean;
  availabilityLevel?: AvailabilityLevel;
  resourceCounts?: {
    availableMovers: number;
    availableDrivers: number;
  };
}

export interface AvailabilityMetadata {
  queryTimeMs: number;
  totalDaysChecked?: number;
  resourcesChecked: {
    movers: number;
    drivers: number;
  };
  conflictsFound: {
    blockedDates: number;
    existingBookings: number;
    onfleetTasks: number;
  };
  cacheHit: boolean;
}

export interface MonthlyAvailabilityResponse {
  dates: MonthlyAvailabilityDate[];
  metadata: AvailabilityMetadata;
}

export interface DailyAvailabilityResponse {
  timeSlots: EnhancedTimeSlot[];
  metadata: AvailabilityMetadata;
  recommendations?: {
    alternativeDates?: string[];
    peakHours?: string[];
  };
}

// Resource Types with Availability
export type PartnerWithAvailability = MovingPartner & { 
  availability: MovingPartnerAvailability[] 
};

export type DriverWithAvailability = Driver & { 
  availability: DriverAvailability[] 
};

// Business Configuration
export interface BusinessHoursConfig {
  startHour: number; // 8
  endHour: number;   // 18
  slotDurationMinutes: number; // 60
  timezone: string; // 'America/Los_Angeles'
}

// Driver Requirements Calculation
export interface DriverRequirement {
  driversNeeded: number;
  reason: 'diy_all_units' | 'full_service_extra_units' | 'none';
}

// Conflict Detection Types
export interface TimeConflict {
  startTime: Date;
  endTime: Date;
  type: 'booking' | 'onfleet_task' | 'blocked_date';
  resourceId?: number;
  details?: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: TimeConflict[];
}

// Cache-related Types
export interface CacheKey {
  type: 'monthly' | 'daily' | 'resources';
  planType?: PlanType;
  date?: string;
  year?: number;
  month?: number;
  numberOfUnits?: number;
  dayOfWeek?: string;
}

export interface CachedAvailabilityData<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

// Database Query Types
export interface AvailabilityQueryFilters {
  dayOfWeek?: string;
  dayOfWeekList?: string[];
  startDate?: Date;
  endDate?: Date;
  planType: PlanType;
  excludeBlockedMoverIds?: number[];
  excludeBlockedDriverIds?: number[];
}

export interface ResourceAvailabilityData {
  movers: PartnerWithAvailability[];
  drivers: DriverWithAvailability[];
  blockedMoverIds: Set<number>;
  blockedDriverIds: Set<number>;
}

// Slot Generation Types
export interface GeneratedSlot {
  slotStart: Date;
  slotEnd: Date;
  display: string;
  startTimeStr: string;
  endTimeStr: string;
}

// Performance Monitoring
export interface AvailabilityPerformanceMetrics {
  queryStartTime: number;
  databaseQueryTime: number;
  cacheOperationTime: number;
  calculationTime: number;
  totalTime: number;
}

// Error Types
export interface AvailabilityError extends Error {
  code: 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'CACHE_ERROR' | 'BUSINESS_LOGIC_ERROR';
  details?: Record<string, any>;
} 
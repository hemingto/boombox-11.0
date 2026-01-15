/**
 * @fileoverview Availability validation schemas using Zod
 * @source boombox-10.0/src/app/api/availability/route.ts (availabilityQuerySchema)
 * @refactor Enhanced validation with better error messages and type safety
 */

import { z } from 'zod';
import { PlanType } from '@/types/availability.types';

// Base validation schemas
export const planTypeSchema = z.enum(['DIY', 'FULL_SERVICE'], {
  errorMap: () => ({ message: 'Plan type must be either DIY or FULL_SERVICE' })
});

export const numberOfUnitsSchema = z.preprocess(
  (val) => {
    if (typeof val === 'number') return val;
    const parsed = parseInt(String(val), 10);
    return isNaN(parsed) ? undefined : parsed;
  },
  z.number().int().min(1, 'Number of units must be at least 1').max(10, 'Maximum 10 units allowed').default(1)
);

export const yearSchema = z.string().regex(/^\d{4}$/, 'Year must be a 4-digit number').optional();
export const monthSchema = z.string().regex(/^(1[0-2]|[1-9])$/, 'Month must be between 1 and 12').optional();
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional();

// Query type validation
export const queryTypeSchema = z.enum(['month', 'date'], {
  errorMap: () => ({ message: 'Query type must be either "month" or "date"' })
});

// Optional appointment ID to exclude from booking conflicts (for edit mode)
export const excludeAppointmentIdSchema = z.preprocess(
  (val) => {
    if (val === undefined || val === null || val === '') return undefined;
    const parsed = parseInt(String(val), 10);
    return isNaN(parsed) ? undefined : parsed;
  },
  z.number().int().positive().optional()
);

// Main availability query schema (for API endpoint)
export const availabilityQuerySchema = z.object({
  planType: planTypeSchema,
  year: yearSchema,
  month: monthSchema,
  date: dateSchema,
  type: queryTypeSchema,
  numberOfUnits: numberOfUnitsSchema,
  excludeAppointmentId: excludeAppointmentIdSchema, // Optional: exclude this appointment's booking from conflicts
}).refine(
  (data) => {
    if (data.type === 'month') {
      return data.year && data.month;
    }
    if (data.type === 'date') {
      return data.date;
    }
    return false;
  },
  {
    message: 'For month type: year and month are required. For date type: date is required.',
    path: ['type']
  }
);

// Monthly availability parameters schema
export const monthlyAvailabilityParamsSchema = z.object({
  planType: planTypeSchema,
  year: z.number().int().min(2024).max(2030),
  month: z.number().int().min(1).max(12),
  numberOfUnits: z.number().int().min(1).max(10).default(1),
});

// Daily availability parameters schema
export const dailyAvailabilityParamsSchema = z.object({
  planType: planTypeSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  numberOfUnits: z.number().int().min(1).max(10).default(1),
  excludeAppointmentId: z.number().int().positive().optional(), // Optional: exclude this appointment's booking from conflicts
}).refine(
  (data) => {
    const date = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  },
  {
    message: 'Date cannot be in the past',
    path: ['date']
  }
);

// Cache key validation
export const cacheKeySchema = z.object({
  type: z.enum(['monthly', 'daily', 'resources']),
  planType: planTypeSchema.optional(),
  date: dateSchema,
  year: z.number().optional(),
  month: z.number().optional(),
  numberOfUnits: z.number().optional(),
  dayOfWeek: z.string().optional(),
});

// Business hours configuration validation
export const businessHoursConfigSchema = z.object({
  startHour: z.number().int().min(0).max(23).default(8),
  endHour: z.number().int().min(1).max(24).default(18),
  slotDurationMinutes: z.number().int().min(15).max(240).default(60),
  timezone: z.string().default('America/Los_Angeles'),
}).refine(
  (data) => data.endHour > data.startHour,
  {
    message: 'End hour must be greater than start hour',
    path: ['endHour']
  }
);

// Driver requirement validation
export const driverRequirementSchema = z.object({
  driversNeeded: z.number().int().min(0).max(20),
  reason: z.enum(['diy_all_units', 'full_service_extra_units', 'none']),
});

// Time conflict validation
export const timeConflictSchema = z.object({
  startTime: z.date(),
  endTime: z.date(),
  type: z.enum(['booking', 'onfleet_task', 'blocked_date']),
  resourceId: z.number().optional(),
  details: z.string().optional(),
}).refine(
  (data) => data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime']
  }
);

// Performance metrics validation
export const performanceMetricsSchema = z.object({
  queryStartTime: z.number(),
  databaseQueryTime: z.number().min(0),
  cacheOperationTime: z.number().min(0),
  calculationTime: z.number().min(0),
  totalTime: z.number().min(0),
});

// API response validation schemas
export const timeSlotSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  display: z.string(),
  available: z.boolean(),
});

export const enhancedTimeSlotSchema = timeSlotSchema.extend({
  availabilityLevel: z.enum(['high', 'medium', 'low']).optional(),
  resourceCounts: z.object({
    availableMovers: z.number().min(0),
    availableDrivers: z.number().min(0),
  }).optional(),
});

export const availabilityMetadataSchema = z.object({
  queryTimeMs: z.number().min(0),
  totalDaysChecked: z.number().min(0).optional(),
  resourcesChecked: z.object({
    movers: z.number().min(0),
    drivers: z.number().min(0),
  }),
  conflictsFound: z.object({
    blockedDates: z.number().min(0),
    existingBookings: z.number().min(0),
    onfleetTasks: z.number().min(0),
  }),
  cacheHit: z.boolean(),
});

export const monthlyAvailabilityResponseSchema = z.object({
  dates: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hasAvailability: z.boolean(),
    availabilityLevel: z.enum(['high', 'medium', 'low']).optional(),
    resourceCounts: z.object({
      availableMovers: z.number().min(0),
      availableDrivers: z.number().min(0),
    }).optional(),
  })),
  metadata: availabilityMetadataSchema,
});

export const dailyAvailabilityResponseSchema = z.object({
  timeSlots: z.array(enhancedTimeSlotSchema),
  metadata: availabilityMetadataSchema,
  recommendations: z.object({
    alternativeDates: z.array(z.string()).optional(),
    peakHours: z.array(z.string()).optional(),
  }).optional(),
});

// Utility functions for validation
export function validateAvailabilityQuery(data: unknown) {
  return availabilityQuerySchema.safeParse(data);
}

export function validateMonthlyParams(data: unknown) {
  return monthlyAvailabilityParamsSchema.safeParse(data);
}

export function validateDailyParams(data: unknown) {
  return dailyAvailabilityParamsSchema.safeParse(data);
}

// Type inference helpers
export type ValidatedAvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type ValidatedMonthlyParams = z.infer<typeof monthlyAvailabilityParamsSchema>;
export type ValidatedDailyParams = z.infer<typeof dailyAvailabilityParamsSchema>;
export type ValidatedTimeSlot = z.infer<typeof timeSlotSchema>;
export type ValidatedEnhancedTimeSlot = z.infer<typeof enhancedTimeSlotSchema>;
export type ValidatedAvailabilityMetadata = z.infer<typeof availabilityMetadataSchema>; 
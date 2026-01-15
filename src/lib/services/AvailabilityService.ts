/**
 * @fileoverview Main availability service with business logic and caching
 * @source boombox-10.0/src/app/api/availability/route.ts (main GET function)
 * @refactor Extracted business logic into service layer with caching and optimization
 */

import {
  MonthlyAvailabilityParams,
  DailyAvailabilityParams,
  MonthlyAvailabilityResponse,
  DailyAvailabilityResponse,
  EnhancedTimeSlot,
  MonthlyAvailabilityDate,
} from '@/types/availability.types';

import {
  generateCacheKey,
  getDayOfWeekString,
  getDistinctDaysOfWeekInMonth,
  calculateDriverRequirements,
  generateBusinessHourSlots,
  isResourceAvailableInSlot,
  hasTimeConflict,
  checkOnfleetTaskConflicts,
  determineAvailabilityLevel,
  isDateInPast,
} from '@/lib/utils/availabilityUtils';

import {
  getResourceAvailabilityForDays,
  getResourceCountsByDayOfWeek,
  getDateSpecificAvailabilityData,
  getPartnerBookingConflicts,
  getDriverBookingConflicts,
} from '@/lib/database/availability.queries';

import { cacheService, CACHE_TTL } from '@/lib/services/CacheService';
import { JOB_TIMING } from '@/lib/constants/jobTiming';

export class AvailabilityService {
  /**
   * Get monthly availability overview
   * @source Original month type handler
   */
  async getMonthlyAvailability(
    params: MonthlyAvailabilityParams
  ): Promise<MonthlyAvailabilityResponse> {
    const startTime = Date.now();

    // Generate cache key
    const cacheKey = generateCacheKey('monthly', params);

    // Try cache first
    const cached =
      await cacheService.get<MonthlyAvailabilityResponse>(cacheKey);
    if (cached) {
      cached.metadata.cacheHit = true;
      return cached;
    }

    console.log(
      `[AvailabilityService] Computing monthly availability for ${params.year}-${params.month}`
    );

    const daysInMonth = new Date(
      Date.UTC(params.year, params.month, 0)
    ).getUTCDate();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Get distinct days of week for optimization
    const distinctDaysOfWeek = getDistinctDaysOfWeekInMonth(
      params.year,
      params.month
    );
    console.log(
      `[Monthly] Distinct days of week: ${distinctDaysOfWeek.join(', ')}`
    );

    // Get resource counts by day of week
    const dbQueryStart = Date.now();
    const { moversByDay, driversByDay } = await getResourceCountsByDayOfWeek(
      distinctDaysOfWeek,
      params.planType
    );
    const dbQueryTime = Date.now() - dbQueryStart;

    console.log(`[Monthly] Resource counts - Movers by day:`, moversByDay);
    console.log(`[Monthly] Resource counts - Drivers by day:`, driversByDay);

    // Process each day in the month
    const dates: MonthlyAvailabilityDate[] = [];
    const totalConflicts = {
      blockedDates: 0,
      existingBookings: 0,
      onfleetTasks: 0,
    };

    for (let dayCount = 1; dayCount <= daysInMonth; dayCount++) {
      const currentDate = new Date(
        Date.UTC(params.year, params.month - 1, dayCount)
      );
      const currentDateStr = currentDate.toISOString().split('T')[0];

      // Skip past dates
      if (currentDate < today) {
        dates.push({
          date: currentDateStr,
          hasAvailability: false,
        });
        continue;
      }

      const dayOfWeek = getDayOfWeekString(currentDate);

      // Calculate driver requirements
      const driverRequirement = calculateDriverRequirements(
        params.planType,
        params.numberOfUnits,
        true // Assume mover available for calculation
      );

      // Check availability
      const moverCount = moversByDay[dayOfWeek] || 0;
      const driverCount = driversByDay[dayOfWeek] || 0;

      const moverIsOK = params.planType === 'DIY' || moverCount > 0;
      const driverIsOK =
        driverRequirement.driversNeeded === 0 ||
        driverCount >= driverRequirement.driversNeeded;

      const hasAvailability = moverIsOK && driverIsOK;

      // Determine availability level
      const requiredMovers = params.planType === 'FULL_SERVICE' ? 1 : 0;
      const availabilityLevel = hasAvailability
        ? determineAvailabilityLevel(
            moverCount,
            driverCount,
            requiredMovers,
            driverRequirement.driversNeeded
          )
        : undefined;

      dates.push({
        date: currentDateStr,
        hasAvailability,
        availabilityLevel,
        resourceCounts: {
          availableMovers: moverCount,
          availableDrivers: driverCount,
        },
      });

      // Log some days for debugging
      if (['Monday', 'Tuesday', 'Wednesday'].includes(dayOfWeek)) {
        console.log(
          `[Monthly Check] ${currentDateStr} (${dayOfWeek}): Movers=${moverCount}, Drivers=${driverCount}, DriversNeeded=${driverRequirement.driversNeeded}, Available=${hasAvailability}`
        );
      }
    }

    const totalTime = Date.now() - startTime;

    const response: MonthlyAvailabilityResponse = {
      dates,
      metadata: {
        queryTimeMs: totalTime,
        totalDaysChecked: daysInMonth,
        resourcesChecked: {
          movers: Object.values(moversByDay).reduce(
            (sum, count) => sum + count,
            0
          ),
          drivers: Object.values(driversByDay).reduce(
            (sum, count) => sum + count,
            0
          ),
        },
        conflictsFound: totalConflicts,
        cacheHit: false,
      },
    };

    // Cache the result
    await cacheService.set(cacheKey, response, CACHE_TTL.MONTHLY_AVAILABILITY);

    return response;
  }

  /**
   * Get daily time slot availability
   * @source Original date type handler
   */
  async getDailyTimeSlots(
    params: DailyAvailabilityParams
  ): Promise<DailyAvailabilityResponse> {
    const startTime = Date.now();

    // Generate cache key
    const cacheKey = generateCacheKey('daily', params);

    // Try cache first
    const cached = await cacheService.get<DailyAvailabilityResponse>(cacheKey);
    if (cached) {
      cached.metadata.cacheHit = true;
      return cached;
    }

    console.log(
      `[AvailabilityService] Computing daily availability for ${params.date}`
    );

    // Check if date is in the past
    if (isDateInPast(params.date)) {
      const pastSlots = generateBusinessHourSlots(params.date).map(slot => ({
        startTime: slot.startTimeStr,
        endTime: slot.endTimeStr,
        display: slot.display,
        available: false,
      }));

      return {
        timeSlots: pastSlots,
        metadata: {
          queryTimeMs: Date.now() - startTime,
          resourcesChecked: { movers: 0, drivers: 0 },
          conflictsFound: {
            blockedDates: 0,
            existingBookings: 0,
            onfleetTasks: 0,
          },
          cacheHit: false,
        },
      };
    }

    const dayOfWeek = getDayOfWeekString(new Date(params.date + 'T00:00:00Z'));

    // Get all availability data in batch
    // Pass excludeAppointmentId to skip the current appointment's booking in edit mode
    const dbQueryStart = Date.now();
    const {
      resourceData,
      partnerBookingConflicts,
      driverBookingConflicts,
      onfleetTasks,
    } = await getDateSpecificAvailabilityData(
      params.date,
      dayOfWeek,
      params.planType,
      params.excludeAppointmentId
    );
    const dbQueryTime = Date.now() - dbQueryStart;

    console.log(
      `[Daily] Found ${resourceData.movers.length} movers, ${resourceData.drivers.length} drivers`
    );
    console.log(
      `[Daily] Blocked: ${resourceData.blockedMoverIds.size} movers, ${resourceData.blockedDriverIds.size} drivers`
    );

    // Generate time slots
    const potentialSlots = generateBusinessHourSlots(params.date);
    const timeSlots: EnhancedTimeSlot[] = [];

    const totalConflicts = {
      blockedDates:
        resourceData.blockedMoverIds.size + resourceData.blockedDriverIds.size,
      existingBookings: 0,
      onfleetTasks: 0,
    };

    for (const slot of potentialSlots) {
      let moverIsAvailable = params.planType === 'DIY'; // No mover needed for DIY
      let availableMovers = 0;

      // Check mover availability for FULL_SERVICE
      if (params.planType === 'FULL_SERVICE') {
        for (const partner of resourceData.movers) {
          const isGenerallyAvailable = isResourceAvailableInSlot(
            partner.availability,
            dayOfWeek,
            slot.startTimeStr,
            slot.endTimeStr
          );

          if (isGenerallyAvailable) {
            // Check for booking conflicts
            // Note: booking stores serviceStart (bookingDate) and serviceEnd (endDate)
            // We need to add buffers to get the full blocked window
            const conflicts = partnerBookingConflicts.get(partner.id) || [];
            const hasConflict = conflicts.some(conflict => {
              const blockedStart = new Date(
                conflict.bookingDate.getTime() - JOB_TIMING.BUFFER_BEFORE_MINUTES * 60 * 1000
              );
              const blockedEnd = new Date(
                conflict.endDate.getTime() + JOB_TIMING.BUFFER_AFTER_MINUTES * 60 * 1000
              );
              return hasTimeConflict(
                slot.slotStart,
                slot.slotEnd,
                blockedStart,
                blockedEnd
              );
            });

            if (!hasConflict) {
              moverIsAvailable = true;
              availableMovers++;
              break; // Only need one mover
            } else {
              totalConflicts.existingBookings++;
            }
          }
        }
      }

      // Calculate driver requirements
      const driverRequirement = calculateDriverRequirements(
        params.planType,
        params.numberOfUnits,
        moverIsAvailable
      );

      let driversAreAvailable = driverRequirement.driversNeeded === 0;
      let availableDrivers = 0;

      if (driverRequirement.driversNeeded > 0) {
        for (const driver of resourceData.drivers) {
          const isGenerallyAvailable = isResourceAvailableInSlot(
            driver.availability,
            dayOfWeek,
            slot.startTimeStr,
            slot.endTimeStr
          );

          if (isGenerallyAvailable) {
            // Check for booking conflicts
            // We need to check if a NEW job at this slot would conflict with existing bookings
            // The new job's blocked window = slotStart - buffer BEFORE to slotStart + service + buffer AFTER
            const potentialJobBlockedStart = new Date(
              slot.slotStart.getTime() - JOB_TIMING.BUFFER_BEFORE_MINUTES * 60 * 1000
            );
            const potentialJobBlockedEnd = new Date(
              slot.slotStart.getTime() + 
              (JOB_TIMING.SERVICE_DURATION_MINUTES + JOB_TIMING.BUFFER_AFTER_MINUTES) * 60 * 1000
            );

            const bookingConflicts =
              driverBookingConflicts.get(driver.id) || [];
            const hasBookingConflict = bookingConflicts.some(conflict => {
              // Calculate existing booking's full blocked window with buffers
              const existingBlockedStart = new Date(
                conflict.bookingDate.getTime() - JOB_TIMING.BUFFER_BEFORE_MINUTES * 60 * 1000
              );
              const existingBlockedEnd = new Date(
                conflict.endDate.getTime() + JOB_TIMING.BUFFER_AFTER_MINUTES * 60 * 1000
              );
              // Check if potential new job's blocked window overlaps with existing
              return hasTimeConflict(
                potentialJobBlockedStart,
                potentialJobBlockedEnd,
                existingBlockedStart,
                existingBlockedEnd
              );
            });

            if (hasBookingConflict) {
              totalConflicts.existingBookings++;
              continue;
            }

            // Check for Onfleet task conflicts
            const driverTasks = onfleetTasks[driver.id] || [];
            const onfleetConflictResult = checkOnfleetTaskConflicts(
              slot.slotStart,
              slot.slotEnd,
              driverTasks
            );

            if (onfleetConflictResult.hasConflict) {
              totalConflicts.onfleetTasks +=
                onfleetConflictResult.conflicts.length;
              continue;
            }

            availableDrivers++;
          }
        }

        driversAreAvailable =
          availableDrivers >= driverRequirement.driversNeeded;
      }

      const slotIsAvailable = moverIsAvailable && driversAreAvailable;

      // Determine availability level
      const requiredMovers = params.planType === 'FULL_SERVICE' ? 1 : 0;
      const availabilityLevel = slotIsAvailable
        ? determineAvailabilityLevel(
            availableMovers,
            availableDrivers,
            requiredMovers,
            driverRequirement.driversNeeded
          )
        : 'low';

      timeSlots.push({
        startTime: slot.startTimeStr,
        endTime: slot.endTimeStr,
        display: slot.display,
        available: slotIsAvailable,
        availabilityLevel,
        resourceCounts: {
          availableMovers,
          availableDrivers,
        },
      });
    }

    const totalTime = Date.now() - startTime;

    const response: DailyAvailabilityResponse = {
      timeSlots,
      metadata: {
        queryTimeMs: totalTime,
        resourcesChecked: {
          movers: resourceData.movers.length,
          drivers: resourceData.drivers.length,
        },
        conflictsFound: totalConflicts,
        cacheHit: false,
      },
    };

    // Cache the result
    await cacheService.set(cacheKey, response, CACHE_TTL.DAILY_AVAILABILITY);

    return response;
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return cacheService.getStats();
  }

  /**
   * Warm cache for popular dates (for background processing)
   */
  async warmCache(
    dates: string[],
    planTypes: Array<'DIY' | 'FULL_SERVICE'> = ['DIY', 'FULL_SERVICE']
  ): Promise<void> {
    console.log(
      `[AvailabilityService] Warming cache for ${dates.length} dates`
    );

    for (const date of dates) {
      for (const planType of planTypes) {
        try {
          await this.getDailyTimeSlots({
            date,
            planType,
            numberOfUnits: 1,
          });
        } catch (error) {
          console.error(
            `[AvailabilityService] Failed to warm cache for ${date} ${planType}:`,
            error
          );
        }
      }
    }
  }
}

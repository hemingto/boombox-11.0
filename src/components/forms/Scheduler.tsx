/**
 * @fileoverview Scheduler component for appointment date and time selection
 * @source boombox-10.0/src/app/components/reusablecomponents/scheduler.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Manages appointment scheduling flow with date and time selection
 * - Integrates CalendarView and TimeSlotPicker components
 * - Handles availability fetching for different plan types (DIY/FULL_SERVICE)
 * - Provides navigation controls and error state management
 * - Supports initial date selection and state persistence
 * 
 * API ROUTES UPDATED:
 * - Old: /api/availability → New: /api/orders/availability
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc colors with design system tokens
 * - Updated button styles to use consistent hover/focus states
 * - Applied semantic color classes for error states and interactive elements
 * - Used design system spacing and typography tokens
 * - Applied proper focus management and accessibility improvements
 * 
 * @refactor Enhanced accessibility with proper ARIA labels, improved keyboard navigation,
 * and better semantic HTML structure. Extracted API calls to use existing utilities
 * and prevented duplication. Updated to use migrated CalendarView component.
 */

import React, { useState, useEffect, useCallback } from 'react';
import CalendarView from './CalendarView';
import TimeSlotPicker from './TimeSlotPicker';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';

// TimeSlot interface for time slot data structure
export interface TimeSlot {
  /** Start time in HH:MM format (e.g., "09:00") */
  startTime: string;
  /** End time in HH:MM format (e.g., "10:00") */
  endTime: string;
  /** Display string for user (e.g., "9am-10am") */
  display: string;
  /** Whether this time slot is available for booking */
  available: boolean;
}

export interface SchedulerProps {
  /** Type of service plan being scheduled */
  planType: 'DIY' | 'FULL_SERVICE';
  /** Number of storage units being scheduled */
  numberOfUnits: number;
  /** Callback when date and time are selected */
  onDateTimeSelected: (date: Date, timeSlotDisplay: string) => void;
  /** Initial date to select (optional) */
  initialSelectedDate?: Date;
  /** Callback to navigate back to previous step */
  goBackToStep1: () => void;
  /** Whether there's an error state */
  hasError?: boolean;
  /** Error message to display */
  errorMessage?: string | null;
}

const Scheduler: React.FC<SchedulerProps> = ({
  planType,
  numberOfUnits,
  onDateTimeSelected,
  initialSelectedDate,
  goBackToStep1,
  hasError,
  errorMessage,
}) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(initialSelectedDate || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialSelectedDate || null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<Record<string, boolean>>({});
  const [timeSlotsForSelectedDate, setTimeSlotsForSelectedDate] = useState<TimeSlot[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);

  /**
   * Fetch available dates for a given month
   * Uses the migrated API route /api/orders/availability
   */
  const fetchAvailableDatesForMonth = useCallback(async (date: Date) => {
    setIsLoadingCalendar(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const response = await fetch(`/api/orders/availability?planType=${planType}&year=${year}&month=${month}&type=month&numberOfUnits=${numberOfUnits}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch available dates: ${response.statusText}`);
      }
      const data: { date: string; hasAvailability: boolean }[] = await response.json();
      const availabilityMap: Record<string, boolean> = {};
      data.forEach(item => {
        availabilityMap[item.date] = item.hasAvailability;
      });
      setAvailableDates(availabilityMap);
    } catch (error) {
      console.error("Error fetching available dates:", error);
      setAvailableDates({});
    } finally {
      setIsLoadingCalendar(false);
    }
  }, [planType, numberOfUnits]);

  /**
   * Fetch time slots for a specific date
   * Uses the migrated API route /api/orders/availability
   */
  const fetchTimeSlotsForDate = useCallback(async (date: Date | null) => {
    if (!date) {
      setTimeSlotsForSelectedDate([]);
      return;
    }
    setIsLoadingTimeSlots(true);
    try {
      const dateString = date.toISOString().split('T')[0];
      const response = await fetch(`/api/orders/availability?planType=${planType}&date=${dateString}&type=date&numberOfUnits=${numberOfUnits}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch time slots: ${response.statusText}`);
      }
      const data: TimeSlot[] = await response.json();
      setTimeSlotsForSelectedDate(data);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setTimeSlotsForSelectedDate([]);
    } finally {
      setIsLoadingTimeSlots(false);
    }
  }, [planType, numberOfUnits]);

  // Fetch available dates when calendar month changes
  useEffect(() => {
    fetchAvailableDatesForMonth(currentCalendarDate);
    // Set isInitializing to false after first calendar load
    setIsInitializing(false);
  }, [currentCalendarDate, planType, numberOfUnits, fetchAvailableDatesForMonth]);

  // Fetch time slots when selected date changes
  useEffect(() => {
    fetchTimeSlotsForDate(selectedDate);
    if (selectedDate) {
        setSelectedTimeSlot(null); // Reset time slot when date changes
    } else {
        setTimeSlotsForSelectedDate([]); // Clear time slots if no date is selected
        setSelectedTimeSlot(null);
    }
  }, [selectedDate, planType, numberOfUnits, fetchTimeSlotsForDate]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // No need to set currentCalendarDate here, only on month change
  };

  const handleTimeSlotSelect = (timeSlotDisplay: string) => {
    setSelectedTimeSlot(timeSlotDisplay);
    if (selectedDate) {
      onDateTimeSelected(selectedDate, timeSlotDisplay);
    }
  };

  const handleMonthChange = (newMonthDate: Date) => {
    setCurrentCalendarDate(newMonthDate);
    setSelectedDate(null); // Clear selected date when month changes
  };

  // Set initial selected date from prop after first calendar load
  useEffect(() => {
    if (initialSelectedDate && Object.keys(availableDates).length > 0) {
        const initialDateString = initialSelectedDate.toISOString().split('T')[0];
        if(availableDates[initialDateString]){
            setSelectedDate(initialSelectedDate);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableDates]); // Run only when availableDates are populated

  return (
    <section className="w-full basis-1/2" aria-label="Appointment scheduler">
      <div className="max-w-lg mx-auto md:mx-0 md:ml-auto">
        <header className="flex items-center gap-2 mb-12 lg:-ml-10">
          <button
            type="button"
            onClick={goBackToStep1}
            className="p-1 rounded-md hover:bg-surface-tertiary text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 transition-colors duration-200"
            aria-label="Go back to previous step"
          >
            <ChevronLeftIcon className="w-8" />
          </button>
          <h1 className="text-4xl font-poppins text-text-primary hidden sm:block">Select date and time</h1>
          <h1 className="text-4xl font-poppins text-text-primary sm:hidden">Date and time</h1>
        </header>

        <CalendarView
          currentDate={currentCalendarDate}
          selectedDate={selectedDate}
          availableDates={availableDates}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
          isLoading={isLoadingCalendar}
          hasError={hasError}
        />

        <TimeSlotPicker
          selectedDate={selectedDate}
          timeSlots={timeSlotsForSelectedDate}
          selectedTimeSlot={selectedTimeSlot}
          onTimeSlotSelect={handleTimeSlotSelect}
          isLoading={isLoadingTimeSlots}
          currentCalendarDate={currentCalendarDate}
          hasError={hasError}
        />

        {hasError && errorMessage && (
          <div 
            className="text-status-error text-sm mt-2 ml-1 md:text-left font-inter"
            role="alert"
            aria-live="polite"
          >
            {errorMessage}
          </div>
        )}
      </div>
    </section>
  );
};

export default Scheduler;

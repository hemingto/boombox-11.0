/**
 * @fileoverview Scheduling logic for date and time slot selection
 * @source Extracted from boombox-10.0/src/app/components/getquote/getquoteform.tsx
 * 
 * Custom hook for managing appointment date and time slot selection,
 * including validation and datetime parsing.
 */

import { useState, useCallback } from 'react';
import { parseAppointmentTime } from '@/lib/utils/dateUtils';

/**
 * Custom hook for scheduling appointment date and time
 * 
 * @returns Scheduling state and actions
 * 
 * @example
 * ```tsx
 * const {
 *   selectedDate,
 *   selectedTimeSlot,
 *   error,
 *   handleDateTimeSelected,
 *   getAppointmentDateTime,
 *   clearSchedule,
 *   isValid
 * } = useScheduling();
 * ```
 */
export function useScheduling() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Handle date and time slot selection
   */
  const handleDateTimeSelected = useCallback((date: Date, timeSlot: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(timeSlot);
    setError(null);
  }, []);
  
  /**
   * Get combined appointment datetime as a single Date object
   */
  const getAppointmentDateTime = useCallback((): Date | null => {
    if (!selectedDate || !selectedTimeSlot) return null;
    
    return parseAppointmentTime(selectedDate, selectedTimeSlot);
  }, [selectedDate, selectedTimeSlot]);
  
  /**
   * Clear all scheduling selections
   */
  const clearSchedule = useCallback(() => {
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setError(null);
  }, []);
  
  /**
   * Validate that both date and time are selected
   */
  const isValid = useCallback((): boolean => {
    return selectedDate !== null && selectedTimeSlot !== null;
  }, [selectedDate, selectedTimeSlot]);
  
  return {
    selectedDate,
    selectedTimeSlot,
    error,
    handleDateTimeSelected,
    getAppointmentDateTime,
    clearSchedule,
    isValid,
    setError,
  };
}


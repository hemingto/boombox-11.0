/**
 * @fileoverview Time slot picker component for appointment scheduling
 * @source boombox-10.0/src/app/components/reusablecomponents/timeslotpicker.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays available time slots for a selected date
 * - Handles time slot selection with visual feedback
 * - Shows loading states during time slot fetching
 * - Provides empty states when no slots are available
 * - Includes accessibility features for screen readers
 * - Only displays when selected date is in current calendar month
 * 
 * API ROUTES UPDATED:
 * - No direct API routes used (data passed from parent Scheduler component)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc colors with design system tokens
 * - Updated button styles to use consistent hover/focus states
 * - Applied semantic color classes for loading, error, and interactive states
 * - Used design system spacing and typography tokens
 * - Applied proper focus management and accessibility improvements
 * 
 * @refactor Enhanced accessibility with proper ARIA labels, improved keyboard navigation,
 * and better semantic HTML structure. Updated to use design system colors and utilities.
 */

import React from 'react';
import { TimeSlot } from './Scheduler';

interface TimeSlotPickerProps {
  /** Currently selected date */
  selectedDate: Date | null;
  /** Available time slots for the selected date */
  timeSlots: TimeSlot[];
  /** Currently selected time slot display string */
  selectedTimeSlot: string | null;
  /** Callback when a time slot is selected */
  onTimeSlotSelect: (timeSlotDisplay: string) => void;
  /** Loading state indicator */
  isLoading: boolean;
  /** Current calendar date for month comparison */
  currentCalendarDate: Date;
  /** Error state indicator */
  hasError?: boolean;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedDate,
  timeSlots,
  selectedTimeSlot,
  onTimeSlotSelect,
  isLoading,
  currentCalendarDate,
  hasError,
}) => {
  // Only show time slots if selected date is in the current calendar month
  const isSelectedDateInCurrentMonth = selectedDate && 
    selectedDate.getMonth() === currentCalendarDate.getMonth() && 
    selectedDate.getFullYear() === currentCalendarDate.getFullYear();

  if (!isSelectedDateInCurrentMonth) {
    return null;
  }

  if (!selectedDate) {
    return (
      <div className="text-center text-text-secondary mt-4 py-4 font-inter">
        Please select a date to see available time slots.
      </div>
    );
  }

  if (timeSlots.length === 0 && !isLoading) {
    return (
      <section className="bg-surface-primary p-4 sm:p-6 rounded-md border-2 border-zinc-100">
        <h3 className="text-lg font-semibold text-text-primary mb-3 font-poppins">
          Available time slots for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>
        <p className="text-text-secondary font-inter">No available time slots for this date.</p>
      </section>
    );
  }

  return (
    <section 
      className={`p-4 sm:p-6 rounded-md 
        ${hasError 
          ? 'ring-border-error ring-2 bg-status-bg-error border-border-error' 
          : 'border-2 border-zinc-100 bg-surface-primary'}
      `}
      aria-label="Time slot selection"
    >
      <h3 className="text-lg font-semibold text-text-primary mb-6 font-poppins">
        Available time slots for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </h3>

      {isLoading ? (
        <div className="relative" aria-label="Loading time slots">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {Array(6).fill(null).map((_, index) => (
              <div key={`skeleton-${index}`} className="h-12 bg-surface-tertiary rounded-lg animate-pulse"></div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-surface-primary bg-opacity-70">
            <div 
              className="w-10 h-10 border-4 border-surface-disabled border-t-primary rounded-full animate-spin"
              role="status"
              aria-label="Loading time slots"
            ></div>
          </div>
        </div>
      ) : (
        <>
          <div 
            className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3"
            role="group"
            aria-label="Available time slots"
          >
            {timeSlots.map((slot) => (
              <button
                key={slot.display}
                onClick={() => onTimeSlotSelect(slot.display)}
                disabled={!slot.available}
                className={`py-3 px-3 rounded-lg text-sm font-medium font-inter focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 transition-colors duration-200 ${
                  selectedTimeSlot === slot.display
                    ? 'bg-primary text-text-inverse'
                    : !slot.available
                    ? 'text-text-secondary cursor-not-allowed bg-surface-disabled line-through'
                    : 'bg-surface-tertiary text-text-primary hover:bg-surface-disabled active:bg-zinc-200'
                }`}
                aria-pressed={selectedTimeSlot === slot.display}
                aria-label={`${slot.display} ${!slot.available ? '(not available)' : ''}`}
                type="button"
              >
                {slot.display}
              </button>
            ))}
          </div>
          
          <p className="text-text-primary text-sm px-1 pt-6 font-inter">
            This is the arrival window not how long the job will take
          </p>
        </>
      )}
    </section>
  );
};

export default TimeSlotPicker;

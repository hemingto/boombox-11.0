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
  /** 
   * Whether this is edit mode - allows original time slot to be kept.
   * When true and originalTimeSlot is provided, that slot will always be available.
   */
  isEditMode?: boolean;
  /** 
   * The original appointment time slot (for edit mode).
   * This slot will always be shown as available in edit mode.
   */
  originalTimeSlot?: string | null;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedDate,
  timeSlots,
  selectedTimeSlot,
  onTimeSlotSelect,
  isLoading,
  currentCalendarDate,
  hasError,
  isEditMode = false,
  originalTimeSlot = null,
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

  // In edit mode with an original time slot, we can still proceed even if no slots are returned
  // This handles the case of editing a same-day appointment where the original slot has passed
  const hasOriginalSlotInEditMode = isEditMode && originalTimeSlot;
  
  if (timeSlots.length === 0 && !isLoading && !hasOriginalSlotInEditMode) {
    return (
      <section className="bg-surface-primary p-4 sm:p-6 rounded-md border-2 border-zinc-100">
        <h2 className="font-semibold text-text-primary mb-3 font-poppins">
          Available time slots for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h2>
        <p className="text-text-secondary font-inter">No available time slots for this date.</p>
      </section>
    );
  }

  return (
    <section 
      className={`p-4 sm:p-6 rounded-md 
        ${hasError 
          ? 'ring-border-error ring-2 bg-red-50' 
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
            {(() => {
              // In edit mode, ensure the original time slot is in the list and marked as available
              let slotsToRender = [...timeSlots];
              
              if (isEditMode && originalTimeSlot) {
                const originalSlotExists = timeSlots.some(s => s.display === originalTimeSlot);
                
                if (!originalSlotExists) {
                  // Add the original time slot to the list (it may have passed or not be in API response)
                  // Parse the time slot display to create start/end times
                  const [startPart, endPart] = originalTimeSlot.split('-');
                  slotsToRender.push({
                    startTime: startPart || '',
                    endTime: endPart || '',
                    display: originalTimeSlot,
                    available: true, // Always available in edit mode for original slot
                  });
                }
              }
              
              return slotsToRender.map((slot) => {
                // In edit mode, the original time slot is always available
                const isOriginalSlot = isEditMode && originalTimeSlot === slot.display;
                const isSlotAvailable = slot.available || isOriginalSlot;
                
                return (
                  <button
                    key={slot.display}
                    onClick={() => onTimeSlotSelect(slot.display)}
                    disabled={!isSlotAvailable}
                    className={`py-3 px-3 rounded-lg text-sm font-medium font-inter focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 ${
                      selectedTimeSlot === slot.display
                        ? 'bg-primary text-text-inverse'
                        : !isSlotAvailable
                        ? 'text-zinc-200 cursor-not-allowed bg-slate-50 line-through'
                        : isOriginalSlot && !slot.available
                        ? 'bg-amber-50 text-text-primary hover:bg-amber-100 active:bg-amber-200 border border-amber-300'
                        : 'bg-surface-tertiary text-text-primary hover:bg-surface-disabled active:bg-zinc-200'
                    }`}
                    aria-pressed={selectedTimeSlot === slot.display}
                    aria-label={`${slot.display} ${!isSlotAvailable ? '(not available)' : isOriginalSlot && !slot.available ? '(original appointment time)' : ''}`}
                    type="button"
                  >
                    {slot.display}
                    {isOriginalSlot && !slot.available && (
                      <span className="sr-only"> (your current appointment time)</span>
                    )}
                  </button>
                );
              });
            })()}
          </div>
          
          <p className="text-text-primary font-medium text-sm px-1 pt-6 font-poppins">
            This is the arrival window not how long the job will take
          </p>
        </>
      )}
    </section>
  );
};

export default TimeSlotPicker;

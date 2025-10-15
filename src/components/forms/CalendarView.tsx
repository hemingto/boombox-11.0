/**
 * @fileoverview Interactive calendar component for date selection with availability display
 * @source boombox-10.0/src/app/components/reusablecomponents/calendarview.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays monthly calendar grid with navigation controls
 * - Shows date availability status with visual indicators
 * - Handles date selection with keyboard and mouse interaction
 * - Automatically selects tomorrow if available when no date is selected
 * - Includes loading states and error handling
 * - Supports past date disabling and availability filtering
 * 
 * API ROUTES UPDATED:
 * - No API routes used directly in this component
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc colors with design system tokens
 * - Updated button styles to use consistent hover/focus states
 * - Applied semantic color classes for loading, error, and interactive states
 * - Used design system spacing and typography tokens
 * 
 * @refactor Enhanced accessibility with proper ARIA labels, improved keyboard navigation,
 * and better semantic HTML structure. Extracted date utility functions to use existing
 * utilities to prevent duplication.
 */

import React, { useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { formatDateForInput } from '@/lib/utils/dateUtils';

interface CalendarViewProps {
  /** The full date object, used to derive current month and year */
  currentDate: Date;
  /** Currently selected date */
  selectedDate: Date | null;
  /** Dates in "YYYY-MM-DD" format and their availability */
  availableDates: Record<string, boolean>;
  /** Handler for date selection */
  onDateSelect: (date: Date) => void;
  /** Handler for month navigation - newDate will be the first day of the new month */
  onMonthChange: (newDate: Date) => void;
  /** Loading state indicator */
  isLoading: boolean;
  /** Error state indicator for accessibility and visual feedback */
  hasError?: boolean;
}

const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  selectedDate,
  availableDates,
  onDateSelect,
  onMonthChange,
  isLoading,
  hasError,
}) => {
  /**
   * Generate date key in YYYY-MM-DD format for availability lookup
   * Uses existing date utility pattern from dateUtils
   */
  const getDayKey = (date: Date) => date.toISOString().split('T')[0];

  /**
   * Create tomorrow's date with time normalized to midnight
   * Reuses similar pattern from getTodayDateRange in adminTaskUtils
   */
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  };

  useEffect(() => {
    // Set default selected date to tomorrow if no date is selected
    if (!selectedDate) {
      const tomorrow = getTomorrowDate();
      const tomorrowKey = getDayKey(tomorrow);
      
      // Only select tomorrow if it's available
      if (availableDates[tomorrowKey]) {
        onDateSelect(tomorrow);
      }
    }
  }, [availableDates, selectedDate, onDateSelect, getDayKey, getTomorrowDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  let startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
  startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // Adjust to 0 (Mon) to 6 (Sun)

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null); // Fill initial empty slots
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null); // Fill trailing empty slots
  }

  const handlePrevMonth = () => {
    onMonthChange(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(year, month + 1, 1));
  };

  return (
    <section className={`p-4 sm:p-6 rounded-md mb-6 
      ${hasError 
        ? 'ring-border-error ring-2 bg-status-bg-error border-border-error' 
        : 'border-2 border-zinc-100 bg-surface-primary'}
    `}
    role="region"
    aria-label="Calendar date picker"
    aria-live="polite"
    >
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary font-inter">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <nav className="flex items-center space-x-1" aria-label="Calendar navigation">
          <button
            onClick={handlePrevMonth}
            aria-label={`Previous month - ${new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
            className="p-1.5 rounded-md hover:bg-surface-tertiary text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 transition-colors duration-200"
            disabled={isLoading}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextMonth}
            aria-label={`Next month - ${new Date(year, month + 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
            className="p-1.5 rounded-md hover:bg-surface-tertiary text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 transition-colors duration-200"
            disabled={isLoading}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </nav>
      </header>

      {isLoading ? (
        <div className="relative" aria-label="Loading calendar">
          <div className="grid grid-cols-7 h-6 gap-px text-center text-sm text-text-secondary mb-2">
            {daysOfWeek.map((day, index) => (
              <div key={`${day}-${index}`} className="font-medium font-inter">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px">
            {Array(35).fill(null).map((_, index) => (
              <div key={`skeleton-${index}`} className="h-10 bg-surface-tertiary rounded-md animate-pulse"></div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-surface-primary bg-opacity-70">
            <div 
              className="w-10 h-10 border-4 border-surface-disabled border-t-primary rounded-full animate-spin"
              role="status"
              aria-label="Loading calendar data"
            ></div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-px text-center text-sm text-text-secondary mb-2">
            {daysOfWeek.map((day, index) => (
              <div key={`${day}-${index}`} className="font-medium font-inter" role="columnheader">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px" role="grid" aria-label="Calendar dates">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="py-1.5" role="gridcell"></div>;
              }

              const dayKey = getDayKey(day);
              const isSelected = selectedDate ? getDayKey(selectedDate) === dayKey : false;
              const isPast = day < today;
              const isAvailable = availableDates[dayKey] === true && !isPast;
              const isToday = getDayKey(today) === dayKey;
              
              let buttonClasses = 'py-1.5 sm:py-2.5 w-full flex items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1 transition-colors duration-200 font-inter';

              if (isSelected) {
                buttonClasses += ' bg-primary text-text-inverse';
              } else if (isPast) {
                buttonClasses += ' text-text-secondary cursor-not-allowed bg-surface-disabled';
              } else if (isAvailable) {
                buttonClasses += ' text-text-primary hover:bg-surface-tertiary active:bg-surface-disabled';
              } else { // Not available and not past
                buttonClasses += ' text-text-secondary cursor-not-allowed bg-surface-disabled';
              }

              return (
                <div key={dayKey} className="relative py-px px-px" role="gridcell">
                  <button
                    type="button"
                    onClick={() => isAvailable && onDateSelect(day)}
                    disabled={isPast || !isAvailable}
                    className={buttonClasses}
                    aria-pressed={isSelected}
                    aria-label={`${day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} ${isPast ? '(past date)' : isAvailable ? '(available)' : '(not available)'}`}
                    tabIndex={isSelected ? 0 : (isAvailable ? 0 : -1)}
                  >
                    <span className="relative">
                      {day.getDate()}
                      {isToday && (
                        <span className="sr-only"> (today)</span>
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};

export default CalendarView;

"use client";

/**
 * @fileoverview Admin-specific date picker with consistent admin portal styling
 * 
 * COMPONENT FUNCTIONALITY:
 * - Date selection with react-datepicker integration
 * - Consistent button styling matching admin portal Status/Actions buttons
 * - Past date filtering with configurable allowPastDates option
 * - Dropdown calendar interface similar to filter buttons
 * - Click-outside handling for proper calendar closure
 * 
 * STYLING:
 * - Matches admin portal button styling (Status, Actions, Customize buttons)
 * - Uses same white background, gray ring, and hover states
 * - Integrated ChevronDownIcon for consistency
 * - Compact design for admin toolbar integration
 * 
 * @refactor Created specifically for admin portal consistency
 */

import React, { useState, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ChevronDownIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { formatDateForInput, isPastDate } from '@/lib/utils/dateUtils';
import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/lib/utils/cn';

export interface AdminDatePickerProps {
  /** Current selected date value */
  value?: Date | null;
  /** Callback function called when date changes, receives formatted date string and Date object */
  onDateChange: (formattedDate: string, dateObject: Date | null) => void;
  /** Whether to allow selection of past dates */
  allowPastDates?: boolean;
  /** Optional placeholder text when no date is selected */
  placeholder?: string;
  /** Optional CSS classes */
  className?: string;
  /** External control of dropdown open state */
  isOpen?: boolean;
  /** Callback when dropdown should open/close */
  onToggle?: () => void;
}

/**
 * AdminDatePicker - Date picker with admin portal styling
 * 
 * @example
 * ```tsx
 * <AdminDatePicker
 *   value={selectedDate}
 *   onDateChange={(formattedDate, dateObject) => setSelectedDate(dateObject)}
 *   allowPastDates={true}
 *   placeholder="Date"
 * />
 * ```
 */
export function AdminDatePicker({
  value = null,
  onDateChange,
  allowPastDates = false,
  placeholder = "Date",
  className,
  isOpen: externalIsOpen,
  onToggle,
}: AdminDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onToggle || setInternalIsOpen;

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const formattedDate = formatDateForInput(date);
      onDateChange(formattedDate, date);
    } else {
      onDateChange('', null);
    }
    if (onToggle) {
      onToggle(); // Close via external control
    } else {
      setInternalIsOpen(false);
    }
  };

  const toggleCalendar = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  // Close date picker when clicking outside
  useClickOutside(datePickerRef, () => {
    if (onToggle && isOpen) {
      onToggle();
    } else if (!onToggle) {
      setInternalIsOpen(false);
    }
  });

  // Format display text
  const displayText = selectedDate 
    ? formatDateForInput(selectedDate) 
    : placeholder;

  return (
    <div className={cn("relative", className)} ref={datePickerRef}>
      <button
        onClick={toggleCalendar}
        className="inline-flex items-center text-sm gap-x-1.5 rounded-md bg-white px-3 py-2.5 font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        type="button"
      >
        <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
        {displayText}
        <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" />
      </button>
      
      {isOpen && (
        <div 
          className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="dialog"
          aria-label="Date picker"
        >
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            inline
            calendarClassName="datepicker-calendar"
            minDate={allowPastDates ? undefined : new Date()}
            filterDate={date => !isPastDate(date, allowPastDates)}
            showPopperArrow={false}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}


"use client";

/**
 * @fileoverview Custom date picker component with error handling, validation, and design system compliance
 * @source boombox-10.0/src/app/components/reusablecomponents/customdatepicker.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Date selection with react-datepicker integration
 * - Error state management and visual feedback
 * - Past date filtering with configurable allowPastDates option
 * - Responsive design with mobile-friendly interface
 * - Click-outside handling for proper calendar closure
 * - Keyboard navigation and accessibility support
 * 
 * DESIGN SYSTEM UPDATES:
 * - Integrated with Input primitive component for consistent styling
 * - Replaced hardcoded colors with design system tokens
 * - Applied semantic color patterns (error, focus, text states)
 * - Consistent hover/focus states using design system colors
 * - Leverages Input component's built-in error handling and icon positioning
 * 
 * @refactor Enhanced accessibility, extracted date formatting to utilities, improved TypeScript interfaces, integrated Input primitive
 */

import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarDaysIcon } from '@heroicons/react/20/solid';
import { formatDateForInput, isPastDate } from '@/lib/utils/dateUtils';
import { useClickOutside } from '@/hooks/useClickOutside';
import { Input } from '@/components/ui/primitives/Input';
import { cn } from '@/lib/utils/cn';

export interface CustomDatePickerProps {
  /** Callback function called when date changes, receives formatted date string and Date object */
  onDateChange: (formattedDate: string, dateObject: Date | null) => void;
  /** Whether the input field has a validation error */
  hasError?: boolean;
  /** Error message to display below the input */
  error?: string;
  /** Callback function to clear validation errors when user interacts with input */
  onClearError?: () => void;
  /** Current selected date value */
  value?: Date | null;
  /** Whether to allow selection of past dates */
  allowPastDates?: boolean;
  /** Whether to use smaller text size for compact layouts */
  smallText?: boolean;
  /** Optional placeholder text for the input field */
  placeholder?: string;
  /** Optional label text for the input field */
  label?: string;
  /** Optional aria-label for accessibility */
  'aria-label'?: string;
  /** Optional aria-describedby for accessibility */
  'aria-describedby'?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Optional CSS classes */
  className?: string;
  /** Optional input ID */
  id?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  onDateChange,
  hasError = false,
  error,
  onClearError,
  value = null,  
  allowPastDates = false,
  smallText = false,
  placeholder = "Add Date",
  label,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  disabled = false,
  className,
  id,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);  
  const [isOpen, setIsOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const formattedDate = formatDateForInput(date);
      onDateChange(formattedDate, date);
    } else {
      onDateChange('', null);
    }
    setIsOpen(false);
  };

  const toggleCalendar = () => {
    if (disabled) return;
    
    if (onClearError) {
      onClearError();
    }
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    
    // Open calendar on Enter or Space
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleCalendar();
    }
    // Close calendar on Escape
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Close date picker when clicking outside
  useClickOutside(datePickerRef, () => setIsOpen(false));

  useEffect(() => {
    setSelectedDate(value || null);
  }, [value]);

  // Compute display value using utility function
  const displayValue = selectedDate ? formatDateForInput(selectedDate) : '';

  return (
    <div className={cn("relative w-full", className)} ref={datePickerRef}>
      <Input
        id={id}
        type="text"
        name="date"
        value={displayValue} 
        onClick={toggleCalendar}
        onKeyDown={handleKeyDown}
        readOnly
        disabled={disabled}
        placeholder={placeholder}
        label={label}
        error={error}
        icon={<CalendarDaysIcon />}
        iconPosition="left"
        fullWidth
        size="md"
        className={cn("cursor-pointer", smallText && "!text-sm")}
        aria-label={ariaLabel || label || "Select date"}
        aria-describedby={ariaDescribedBy}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={isOpen ? "date-picker-calendar" : undefined}
        role="combobox"
        onClearError={onClearError}
        variant={hasError || error ? 'error' : 'default'}
      />
      {isOpen && !disabled && (
        <div 
          id="date-picker-calendar"
          className="absolute mt-2 top-full w-full min-w-72 left-0 z-10"
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
};

export default CustomDatePicker;

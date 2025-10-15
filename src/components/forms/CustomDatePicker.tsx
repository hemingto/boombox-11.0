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
 * - Replaced hardcoded colors with design system tokens
 * - Used input-field utility classes from globals.css
 * - Applied semantic color patterns (error, focus, text states)
 * - Consistent hover/focus states using design system colors
 * 
 * @refactor Enhanced accessibility, extracted date formatting to utilities, improved TypeScript interfaces
 */

import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarDaysIcon } from '@heroicons/react/20/solid';
import { formatDateForInput, isPastDate } from '@/lib/utils/dateUtils';
import { useClickOutside } from '@/hooks/useClickOutside';

export interface CustomDatePickerProps {
  /** Callback function called when date changes, receives formatted date string and Date object */
  onDateChange: (formattedDate: string, dateObject: Date | null) => void;
  /** Whether the input field has a validation error */
  hasError?: boolean;
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
  /** Optional aria-label for accessibility */
  'aria-label'?: string;
  /** Optional aria-describedby for accessibility */
  'aria-describedby'?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  onDateChange,
  hasError = false,
  onClearError,
  value = null,  
  allowPastDates = false,
  smallText = false,
  placeholder = "Add Date",
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  disabled = false,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);  
  const [isOpen, setIsOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [hasValue, setHasValue] = useState<boolean>(!!value);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setHasValue(!!date);
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
    setHasValue(!!value);
  }, [value]);

  // Compute display value using utility function
  const displayValue = selectedDate ? formatDateForInput(selectedDate) : '';

  // Compute icon color based on state
  const iconColor = hasError
    ? 'text-status-error'
    : isFocused || hasValue
    ? 'text-primary'
    : 'text-text-secondary';

  // Compute input classes with design system tokens
  const inputClasses = `
    pl-8 py-2.5 px-3 w-full sm:mb-4 mb-2 rounded-md 
    placeholder:text-sm cursor-pointer transition-colors
    ${hasError 
      ? 'ring-status-error ring-2 bg-red-50 placeholder:text-status-error border-status-error' 
      : 'input-field'
    } 
    ${smallText ? 'text-sm' : ''} 
    ${disabled ? 'cursor-not-allowed opacity-50' : ''}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="relative w-full" ref={datePickerRef}>
      <input
        type="text"
        name="date"
        value={displayValue} 
        onClick={toggleCalendar}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (!disabled) {
            setIsFocused(true);
            if (onClearError) onClearError();
          }
        }}
        onBlur={() => setIsFocused(false)}
        readOnly
        disabled={disabled}
        placeholder={placeholder}
        className={inputClasses}
        aria-label={ariaLabel || "Select date"}
        aria-describedby={ariaDescribedBy}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={isOpen ? "date-picker-calendar" : undefined}
        role="combobox"
      />
      <CalendarDaysIcon 
        className={`absolute left-2 w-5 h-5 pointer-events-none transition-colors
          ${iconColor} 
          ${smallText ? 'inset-y-2.5' : 'inset-y-3'}
        `} 
        aria-hidden="true"
      />
      {isOpen && !disabled && (
        <div 
          id="date-picker-calendar"
          className="absolute top-full w-full min-w-72 left-0 z-10"
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

"use client";

/**
 * @fileoverview Time picker dropdown component for selecting predefined time ranges
 * @source boombox-10.0/src/app/components/reusablecomponents/timepicker.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays a dropdown with predefined time slots (9am-6pm in 1-hour windows)
 * - Provides visual feedback for selected time slots
 * - Handles error states with proper styling and accessibility
 * - Includes click-outside functionality to close dropdown
 * - Supports controlled component pattern with value prop
 * - Provides both display and value formats for time slots
 * 
 * API ROUTES UPDATED:
 * - No direct API routes used (pure UI component)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc/slate colors with design system tokens
 * - Updated input styling to use .input-field utility class
 * - Applied semantic color classes for error, focus, and interactive states
 * - Used design system spacing, typography, and shadow tokens
 * - Applied proper focus management and accessibility improvements
 * 
 * @refactor Enhanced accessibility with proper ARIA labels, improved keyboard navigation,
 * semantic HTML structure, and better error state handling. Updated to use design system
 * colors and utilities while maintaining the original dropdown functionality.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/20/solid';
import { useClickOutside } from '@/hooks/useClickOutside';

interface TimeSlot {
  display: string;
  value: string;  // 24-hour format for parsing
  disabled?: boolean;
}

const timeSlots: TimeSlot[] = [
  { display: '9am-10am', value: '09:00' },
  { display: '10am-11am', value: '10:00' },
  { display: '11am-12pm', value: '11:00' },
  { display: '12pm-1pm', value: '12:00' },
  { display: '1pm-2pm', value: '13:00' },
  { display: '2pm-3pm', value: '14:00' },
  { display: '3pm-4pm', value: '15:00' },
  { display: '4pm-5pm', value: '16:00' },
  { display: '5pm-6pm', value: '17:00' }
];

interface TimePickerProps {
  /** Callback when time selection changes */
  onTimeChange: (display: string, value: string) => void;
  /** Error state indicator */
  hasError?: boolean;
  /** Callback to clear error state */
  onClearError?: () => void;
  /** Current selected value (display format) */
  value?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Unique identifier for the input */
  id?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** ARIA described by for accessibility */
  'aria-describedby'?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ 
  onTimeChange, 
  hasError = false, 
  onClearError, 
  value = '',
  disabled = false,
  placeholder = 'Add Time',
  className = '',
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [hasValue, setHasValue] = useState<boolean>(!!value);

  const handleTimeClick = (slot: TimeSlot) => {
    if (slot.disabled) return;
    
    setSelectedTime(slot);
    onTimeChange(slot.display, slot.value);
    setIsPopoverOpen(false);
    
    // Return focus to input for better accessibility
    inputRef.current?.focus();
  };

  useEffect(() => {
    const timeSlot = timeSlots.find(slot => slot.display === value);
    setSelectedTime(timeSlot || null);
    setHasValue(!!value);
  }, [value]);

  const togglePopover = () => {
    if (disabled) return;
    
    if (onClearError) {
      onClearError();
    }
    setIsPopoverOpen(!isPopoverOpen);
  };

  // Close time picker when clicking outside
  useClickOutside(popoverRef, () => setIsPopoverOpen(false), isPopoverOpen);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        togglePopover();
        break;
      case 'Escape':
        if (isPopoverOpen) {
          event.preventDefault();
          setIsPopoverOpen(false);
          inputRef.current?.focus();
        }
        break;
      case 'ArrowDown':
        if (!isPopoverOpen) {
          event.preventDefault();
          setIsPopoverOpen(true);
        }
        break;
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name="time"
          id={id}
          value={selectedTime?.display || ''}
          onClick={togglePopover}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            if (onClearError) onClearError();
          }}
          onBlur={() => setIsFocused(false)}
          readOnly
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel || 'Select time slot'}
          aria-describedby={ariaDescribedBy}
          aria-expanded={isPopoverOpen}
          aria-haspopup="listbox"
          role="combobox"
          className={`
            pl-10 pr-3 py-2.5 w-full sm:mb-4 mb-2 rounded-md cursor-pointer font-inter
            ${hasError 
              ? 'input-field--error' 
              : disabled
                ? 'input-field bg-surface-disabled cursor-not-allowed'
                : 'input-field'
            }
            ${isFocused || hasValue ? 'placeholder:text-text-primary' : 'placeholder:text-text-secondary'}
          `}
        />
        <ClockIcon 
          className={`absolute inset-y-0 left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none ${
            hasError
              ? 'text-status-error'
              : disabled
                ? 'text-text-secondary'
                : isFocused || hasValue
                  ? 'text-text-primary'
                  : 'text-text-secondary'
          }`} 
          aria-hidden="true"
        />
      </div>

      {isPopoverOpen && (
        <div 
          ref={popoverRef} 
          className="absolute top-full right-0 sm:min-w-96 w-full bg-surface-primary rounded-md shadow-custom-shadow z-50 border border-border"
          role="listbox"
          aria-label="Time slot options"
        >
          <div className="pt-4 px-4 pb-2 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {timeSlots.map((slot) => (
              <button
                key={slot.display}
                onClick={() => handleTimeClick(slot)}
                disabled={slot.disabled}
                role="option"
                aria-selected={selectedTime?.display === slot.display}
                className={`
                  py-3 px-3 rounded-lg text-sm font-medium font-inter
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 
                  ${selectedTime?.display === slot.display 
                    ? 'bg-primary text-text-inverse' 
                    : slot.disabled 
                      ? 'text-text-secondary cursor-not-allowed bg-surface-disabled line-through'
                      : 'bg-surface-tertiary text-text-primary hover:bg-surface-disabled active:bg-zinc-200'
                  }
                `}
                type="button"
              >
                {slot.display}
              </button>
            ))}
          </div>
          
        </div>
      )}
    </div>
  );
};

export default TimePicker;

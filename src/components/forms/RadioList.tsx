/**
 * @fileoverview RadioList component for simple radio button list selections
 * @source boombox-10.0/src/app/components/reusablecomponents/radiolist.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Renders a list of radio button options with clean styling and selection states.
 * Supports callback functions for selection changes and maintains selected state.
 * Used for simple list-based selections like cancellation reasons, preferences, etc.
 * 
 * API ROUTES UPDATED:
 * - No API routes used in this component
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced bg-slate-100 with surface-tertiary for consistent background
 * - Replaced bg-white with surface-primary for selected state
 * - Replaced ring-zinc-950 with ring-primary for selection indicator
 * - Replaced text-zinc-950 with text-primary for consistent text color
 * - Updated focus states to use border-focus from design system
 * - Applied consistent transition and spacing using design tokens
 * 
 * @refactor Enhanced accessibility with proper ARIA labels, keyboard navigation support,
 * fieldset/legend structure for screen readers, and semantic HTML. Applied design system
 * colors throughout and improved focus management.
 */

import React, { useState } from 'react';

interface RadioListProps {
  /** Array of option strings to display as radio buttons */
  options: string[];
  /** Optional callback function called when selection changes */
  onChange?: (option: string) => void;
  /** Optional name attribute for the radio group (defaults to 'radioList') */
  name?: string;
  /** Optional legend text for the radio group fieldset */
  legend?: string;
  /** Optional initial selected value */
  defaultValue?: string;
  /** Optional disabled state */
  disabled?: boolean;
  /** Optional error state */
  hasError?: boolean;
  /** Optional error message to display */
  errorMessage?: string;
  /** Optional CSS class name for additional styling */
  className?: string;
}

export const RadioList: React.FC<RadioListProps> = ({
  options,
  onChange,
  name = 'radioList',
  legend,
  defaultValue,
  disabled = false,
  hasError = false,
  errorMessage,
  className = '',
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(defaultValue || null);

  const handleOptionChange = (option: string) => {
    if (disabled) return;
    
    setSelectedOption(option);
    if (onChange) {
      onChange(option);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, option: string) => {
    // Handle Enter and Space key presses for accessibility
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOptionChange(option);
    }
  };

  return (
    <fieldset 
      className={`space-y-2 ${className}`}
      disabled={disabled}
      aria-invalid={hasError}
      aria-describedby={hasError && errorMessage ? `${name}-error` : undefined}
    >
      {legend && (
        <legend className="form-label">
          {legend}
        </legend>
      )}
      
      <div className="space-y-2" role="radiogroup" aria-labelledby={legend ? undefined : `${name}-group`}>
        {!legend && (
          <div id={`${name}-group`} className="sr-only">
            Radio button options
          </div>
        )}
        
        {options.map((option, idx) => {
          const optionId = `${name}-option-${idx}`;
          const isSelected = selectedOption === option;
          
          return (
            <label
              key={idx}
              htmlFor={optionId}
              className={`flex justify-between items-center p-4 rounded-lg cursor-pointer transition-all duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-border-focus focus-within:ring-offset-2 ${
                disabled 
                  ? 'bg-surface-disabled cursor-not-allowed opacity-60' 
                  : isSelected 
                    ? hasError
                      ? 'bg-status-bg-error ring-2 ring-border-error' 
                      : 'bg-surface-primary ring-2 ring-primary'
                    : hasError
                      ? 'bg-status-bg-error hover:bg-red-200'
                      : 'bg-surface-tertiary hover:bg-surface-secondary'
              }`}
              tabIndex={disabled ? -1 : 0}
              onKeyDown={(e) => handleKeyDown(e, option)}
              role="radio"
              aria-checked={isSelected}
              aria-describedby={`${optionId}-text`}
            >
              <div className="flex flex-col">
                <span 
                  id={`${optionId}-text`}
                  className={`text-base transition-colors duration-200 ${
                    disabled 
                      ? 'text-text-secondary' 
                      : hasError 
                        ? 'text-status-error' 
                        : 'text-text-primary'
                  }`}
                >
                  {option}
                </span>
              </div>
              
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option}
                checked={isSelected}
                onChange={() => handleOptionChange(option)}
                disabled={disabled}
                className={`w-5 h-5 transition-colors duration-200 focus:ring-2 focus:ring-border-focus focus:ring-offset-2 ${
                  hasError 
                    ? 'accent-status-error' 
                    : 'accent-primary'
                } ${
                  disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
                aria-describedby={`${optionId}-text`}
              />
            </label>
          );
        })}
      </div>
      
      {hasError && errorMessage && (
        <div 
          id={`${name}-error`}
          className="form-error"
          role="alert"
          aria-live="polite"
        >
          {errorMessage}
        </div>
      )}
    </fieldset>
  );
};

export default RadioList;


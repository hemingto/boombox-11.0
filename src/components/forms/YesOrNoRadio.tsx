/**
 * @fileoverview YesOrNoRadio component for binary choice selection with radio button behavior
 * @source boombox-10.0/src/app/components/reusablecomponents/yesornoradio.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a binary choice selection interface with customizable labels (defaulting to Yes/No).
 * Displays two clickable buttons that behave like radio buttons - only one can be selected at a time.
 * Supports error states with visual feedback and error message display.
 * 
 * API ROUTES UPDATED:
 * - No API routes used in this component
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with design system tokens (primary, surface, text, border)
 * - Updated hover/focus states to use semantic color tokens
 * - Applied consistent spacing and typography from design system
 * - Added proper focus indicators for accessibility
 * 
 * @refactor Migrated from boombox-10.0 with design system compliance, accessibility improvements,
 * and TypeScript interface enhancements. Added keyboard navigation support and ARIA attributes.
 */

'use client';

import React from 'react';

interface YesOrNoRadioProps {
  /** Current selected value */
  value: string | null;
  /** Callback function called when selection changes */
  onChange: (value: string) => void;
  /** Whether the component is in an error state */
  hasError?: boolean;
  /** Error message to display when hasError is true */
  errorMessage?: string;
  /** Custom label for the "yes" option */
  yesLabel?: string;
  /** Custom label for the "no" option */
  noLabel?: string;
  /** Unique identifier for the radio group (for accessibility) */
  name?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * YesOrNoRadio component provides a binary choice selection interface
 * with radio button behavior and full accessibility support.
 */
const YesOrNoRadio: React.FC<YesOrNoRadioProps> = ({
  value,
  onChange,
  hasError = false,
  errorMessage,
  yesLabel = 'Yes',
  noLabel = 'No',
  name = 'yes-no-radio',
  disabled = false,
  className = '',
}) => {
  const handleKeyDown = (event: React.KeyboardEvent, optionValue: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled) {
        onChange(optionValue);
      }
    }
  };

  const getButtonClasses = (isSelected: boolean) => {
    const baseClasses = 'w-fit text-sm py-2.5 px-6 flex justify-center items-center ring-2 rounded-md cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
    
    if (disabled) {
      return `${baseClasses} ring-transparent bg-surface-disabled text-text-secondary cursor-not-allowed`;
    }
    
    if (isSelected) {
      return `${baseClasses} ring-primary bg-surface-primary text-primary font-semibold`;
    }
    
    if (hasError) {
      return `${baseClasses} ring-border-error bg-status-bg-error text-status-text-error hover:bg-red-200`;
    }
    
    return `${baseClasses} ring-transparent bg-surface-tertiary text-text-secondary hover:bg-surface-disabled hover:text-text-primary`;
  };

  return (
    <div className={`space-y-2 ${className}`} role="radiogroup" aria-labelledby={`${name}-label`}>
      <div className="flex space-x-2">
        {/* Yes Button */}
        <div
          className={getButtonClasses(value === yesLabel)}
          onClick={() => !disabled && onChange(yesLabel)}
          onKeyDown={(e) => handleKeyDown(e, yesLabel)}
          role="radio"
          aria-checked={value === yesLabel ? 'true' : 'false'}
          aria-disabled={disabled ? 'true' : 'false'}
          tabIndex={disabled ? -1 : 0}
          aria-describedby={hasError && errorMessage ? `${name}-error` : undefined}
        >
          <span>{yesLabel}</span>
        </div>

        {/* No Button */}
        <div
          className={getButtonClasses(value === noLabel)}
          onClick={() => !disabled && onChange(noLabel)}
          onKeyDown={(e) => handleKeyDown(e, noLabel)}
          role="radio"
          aria-checked={value === noLabel ? 'true' : 'false'}
          aria-disabled={disabled ? 'true' : 'false'}
          tabIndex={disabled ? -1 : 0}
          aria-describedby={hasError && errorMessage ? `${name}-error` : undefined}
        >
          <span>{noLabel}</span>
        </div>
      </div>

      {/* Error Message */}
      {hasError && errorMessage && (
        <p 
          id={`${name}-error`}
          className="text-status-error text-sm mt-2"
          role="alert"
          aria-live="polite"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default YesOrNoRadio;

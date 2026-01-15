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
  /** Optional callback to clear error state when a selection is made */
  onErrorClear?: () => void;
  /** Custom label for the "yes" option */
  yesLabel?: string;
  /** Custom label for the "no" option */
  noLabel?: string;
  /** Unique identifier for the radio group (for accessibility) */
  name?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Optional label/heading text to display above the radio buttons */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to use compact label spacing (mb-2 instead of mb-4) */
  compactLabel?: boolean;
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
  onErrorClear,
  yesLabel = 'Yes',
  noLabel = 'No',
  name = 'yes-no-radio',
  disabled = false,
  label,
  className = '',
  compactLabel = false,
}) => {
  const handleSelection = (optionValue: string) => {
    if (!disabled) {
      onChange(optionValue);
      // Clear error state when a selection is made
      if (hasError && onErrorClear) {
        onErrorClear();
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, optionValue: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelection(optionValue);
    }
  };

  return (
    <div className={className}>
      {label && (
        <h2 id={`${name}-label`} className={`form-label ${compactLabel ? 'mb-2' : 'mb-4'}`}>
          {label}
        </h2>
      )}
      <div role="radiogroup" aria-labelledby={label ? `${name}-label` : undefined}>
        <div className="flex space-x-2">
          {/* Yes Button */}
          <div
            className={`w-fit text-sm font-medium py-2.5 px-6 flex justify-center items-center ring-2 rounded-md cursor-pointer ${
              value === yesLabel
                ? 'ring-border-focus bg-surface-primary text-text-primary'
                : hasError && !value
                ? 'border-border-error ring-2 ring-border-error bg-red-50 text-status-error'
                : 'ring-transparent bg-surface-tertiary text-text-secondary'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            onClick={() => handleSelection(yesLabel)}
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
            className={`w-fit text-sm font-medium py-2.5 px-6 flex justify-center items-center ring-2 rounded-md cursor-pointer ${
              value === noLabel
                ? 'ring-border-focus bg-surface-primary text-text-primary'
                : hasError && !value
                ? 'border-border-error ring-2 ring-border-error bg-red-50 text-status-error'
                : 'ring-transparent bg-surface-tertiary text-text-secondary'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            onClick={() => handleSelection(noLabel)}
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
            className="form-error"
            role="alert"
            aria-live="polite"
          >
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default YesOrNoRadio;

"use client";

/**
 * @fileoverview Card expiration date input component using Stripe Elements with design system integration
 * @source boombox-10.0/src/app/components/reusablecomponents/cardexpirationdateinput.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a secure card expiration date input field using Stripe's CardExpiryElement.
 * Includes proper error handling, focus states, and accessibility features.
 * Integrated with Boombox design system colors and styling patterns.
 * 
 * API ROUTES UPDATED:
 * N/A - This is a frontend component without direct API dependencies
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design tokens (primary, surface, text, border)
 * - Updated focus states to use design system focus colors
 * - Applied consistent error styling using status-error colors
 * - Used design system utility classes for consistent spacing and borders
 * - Integrated proper accessibility colors meeting WCAG standards
 * 
 * @refactor Enhanced component with proper TypeScript interfaces, ARIA accessibility,
 * design system compliance, and consistent error handling patterns
 */

import React, { useState } from 'react';
import { CardExpiryElement } from '@stripe/react-stripe-js';
import { StripeElementChangeEvent } from '@stripe/stripe-js';

export interface CardExpirationDateInputProps {
  /** Callback function triggered when the Stripe element value changes */
  onChange: (event: StripeElementChangeEvent) => void;
  /** Optional callback triggered when the input receives focus */
  onFocus?: () => void;
  /** Optional callback triggered when the input loses focus */
  onBlur?: () => void;
  /** Additional CSS classes to apply to the container */
  className?: string;
  /** Whether the input should be disabled */
  disabled?: boolean;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** ARIA described by for error messages */
  'aria-describedby'?: string;
}

/**
 * CardExpirationDateInput component provides a secure card expiration date input
 * using Stripe Elements with full design system integration and accessibility support.
 */
const CardExpirationDateInput: React.FC<CardExpirationDateInputProps> = ({
  onChange,
  onFocus,
  onBlur,
  className = '',
  disabled = false,
  'aria-label': ariaLabel = 'Card expiration date',
  'aria-describedby': ariaDescribedBy,
}) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const handleChange = (event: StripeElementChangeEvent) => {
    setHasError(!!event.error);
    onChange(event);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setHasError(false); // Clear error state when user focuses
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  // Stripe element configuration with design system integration
  const cardExpiryElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: 'rgb(24 24 27)', // text-primary from design system
        fontFamily: 'var(--font-poppins), Poppins, ui-sans-serif, system-ui, sans-serif',
        lineHeight: '24px',
        fontWeight: '400',
        '::placeholder': {
          color: hasError ? 'rgb(239 68 68)' : (isFocused ? 'rgb(24 24 27)' : 'rgb(161 161 170)'), // Red when error, zinc-950 when focused, text-secondary otherwise
          fontSize: '14px',
        },
      },
      invalid: {
        color: 'rgb(239 68 68)', // status-error from design system
      },
    },
    placeholder: 'MM / YY',
    disabled,
  };

  // Dynamic styling based on state using design system classes
  const containerClassName = `
    py-2.5 px-3 rounded-md
    ${hasError 
      ? 'ring-2 ring-border-error bg-red-50 border-border-error' 
      : isFocused
        ? 'ring-2 ring-border-focus bg-surface-primary border-transparent'
        : 'bg-surface-tertiary'
    }
    ${disabled 
      ? 'bg-surface-disabled cursor-not-allowed opacity-60' 
      : 'focus-within:outline-none'
    }
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div
      className={containerClassName}
      role="textbox"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-invalid={hasError}
      tabIndex={-1} // Stripe element handles its own focus
    >
      <CardExpiryElement
        options={cardExpiryElementOptions}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </div>
  );
};

export default CardExpirationDateInput;

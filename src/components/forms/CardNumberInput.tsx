/**
 * @fileoverview Card number input component using Stripe Elements with design system integration
 * @source boombox-10.0/src/app/components/reusablecomponents/cardnumberinput.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a secure card number input field using Stripe's CardNumberElement.
 * Includes credit card icon, proper error handling, focus states, and accessibility features.
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
 * - Enhanced icon color transitions with design system states
 * 
 * @refactor Enhanced component with proper TypeScript interfaces, ARIA accessibility,
 * design system compliance, consistent error handling patterns, and improved icon integration
 */

import React, { useState } from 'react';
import { CreditCardIcon } from '@heroicons/react/20/solid';
import { CardNumberElement } from '@stripe/react-stripe-js';
import { StripeElementChangeEvent } from '@stripe/stripe-js';

export interface CardNumberInputProps {
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
 * CardNumberInput component provides a secure card number input
 * using Stripe Elements with credit card icon, full design system integration and accessibility support.
 */
const CardNumberInput: React.FC<CardNumberInputProps> = ({
  onChange,
  onFocus,
  onBlur,
  className = '',
  disabled = false,
  'aria-label': ariaLabel = 'Credit card number',
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
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  // Stripe element configuration with design system integration
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: 'rgb(24 24 27)', // text-primary from design system
        fontFamily: 'var(--font-poppins), Poppins, ui-sans-serif, system-ui, sans-serif',
        lineHeight: '24px',
        fontWeight: '400',
        '::placeholder': {
          color: 'rgb(161 161 170)', // text-secondary from design system
          fontSize: '14px',
        },
      },
      invalid: {
        color: 'rgb(239 68 68)', // status-error from design system
        '::placeholder': {
          color: 'rgb(239 68 68)', // status-error for placeholder too
        },
      },
    },
    placeholder: 'Card Number',
    disabled,
  };

  // Dynamic icon color based on state using design system colors
  const iconClassName = `
    w-5 h-5 transition-colors duration-200
    ${hasError
      ? 'text-status-error'
      : isFocused
        ? 'text-primary'
        : disabled
          ? 'text-text-secondary opacity-60'
          : 'text-text-secondary hover:text-text-tertiary'
    }
  `.trim().replace(/\s+/g, ' ');

  // Dynamic container styling based on state using design system classes
  const containerClassName = `
    relative w-full
    ${className}
  `.trim();

  const inputContainerClassName = `
    relative rounded-md transition-all duration-200
    ${hasError 
      ? 'ring-2 ring-border-error bg-red-50 border-border-error' 
      : isFocused
        ? 'ring-2 ring-border-focus bg-surface-primary border-transparent'
        : 'bg-surface-tertiary border border-border hover:bg-surface-secondary'
    }
    ${disabled 
      ? 'bg-surface-disabled cursor-not-allowed opacity-60' 
      : 'focus-within:outline-none'
    }
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={containerClassName}>
      {/* Credit card icon with accessible label */}
      <span 
        className="absolute top-3 left-3 z-10"
        aria-hidden="true"
      >
        <CreditCardIcon className={iconClassName} />
      </span>
      
      {/* Stripe element container with proper spacing for icon */}
      <div 
        className={inputContainerClassName}
        role="textbox"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={hasError}
        tabIndex={-1} // Stripe element handles its own focus
      >
        <div className="pl-10 py-2.5 px-3">
          <CardNumberElement
            options={cardElementOptions}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
      </div>
    </div>
  );
};

export default CardNumberInput;

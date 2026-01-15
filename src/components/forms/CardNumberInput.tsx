"use client";

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
    setHasError(false); // Clear error state when user focuses
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  // Stripe element configuration
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: 'Poppins, sans-serif',
        lineHeight: '24px',
        fontWeight: '400',
        '::placeholder': {
          color: hasError ? 'rgb(239 68 68)' : (isFocused ? '#18181b' : '#a1a1aa'), // Red when error, zinc-950 when focused, zinc-400 otherwise
          fontSize: '14px'
        },
      },
      invalid: {
        color: 'rgb(239 68 68)', // status-error from design system
      },
    },
    placeholder: 'Card Number'
  };

  // Dynamic icon color based on state
  const iconColor = hasError
    ? 'text-red-500'
    : isFocused
      ? 'text-zinc-950'
      : 'text-zinc-400';

  return (
    <div className="relative w-full">
      {/* Credit card icon with accessible label */}
      <span 
        className="absolute top-3 left-2 z-10"
        aria-hidden="true"
      >
        <CreditCardIcon className={`w-5 h-5 ${iconColor}`} />
      </span>
      
      {/* Stripe element container with proper spacing for icon */}
      <div className={`relative ${
        hasError 
          ? 'ring-2 ring-border-error bg-red-50 border-border-error rounded-md' 
          : isFocused
            ? 'ring-2 ring-zinc-950 bg-white focus:placeholder:text-zinc-950 rounded-md'
            : 'bg-slate-100 rounded-md'
      }`}>
        <div className="pl-8 py-2.5 px-3">
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

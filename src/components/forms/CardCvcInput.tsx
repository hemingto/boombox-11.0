/**
 * @fileoverview Card CVC input component with Stripe integration and design system compliance
 * @source boombox-10.0/src/app/components/reusablecomponents/cardcvcinput.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Renders a CVC input field using Stripe Elements CardCvcElement with enhanced UI states.
 * Manages focus, error, and validation states for secure CVC collection. Provides controlled
 * integration with parent payment forms through event callbacks.
 * 
 * API ROUTES UPDATED:
 * - No direct API routes used (client-side Stripe Elements component)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with design system tokens (primary, surface, text, border)
 * - Applied consistent focus states using design system focus ring colors
 * - Used semantic color tokens for error states (border-error, status-error)
 * - Applied design system typography (font-family from Poppins tokens)
 * - Used input-field utility classes and form patterns from globals.css
 * 
 * @refactor Enhanced accessibility with ARIA labels, improved focus management,
 * and integrated design system colors. Maintained Stripe Elements integration
 * while updating styling to match boombox-11.0 design standards.
 */

import { useState } from 'react';
import { CardCvcElement } from '@stripe/react-stripe-js';
import { StripeElementChangeEvent } from '@stripe/stripe-js';

interface CardCvcInputProps {
  /** Callback fired when the CVC element value changes */
  onChange: (event: StripeElementChangeEvent) => void;
  /** Callback fired when the CVC element gains focus */
  onFocus?: () => void;
  /** Callback fired when the CVC element loses focus */
  onBlur?: () => void;
  /** Additional CSS classes to apply to the container */
  className?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
  /** ARIA label for accessibility */
  ariaLabel?: string;
}

const CardCvcInput: React.FC<CardCvcInputProps> = ({
  onChange,
  onFocus,
  onBlur,
  className = '',
  disabled = false,
  placeholder = 'CVC',
  ariaLabel = 'Card security code'
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

  const cardCvcElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: 'rgb(24 24 27)', // text-primary from design system
        fontFamily: 'var(--font-poppins), Poppins, sans-serif',
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
          color: 'rgb(239 68 68)', // status-error from design system
        },
      },
    },
    placeholder,
    disabled,
  };

  // Determine container classes based on state
  const getContainerClasses = () => {
    const baseClasses = 'py-2.5 px-3 rounded-md transition-all duration-200';
    
    if (disabled) {
      return `${baseClasses} bg-surface-disabled cursor-not-allowed opacity-60`;
    }
    
    if (hasError) {
      return `${baseClasses} input-field--error`;
    }
    
    if (isFocused) {
      return `${baseClasses} bg-surface-primary ring-2 ring-border-focus border-transparent`;
    }
    
    return `${baseClasses} input-field`;
  };

  return (
    <div
      className={`${getContainerClasses()} ${className}`}
      role="group"
      aria-label={ariaLabel}
      aria-invalid={hasError}
      aria-describedby={hasError ? 'cvc-error' : undefined}
    >
      <CardCvcElement
        options={cardCvcElementOptions}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {/* Screen reader accessible error announcement */}
      {hasError && (
        <div id="cvc-error" className="sr-only" role="alert" aria-live="polite">
          Invalid security code
        </div>
      )}
    </div>
  );
};

export default CardCvcInput;

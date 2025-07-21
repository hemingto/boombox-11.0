/**
 * @fileoverview Input component with design system integration
 * @source boombox-10.0/src/app/components/reusablecomponents/textinput.tsx
 * @source boombox-10.0/src/app/components/reusablecomponents/emailinput.tsx
 * @source boombox-10.0/src/app/components/reusablecomponents/firstnameinput.tsx
 * @refactor Consolidated scattered input patterns into unified component with variants
 */

import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Input variant for different visual styles
   */
  variant?: 'default' | 'error' | 'success';

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Label for the input field
   */
  label?: string;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Helper text to display below input
   */
  helperText?: string;

  /**
   * Icon to display (typically on left side)
   */
  icon?: React.ReactNode;

  /**
   * Icon position
   */
  iconPosition?: 'left' | 'right';

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Full width input
   */
  fullWidth?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Callback when error state should be cleared
   */
  onClearError?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default', // eslint-disable-line @typescript-eslint/no-unused-vars
      size = 'md',
      label,
      error,
      helperText,
      icon,
      iconPosition = 'left',
      required = false,
      fullWidth = false,
      className,
      onFocus,
      onClearError,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasError = Boolean(error);
    const hasIcon = Boolean(icon);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (onClearError && hasError) {
        onClearError();
      }
      onFocus?.(e);
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    const inputClasses = cn(
      // Base styles using design system classes
      'input-field',

      // Size variants
      {
        'py-2 px-2.5 text-sm': size === 'sm',
        'py-2.5 px-3 text-md': size === 'md',
        'py-3 px-4 text-lg': size === 'lg',
      },

      // Icon padding
      {
        'pl-10': hasIcon && iconPosition === 'left' && size === 'md',
        'pl-9': hasIcon && iconPosition === 'left' && size === 'sm',
        'pl-12': hasIcon && iconPosition === 'left' && size === 'lg',
        'pr-10': hasIcon && iconPosition === 'right' && size === 'md',
        'pr-9': hasIcon && iconPosition === 'right' && size === 'sm',
        'pr-12': hasIcon && iconPosition === 'right' && size === 'lg',
      },

      // Error state
      {
        'input-field--error': hasError,
      },

      // Full width
      {
        'w-full': fullWidth,
      },

      className
    );

    const iconClasses = cn(
      'absolute top-1/2 transform -translate-y-1/2 pointer-events-none transition-colors',
      {
        'left-3': iconPosition === 'left',
        'right-3': iconPosition === 'right',
        'w-4 h-4': size === 'sm',
        'w-5 h-5': size === 'md',
        'w-6 h-6': size === 'lg',
        // Icon color states
        'text-red-500': hasError,
        'text-zinc-950': isFocused && !hasError,
        'text-zinc-400': !isFocused && !hasError,
      }
    );

    return (
      <div className={cn('form-group', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label className="form-label">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input container */}
        <div className="relative">
          {/* Icon */}
          {icon && <div className={iconClasses}>{icon}</div>}

          {/* Input field */}
          <input
            ref={ref}
            className={inputClasses}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={
              error
                ? `${props.id}-error`
                : helperText
                  ? `${props.id}-helper`
                  : undefined
            }
            {...props}
          />
        </div>

        {/* Error message */}
        {error && (
          <p id={`${props.id}-error`} className="form-error">
            {error}
          </p>
        )}

        {/* Helper text */}
        {helperText && !error && (
          <p id={`${props.id}-helper`} className="form-helper">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };

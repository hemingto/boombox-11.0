/**
 * @fileoverview Select component with design system integration
 * @source boombox-10.0/src/app/components/reusablecomponents/selectiondropdown.tsx
 * @source boombox-10.0/src/app/components/driver-signup/driversignupform.tsx (dropdown patterns)
 * @refactor Created unified Select component with consistent styling and accessibility
 */

import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * Select variant for different visual styles
   */
  variant?: 'default' | 'error' | 'success';

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Label for the select field
   */
  label?: string;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Helper text to display below select
   */
  helperText?: string;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Full width select
   */
  fullWidth?: boolean;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Options for the select
   */
  options?: SelectOption[];

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Callback when error state should be cleared
   */
  onClearError?: () => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      variant = 'default', // eslint-disable-line @typescript-eslint/no-unused-vars
      size = 'md',
      label,
      error,
      helperText,
      required = false,
      fullWidth = false,
      placeholder,
      options = [],
      className,
      onFocus,
      onClearError,
      children,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasError = Boolean(error);

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      if (onClearError && hasError) {
        onClearError();
      }
      onFocus?.(e);
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    const selectClasses = cn(
      // Base styles using design system classes
      'input-field',

      // Select-specific styles
      'appearance-none cursor-pointer',
      'pr-10', // Space for chevron icon

      // Size variants
      {
        'py-2 px-2.5 text-sm': size === 'sm',
        'py-2.5 px-3 text-md': size === 'md',
        'py-3 px-4 text-lg': size === 'lg',
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

    const chevronClasses = cn(
      'absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none transition-colors',
      {
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

        {/* Select container */}
        <div className="relative">
          {/* Select field */}
          <select
            ref={ref}
            className={selectClasses}
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
          >
            {/* Placeholder option */}
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {/* Options from props */}
            {options.map(option => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}

            {/* Children options (for flexibility) */}
            {children}
          </select>

          {/* Chevron icon */}
          <ChevronDownIcon className={chevronClasses} />
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

Select.displayName = 'Select';

export { Select };

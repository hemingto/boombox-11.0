"use client";

/**
 * @fileoverview TextArea component with design system integration
 * @source boombox-10.0/src/app/components/reusablecomponents/textinput.tsx (textarea patterns)
 * @refactor Created dedicated TextArea component following Input component patterns
 */

import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * TextArea variant for different visual styles
   */
  variant?: 'default' | 'error' | 'success';

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Label for the textarea field
   */
  label?: string;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Helper text to display below textarea
   */
  helperText?: string;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Full width textarea
   */
  fullWidth?: boolean;

  /**
   * Resize behavior
   */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Callback when error state should be cleared
   */
  onClearError?: () => void;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      variant = 'default', // eslint-disable-line @typescript-eslint/no-unused-vars
      size = 'md',
      label,
      error,
      helperText,
      required = false,
      fullWidth = false,
      resize = 'vertical',
      className,
      onFocus,
      onClearError,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
    const hasError = Boolean(error);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      if (onClearError && hasError) {
        onClearError();
      }
      onFocus?.(e);
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    const textareaClasses = cn(
      // Base styles using design system classes
      'input-field', 'input-reset',

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

      // Resize behavior
      {
        'resize-none': resize === 'none',
        'resize-y': resize === 'vertical',
        'resize-x': resize === 'horizontal',
        resize: resize === 'both',
      },

      className
    );

    return (
      <div className={cn('form-group', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label htmlFor={props.id} className="form-label">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* TextArea field */}
        <textarea
          ref={ref}
          className={textareaClasses}
          onFocus={handleFocus}
          onBlur={handleBlur}
          rows={rows}
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

TextArea.displayName = 'TextArea';

export { TextArea };

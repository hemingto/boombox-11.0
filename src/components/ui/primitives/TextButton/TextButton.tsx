/**
 * @fileoverview TextButton component - A minimal text-only button for secondary actions
 * @source boombox-10.0/src/app/components/reusablecomponents/sendquoteemailpopup.tsx (Cancel button pattern)
 * @refactor Extracted text button pattern into reusable design system primitive
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface TextButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant
   */
  variant?: 'primary' | 'secondary' | 'destructive';

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether to show underline
   */
  underline?: boolean;

  /**
   * Loading state - disables button and changes text color
   */
  loading?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Button content
   */
  children?: React.ReactNode;
}

const TextButton = forwardRef<HTMLButtonElement, TextButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      underline = true,
      loading = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed',
          'transition-colors duration-200',

          // Size variants
          {
            'text-xs': size === 'sm',
            'text-sm': size === 'md',
            'text-base': size === 'lg',
          },

          // Underline
          {
            'underline': underline,
          },

          // Variant styles
          {
            // Primary variant - matches Cancel button from original
            'text-text-primary underline-offset-2 decoration-dotted hover:decoration-solid hover:text-text-tertiary active:text-text-tertiary disabled:text-text-secondary':
              variant === 'primary',
            
            // Secondary variant - lighter text
            'text-text-secondary hover:text-text-primary active:text-text-primary disabled:text-text-secondary':
              variant === 'secondary',
            
            // Destructive variant - red text
            'text-status-error hover:text-red-600 active:text-red-700 disabled:text-text-secondary':
              variant === 'destructive',
          },

          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TextButton.displayName = 'TextButton';

export { TextButton };

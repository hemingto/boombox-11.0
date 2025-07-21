/**
 * @fileoverview Button component with design system variants
 * @source boombox-10.0/src/app/components/buttons/navbutton.tsx
 * @source boombox-10.0/src/app/components/landingpage/herosection.tsx (button patterns)
 * @source boombox-10.0/src/app/components/landingpage/whatfitssection.tsx (button patterns)
 * @refactor Consolidated scattered button patterns into design system variants
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant
   */
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Loading state - shows spinner and disables button
   */
  loading?: boolean;

  /**
   * Icon to display - can be on left or right
   */
  icon?: React.ReactNode;

  /**
   * Position of icon relative to text
   */
  iconPosition?: 'left' | 'right';

  /**
   * Full width button
   */
  fullWidth?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Button content
   */
  children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
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
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-inter',

          // Size variants
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-6 py-2.5 text-md': size === 'md',
            'px-8 py-3 text-lg': size === 'lg',
            'px-10 py-4 text-xl': size === 'xl',
          },

          // Variant styles - using design system classes
          {
            'btn-primary': variant === 'primary',
            'btn-secondary': variant === 'secondary',
            'btn-destructive': variant === 'destructive',
            'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-zinc-950':
              variant === 'ghost',
            'border-2 border-zinc-200 bg-transparent hover:bg-slate-50 active:bg-slate-100 text-zinc-950':
              variant === 'outline',
          },

          // Full width
          {
            'w-full': fullWidth,
          },

          // Focus ring color based on variant
          {
            'focus:ring-zinc-950':
              variant === 'primary' ||
              variant === 'ghost' ||
              variant === 'outline',
            'focus:ring-zinc-300': variant === 'secondary',
            'focus:ring-red-500': variant === 'destructive',
          },

          className
        )}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
        )}

        {/* Left icon */}
        {icon && iconPosition === 'left' && !loading && (
          <span className={cn('flex-shrink-0', children && 'mr-2')}>
            {icon}
          </span>
        )}

        {/* Button text */}
        {children}

        {/* Right icon */}
        {icon && iconPosition === 'right' && !loading && (
          <span className={cn('flex-shrink-0', children && 'ml-2')}>
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

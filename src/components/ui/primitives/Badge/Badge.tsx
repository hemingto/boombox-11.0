/**
 * @fileoverview Badge component for labels and tags with design system integration
 * @source boombox-10.0/src/app/components/reusablecomponents/chip.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Simple badge/chip component for displaying labels with truncation support.
 * Provides consistent styling for tags, categories, and status indicators.
 * 
 * USED BY (boombox-10.0 files):
 * - To be determined during component usage analysis
 * 
 * DESIGN SYSTEM UPDATES:
 * - Integrated with design token system using badge utility classes
 * - Added size variants and semantic color options
 * - Enhanced with accessibility attributes and truncation handling
 * 
 * @refactor Enhanced simple Chip into comprehensive badge system with variants
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * The text content of the badge
   */
  label: string;

  /**
   * Visual variant based on semantic meaning
   */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'pending' | 'processing';

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS classes
   */
  className?: string;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      label,
      variant = 'default',
      size = 'md',
      className,
      ...props
    },
    ref
  ) => {
    const badgeClasses = cn(
      // Base styles
      'inline-flex items-center justify-center rounded-full font-medium overflow-hidden',
      'transition-colors duration-200',
      
      // Size variants
      {
        'px-2 py-1 text-xs': size === 'sm',
        'px-4 py-2 text-sm': size === 'md',
        'px-6 py-3 text-base': size === 'lg',
      },

      // Variant styles using design system badge classes
      {
        'bg-surface-tertiary text-text-primary': variant === 'default',
        'badge-success': variant === 'success',
        'badge-warning': variant === 'warning',
        'badge-error': variant === 'error',
        'badge-info': variant === 'info',
        'badge-pending': variant === 'pending',
        'badge-processing': variant === 'processing',
      },

      className
    );

    return (
      <span
        ref={ref}
        className={badgeClasses}
        role="status"
        aria-label={`${variant !== 'default' ? variant : 'badge'}: ${label}`}
        {...props}
      >
        <span className="truncate whitespace-nowrap text-ellipsis">
          {label}
        </span>
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };

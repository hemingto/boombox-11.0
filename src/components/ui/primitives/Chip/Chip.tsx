/**
 * @fileoverview Chip component for interactive tags and removable labels
 * @source boombox-10.0/src/app/components/reusablecomponents/chip.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Interactive chip/tag component for displaying removable labels, filters, and selections.
 * Supports optional close functionality and click interactions.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Integrated with design token system using surface and text colors
 * - Added interactive states and variants for different use cases
 * - Enhanced with accessibility attributes and keyboard navigation support
 * 
 * @refactor Enhanced simple Chip into interactive tag system with removal capability
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The text content of the chip
   */
  label: string;

  /**
   * Visual variant of the chip
   */
  variant?: 'default' | 'primary' | 'secondary' | 'outline';

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether the chip can be removed/closed
   */
  removable?: boolean;

  /**
   * Callback when chip is removed (only applies if removable is true)
   */
  onRemove?: () => void;

  /**
   * Whether the chip is disabled
   */
  disabled?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      label,
      variant = 'default',
      size = 'md',
      removable = false,
      onRemove,
      disabled = false,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const chipClasses = cn(
      // Base styles
      'inline-flex items-center justify-center rounded-full font-medium overflow-hidden',
      'transition-colors focus-visible',
      
      // Size variants
      {
        'px-2 py-1 text-xs gap-1': size === 'sm',
        'px-4 py-2 text-sm gap-2': size === 'md',
        'px-6 py-3 text-base gap-2': size === 'lg',
      },

      // Variant styles using design system colors
      {
        // Default - neutral gray
        'bg-surface-tertiary text-text-primary border-border hover:bg-surface-disabled': 
          variant === 'default' && !disabled,
        
        // Primary - brand colors
        'bg-primary text-text-inverse border-primary hover:bg-primary-hover': 
          variant === 'primary' && !disabled,
        
        // Secondary - lighter brand variant
        'bg-surface-secondary text-text-primary border-border hover:bg-surface-tertiary': 
          variant === 'secondary' && !disabled,
        
        // Outline - border only
        'bg-transparent text-text-primary border-border hover:bg-surface-secondary': 
          variant === 'outline' && !disabled,
      },

      // Interactive states
      {
        'cursor-pointer': (onClick || removable) && !disabled,
        'cursor-default': !onClick && !removable && !disabled,
        'cursor-not-allowed opacity-50': disabled,
      },

      // Disabled styles
      {
        'bg-surface-disabled text-text-secondary border-surface-disabled': disabled,
      },

      className
    );

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!disabled && onRemove) {
        onRemove();
      }
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!disabled && onClick) {
        onClick(e);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (onClick) {
          onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (removable && onRemove) {
          onRemove();
        }
      }
    };

    return (
      <div
        ref={ref}
        className={chipClasses}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={removable ? `${label}, removable` : label}
        aria-disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <span className="truncate whitespace-nowrap text-ellipsis">
          {label}
        </span>
        
        {removable && (
          <button
            type="button"
            className={cn(
              'ml-1 flex-shrink-0 rounded-full p-0.5 transition-colors duration-200',
              'hover:bg-black/10 focus:outline-none focus:bg-black/10',
              {
                'text-text-inverse hover:bg-white/20 focus:bg-white/20': variant === 'primary',
                'text-text-secondary hover:bg-black/5 focus:bg-black/5': variant !== 'primary',
              }
            )}
            onClick={handleRemove}
            disabled={disabled}
            aria-label={`Remove ${label}`}
            tabIndex={-1} // Parent handles keyboard navigation
          >
            <svg
              className={cn({
                'w-3 h-3': size === 'sm',
                'w-4 h-4': size === 'md',
                'w-5 h-5': size === 'lg',
              })}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Chip.displayName = 'Chip';

export { Chip };

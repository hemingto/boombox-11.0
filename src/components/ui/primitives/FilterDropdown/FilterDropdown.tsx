/**
 * @fileoverview FilterDropdown primitive component for filtering content
 * @source boombox-11.0/src/components/features/service-providers/best-practices/BestPracticesVideoGallery.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * A lightweight, accessible dropdown component specifically designed for filtering content.
 * Features include:
 * - Customizable filter options with labels and values
 * - Click-outside detection to close dropdown
 * - Keyboard navigation support
 * - Design system integration with semantic tokens
 * - Proper ARIA attributes for accessibility
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic color tokens (surface-*, text-*, border)
 * - Consistent hover, active states using design system tokens
 * - Shadow using shadow-custom-shadow
 * 
 * @refactor Extracted from BestPracticesVideoGallery to create reusable primitive component
 */

'use client';

import { useState, useRef, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { useClickOutside } from '@/hooks/useClickOutside';

export interface FilterOption {
  /**
   * Unique value for the filter option
   */
  value: string;
  
  /**
   * Display label for the option
   */
  label: string;
}

export interface FilterDropdownProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * Array of filter options
   */
  options: FilterOption[];

  /**
   * Currently selected filter value
   */
  value: string;

  /**
   * Callback when filter selection changes
   */
  onChange: (value: string) => void;

  /**
   * Placeholder text when no filter is selected
   */
  placeholder?: string;

  /**
   * Whether the dropdown is disabled
   */
  disabled?: boolean;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Custom ARIA label for the dropdown button
   */
  ariaLabel?: string;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Additional CSS classes for the button
   */
  buttonClassName?: string;

  /**
   * Additional CSS classes for the dropdown menu
   */
  menuClassName?: string;
}

export const FilterDropdown = forwardRef<HTMLDivElement, FilterDropdownProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Filter by',
      disabled = false,
      size = 'md',
      ariaLabel = 'Filter options',
      className,
      buttonClassName,
      menuClassName,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useClickOutside(containerRef, () => {
      if (isOpen) setIsOpen(false);
    });

    const handleSelect = (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
    };

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(!isOpen);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const selectedOption = options.find((option) => option.value === value);
    const displayLabel = selectedOption?.label || placeholder;

    const buttonSizeClasses = {
      sm: 'px-2.5 py-1.5 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-2.5 text-base',
    };

    return (
      <div
        ref={containerRef}
        className={cn('relative', className)}
        {...props}
      >
        <button
          type="button"
          className={cn(
            'relative w-fit rounded-full cursor-pointer',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
            buttonSizeClasses[size],
            isOpen
              ? 'ring-2 ring-border bg-surface-primary'
              : 'ring-1 ring-border bg-surface-tertiary',
            disabled && 'opacity-50 cursor-not-allowed hover:bg-surface-tertiary',
            buttonClassName
          )}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={ariaLabel}
          aria-disabled={disabled}
        >
          <div className="flex justify-between items-center gap-1">
            <span className={cn('text-text-primary', disabled && 'text-text-secondary')}>
              {displayLabel}
            </span>
            <svg
              className={cn(
                'shrink-0 text-text-primary',
                disabled && 'text-text-secondary',
                {
                  'w-2 h-2': size === 'sm',
                  'w-3 h-3': size === 'md',
                  'w-4 h-4': size === 'lg',
                }
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {isOpen && !disabled && (
          <div
            role="listbox"
            aria-label={ariaLabel}
            className={cn(
              'absolute w-fit min-w-36 left-0 z-10 mt-2',
              'rounded-md bg-surface-primary shadow-custom-shadow',
              menuClassName
            )}
          >
            {options.map((option, index) => {
              const isSelected = value === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'w-full flex justify-between items-center p-3',
                    'cursor-pointer hover:bg-surface-tertiary active:bg-surface-secondary',
                    'text-left',
                    'focus:outline-none focus-visible:bg-surface-tertiary',
                    index === 0 && 'rounded-t-md',
                    index === options.length - 1 && 'rounded-b-md',
                    isSelected && 'bg-surface-secondary'
                  )}
                  onClick={() => handleSelect(option.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(option.value);
                    }
                  }}
                >
                  <span className="text-sm text-text-primary">
                    {option.label}
                  </span>
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-primary ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

FilterDropdown.displayName = 'FilterDropdown';


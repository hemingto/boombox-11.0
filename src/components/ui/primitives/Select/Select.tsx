"use client";

/**
 * @fileoverview Select component with design system integration
 * @source boombox-10.0/src/app/components/reusablecomponents/selectiondropdown.tsx
 * @source boombox-10.0/src/app/components/driver-signup/driversignupform.tsx (dropdown patterns)
 * @refactor Created unified Select component with consistent styling and accessibility
 */

import { forwardRef, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useClickOutside } from '@/hooks/useClickOutside';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  // Rich content support
  description?: string;
  price?: string;
  icon?: React.ElementType;
  metadata?: Record<string, any>; // For extensibility
}

export interface SelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'size' | 'onChange'> {
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

  /**
   * Current selected value
   */
  value?: string;

  /**
   * Callback when selection changes
   */
  onChange?: (value: string) => void;

  /**
   * Whether the select is disabled
   */
  disabled?: boolean;

  /**
   * Input name attribute
   */
  name?: string;

  /**
   * Input id attribute
   */
  id?: string;

  /**
   * Use compact label styling
   */
  compactLabel?: boolean;

  /**
   * Display mode for different option layouts
   */
  displayMode?: 'simple' | 'rich' | 'compact';

  /**
   * Custom option renderer for maximum flexibility
   */
  renderOption?: (option: SelectOption) => React.ReactNode;

  /**
   * Custom trigger renderer for selected value display
   */
  renderSelected?: (option: SelectOption) => React.ReactNode;
}

const Select = forwardRef<HTMLDivElement, SelectProps>(
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
      onClearError,
      value,
      onChange,
      disabled = false,
      name,
      id,
      compactLabel = false,
      displayMode = 'simple',
      renderOption,
      renderSelected,
      ...props
    },
    ref
  ) => {
    const [selectedValue, setSelectedValue] = useState<string>(value || '');
    const [isOpen, setIsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const hasError = Boolean(error);

    // Update internal state when value prop changes
    useEffect(() => {
      setSelectedValue(value || '');
    }, [value]);

    // Handle click outside to close dropdown
    useClickOutside(dropdownRef, () => setIsOpen(false));

    const handleOptionSelect = (optionValue: string) => {
      setSelectedValue(optionValue);
      setIsOpen(false);
      onChange?.(optionValue);
    };

    const handleDropdownToggle = () => {
      if (disabled) return;
      setIsOpen(!isOpen);
      if (onClearError && hasError) {
        onClearError();
      }
    };

    // Get the selected option for display
    const selectedOption = options.find(option => option.value === selectedValue);
    
    // Render functions for different display modes
    const renderSelectedContent = (option: SelectOption | undefined) => {
      // Custom render function takes precedence
      if (renderSelected && option) {
        return renderSelected(option);
      }
      
      // Display mode-based rendering
      if (displayMode === 'rich' && option) {
        return (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              {option.icon && (
                <option.icon className={cn(
                  'flex-shrink-0',
                  {
                    'w-6 h-6': size === 'sm',
                    'w-7 h-7': size === 'md', 
                    'w-8 h-8': size === 'lg',
                  }
                )} />
              )}
              <span className="text-left">{option.label}</span>
            </div>
            {option.price && (
              <span className="font-medium text-sm text-text-primary ml-2">
                {option.price}
              </span>
            )}
          </div>
        );
      }
      
      if (displayMode === 'compact' && option) {
        return (
          <div className="flex items-center space-x-2">
            {option.icon && (
              <option.icon className={cn(
                'flex-shrink-0',
                {
                  'w-6 h-6': size === 'sm',
                  'w-7 h-7': size === 'md',
                  'w-8 h-8': size === 'lg',
                }
              )} />
            )}
            <span>{option.label}</span>
          </div>
        );
      }
      
      // Simple mode (default) - just return label
      return option?.label || placeholder || 'Select an option';
    };

    const renderOptionContent = (option: SelectOption) => {
      // Custom render function takes precedence
      if (renderOption) {
        return renderOption(option);
      }
      
      // Display mode-based rendering
      if (displayMode === 'rich') {
        return (
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center space-x-3">
              {option.icon && (
                <option.icon className="w-6 h-6 text-text-primary flex-shrink-0" />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-text-primary">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-text-tertiary">{option.description}</span>
                )}
              </div>
            </div>
            {option.price && (
              <span className="font-medium text-sm text-text-primary ml-2">
                {option.price}
              </span>
            )}
          </div>
        );
      }
      
      if (displayMode === 'compact') {
        return (
          <div className="flex items-center space-x-3">
            {option.icon && (
              <option.icon className="w-5 h-5 text-text-primary flex-shrink-0" />
            )}
            <span className="text-sm text-text-primary">{option.label}</span>
          </div>
        );
      }
      
      // Simple mode (default)
      return <span className="text-sm text-text-primary">{option.label}</span>;
    };

    const selectClasses = cn(
      // Base styling matching input-field pattern
      'relative rounded-md cursor-pointer',
      'flex justify-between items-center',
      // Remove browser default focus outline
      'outline-none',

      // Size variants
      {
        'p-3 text-sm font-medium': size === 'sm',
        'py-2.5 px-3 text-base': size === 'md',
        'py-3 px-4 text-lg': size === 'lg',
      },

      // State-based styling matching input-field
      {
        // Error state
        'border-border-error ring-2 ring-border-error bg-red-50 text-status-error': hasError && !disabled,
        // Focused or open state - matching input focus state
        'border-transparent ring-2 ring-border-focus bg-surface-primary': (isFocused || isOpen) && !hasError && !disabled,
        // Default state - matching input default state
        'border-border bg-surface-tertiary': !isFocused && !isOpen && !hasError && !disabled,
        // Disabled state - matching input-field disabled styling
        'bg-surface-disabled cursor-not-allowed border-border text-text-secondary': disabled,
      },

      // Full width
      {
        'w-full': fullWidth,
      },

      className
    );

    const chevronClasses = cn(
      {
        'w-5 h-5': size === 'sm',
        'w-6 h-6': size === 'md',
        'w-7 h-7': size === 'lg',
        // Icon color states matching text states
        'text-status-error': hasError && !disabled,
        'text-text-secondary': disabled || (!hasError && !disabled && !selectedValue), // disabled or placeholder state
        'text-text-primary': !hasError && !disabled && selectedValue, // selected state
      }
    );

    const dropdownClasses = cn(
      'absolute z-50 w-full mt-2 rounded-md bg-white shadow-custom-shadow max-h-60 overflow-auto'
    );

    return (
      <div className={cn('form-group', fullWidth && 'w-full')} ref={ref} {...props}>
        {/* Label */}
        {label && (
          <label className={compactLabel ? 'form-label-compact' : 'form-label'}>
            {label}
          </label>
        )}

        {/* Custom Select container */}
        <div className="relative" ref={dropdownRef}>
          {/* Hidden select for form submission and accessibility */}
          <select
            value={selectedValue}
            onChange={() => {}} // Controlled by custom dropdown
            name={name}
            disabled={disabled}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={
              error
                ? `${name}-error`
                : helperText
                  ? `${name}-helper`
                  : undefined
            }
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom dropdown trigger */}
          <div
            className={selectClasses}
            onClick={handleDropdownToggle}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-invalid={hasError ? 'true' : 'false'}
            tabIndex={disabled ? -1 : 0}
            id={id}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDropdownToggle();
              } else if (e.key === 'Escape') {
                setIsOpen(false);
              }
            }}
          >
            <div
              className={cn(
                'flex-1 min-w-0 font-medium', // Allow content to shrink and handle overflow
                {
                  'text-status-error': hasError && !disabled,
                  'text-text-secondary': disabled || (!hasError && !selectedValue && !isOpen && !isFocused), // disabled or unfocused placeholder
                  'text-text-primary': !hasError && !disabled && (selectedValue || isOpen || isFocused), // selected state OR focused (including placeholder)
                }
              )}
            >
              {renderSelectedContent(selectedOption)}
            </div>
            <ChevronDownIcon className={cn(chevronClasses, 'flex-shrink-0 ml-2')} />
          </div>

          {/* Custom dropdown menu */}
          {isOpen && (
            <div className={dropdownClasses} role="listbox">
              {options.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    'cursor-pointer hover:bg-slate-100',
                    {
                      // Dynamic padding based on display mode
                      'px-4 py-2': displayMode === 'simple',
                      'px-4 py-3': displayMode === 'rich',
                      'px-4 py-2.5': displayMode === 'compact',
                      // Selection state
                      'bg-slate-200': selectedValue === option.value,
                      'bg-white': selectedValue !== option.value,
                      // Disabled state
                      'opacity-50 cursor-not-allowed': option.disabled,
                    }
                  )}
                  onClick={() => {
                    if (!option.disabled) {
                      handleOptionSelect(option.value);
                    }
                  }}
                  role="option"
                  aria-selected={selectedValue === option.value}
                  tabIndex={option.disabled ? -1 : 0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (!option.disabled) {
                        handleOptionSelect(option.value);
                      }
                    }
                  }}
                >
                  {renderOptionContent(option)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p id={`${name}-error`} className="form-error">
            {error}
          </p>
        )}

        {/* Helper text */}
        {helperText && !error && (
          <p id={`${name}-helper`} className="form-helper">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };

/**
 * @fileoverview CheckboxCard component for selectable card options with visual states
 * @source boombox-10.0/src/app/components/reusablecomponents/checkboxcard.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * A selectable card component that displays a title, description, plan details, and
 * checkbox-style visual indicator. Supports error states, checked states, and interactive
 * selection with clear visual feedback. Commonly used for plan selection, option choice,
 * and multi-step form interfaces where users need to select from multiple options.
 * 
 * API ROUTES UPDATED:
 * - No API routes in this component (purely UI)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced custom colors with design system tokens (primary, surface, status, text, border)
 * - Used semantic color system for hover, focus, and error states
 * - Applied design system border and shadow utilities
 * - Integrated proper focus management and accessibility patterns
 * - Used design system spacing and typography scales
 * 
 * @refactor Enhanced accessibility with proper ARIA labels, keyboard navigation support,
 * role attributes, and semantic HTML structure. Improved error handling, focus management,
 * and visual feedback consistency with design system standards.
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CheckboxCardProps {
  /**
   * Unique identifier for the checkbox card
   */
  id: string;

  /**
   * Primary title text displayed at the top
   */
  title: string;

  /**
   * Subtitle or description for the title
   */
  titleDescription: string;

  /**
   * Additional description text
   */
  description: string;

  /**
   * Plan or option name/pricing
   */
  plan: string;

  /**
   * Whether the card is currently selected/checked
   */
  checked: boolean;

  /**
   * Callback function when the selection state changes
   */
  onChange: () => void;

  /**
   * Whether the card is in an error state
   */
  hasError?: boolean;

  /**
   * Callback to clear the error state
   */
  onClearError?: () => void;

  /**
   * Whether the card is disabled
   */
  disabled?: boolean;

  /**
   * Additional CSS classes for customization
   */
  className?: string;

  /**
   * ARIA label for accessibility (auto-generated if not provided)
   */
  ariaLabel?: string;

  /**
   * Test ID for testing purposes
   */
  testId?: string;
}

export const CheckboxCard: React.FC<CheckboxCardProps> = ({
  id,
  title,
  titleDescription,
  description,
  plan,
  checked,
  onChange,
  hasError = false,
  onClearError,
  disabled = false,
  className,
  ariaLabel,
  testId,
}) => {
  // Auto-generate accessible label if not provided
  const accessibleLabel = ariaLabel || `${title}: ${plan} - ${titleDescription}. ${description}. ${checked ? 'Selected' : 'Not selected'}.`;

  const handleClick = () => {
    if (disabled) return;
    
    onChange();
    if (hasError && onClearError) {
      onClearError();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    // Handle Space and Enter key activation
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="radio"
      aria-checked={checked}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description ${id}-plan`}
      aria-label={accessibleLabel}
      aria-invalid={hasError}
      tabIndex={disabled ? -1 : 0}
      data-testid={testId}
      className={cn(
        // Base styles
        'mb-4 rounded-md flex flex-col justify-between cursor-pointer transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        
        // State-based styling with design system colors
        {
          // Error state (highest priority)
          'ring-status-error bg-status-bg-error ring-2': hasError,
          
          // Checked state (when no error)
          'ring-primary ring-2 bg-surface-primary shadow-md': checked && !hasError,
          
          // Default state
          'ring-border ring-2 bg-surface-tertiary hover:bg-surface-secondary hover:ring-primary': !checked && !hasError,
          
          // Disabled state
          'opacity-50 cursor-not-allowed': disabled,
        },
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Header Section */}
      <div
        className={cn(
          'flex flex-col items-center border-b-2 transition-colors duration-200',
          {
            // Error border
            'border-status-error': hasError,
            
            // Checked border (when no error)
            'border-primary': checked && !hasError,
            
            // Default border
            'border-surface-primary': !checked && !hasError,
          }
        )}
      >
        <div className="pb-4 w-full">
          <p 
            id={`${id}-title`}
            className={cn(
              'px-4 pt-4 font-semibold text-text-primary',
              {
                'text-status-error': hasError,
              }
            )}
          >
            {title}
          </p>
          <p 
            className={cn(
              'px-4 pt-2 text-sm text-text-secondary',
              {
                'text-status-error': hasError,
              }
            )}
          >
            {titleDescription}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex justify-between items-center">
        <div className="flex-1 mr-4">
          <p 
            id={`${id}-plan`}
            className={cn(
              'text-sm font-medium text-text-primary',
              {
                'text-status-error': hasError,
              }
            )}
          >
            {plan}
          </p>
          <p 
            id={`${id}-description`}
            className={cn(
              'text-xs text-text-secondary mt-1',
              {
                'text-status-error': hasError,
              }
            )}
          >
            {description}
          </p>
        </div>

        {/* Custom Checkbox Indicator */}
        <div 
          className="relative w-5 h-5 flex-shrink-0"
          aria-hidden="true"
        >
          <div 
            className={cn(
              'w-5 h-5 rounded-full border-2 transition-all duration-200',
              {
                // Error state
                'border-status-error': hasError,
                
                // Checked state
                'border-primary bg-primary': checked && !hasError,
                
                // Default state
                'border-border': !checked && !hasError,
              }
            )} 
          />
          {checked && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-surface-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Screen reader only status announcement */}
      <span className="sr-only">
        {hasError && 'Error: '}
        {checked ? 'Selected' : 'Not selected'}
        {disabled && ' (disabled)'}
      </span>
    </div>
  );
};

export default CheckboxCard;

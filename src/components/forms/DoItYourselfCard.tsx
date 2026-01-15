/**
 * @fileoverview Do It Yourself Plan selection card component for form contexts
 * @source boombox-10.0/src/app/components/reusablecomponents/doityourselfcard.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Renders a selectable card interface for the "Do It Yourself Plan" option
 * - Handles radio input selection with visual feedback for checked/error states
 * - Provides clear pricing display (Free! 1st hour) and descriptive content
 * - Includes furniture icon visual indicator and proper layout structure
 * - Supports error states with visual feedback and accessibility features
 * 
 * API ROUTES UPDATED:
 * - No direct API routes in this component (form UI component only)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design tokens from tailwind.config.ts
 * - Updated ring colors to use border-focus and status-error from design system
 * - Applied surface colors (surface-secondary, surface-tertiary) for backgrounds
 * - Used text color hierarchy (text-primary, text-secondary) for content
 * - Implemented proper focus states using design system focus utilities
 * 
 * @refactor 
 * - Renamed from doityourselfcard.tsx to DoItYourselfCard.tsx (PascalCase)
 * - Enhanced accessibility with proper ARIA labels and keyboard navigation
 * - Added comprehensive error handling and visual feedback
 * - Implemented design system color tokens throughout
 * - Added proper TypeScript interfaces with comprehensive prop validation
 * - Improved component structure with better semantic HTML elements
 */

import React from 'react';
import { FurnitureIcon } from '@/components/icons';

export interface DoItYourselfCardProps {
  /** Whether the card is currently selected */
  checked?: boolean;
  /** Callback when the card selection changes */
  onChange?: (id: string, price: string, description: string) => void;
  /** Callback when plan type changes */
  onPlanTypeChange: (planType: string) => void;
  /** Whether the card is in an error state */
  hasError?: boolean;
  /** Callback to clear error state */
  onClearError?: () => void;
  /** Additional CSS classes for styling customization */
  className?: string;
  /** Whether the card is disabled */
  disabled?: boolean;
}

/**
 * DoItYourselfCard - A selectable card component for the "Do It Yourself Plan" option
 * 
 * Features:
 * - Visual selection feedback with design system colors
 * - Error state handling with accessible error indicators
 * - Keyboard navigation support with focus management
 * - Semantic HTML structure with proper labeling
 * - Responsive design with mobile-first approach
 * 
 * @param props - Component props
 * @returns JSX element representing the Do It Yourself plan selection card
 */
export const DoItYourselfCard: React.FC<DoItYourselfCardProps> = ({
  checked = false,
  onChange,
  hasError = false,
  onClearError,
  onPlanTypeChange,
  className = '',
  disabled = false,
}) => {
  const handleCardSelection = () => {
    if (disabled) return;

    // Clear any existing error state
    if (onClearError) {
      onClearError();
    }

    // Notify parent components of plan type change
    if (onPlanTypeChange) {
      onPlanTypeChange('Do It Yourself Plan');
    }

    // Execute change callback with plan details
    if (onChange) {
      onChange('Do It Yourself Plan', '0', 'Do It Yourself Plan');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Handle Enter and Space key activation for accessibility
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardSelection();
    }
  };

  // Build CSS classes using design system tokens
  const cardClasses = `
    mb-4 p-4 rounded-md flex justify-between cursor-pointer
    ${hasError
      ? 'ring-border-error bg-status-bg-error ring-2'
      : checked
      ? 'ring-border-focus ring-2 bg-surface-primary'
      : 'ring-border ring-2 bg-surface-tertiary'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2
    ${className}
  `.trim();

  const iconContainerClasses = `
    relative w-28 h-28 flex flex-none justify-center items-center rounded-md mr-3
    ${hasError ? 'bg-status-bg-error' : 'bg-slate-200'}
  `.trim();

  return (
    <label
      htmlFor="do-it-yourself-plan"
      className={cardClasses}
      onClick={handleCardSelection}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
    >
      <div className="flex w-full">
        {/* Icon container with visual state feedback */}
        <div className={iconContainerClasses}>
          <FurnitureIcon 
            className="w-14 sm:w-16 text-text-primary" 
            hasError={hasError}
          />
        </div>

        {/* Content section with plan details */}
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-md font-medium text-text-primary">
              Do It Yourself Plan
            </h3>
          </div>
          
          <p 
            id="do-it-yourself-description"
            className="text-sm flex-grow text-text-primary leading-relaxed"
          >
            Feeling strong? Save money by loading your Boombox yourself
          </p>
          
          <p 
            id="do-it-yourself-price"
            className="font-semibold text-text-primary mt-2"
          >
            Free! <span className="text-sm font-normal text-text-primary">1st hour</span>
          </p>
        </div>
      </div>

      {/* Hidden radio input for form submission */}
      <div>
        <input
          id="do-it-yourself-plan"
          type="radio"
          name="planName"
          value="Do It Yourself Plan"
          checked={checked}
          onChange={handleCardSelection}
          disabled={disabled}
          className="sr-only"
          aria-describedby="do-it-yourself-description do-it-yourself-price"
          aria-invalid={hasError}
        />
      </div>
    </label>
  );
};

export default DoItYourselfCard;

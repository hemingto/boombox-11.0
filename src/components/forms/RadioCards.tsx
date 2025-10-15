/**
 * @fileoverview RadioCards component for form selection with radio button functionality
 * @source boombox-10.0/src/app/components/reusablecomponents/radiocards.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Renders a radio card selection component with icon, title, plan, and description.
 * Supports error states, accessibility features, and keyboard navigation.
 * Used for storage plan selection and other form choice scenarios.
 * 
 * API ROUTES UPDATED:
 * - No API routes used in this component
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with design system tokens (zinc-950 → primary, red-500 → status-error)
 * - Updated ring colors to use semantic border tokens
 * - Applied consistent hover and focus states using design system colors
 * - Used surface colors for background states
 * 
 * @refactor Enhanced accessibility with proper ARIA labels, keyboard navigation support,
 * and semantic HTML structure. Applied design system colors throughout.
 */

import React from 'react';

interface RadioCardsProps {
  id: string;
  title: string;
  description: string;
  plan: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (id: string, plan: string, description: string) => void;
  hasError?: boolean;
  onClearError?: () => void;
}

export const RadioCards: React.FC<RadioCardsProps> = ({
  id,
  title,
  description,
  plan,
  icon,
  checked,
  onChange,
  hasError,
  onClearError,
}) => {
  const handleChange = () => {
    onChange(id, plan, description);
    if (onClearError) {
      onClearError();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Handle Enter and Space key presses for accessibility
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleChange();
    }
  };

  return (
    <label
      htmlFor={id}
      className={`mb-2 rounded-md flex flex-col justify-between cursor-pointer transition-all duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-border-focus focus-within:ring-offset-2
        ${hasError 
          ? 'ring-border-error bg-status-bg-error ring-2'
          : checked 
            ? 'ring-primary ring-2 bg-surface-primary'
            : 'ring-border ring-2 bg-surface-tertiary hover:bg-surface-secondary' 
        }`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className={`flex flex-col items-center border-b-2 transition-colors duration-200
        ${hasError 
          ? 'border-border-error' 
          : checked 
            ? 'border-primary' 
            : 'border-surface-primary' 
        }`}
      >
        <div className="p-4 h-16 sm:h-20 flex items-center justify-center" aria-hidden="true">
          {icon}
        </div>
        <div className="pb-4 w-full text-center">
          <p className={`px-4 pt-4 text-sm font-medium transition-colors duration-200 ${
            hasError ? 'text-status-error' : 'text-text-primary'
          }`}>
            {title}
          </p>
        </div>
      </div>
      
      <div className="p-4 flex justify-between items-center">
        <div className="flex-1">
          <p className={`text-sm font-semibold transition-colors duration-200 ${
            hasError ? 'text-status-error' : 'text-text-primary'
          }`}>
            {plan}
          </p>
          <p 
            id={`${id}-description`}
            className={`text-xs transition-colors duration-200 ${
              hasError ? 'text-status-text-error' : 'text-text-secondary'
            }`}
          >
            {description}
          </p>
        </div>
        
        <input
          id={id}
          type="radio"
          name="storageOption"
          checked={checked}
          onChange={handleChange}
          className={`w-5 h-5 transition-colors duration-200 focus:ring-2 focus:ring-border-focus focus:ring-offset-2 ${
            hasError 
              ? 'accent-status-error' 
              : 'accent-primary'
          }`}
          aria-describedby={`${id}-description`}
        />
      </div>
    </label>
  );
};

export default RadioCards;

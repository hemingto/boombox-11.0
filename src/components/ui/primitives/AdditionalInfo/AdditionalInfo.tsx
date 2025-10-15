/**
 * @fileoverview AdditionalInfo component for displaying supplemental information in a styled container
 * @source boombox-10.0/src/app/components/reusablecomponents/additionalinfo.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * A simple informational text display component that shows additional context or helper text
 * in a visually distinct container with proper spacing and design system compliance.
 * 
 * API ROUTES UPDATED:
 * - N/A (No API routes used in this component)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced custom colors with design system tokens (surface-primary, border, text-tertiary)
 * - Updated border styling to use semantic border colors
 * - Applied consistent spacing using design system spacing scale
 * - Added responsive design patterns using sm: breakpoints
 * 
 * @refactor Migrated to primitives with enhanced accessibility, design system compliance, and TypeScript safety
 */

import React from 'react';

export interface AdditionalInfoProps {
  /** The informational text content to display */
  text: string;
  /** Additional CSS classes for styling customization */
  className?: string;
  /** Unique identifier for the component */
  id?: string;
  /** ARIA label for screen readers (optional, defaults to text content) */
  'aria-label'?: string;
}

/**
 * AdditionalInfo component for displaying supplemental information
 * 
 * @example
 * ```tsx
 * <AdditionalInfo text="This is additional context about the form above." />
 * ```
 * 
 * @example
 * ```tsx
 * <AdditionalInfo 
 *   text="Important: Please review before submitting."
 *   className="mt-2"
 *   aria-label="Important submission notice"
 * />
 * ```
 */
export function AdditionalInfo({ 
  text, 
  className = '', 
  id,
  'aria-label': ariaLabel 
}: AdditionalInfoProps) {
  return (
    <div 
      id={id}
      className={`
        mt-4 p-3 sm:mb-4 mb-2 
        bg-surface-primary 
        border border-border 
        rounded-md 
        max-w-fit
        ${className}
      `.trim()}
      role="note"
      aria-label={ariaLabel || text}
      aria-live="polite"
    >
      <p className="text-xs text-text-tertiary">
        {text}
      </p>
    </div>
  );
}

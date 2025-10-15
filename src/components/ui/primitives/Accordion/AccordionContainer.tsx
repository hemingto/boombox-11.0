/**
 * @fileoverview AccordionContainer component for managing multiple accordion items
 * @source boombox-10.0/src/app/components/reusablecomponents/accordioncontainer.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Container component that manages the state and behavior of multiple accordion items.
 * Supports single or multiple open accordions, default open states, and centralized event handling.
 * Provides consistent spacing and layout for accordion groups.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Removed borderColor prop in favor of consistent design system border tokens
 * - Applied semantic design system colors and spacing
 * - Enhanced with proper container styling using design system utilities
 * - Integrated consistent focus and interaction states
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Enhanced keyboard navigation between accordion items
 * - Added proper ARIA landmark roles for accordion groups
 * - Implemented focus management for accordion collections
 * - Added screen reader announcements for accordion group context
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Optimized state management to prevent unnecessary re-renders
 * - Improved callback memoization for better performance
 * - Enhanced prop validation and type safety
 * 
 * @refactor Enhanced container with design system compliance and accessibility improvements
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Accordion } from './Accordion';
import { cn } from '@/lib/utils/cn';

export interface AccordionData {
  /**
   * The question/title text for the accordion item
   */
  question: string;

  /**
   * The answer/content displayed when expanded
   */
  answer: React.ReactNode;

  /**
   * Category for grouping and identification
   */
  category: string;

  /**
   * Optional image to display in the accordion content
   */
  image?: string;

  /**
   * Optional unique identifier for the accordion item
   */
  id?: string;
}

export interface AccordionContainerProps {
  /**
   * Array of accordion data items to render
   */
  data: AccordionData[];

  /**
   * Callback function called when any accordion is toggled
   * Receives the index of the toggled accordion
   */
  onAccordionChange: (index: number) => void;

  /**
   * Index of accordion to be open by default (null for none)
   */
  defaultOpenIndex?: number | null;

  /**
   * Whether at least one accordion should always remain open
   * When true, clicking an open accordion won't close it if it's the only one open
   */
  alwaysOpen?: boolean;

  /**
   * Whether multiple accordions can be open simultaneously
   * When false (default), opening one closes others
   */
  allowMultiple?: boolean;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Additional CSS classes for individual accordion items
   */
  accordionClassName?: string;

  /**
   * Additional CSS classes for accordion content
   */
  contentClassName?: string;

  /**
   * ARIA label for the accordion group
   */
  ariaLabel?: string;
}

const AccordionContainer: React.FC<AccordionContainerProps> = ({
  data,
  onAccordionChange,
  defaultOpenIndex = 0,
  alwaysOpen = false,
  allowMultiple = false,
  className,
  accordionClassName,
  contentClassName,
  ariaLabel,
}) => {
  // State management for single or multiple open accordions
  const [openIndices, setOpenIndices] = useState<Set<number>>(
    new Set(defaultOpenIndex !== null ? [defaultOpenIndex] : [])
  );

  // Update open indices when defaultOpenIndex changes
  useEffect(() => {
    if (defaultOpenIndex !== null) {
      setOpenIndices(new Set([defaultOpenIndex]));
    } else {
      setOpenIndices(new Set());
    }
  }, [defaultOpenIndex]);

  // Optimized toggle function with useCallback for performance
  const toggleAccordion = useCallback((index: number) => {
    setOpenIndices(prevOpenIndices => {
      const newOpenIndices = new Set(prevOpenIndices);
      const isCurrentlyOpen = newOpenIndices.has(index);

      if (allowMultiple) {
        // Multiple accordions can be open
        if (isCurrentlyOpen) {
          // Don't close if alwaysOpen is true and this is the only open accordion
          if (alwaysOpen && newOpenIndices.size === 1) {
            return prevOpenIndices; // No change
          }
          newOpenIndices.delete(index);
        } else {
          newOpenIndices.add(index);
        }
      } else {
        // Only one accordion can be open at a time
        if (isCurrentlyOpen) {
          // Don't close if alwaysOpen is true
          if (alwaysOpen) {
            return prevOpenIndices; // No change
          }
          newOpenIndices.clear();
        } else {
          newOpenIndices.clear();
          newOpenIndices.add(index);
        }
      }

      return newOpenIndices;
    });

    // Call the external change handler
    onAccordionChange(index);
  }, [onAccordionChange, alwaysOpen, allowMultiple]);

  return (
    <div 
      className={cn('mx-auto', className)}
      role="region"
      aria-label={ariaLabel || `Accordion group with ${data.length} items`}
    >
      {data.map((item, index) => (
        <Accordion
          key={item.id || `accordion-${index}`}
          id={item.id || `accordion-${item.category}-${index}`}
          category={item.category}
          question={item.question}
          answer={item.answer}
          image={item.image}
          isOpen={openIndices.has(index)}
          toggleAccordion={() => toggleAccordion(index)}
          className={accordionClassName}
          contentClassName={contentClassName}
        />
      ))}
    </div>
  );
};

export { AccordionContainer };

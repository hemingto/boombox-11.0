"use client";

/**
 * @fileoverview Accordion component with design system compliance and accessibility features
 * @source boombox-10.0/src/app/components/reusablecomponents/accordion.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Individual accordion item component that displays collapsible content with smooth animations.
 * Supports custom content, images, and categories with proper accessibility and keyboard navigation.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors (border-slate-100, text-zinc-950) with semantic design tokens
 * - Applied design system border, text, and surface colors from tailwind.config.ts
 * - Integrated focus-visible utility class for consistent focus states
 * - Used design system animation tokens for smooth transitions
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added comprehensive ARIA attributes (aria-expanded, aria-controls, aria-labelledby)
 * - Implemented proper role="region" for accordion content
 * - Added keyboard navigation support and focus management
 * - Included screen reader friendly button labeling
 * - Enhanced semantic HTML structure
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Consolidated duplicate useEffect hooks into single optimized hook
 * - Improved ResizeObserver implementation with proper cleanup
 * - Optimized animation performance using design system classes
 * 
 * @refactor Enhanced with design system compliance, accessibility, and performance improvements
 */

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn';

export interface AccordionProps {
 /**
  * The question/title text displayed in the accordion header
  */
 question: string;

 /**
  * The answer/content displayed when accordion is expanded
  */
 answer: React.ReactNode;

 /**
  * Category for the accordion item (used for grouping/styling)
  */
 category: string;

 /**
  * Optional image to display within the accordion content
  */
 image?: string;

 /**
  * Whether the accordion is currently open/expanded
  */
 isOpen: boolean;

 /**
  * Callback function triggered when accordion is toggled
  */
 toggleAccordion: () => void;

 /**
  * Unique identifier for accessibility (aria-controls, aria-labelledby)
  */
 id?: string;

 /**
  * Additional CSS classes for the accordion container
  */
 className?: string;

 /**
  * Additional CSS classes for the accordion content
  */
 contentClassName?: string;
}

const Accordion: React.FC<AccordionProps> = ({
 question,
 answer,
 category,
 image,
 isOpen,
 toggleAccordion,
 id,
 className,
 contentClassName,
}) => {
 const [maxHeight, setMaxHeight] = useState<string | number>('0px');
 const contentRef = useRef<HTMLDivElement>(null);

 // Consolidated useEffect for height management and ResizeObserver
 useEffect(() => {
  const contentElement = contentRef.current;
  if (!contentElement) return;

  const updateHeight = () => {
   if (isOpen) {
    setMaxHeight(`${contentElement.scrollHeight}px`);
   } else {
    setMaxHeight('0px');
   }
  };

  // Initial height calculation
  updateHeight();

  // Set up ResizeObserver for dynamic content changes (if available)
  let resizeObserver: ResizeObserver | null = null;
  
  if (typeof window !== 'undefined' && window.ResizeObserver) {
   resizeObserver = new ResizeObserver(() => {
    if (isOpen) {
     updateHeight();
    }
   });

   resizeObserver.observe(contentElement);
  }

  return () => {
   if (resizeObserver) {
    resizeObserver.disconnect();
   }
  };
 }, [isOpen, answer]);

 // Generate unique IDs for accessibility if not provided
 const accordionId = id || `accordion-${category}-${question.replace(/\s+/g, '-').toLowerCase()}`;
 const headerId = `${accordionId}-header`;
 const contentId = `${accordionId}-content`;

 return (
  <div className={cn('border-b border-border', className)}>
   <button
    id={headerId}
    className={cn(
     'flex justify-between items-center w-full py-6 gap-2 text-left',
     'focus-visible'
    )}
    onClick={toggleAccordion}
    aria-expanded={isOpen}
    aria-controls={contentId}
    aria-labelledby={headerId}
    type="button"
   >
    <span>
     <h2 className="text-text-primary font-medium">{question}</h2>
    </span>
    <span className="flex-none" aria-hidden="true">
     {isOpen ? (
      <ChevronUpIcon className="w-6 h-6 text-text-primary transition-transform duration-200" />
     ) : (
      <ChevronDownIcon className="w-6 h-6 text-text-primary transition-transform duration-200" />
     )}
    </span>
   </button>

   <div
    id={contentId}
    ref={contentRef}
    role="region"
    aria-labelledby={headerId}
    style={{ 
     maxHeight, 
     transition: 'max-height 0.3s ease-in-out' 
    }}
    className={cn(
     'overflow-hidden',
     isOpen && 'animate-fadeIn'
    )}
   >
    <div className={cn('pb-6 pr-8', contentClassName)}>
     {/* Content with proper semantic structure */}
     <div className="text-primary leading-relaxed">
      {answer}
     </div>
     
     {/* Optional image with proper accessibility */}
     {image && (
      <div className="mt-6">
       <Image 
        src={image} 
        alt={`Illustration for: ${question}`}
        className="rounded-md w-full sm:hidden"
        width={600}
        height={400}
        loading="lazy"
        sizes="(max-width: 640px) 100vw, 0px"
       />
      </div>
     )}
    </div>
   </div>
  </div>
 );
};

export { Accordion };

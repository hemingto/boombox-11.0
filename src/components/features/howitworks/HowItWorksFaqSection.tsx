/**
 * @fileoverview FAQ section for the "How It Works" page
 * @source boombox-10.0/src/app/components/howitworks/howitworksfaq.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a curated selection of FAQs filtered by "Best Practices" and "General" categories.
 * Shows up to 5 FAQs in an accordion format to help users understand how the Boombox service works.
 * Provides a two-column responsive layout with heading on left and accordion on right.
 * 
 * API ROUTES UPDATED:
 * - None (presentation component, no API calls)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced bg-slate-100 with bg-surface-tertiary for consistent design system usage
 * - Removed borderColor prop (handled by AccordionContainer design system defaults)
 * - Updated padding/spacing to use standard design system patterns
 * - Enhanced with semantic color tokens throughout
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added proper heading hierarchy (h1 for main heading)
 * - Added ARIA label for accordion group
 * - Component maintains keyboard navigation via AccordionContainer
 * - Proper semantic HTML structure with responsive layout
 * 
 * @refactor Migrated to features/howitworks with design system compliance and enhanced accessibility
 */

'use client';

import React from 'react';
import { AccordionContainer } from '@/components/ui/primitives/Accordion/AccordionContainer';
import { faqs } from '@/data/faq';

export interface HowItWorksFaqSectionProps {
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * HowItWorksFaqSection component
 * Displays curated FAQ items for the "How It Works" page
 */
export function HowItWorksFaqSection({ 
  className 
}: HowItWorksFaqSectionProps) {
  // Filter FAQs by relevant categories
  const bestPracticesFaqs = faqs.filter(faq => faq.category === 'Best Practices');
  const generalFaqs = faqs.filter(faq => faq.category === 'General');
  
  // Combine and limit to 5 most relevant FAQs
  const selectedFaqs = [...bestPracticesFaqs, ...generalFaqs].slice(0, 5);

  return (
    <section 
      className={`md:flex bg-surface-tertiary mt-14 lg:px-16 px-6 py-24 ${className || ''}`}
      aria-labelledby="faq-heading"
    >
      {/* FAQ Heading Section */}
      <div className="basis-2/5 pt-6">
        <h1 
          id="faq-heading"
          className="mb-10 py-4 mr-4 text-text-primary"
        >
          Frequently asked questions
        </h1>
      </div>

      {/* FAQ Accordion Section */}
      <div className="flex place-content-end basis-3/5">
        <div className="w-full">
          <AccordionContainer 
            data={selectedFaqs}
            onAccordionChange={() => {}}
            defaultOpenIndex={null}
            ariaLabel="How It Works frequently asked questions"
          />
        </div>
      </div>
    </section>
  );
}


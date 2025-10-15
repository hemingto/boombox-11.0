/**
 * @fileoverview Pricing FAQ section with filtered questions
 * @source boombox-10.0/src/app/components/storage-unit-prices/faqsection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays frequently asked questions specific to storage unit pricing.
 * Filters FAQs by "Pricing" category, with fallback to "General" category.
 * Shows up to 5 FAQs in an accordion format for easy browsing.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced bg-slate-100 with bg-surface-tertiary (semantic background color)
 * - Replaced border-slate-200 with design system border tokens
 * - Added semantic text colors for headings
 * - Applied consistent spacing using design system patterns
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added proper section landmark with aria-label
 * - Semantic HTML structure with proper heading hierarchy
 * - AccordionContainer handles keyboard navigation and ARIA attributes
 * 
 * @refactor Applied design system colors, enhanced semantic structure,
 * removed borderColor prop (now handled by design system)
 */

'use client';

import React, { useMemo } from 'react';
import { AccordionContainer } from '@/components/ui/primitives/Accordion/AccordionContainer';
import { faqs } from '@/data/faq';

export function PricingFAQSection(): React.ReactElement {
  // Filter and memoize FAQs to prevent unnecessary recalculations
  const selectedFaqs = useMemo(() => {
    // Filter FAQs based on category
    const pricingFaqs = faqs.filter(faq => faq.category === 'Pricing');
    const generalFaqs = faqs.filter(faq => faq.category === 'General');

    // Select up to 5 FAQs from Pricing, fallback to General if needed
    return [...pricingFaqs, ...generalFaqs].slice(0, 5);
  }, []);

  return (
    <section
      className="md:flex bg-surface-tertiary mt-14 lg:px-16 px-6 py-24"
      aria-label="Pricing frequently asked questions"
    >
      {/* FAQ heading */}
      <div className="basis-2/5 pt-6">
        <h1 className="mb-10 py-4 mr-4 text-text-primary">
          Frequently asked questions
        </h1>
      </div>

      {/* FAQ accordion */}
      <div className="flex place-content-end basis-3/5">
        <div className="w-full">
          <AccordionContainer
            data={selectedFaqs}
            onAccordionChange={() => {}}
            defaultOpenIndex={null}
          />
        </div>
      </div>
    </section>
  );
}


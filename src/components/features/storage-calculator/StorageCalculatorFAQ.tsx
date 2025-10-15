/**
 * @fileoverview Storage calculator FAQ section
 * @source boombox-10.0/src/app/components/storagecalculator/storagecalculatorfaq.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a curated selection of frequently asked questions related to storage
 * unit sizes and general Boombox information. Shows the first 5 FAQs from the
 * "Storage Unit Sizes" and "General" categories.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced bg-slate-100 with semantic bg-surface-tertiary
 * - Updated to use consistent design system spacing and layout
 * - Removed borderColor prop (now handled by design system)
 * - Applied semantic text colors (text-text-primary)
 * - Enhanced responsive layout patterns
 * 
 * @refactor 
 * - Renamed from storagecalculatorfaq.tsx to StorageCalculatorFAQ.tsx (PascalCase)
 * - Updated to use centralized AccordionContainer from UI primitives
 * - Updated to use semantic color tokens from design system
 * - Updated imports to use absolute imports with @/ prefix
 * - Enhanced accessibility with proper section landmarks
 */

'use client';

import { AccordionContainer } from '@/components/ui/primitives/Accordion/AccordionContainer';
import { faqs } from '@/data/faq';

/**
 * Main storage calculator FAQ section component
 */
export function StorageCalculatorFAQ() {
  // Filter and combine FAQs from specific categories
  const storageUnitSizesFaqs = faqs.filter(faq => faq.category === 'Storage Unit Sizes');
  const generalFaqs = faqs.filter(faq => faq.category === 'General');
  const selectedFaqs = [...storageUnitSizesFaqs, ...generalFaqs].slice(0, 5);

  return (
    <section 
      className="md:flex bg-surface-tertiary lg:px-16 px-6 py-24"
      aria-labelledby="storage-calculator-faq-heading"
    >
      {/* Left column - Heading */}
      <div className="basis-2/5 pt-6">
        <h1 
          id="storage-calculator-faq-heading"
          className="mb-10 py-4 text-3xl font-bold text-text-primary"
        >
          Frequently asked questions
        </h1>
      </div>

      {/* Right column - Accordion */}
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

export default StorageCalculatorFAQ;


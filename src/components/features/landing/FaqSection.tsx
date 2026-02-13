/**
 * @fileoverview FAQ Section component for landing page
 * @source boombox-10.0/src/app/components/landingpage/faqsection.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays a curated selection of 5 FAQs from General and Best Practices categories
 * in a two-column layout with title and accordion container. Provides quick access
 * to common questions on the landing page.
 *
 * API ROUTES UPDATED:
 * - None (static data component)
 *
 * DESIGN SYSTEM UPDATES:
 * - Replaced bg-slate-100 with bg-surface-tertiary semantic token
 * - Updated padding using design system spacing standards
 * - Applied consistent container patterns (lg:px-16 px-6)
 * - Removed hardcoded border color prop in favor of design system defaults
 *
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added semantic HTML with proper heading hierarchy
 * - Enhanced ARIA labels for accordion group
 * - Proper landmark role for section container
 *
 * @refactor Migrated to features/landing with design system compliance and updated imports
 */

'use client';

import { AccordionContainer } from '@/components/ui/primitives/Accordion/AccordionContainer';
import { faqs } from '@/data/faq';

export interface FaqSectionProps {
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * FAQ Section Component
 *
 * Displays a curated selection of frequently asked questions on the landing page.
 * Filters FAQs to show 5 questions from General and Best Practices categories.
 *
 * @example
 * ```tsx
 * <FaqSection />
 * ```
 */
export function FaqSection({ className }: FaqSectionProps) {
  // Filter FAQs by category and select first 5
  const generalFaqs = faqs.filter(faq => faq.category === 'General');
  const bestPracticesFaqs = faqs.filter(
    faq => faq.category === 'Best Practices'
  );
  const selectedFaqs = [...generalFaqs, ...bestPracticesFaqs].slice(0, 5);

  return (
    <section
      className={`md:flex bg-surface-tertiary mt-14 lg:px-16 px-6 py-24 ${className || ''}`}
      aria-labelledby="faq-section-title"
    >
      {/* Left column: Title */}
      <div className="basis-2/5 pt-6">
        <h1 id="faq-section-title" className="mb-10 py-4 mr-6">
          Frequently asked questions
        </h1>
      </div>

      {/* Right column: Accordion */}
      <div className="flex place-content-end basis-3/5">
        <div className="w-full">
          <AccordionContainer
            data={selectedFaqs}
            onAccordionChange={() => {}}
            defaultOpenIndex={null}
            ariaLabel="Frequently asked questions about Boombox storage services"
          />
        </div>
      </div>
    </section>
  );
}

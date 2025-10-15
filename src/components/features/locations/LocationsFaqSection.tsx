/**
 * @fileoverview FAQ Section component for locations pages
 * @source boombox-10.0/src/app/components/locations/locationsfaq.tsx
 * @location src/components/features/locations/
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a curated selection of 5 FAQs from Locations and General categories
 * in a two-column layout with title and accordion container. Provides quick access
 * to location-specific questions on location pages.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced bg-slate-100 with bg-surface-tertiary semantic token
 * - Removed hardcoded borderColor prop in favor of design system defaults
 * - Applied consistent container patterns (lg:px-16 px-6)
 * - Updated padding using design system spacing standards
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added semantic HTML with proper section landmark
 * - Enhanced ARIA labels for accordion group with location-specific context
 * - Proper heading hierarchy with id for aria-labelledby
 * - Added descriptive aria-label for accordion container
 * 
 * PATTERN CONSISTENCY:
 * - Follows same structure as FaqSection from landing page
 * - Filters different categories (Locations + General instead of General + Best Practices)
 * - Maintains consistent layout and spacing with other FAQ sections
 * 
 * @refactor Migrated to features/locations with design system compliance and updated imports
 */

'use client';

import { AccordionContainer } from '@/components/ui/primitives/Accordion/AccordionContainer';
import { faqs } from '@/data/faq';
import { cn } from '@/lib/utils/cn';

export interface LocationsFaqSectionProps {
  /**
   * Heading text for the FAQ section
   * @default "Frequently asked questions"
   */
  heading?: string;
  
  /**
   * Number of FAQs to display
   * @default 5
   */
  faqCount?: number;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Locations FAQ Section Component
 * 
 * Displays a curated selection of frequently asked questions for location pages.
 * Filters FAQs to show questions from Locations and General categories, prioritizing
 * location-specific questions first, then general questions.
 * 
 * @example
 * ```tsx
 * // Default usage (5 FAQs)
 * <LocationsFaqSection />
 * 
 * // Custom heading and FAQ count
 * <LocationsFaqSection 
 *   heading="Common Questions About Storage in Your Area"
 *   faqCount={3}
 * />
 * 
 * // With custom styling
 * <LocationsFaqSection className="my-custom-class" />
 * ```
 */
export function LocationsFaqSection({ 
  heading = "Frequently asked questions",
  faqCount = 5,
  className 
}: LocationsFaqSectionProps) {
  // Filter FAQs by category - prioritize Locations, then General
  const locationsFaqs = faqs.filter(faq => faq.category === 'Locations');
  const generalFaqs = faqs.filter(faq => faq.category === 'General');
  const selectedFaqs = [...locationsFaqs, ...generalFaqs].slice(0, faqCount);

  return (
    <section 
      className={cn(
        'md:flex bg-surface-tertiary mt-14 lg:px-16 px-6 py-24',
        className
      )}
      aria-labelledby="locations-faq-section-title"
    >
      {/* Left column: Title */}
      <div className="basis-2/5 pt-6">
        <h1 
          id="locations-faq-section-title" 
          className="mb-10 py-4 mr-4"
        >
          {heading}
        </h1>
      </div>

      {/* Right column: Accordion */}
      <div className="flex place-content-end basis-3/5">
        <div className="w-full">
          <AccordionContainer 
            data={selectedFaqs}
            onAccordionChange={() => {}}
            defaultOpenIndex={null}
            ariaLabel="Frequently asked questions about storage locations and services in your area"
          />
        </div>
      </div>
    </section>
  );
}


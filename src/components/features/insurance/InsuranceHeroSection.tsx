/**
 * @fileoverview Insurance coverage page hero section with main heading
 * @source boombox-10.0/src/app/components/insurance-coverage/insuranceherosection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays the main hero heading and description for the insurance coverage page.
 * Simple presentational component with no state or business logic.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied semantic spacing patterns (Container component pattern)
 * - Added proper semantic HTML (section element)
 * - Improved heading hierarchy for SEO
 * - Added descriptive text for better UX
 * 
 * @refactor Migrated to features/insurance domain with design system compliance
 */

'use client';

export function InsuranceHeroSection() {
  return (
    <section className="w-full my-10 sm:my-20 lg:px-16 px-6">
      <div>
        <h1 className="mb-4">Insurance Coverage</h1>
        <p className="text-text-primary">Make sure your items are protected</p>
      </div>
    </section>
  );
}


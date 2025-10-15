/**
 * @fileoverview Insurance coverage introduction section
 * @source boombox-10.0/src/app/components/insurance-coverage/insurancetopsection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays an introductory section explaining the importance of insurance coverage
 * for stored items. Uses card styling for visual separation.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded border colors: border-slate-100 → border-border
 * - Applied semantic text colors for hierarchy
 * - Used card component pattern for consistent styling
 * - Added semantic HTML (section element)
 * 
 * @refactor Migrated to features/insurance domain with design system compliance
 */

'use client';

export function InsuranceTopSection() {
  return (
    <section className="w-full lg:px-16 px-6 mb-8">
      <div className="card">
        <h2 className="mb-4">Protect your belongings</h2>
        <p className="text-text-secondary">
          If your belongings are worth storing, they are worth protecting. While Boombox takes precautions to provide a safe and secure storage 
          environment, we are not responsible for damage or loss to your stored belongings. For that reason, we offer you comprehensive
          insurance, designed specifically for your belongings while stored at a Boombox Self-Storage facility
        </p>
      </div>
    </section>
  );
}


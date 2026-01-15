/**
 * @fileoverview Storage calculator hero section with heading and description
 * @source boombox-10.0/src/app/components/storagecalculator/storagecalculatorhero.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Simple hero section for the storage calculator page. Displays an icon, heading,
 * and descriptive text to introduce the calculator functionality.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied semantic text colors (text-text-primary, text-text-secondary)
 * - Used consistent spacing from design system (mt-12 sm:mt-24)
 * - Updated to use absolute imports with @/
 * - Enhanced accessibility with proper heading hierarchy
 * 
 * @refactor 
 * - Renamed from storagecalculatorhero.tsx to StorageCalculatorHero.tsx (PascalCase)
 * - Changed component name from StorageCalculatorHeroSection to StorageCalculatorHero for consistency
 * - Updated imports to use absolute paths
 * - Applied semantic design system color tokens
 * - Improved accessibility with semantic HTML structure
 */

'use client';

import { RulerIcon } from '@/components/icons/RulerIcon';

/**
 * Storage Calculator Hero Section Component
 * 
 * Displays the introductory section for the storage calculator with:
 * - Ruler icon for visual context
 * - Main heading "Storage Calculator"
 * - Descriptive subtitle
 */
export function StorageCalculatorHero() {
  return (
    <section 
      className="flex mt-12 sm:mt-24 lg:px-16 px-6"
      aria-labelledby="storage-calculator-heading"
    >
      <div className="place-content-center mb-8">
        <RulerIcon 
          className="mb-4 w-12 h-12 text-text-primary" 
          aria-hidden="true"
        />
        <h1 
          id="storage-calculator-heading"
          className="mb-4 text-text-primary"
        >
          Storage Calculator
        </h1>
        <p className="text-text-primary">
          know exactly how much storage space you&apos;ll need
        </p>
      </div>
    </section>
  );
}

export default StorageCalculatorHero;


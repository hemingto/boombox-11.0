/**
 * @fileoverview Storage calculator section with visual placeholder
 * @source boombox-10.0/src/app/components/storagecalculator/storagecalculatorsection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a visual section for the storage calculator. This section appears to be
 * a placeholder for future calculator functionality or interactive content.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses Next.js Image component for images
 * - Applied semantic surface colors (bg-surface-tertiary for fallback)
 * - Used consistent spacing from design system
 * - Implemented proper image optimization with lazy loading
 * 
 * IMAGE OPTIMIZATION:
 * - Uses Next.js Image with lazy loading for below-the-fold content
 * - Set quality to 85 for optimal performance
 * - Responsive sizing with proper aspect ratio
 * - Descriptive alt text for accessibility and SEO
 * 
 * @refactor 
 * - Renamed from storagecalculatorsection.tsx to StorageCalculatorSection.tsx (PascalCase)
 * - Uses Next.js Image for better performance
 * - Updated imports to use absolute paths
 * - Applied semantic design system color tokens
 * - Enhanced accessibility with proper semantic HTML
 */

'use client';

import Image from 'next/image';

/**
 * Storage Calculator Section Component
 * 
 * Displays a visual section that can be used for:
 * - Interactive storage calculator interface
 * - Visual illustration of storage solutions
 * - Placeholder for future calculator functionality
 */
export function StorageCalculatorSection() {
  return (
    <section 
      className="md:flex lg:px-16 px-6 sm:mb-48 mb-24"
      aria-label="Storage calculator interactive section"
    >
      <div className="relative rounded-md w-full flex flex-col items-center text-center p-24 bg-surface-tertiary max-w-2xl aspect-[8/5] overflow-hidden">
        <Image
          src="/placeholder.jpg"
          alt="Storage calculator interactive interface - calculate your storage needs with Boombox units"
          fill
          className="object-cover rounded-md"
          loading="lazy"
          quality={85}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
        />
      </div>
    </section>
  );
}

export default StorageCalculatorSection;


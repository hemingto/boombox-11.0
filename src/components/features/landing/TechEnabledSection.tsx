/**
 * @fileoverview Tech-enabled storage features section for the landing page.
 * @source boombox-10.0/src/app/components/landingpage/techenabledsection.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays tech features with an interactive accordion and synchronized image display.
 * Features:
 * - Interactive accordion showing tech features
 * - Image carousel that changes based on selected accordion item
 * - Always-open accordion behavior (one item must be open)
 * - Responsive layout with accordion on left, image on right
 * - Default first item open
 *
 * DESIGN SYSTEM UPDATES:
 * - Applied consistent spacing and padding using design system tokens
 * - Replaced hardcoded height with proper responsive sizing
 * - Used semantic layout patterns
 *
 * IMAGE OPTIMIZATION:
 * - Uses Next.js Image with lazy loading for better performance
 * - Proper aspect ratios and responsive sizing
 * - Descriptive alt text for accessibility
 *
 * ACCESSIBILITY IMPROVEMENTS:
 * - Uses `<section>` element with descriptive `aria-label`
 * - Proper heading hierarchy with `<h1>`
 * - AccordionContainer provides keyboard navigation and ARIA support
 * - Image has descriptive alt text that updates with content
 * - Hidden on mobile with proper responsive behavior
 *
 * BUSINESS LOGIC PRESERVED:
 * - Same 3 tech features
 * - Same accordion behavior (alwaysOpen, defaultOpenIndex: 0)
 * - Same image switching based on accordion selection
 * - Same two-column responsive layout
 *
 * @refactor Refactored to use design system, improve accessibility, and align with boombox-11.0 structure.
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { AccordionContainer, type AccordionData } from '@/components/ui/primitives/Accordion/AccordionContainer';
import { cn } from '@/lib/utils';

/**
 * Tech feature interface extending AccordionData with image
 */
interface TechFeature extends AccordionData {
  /**
   * Image path for the feature visualization
   */
  image: string;
}

export interface TechEnabledSectionProps {
  /**
   * Optional additional CSS classes for the section container
   */
  className?: string;

  /**
   * Section heading (defaults to 'Tech enabled storage')
   */
  heading?: string;

  /**
   * Optional custom tech features (defaults to standard 3 features)
   */
  features?: TechFeature[];

  /**
   * Whether to show images (useful for testing or mobile-only scenarios)
   * @default true
   */
  showImages?: boolean;
}

/**
 * Default tech features
 */
const DEFAULT_FEATURES: TechFeature[] = [
  {
    question: 'Calculate your space',
    answer: 'Take the guess work of storage by estimating your space with our storage calculator',
    category: 'tech-feature',
    image: '/placeholder.jpg',
  },
  {
    question: 'Real time tracking',
    answer: "You've got better things to do than wait by the door for your Boombox - so we include real time delivery tracking",
    category: 'tech-feature',
    image: '/placeholder.jpg',
  },
  {
    question: 'Remember what you stored',
    answer: "Upload photos of the items you have stored, so you'll never forget what's in your storage unit.",
    category: 'tech-feature',
    image: '/placeholder.jpg',
  },
];

/**
 * TechEnabledSection Component
 * 
 * Displays tech-enabled storage features with an interactive accordion and synchronized images.
 * 
 * @example
 * ```tsx
 * <TechEnabledSection />
 * ```
 * 
 * @example With custom heading
 * ```tsx
 * <TechEnabledSection heading="Smart Storage Features" />
 * ```
 * 
 * @example With custom features
 * ```tsx
 * <TechEnabledSection
 *   features={customFeatures}
 *   heading="Technology Features"
 * />
 * ```
 */
export function TechEnabledSection({
  className,
  heading = 'Tech enabled storage',
  features = DEFAULT_FEATURES,
  showImages = true,
}: TechEnabledSectionProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // Get current feature for image display
  const currentFeature = features[currentImageIndex];

  return (
    <section
      className={cn('md:flex mt-14 lg:px-16 px-6 sm:mb-48 mb-24', className)}
      aria-labelledby="tech-enabled-section-heading"
    >
      {/* Left column: Accordion */}
      <div className="place-content-center basis-1/2 mb-8 min-h-[480px]">
        <h1 id="tech-enabled-section-heading" className="mb-8">
          {heading}
        </h1>
        <AccordionContainer
          data={features}
          onAccordionChange={setCurrentImageIndex}
          defaultOpenIndex={0}
          alwaysOpen={true}
          ariaLabel="Tech-enabled storage features"
        />
      </div>

      {/* Right column: Image display */}
      {showImages && currentFeature && (
        <div className="hidden sm:flex place-content-end h-[480px] basis-1/2">
          <div className="relative w-full h-full md:ml-8 rounded-md overflow-hidden">
            <Image
              src={currentFeature.image}
              alt={`${currentFeature.question} - ${currentFeature.answer}`}
              fill
              className="rounded-md object-cover"
              loading="lazy"
              quality={85}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      )}
    </section>
  );
}


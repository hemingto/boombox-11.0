/**
 * @fileoverview Tech-enabled storage features section for the landing page.
 * @source boombox-10.0/src/app/components/landingpage/techenabledsection.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays tech features with an interactive accordion and synchronized media display.
 * Features:
 * - Interactive accordion showing tech features
 * - Video/image carousel that changes based on selected accordion item
 * - Short autoplay/looping demo videos inside an iPhone device frame
 * - Falls back to static images when no video is provided
 * - Always-open accordion behavior (one item must be open)
 * - Responsive layout with accordion on left, media on right
 * - Default first item open
 *
 * DESIGN SYSTEM UPDATES:
 * - Applied consistent spacing and padding using design system tokens
 * - Replaced hardcoded height with proper responsive sizing
 * - Used semantic layout patterns
 *
 * MEDIA OPTIMIZATION:
 * - Uses HTML5 video with autoplay, muted, loop, playsInline for demo clips
 * - Poster images shown while video loads
 * - Uses Next.js Image with lazy loading for static image fallbacks
 * - Proper aspect ratios and responsive sizing
 *
 * ACCESSIBILITY IMPROVEMENTS:
 * - Uses `<section>` element with descriptive `aria-label`
 * - Proper heading hierarchy with `<h1>`
 * - AccordionContainer provides keyboard navigation and ARIA support
 * - Videos are decorative demos marked with aria-hidden
 * - Image fallbacks have descriptive alt text
 * - Hidden on mobile with proper responsive behavior
 *
 * BUSINESS LOGIC PRESERVED:
 * - Same 3 tech features
 * - Same accordion behavior (alwaysOpen, defaultOpenIndex: 0)
 * - Same media switching based on accordion selection
 * - Same two-column responsive layout
 *
 * @refactor Refactored to use design system, improve accessibility, and align with boombox-11.0 structure.
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  AccordionContainer,
  type AccordionData,
} from '@/components/ui/primitives/Accordion/AccordionContainer';
import { IPhoneFrame } from '@/components/ui/primitives/IPhoneFrame';
import { cn } from '@/lib/utils';

/**
 * Tech feature interface extending AccordionData with media support
 */
interface TechFeature extends AccordionData {
  /**
   * Image path — used as poster/fallback when video is present, or as the primary display otherwise
   */
  image: string;

  /**
   * Optional video path (.mp4) for an autoplay demo clip
   */
  video?: string;
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
   * Whether to show media (useful for testing or mobile-only scenarios)
   * @default true
   */
  showMedia?: boolean;
}

/**
 * Default tech features
 */
const DEFAULT_FEATURES: TechFeature[] = [
  {
    question: 'Calculate your space',
    answer:
      'Take the guess work of storage by estimating your space with our storage calculator',
    category: 'tech-feature',
    image: '/tech-enabled-storage/storage-calculator.jpg',
    video: '/tech-enabled-storage/storage-calculator.mp4',
  },
  {
    question: 'Real time tracking',
    answer:
      "You've got better things to do than wait by the door for your Boombox - so we include real time delivery tracking",
    category: 'tech-feature',
    image: '/tech-enabled-storage/tracking.jpg',
    video: '/tech-enabled-storage/tracking-3.mp4',
  },
  {
    question: 'Remember what you stored',
    answer:
      "Upload photos of the items you have stored, so you'll never forget what's in your storage unit.",
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
  showMedia = true,
}: TechEnabledSectionProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState<number>(0);

  // Get current feature for media display
  const currentFeature = features[currentMediaIndex];

  // Build accordion data with IPhoneFrame embedded in the answer for mobile.
  // Strip `image` so the Accordion doesn't render its own inline image,
  // and instead include a mobile-only IPhoneFrame within the answer content.
  const accordionData = features.map(({ image, video, answer, ...rest }) => ({
    ...rest,
    answer: (
      <>
        <span>{answer}</span>
        {/* Mobile-only: IPhoneFrame inline within accordion */}
        <div className="mt-6 flex justify-center sm:hidden">
          <IPhoneFrame className="h-[400px]">
            {video ? (
              <video
                src={video}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
                aria-hidden="true"
              />
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src={image}
                  alt={`${rest.question}`}
                  fill
                  className="object-cover"
                  loading="lazy"
                  sizes="(max-width: 640px) 80vw, 0px"
                />
              </div>
            )}
          </IPhoneFrame>
        </div>
      </>
    ),
  }));

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
          data={accordionData}
          onAccordionChange={setCurrentMediaIndex}
          defaultOpenIndex={0}
          alwaysOpen={true}
          ariaLabel="Tech-enabled storage features"
        />
      </div>

      {/* Right column: Media display (video in iPhone frame or fallback image) */}
      {showMedia && currentFeature && (
        <div className="hidden sm:flex place-content-center items-center h-[580px] basis-1/2 md:ml-8">
          <IPhoneFrame key={currentMediaIndex} className="h-full">
            {currentFeature.video ? (
              <video
                src={currentFeature.video}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover animate-fade-in-opacity"
                aria-hidden="true"
              />
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src={currentFeature.image}
                  alt={`${currentFeature.question} - ${currentFeature.answer}`}
                  fill
                  className="object-cover animate-fade-in-opacity"
                  loading="lazy"
                  quality={85}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
          </IPhoneFrame>
        </div>
      )}
    </section>
  );
}

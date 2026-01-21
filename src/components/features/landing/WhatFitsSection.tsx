/**
 * @fileoverview "What fits in a Boombox" section for the landing page.
 * @source boombox-10.0/src/app/components/landingpage/whatfitssection.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays storage capacity information with a call-to-action button.
 * Features:
 * - Information about 5ft x 8ft storage unit capacity
 * - Visual image showing storage unit or items
 * - "Calculate your space" call-to-action button
 * - Responsive two-column layout
 *
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded button styles with `btn-primary` utility class
 * - Applied consistent spacing and padding using design system tokens
 * - Used semantic layout patterns
 *
 * IMAGE OPTIMIZATION:
 * - Uses Next.js Image with lazy loading for better performance
 * - Proper aspect ratio (square) and responsive sizing
 * - Descriptive alt text for accessibility
 *
 * ACCESSIBILITY IMPROVEMENTS:
 * - Uses `<section>` element with descriptive `aria-label`
 * - Proper heading hierarchy with `<h1>`
 * - Button uses semantic `<Link>` with btn-primary styling
 * - Descriptive button text with proper accessible name
 * - Image has descriptive alt text
 *
 * BUSINESS LOGIC PRESERVED:
 * - Same content and layout
 * - Same button text ("Calculate your space")
 * - Same responsive behavior
 * - Same two-column desktop, stacked mobile layout
 *
 * @refactor Refactored to use design system, improve accessibility, and align with boombox-11.0 structure.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface WhatFitsSectionProps {
  /**
   * Section heading
   * @default 'What fits in a Boombox?'
   */
  heading?: string;

  /**
   * Description text
   * @default 'More than you think. Our 5ft x 8ft storage unit is designed to fit all your household and office items'
   */
  description?: string;

  /**
   * Button text
   * @default 'Calculate your space'
   */
  buttonText?: string;

  /**
   * Button link URL
   * @default '/storage-calculator'
   */
  buttonHref?: string;

  /**
   * Image source for the storage unit visualization
   * @default '/placeholder.jpg'
   */
  imageSrc?: string;

  /**
   * Image alt text
   * @default 'Storage unit capacity visualization showing household and office items'
   */
  imageAlt?: string;

  /**
   * Optional additional CSS classes for the section container
   */
  className?: string;
}

/**
 * WhatFitsSection Component
 * 
 * Displays information about storage unit capacity with a visual and call-to-action.
 * 
 * @example
 * ```tsx
 * <WhatFitsSection />
 * ```
 * 
 * @example With custom content
 * ```tsx
 * <WhatFitsSection
 *   heading="Custom Heading"
 *   description="Custom description"
 *   buttonText="Get Started"
 *   buttonHref="/start"
 *   imageSrc="/custom-image.jpg"
 * />
 * ```
 */
export function WhatFitsSection({
  heading = 'What fits in a Boombox?',
  description = 'More than you think. Our 5ft x 8ft storage unit is designed to fit all your household and office items',
  buttonText = 'Calculate your space',
  buttonHref = '/storage-calculator',
  imageSrc = '/placeholder.jpg',
  imageAlt = 'Storage unit capacity visualization showing household and office items that fit in a 5ft x 8ft Boombox storage unit',
  className,
}: WhatFitsSectionProps) {
  return (
    <section
      className={cn('md:flex mt-14 lg:px-16 px-6 sm:mb-48 mb-24', className)}
      aria-labelledby="what-fits-section-heading"
    >
      {/* Left column: Content */}
      <div className="place-content-center basis-1/2 mb-8">
        <h1 id="what-fits-section-heading" className="mb-8">
          {heading}
        </h1>
        <p className="mb-10 w-4/6">{description}</p>
        <Link
          href={buttonHref}
          className="btn-primary inline-block"
          aria-label={`${buttonText} - navigate to storage calculator`}
        >
          {buttonText}
        </Link>
      </div>

      {/* Right column: Image */}
      <div className="flex place-content-end basis-1/2">
        <div className="relative w-full h-full md:ml-8 aspect-square rounded-md overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="rounded-md object-cover"
            loading="lazy"
            quality={85}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}


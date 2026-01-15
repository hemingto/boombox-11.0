/**
 * @fileoverview Get Quote CTA section for locations pages
 * @source boombox-10.0/src/app/components/locations/getquotelocations.tsx
 * @location src/components/features/locations/
 * 
 * COMPONENT FUNCTIONALITY:
 * Simple call-to-action section encouraging users to get a storage quote.
 * Features a heading, descriptive text, CTA button, and hero image.
 * Used on location-specific pages to drive quote conversions.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses Next.js Image component for image placeholder
 * - Replaced inline button styles with design system Button component (variant="primary")
 * - Applied design system colors: bg-zinc-950 → bg-primary, hover:bg-zinc-800 → built into Button
 * - Enhanced accessibility with proper semantic HTML and ARIA labels
 * - Made button properly interactive with navigation to quote flow
 * 
 * IMAGE OPTIMIZATION:
 * - Uses Next.js Image with proper aspect ratio and responsive sizing
 * - Lazy loading for below-the-fold content
 * 
 * @refactor Simplified component with design system Button and Next.js Image
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

export interface GetQuoteLocationsProps {
  /**
   * Heading text
   * @default "Never hassle with a storage unit again"
   */
  heading?: string;
  
  /**
   * Subheading/description text
   * @default "Get a quote in as little as 2 minutes"
   */
  description?: string;
  
  /**
   * CTA button text
   * @default "Get Quote"
   */
  buttonText?: string;
  
  /**
   * URL to navigate when button is clicked
   * @default "/get-quote"
   */
  quoteUrl?: string;
  
  /**
   * Image source for the hero image
   * @default "/placeholder.jpg"
   */
  imageSrc?: string;
  
  /**
   * Alt text for the hero image
   * @default "Boombox mobile storage service"
   */
  imageAlt?: string;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

export const GetQuoteLocations: React.FC<GetQuoteLocationsProps> = ({
  heading = "Never hassle with a storage unit again",
  description = "Get a quote in as little as 2 minutes",
  buttonText = "Get Quote",
  quoteUrl = "/get-quote",
  imageSrc = "/placeholder.jpg",
  imageAlt = "Boombox mobile storage service - convenient storage solution",
  className,
}) => {
  return (
    <section 
      className={cn(
        'md:flex mt-14 lg:px-16 px-6 sm:mb-48 mb-24',
        className
      )}
      aria-labelledby="get-quote-heading"
    >
      {/* Text Content */}
      <div className="place-content-center basis-1/2 mb-8">
        <h1 
          id="get-quote-heading"
          className="mb-8"
        >
          {heading}
        </h1>
        
        <p className="mb-10 w-4/6">
          {description}
        </p>
        
        <Link 
          href={quoteUrl}
          className="inline-block focus-visible"
          aria-label={`${buttonText} - ${description}`}
        >
          <Button
            variant="primary"
            size="md"
            borderRadius="md"
            className="font-semibold"
          >
            {buttonText}
          </Button>
        </Link>
      </div>
      
      {/* Hero Image */}
      <div 
        className="flex place-content-end basis-1/2"
        role="img"
        aria-label={imageAlt}
      >
        <div className="relative w-full md:ml-8 aspect-square rounded-md overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover rounded-md"
            loading="lazy"
            quality={85}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
};


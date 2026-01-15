/**
 * @fileoverview Get Quote call-to-action section for How It Works page
 * @source boombox-10.0/src/app/components/howitworks/getquotehowitworks.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a promotional section encouraging users to get a quote for Boombox storage services.
 * Features a two-column layout with heading, description, CTA button, and image placeholder.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced inline button styles with btn-primary utility class
 * - Replaced bg-slate-100 placeholder with surface-tertiary semantic color
 * - Added proper semantic HTML structure (section, heading hierarchy)
 * - Enhanced button with proper type and accessibility attributes
 * 
 * IMAGE OPTIMIZATION:
 * - Uses Next.js Image component for better performance and SEO
 * - Implements lazy loading and responsive sizing
 * - Aspect ratio preserved for layout stability (square aspect ratio)
 * 
 * @refactor Migrated to features/howitworks with design system integration, accessibility improvements, and Next.js Image
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

/**
 * Get Quote How It Works section props
 */
interface GetQuoteHowItWorksProps {
  className?: string;
}

/**
 * GetQuoteHowItWorks - Promotional section encouraging users to get a quote
 * 
 * Features:
 * - Two-column responsive layout
 * - Clear value proposition
 * - CTA button linking to quote flow
 * - Image placeholder for visual content
 */
export function GetQuoteHowItWorks({ className = '' }: GetQuoteHowItWorksProps) {
  return (
    <section 
      className={`md:flex mt-14 lg:px-16 px-6 sm:mb-48 mb-24 ${className}`}
      aria-labelledby="get-quote-heading"
    >
      {/* Left column: Content */}
      <div className="place-content-center basis-1/2 mb-8">
        <h1 id="get-quote-heading" className="mb-8">
          Say goodbye to self storage
        </h1>
        <p className="mb-10 w-4/6 text-text-primary">
          Get a quote in as little as 2 minutes
        </p>
        <Link 
          href="/getquote"
          className="btn-primary inline-block"
          aria-label="Get a quote for Boombox storage"
        >
          Get Quote
        </Link>
      </div>

      {/* Right column: Image */}
      <div className="flex place-content-end basis-1/2">
        <div className="relative w-full h-full md:ml-8 aspect-square rounded-md overflow-hidden">
          <Image
            src="/placeholder.jpg"
            alt="Boombox storage service - convenient mobile storage solution"
            fill
            className="object-cover rounded-md"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}


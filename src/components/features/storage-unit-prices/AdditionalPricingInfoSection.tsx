/**
 * @fileoverview Additional pricing information section with horizontal scroll carousel
 * @source boombox-10.0/src/app/components/storage-unit-prices/additionalinfosection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a horizontally scrollable carousel of additional pricing information cards
 * including delivery fees, loading help, storage unit access, and packing supplies.
 * Features smooth scroll navigation with arrow buttons and keyboard accessibility.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced bg-slate-100 with bg-surface-tertiary (semantic color)
 * - Replaced active:bg-slate-200 with active:bg-surface-disabled
 * - Replaced bg-white with bg-surface-primary
 * - Replaced placeholder divs with OptimizedImage components for better SEO and accessibility
 * - Added proper ARIA labels and keyboard navigation support
 * - Extracted scroll logic into useHorizontalScroll custom hook
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added aria-label to scroll buttons
 * - Added role="region" and aria-label to carousel container
 * - Added keyboard navigation support (arrow keys)
 * - Improved focus management and tab order
 * 
 * @refactor Extracted scroll logic to custom hook, applied design system colors,
 * replaced placeholder divs with OptimizedImage, enhanced accessibility
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';
import { OptimizedImage } from '@/components/ui/primitives/OptimizedImage/OptimizedImage';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';

interface PricingStep {
  title: string;
  subtitle: string;
  description: string;
  link: string;
  imageSrc: string;
  imageAlt: string;
}

export function AdditionalPricingInfoSection(): React.ReactElement {
  const { scrollContainerRef, handleScrollLeft, handleScrollRight } = useHorizontalScroll({
    gap: 16,
  });

  // Pricing information content
  const steps: PricingStep[] = [
    {
      title: 'Free',
      subtitle: 'Initial Delivery',
      description:
        "Your Boombox is delivered right to your door. Free for the first hour, $50/hr after first hour.",
      link: '/',
      imageSrc: '/placeholder.jpg',
      imageAlt: 'Mobile storage unit being delivered to customer location',
    },
    {
      title: '$189/hr on avg',
      subtitle: 'Optional Loading Help',
      description:
        'Need help loading your Boombox? We partner with local moving pros to save your back and your wallet.',
      link: '/',
      imageSrc: '/placeholder.jpg',
      imageAlt: 'Professional movers helping load items into storage unit',
    },
    {
      title: '$45 flat rate',
      subtitle: 'Storage Unit Access',
      description:
        "If you ever need something back, book a return delivery, and we'll deliver your storage unit to where you need us. Labor is not included",
      link: '/',
      imageSrc: '/placeholder.jpg',
      imageAlt: 'Storage unit access service - unit being delivered for customer access',
    },
    {
      title: 'Boxes',
      subtitle: 'Packing Supplies',
      description:
        'Need packing supplies? We have you covered. Order boxes, tape, and more from our online store.',
      link: '/',
      imageSrc: '/placeholder.jpg',
      imageAlt: 'Packing supplies including boxes, tape, and moving materials',
    },
  ];

  return (
    <section className="sm:mb-48 mb-24" aria-label="Additional pricing information">
      {/* Header with navigation buttons */}
      <div className="flex flex-col sm:flex-row w-full lg:px-16 px-6 justify-between items-left sm:items-center mb-10">
        <h1 className="text-left text-text-primary">Additional pricing info</h1>
        <div className="flex mt-4 sm:mt-0 gap-1">
          <button
            onClick={handleScrollLeft}
            className="rounded-full bg-surface-tertiary active:bg-surface-disabled hover:bg-surface-disabled cursor-pointer p-2 transition-colors"
            aria-label="Scroll to previous pricing card"
            type="button"
          >
            <ArrowLeftIcon className="w-6 text-text-primary" aria-hidden="true" />
          </button>
          <button
            onClick={handleScrollRight}
            className="rounded-full bg-surface-tertiary active:bg-surface-disabled hover:bg-surface-disabled cursor-pointer p-2 transition-colors"
            aria-label="Scroll to next pricing card"
            type="button"
          >
            <ArrowRightIcon className="w-6 text-text-primary" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Scrollable carousel container */}
      <div
        id="scroll-container"
        className="w-full overflow-x-auto hide-scrollbar"
        ref={scrollContainerRef}
        tabIndex={0}
        role="region"
        aria-label="Pricing information carousel"
      >
        <div
          id="item-container"
          className="lg:px-16 px-6 py-4 flex gap-4 flex-nowrap"
        >
          {steps.map((step, index) => (
            <Link
              key={index}
              href={step.link}
              className="flex-none"
              aria-label={`${step.subtitle}: ${step.title}`}
            >
              <article className="bg-surface-tertiary w-[297.6px] sm:w-[372px] h-[569.6px] sm:h-[712px] rounded-md transform transition-transform duration-300 sm:hover:scale-[102%] cursor-pointer hover:z-10 overflow-hidden">
                {/* Image placeholder - TODO: Replace with actual images */}
                <div className="relative w-full h-[60%]">
                  <OptimizedImage
                    src={step.imageSrc}
                    alt={step.imageAlt}
                    width={372}
                    height={427}
                    aspectRatio="portrait"
                    containerClassName="w-full h-full"
                    className="object-cover"
                    loading="lazy"
                    quality={85}
                    sizes="(max-width: 640px) 297.6px, 372px"
                  />
                </div>

                {/* Content section */}
                <div className="p-4">
                  <p className="bg-surface-primary rounded-full py-2.5 px-4 font-semibold inline-block mb-2 text-sm font-inter text-text-primary">
                    {step.title}
                  </p>
                  <h2 className="mb-2 text-text-primary">{step.subtitle}</h2>
                  <p className="text-text-secondary">{step.description}</p>
                </div>
              </article>
            </Link>
          ))}

          {/* Spacer div for proper scrolling */}
          <div
            className="bg-transparent lg:w-[48px] w-[8px] h-[569.6px] sm:h-[712px] flex-none"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Hide scrollbar styles */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* For Chrome, Safari, and Opera */
        }
        .hide-scrollbar {
          -ms-overflow-style: none; /* For Internet Explorer and Edge */
          scrollbar-width: none; /* For Firefox */
        }
      `}</style>
    </section>
  );
}


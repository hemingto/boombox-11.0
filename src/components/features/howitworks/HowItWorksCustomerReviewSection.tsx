/**
 * @fileoverview Customer review section component with horizontal scrolling for How It Works page
 * @source boombox-10.0/src/app/components/howitworks/customerreviewsectionlight.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a horizontally scrollable section of customer testimonials with navigation arrows.
 * Features smooth scrolling, hover effects, and responsive design for multiple screen sizes.
 * Uses centralized review data from @/data/customerReviews for better maintainability.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced bg-slate-100 with bg-surface-tertiary (semantic surface color)
 * - Replaced bg-white with bg-surface-primary (semantic primary surface)
 * - Replaced bg-slate-200 with bg-surface-disabled (semantic disabled state)
 * - Removed styled-jsx in favor of Tailwind utilities
 * - Added proper ARIA labels for accessibility
 * - Enhanced keyboard navigation support
 * 
 * DATA ARCHITECTURE:
 * - Review data extracted to centralized @/data/customerReviews.ts
 * - Enables reusability across multiple pages (landing, marketing, etc.)
 * - Consistent data structure with helper functions
 * 
 * @refactor Migrated to features/howitworks with design system integration, accessibility improvements, and centralized data
 * @refactor Renamed from CustomerReviewSection to HowItWorksCustomerReviewSection to avoid naming conflict with landing page component
 */

'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon } from '@heroicons/react/20/solid';
import { CUSTOMER_REVIEWS, type CustomerReview } from '@/data';

/**
 * How It Works customer review section component props
 */
interface HowItWorksCustomerReviewSectionProps {
  className?: string;
}

/**
 * HowItWorksCustomerReviewSection - Displays customer testimonials in a horizontally scrollable layout
 * 
 * Features:
 * - Horizontal scrolling with smooth animations
 * - Navigation arrows for easy browsing
 * - Responsive card layout
 * - Hover effects and interactions
 * - Accessibility-first design with ARIA labels
 */
export function HowItWorksCustomerReviewSection({ className = '' }: HowItWorksCustomerReviewSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemWidth = 405 + 16; // Width of the card + gap

  /**
   * Scrolls to the next or previous item in the review list
   * @param direction - Direction to scroll ('left' or 'right')
   */
  const scrollToItem = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current && typeof scrollContainerRef.current.scrollTo === 'function') {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const offset = direction === 'left' ? -itemWidth : itemWidth;

      // Find the nearest item index
      const nearestIndex = Math.round(scrollLeft / itemWidth);
      const newScrollPosition = nearestIndex * itemWidth + offset;

      // Scroll to the nearest item position
      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleScrollLeft = () => scrollToItem('left');
  const handleScrollRight = () => scrollToItem('right');

  return (
    <section 
      className={`sm:mb-48 mb-24 bg-surface-primary ${className}`}
      aria-labelledby="customer-reviews-heading"
    >
      {/* Header with navigation controls */}
      <div className="flex flex-col sm:flex-row w-full lg:px-16 px-6 justify-between items-left sm:items-center mb-10">
        <h1 id="customer-reviews-heading" className="text-left">
          Hear from our customers
        </h1>
        <div className="flex mt-4 sm:mt-0" role="group" aria-label="Review navigation">
          <button
            onClick={handleScrollLeft}
            className="rounded-full bg-surface-tertiary active:bg-surface-disabled cursor-pointer p-2 mr-1 transition-colors duration-200 hover:bg-surface-disabled focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Scroll to previous reviews"
            type="button"
          >
            <ArrowLeftIcon className="w-6 text-text-primary" aria-hidden="true" />
          </button>
          <button
            onClick={handleScrollRight}
            className="rounded-full bg-surface-tertiary active:bg-surface-disabled cursor-pointer p-2 transition-colors duration-200 hover:bg-surface-disabled focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Scroll to next reviews"
            type="button"
          >
            <ArrowRightIcon className="w-6 text-text-primary" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Scrollable review container */}
      <div
        ref={scrollContainerRef}
        className="w-full overflow-x-auto scrollbar-hide"
        tabIndex={0}
        aria-label="Customer reviews"
        role="region"
      >
        <div className="lg:px-16 px-6 py-4 flex gap-4 flex-nowrap">
          {CUSTOMER_REVIEWS.map((review) => (
            <Link 
              key={review.id} 
              href="/"
              className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
            >
              <article className="bg-surface-tertiary w-[405px] rounded-md flex-none transform transition-transform duration-300 hover:scale-[102%] cursor-pointer hover:z-10 focus-within:scale-[102%]">
                {/* Customer info header */}
                <div className="flex p-4 mb-2 items-center">
                  <div 
                    className="w-14 h-14 bg-surface-primary rounded-full"
                    aria-hidden="true"
                  />
                  <div className="ml-2">
                    <h2 className="text-text-primary font-semibold">{review.customer}</h2>
                    <p className="text-sm text-text-secondary">{review.date}</p>
                  </div>
                </div>

                {/* Review description */}
                <div className="w-[385px] h-[145px] mx-5 mb-2">
                  <p className="overflow-hidden text-ellipsis whitespace-normal line-clamp-6 text-text-primary">
                    {review.description}
                  </p>
                </div>

                {/* Read more action */}
                <div className="flex justify-end p-4">
                  <div 
                    className="rounded-full bg-surface-primary cursor-pointer p-2 inline-block transition-colors duration-200 hover:bg-surface-disabled"
                  >
                    <ArrowUpRightIcon className="w-6 text-text-primary" aria-hidden="true" />
                  </div>
                </div>
              </article>
            </Link>
          ))}
          {/* Spacer for smooth scrolling end */}
          <div className="bg-transparent lg:w-[48px] w-[8px] h-[295px] flex-none" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}


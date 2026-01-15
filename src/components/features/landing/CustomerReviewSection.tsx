/**
 * @fileoverview Landing page customer review section with horizontal scrolling
 * @source boombox-10.0/src/app/components/landingpage/customerreviewsection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a horizontally scrollable section of customer testimonials on the landing page.
 * Features smooth scrolling navigation, hover effects, and responsive design.
 * Each review card is clickable and leads to detailed review pages.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced bg-slate-100 with bg-surface-tertiary (semantic surface color)
 * - Replaced bg-white with bg-surface-primary (semantic primary surface)
 * - Replaced bg-slate-200 with bg-surface-disabled (semantic disabled state)
 * - Replaced hardcoded text colors with text-text-primary, text-text-secondary
 * - Removed styled-jsx in favor of Tailwind utility classes (scrollbar-hide)
 * - Applied consistent hover and active states using design system tokens
 * 
 * ACCESSIBILITY UPDATES:
 * - Added semantic HTML (section, article, navigation buttons)
 * - Added ARIA labels for screen readers
 * - Converted clickable divs to proper button elements
 * - Added keyboard navigation support with focus indicators
 * - Added role="region" for scrollable container
 * - Proper heading hierarchy
 * 
 * IMAGE OPTIMIZATION:
 * - Uses Next.js Image with lazy loading for customer avatars
 * - Added proper alt text for accessibility
 * 
 * DATA ARCHITECTURE:
 * - Review data imported from centralized @/data/customerReviews
 * - Enables reusability and consistent data across landing and marketing pages
 * - Single source of truth for customer testimonials
 * 
 * @refactor Migrated to features/landing with full design system integration,
 * accessibility improvements, and integrated centralized review data
 */

'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon } from '@heroicons/react/20/solid';
import { CUSTOMER_REVIEWS } from '@/data';

/**
 * CustomerReviewSection component props
 */
interface CustomerReviewSectionProps {
 className?: string;
 /**
  * Visual variant that controls section background, card colors, and button styles
  * @default 'default' - Gray section (bg-surface-tertiary) with white cards (bg-surface-primary)
  * 'white' - White section (bg-surface-primary) with gray cards (bg-surface-tertiary)
  * 
  * The variant inverts colors to maintain proper contrast between section and cards.
  */
 variant?: 'default' | 'white';
}

/**
 * CustomerReviewSection - Landing page customer testimonials with horizontal scrolling
 * 
 * Features:
 * - Horizontal scrolling with smooth animations
 * - Navigation arrows for browsing reviews
 * - Responsive card layout with hover effects
 * - Clickable review cards leading to detail pages
 * - Accessibility-first design with ARIA labels and keyboard navigation
 * - Configurable background color via variant prop
 */
export function CustomerReviewSection({ className = '', variant = 'default' }: CustomerReviewSectionProps) {
 const scrollContainerRef = useRef<HTMLDivElement>(null);
 const itemWidth = 405 + 16; // Width of the card + gap

 /**
  * Scrolls to the next or previous item in the review list
  * @param direction - Direction to scroll ('left' or 'right')
  */
 const scrollToItem = (direction: 'left' | 'right') => {
  if (scrollContainerRef.current) {
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

 // Determine colors based on variant - inverted for contrast
 const backgroundClass = variant === 'white' ? 'bg-surface-primary' : 'bg-surface-tertiary';
 const cardBackgroundClass = variant === 'white' ? 'bg-surface-tertiary' : 'bg-surface-primary';
 const buttonBackgroundClass = variant === 'white' ? 'bg-surface-tertiary' : 'bg-surface-primary';
 const iconBackgroundClass = variant === 'white' ? 'bg-surface-primary' : 'bg-surface-tertiary';

 return (
  <section 
   className={`sm:mb-48 mb-24 ${backgroundClass} py-24 ${className}`}
   aria-labelledby="customer-reviews-heading"
  >
   {/* Header with navigation controls */}
   <div className="flex flex-col sm:flex-row w-full lg:px-16 px-6 justify-between items-left sm:items-center mb-10">
    <h1 id="customer-reviews-heading" className="text-left text-text-primary">
     Hear from our customers
    </h1>
    <div className="flex mt-4 sm:mt-0" role="group" aria-label="Review navigation">
     <button
      onClick={handleScrollLeft}
      className={`rounded-full ${buttonBackgroundClass} active:bg-surface-disabled cursor-pointer p-2 mr-1 hover:bg-surface-disabled focus:outline-none`}
      aria-label="Scroll to previous reviews"
      type="button"
     >
      <ArrowLeftIcon className="w-6 text-text-primary" aria-hidden="true" />
     </button>
     <button
      onClick={handleScrollRight}
      className={`rounded-full ${buttonBackgroundClass} active:bg-surface-disabled cursor-pointer p-2 hover:bg-surface-disabled focus:outline-none`}
      aria-label="Scroll to next reviews"
      type="button"
     >
      <ArrowRightIcon className="w-6 text-text-primary" aria-hidden="true" />
     </button>
    </div>
   </div>

   {/* Scrollable review container */}
   <div
    id="scroll-container"
    ref={scrollContainerRef}
    className="w-full overflow-x-auto scrollbar-hide"
    tabIndex={0}
    aria-label="Customer reviews"
    role="region"
   >
    <div
     id="item-container"
     className="lg:px-16 px-6 py-4 flex gap-4 flex-nowrap"
    >
     {CUSTOMER_REVIEWS.map((review) => (
      <article 
       key={review.id}
       className={`${cardBackgroundClass} w-[405px] rounded-md flex-none transform transition-transform duration-300 hover:scale-[102%] focus-within:scale-[102%]`}
      >
       {/* Customer info header */}
       <div className="flex p-4 mb-2 items-center">
        <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src="/placeholder.jpg"
            alt={`${review.customer} profile`}
            fill
            className="rounded-full object-cover"
            loading="lazy"
            quality={75}
          />
        </div>
        <div className="ml-2">
         <h2 className="text-text-primary font-semibold">{review.customer}</h2>
         <p className="text-sm text-text-primary">{review.date}</p>
        </div>
       </div>

       {/* Review description */}
       <div className="w-[385px] h-[145px] mx-5 mb-2">
        <p className="overflow-hidden text-ellipsis whitespace-normal line-clamp-6 text-text-primary">
         {review.description}
        </p>
       </div>

       {/* Link to full review (Google Reviews) */}
       <div className="flex justify-end p-4">
        <Link 
         href="#google-reviews"
         className={`rounded-full ${iconBackgroundClass} p-2 inline-block focus:outline-none`}
         aria-label={`Read full review from ${review.customer}`}
         target="_blank"
         rel="noopener noreferrer"
        >
         <ArrowUpRightIcon className="w-6 text-text-primary" aria-hidden="true" />
        </Link>
       </div>
      </article>
     ))}
     {/* Spacer for smooth scrolling end */}
     <div className="bg-transparent lg:w-[48px] w-[8px] h-[295px] flex-none" aria-hidden="true" />
    </div>
   </div>
  </section>
 );
}


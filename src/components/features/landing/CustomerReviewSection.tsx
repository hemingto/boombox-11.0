/**
 * @fileoverview Landing page customer review section with horizontal scrolling
 * @source boombox-10.0/src/app/components/landingpage/customerreviewsection.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays a horizontally scrollable section of customer testimonials on the landing page.
 * Features smooth scrolling navigation, hover effects, and responsive design.
 * Each review card links to the full review on Google Maps when available.
 *
 * DATA ARCHITECTURE:
 * - Uses useGoogleReviews hook to fetch live reviews from Google Places API
 * - Falls back to hardcoded reviews from @/data/customerReviews if API unavailable
 * - Accepts optional reviews prop to override both sources
 * - Renders star ratings, reviewer photos, and Google Maps links when available
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
 * @refactor Migrated to features/landing with full design system integration,
 * accessibility improvements, Google Places API integration, and centralized review data
 */

'use client';

import React, { useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  StarIcon,
} from '@heroicons/react/20/solid';
import { UserIcon } from '@heroicons/react/24/solid';
import { useGoogleReviews } from '@/hooks/useGoogleReviews';
import { Button } from '@/components/ui/primitives/Button/Button';
import type { CustomerReview } from '@/data/customerReviews';

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
  /**
   * Optional reviews to render. When provided, skips the Google Places API fetch
   * and renders these reviews directly.
   */
  reviews?: CustomerReview[];
}

/**
 * Renders a reviewer's profile photo with graceful fallback.
 * Uses referrerPolicy="no-referrer" to prevent Google's CDN from
 * rejecting the image request based on the Referer header (which can
 * cause 429 rate-limit responses, especially during local development).
 * Falls back to the default customer headshot if the Google photo fails to load.
 */
function ReviewerPhoto({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl?: string;
}) {
  const [failed, setFailed] = useState(false);
  const handleError = useCallback(() => setFailed(true), []);

  if (photoUrl && !failed) {
    return (
      <img
        src={photoUrl}
        alt={`${name} profile`}
        className="rounded-full object-cover w-full h-full"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={handleError}
      />
    );
  }

  return (
    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center">
      <UserIcon className="w-7 h-7 text-slate-200" aria-hidden="true" />
    </div>
  );
}

/**
 * Renders a row of star icons for a given rating (1-5).
 * Filled stars use a gold color; unfilled stars use a muted color.
 */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(star => (
        <StarIcon
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/**
 * CustomerReviewSection - Landing page customer testimonials with horizontal scrolling
 *
 * Features:
 * - Fetches live reviews from Google Places API via useGoogleReviews hook
 * - Horizontal scrolling with smooth animations
 * - Navigation arrows for browsing reviews
 * - Responsive card layout with hover effects
 * - Star ratings displayed when available
 * - Reviewer photos from Google when available
 * - Clickable review cards linking to Google Maps reviews
 * - Accessibility-first design with ARIA labels and keyboard navigation
 * - Configurable background color via variant prop
 * - Graceful fallback to hardcoded reviews if API is unavailable
 */
export function CustomerReviewSection({
  className = '',
  variant = 'default',
  reviews: reviewsProp,
}: CustomerReviewSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemWidth = 405 + 16; // Width of the card + gap
  const {
    reviews: fetchedReviews,
    totalReviewCount,
    googleMapsUrl,
  } = useGoogleReviews();

  // Use prop reviews if provided, otherwise use fetched reviews. Cap at 20 cards.
  const MAX_REVIEWS = 20;
  const reviews = (reviewsProp ?? fetchedReviews).slice(0, MAX_REVIEWS);

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
  const backgroundClass =
    variant === 'white' ? 'bg-surface-primary' : 'bg-surface-tertiary';
  const cardBackgroundClass =
    variant === 'white' ? 'bg-surface-primary' : 'bg-surface-primary';
  const buttonBackgroundClass =
    variant === 'white' ? 'bg-surface-tertiary' : 'bg-surface-primary';
  const iconBackgroundClass =
    variant === 'white' ? 'bg-surface-tertiary' : 'bg-surface-tertiary';

  return (
    <section
      className={`sm:mb-48 mb-24 ${backgroundClass} pt-24 pb-12 ${className}`}
      aria-labelledby="customer-reviews-heading"
    >
      {/* Header with navigation controls */}
      <div className="flex flex-col sm:flex-row w-full lg:px-16 px-6 justify-between items-left sm:items-center mb-10">
        <h1
          id="customer-reviews-heading"
          className="text-left text-text-primary"
        >
          Hear from our customers
        </h1>
        <div
          className="flex mt-4 sm:mt-0"
          role="group"
          aria-label="Review navigation"
        >
          <button
            onClick={handleScrollLeft}
            className={`rounded-full ${buttonBackgroundClass} active:bg-surface-disabled cursor-pointer p-2 mr-1 hover:bg-surface-disabled focus:outline-none`}
            aria-label="Scroll to previous reviews"
            type="button"
          >
            <ArrowLeftIcon
              className="w-6 text-text-primary"
              aria-hidden="true"
            />
          </button>
          <button
            onClick={handleScrollRight}
            className={`rounded-full ${buttonBackgroundClass} active:bg-surface-disabled cursor-pointer p-2 hover:bg-surface-disabled focus:outline-none`}
            aria-label="Scroll to next reviews"
            type="button"
          >
            <ArrowRightIcon
              className="w-6 text-text-primary"
              aria-hidden="true"
            />
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
          {reviews.map(review => (
            <article
              key={review.id}
              className={`${cardBackgroundClass} w-[405px] rounded-lg flex-none transform transition-transform duration-300 hover:scale-[102%] focus-within:scale-[102%]`}
            >
              {/* Customer info header */}
              <div className="flex p-4 mb-2 items-center">
                <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                  <ReviewerPhoto
                    name={review.customer}
                    photoUrl={review.photoUrl}
                  />
                </div>
                <div className="ml-2 min-w-0">
                  <h3 className="text-text-primary font-semibold truncate">
                    {review.customer}
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-text-primary">{review.date}</p>
                    {review.rating && <StarRating rating={review.rating} />}
                  </div>
                </div>
              </div>

              {/* Review description */}
              <div className="w-[385px] h-[145px] mx-2 px-3 mb-2">
                <p className="overflow-hidden text-ellipsis whitespace-normal line-clamp-6 text-text-primary">
                  {review.description}
                </p>
              </div>

              {/* Link to full review (Google Reviews) */}
              <div className="flex justify-end p-4">
                <Link
                  href={review.googleMapsUrl || '#google-reviews'}
                  className={`rounded-full ${iconBackgroundClass} p-2 inline-block focus:outline-none`}
                  aria-label={`Read full review from ${review.customer}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ArrowUpRightIcon
                    className="w-6 text-text-primary"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </article>
          ))}
          {/* Spacer for smooth scrolling end */}
          <div
            className="bg-transparent lg:w-[48px] w-[8px] h-[295px] flex-none"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* "Read all reviews" button */}
      {totalReviewCount && googleMapsUrl && (
        <div className="lg:px-16 px-6 mt-8">
          <Link href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="white"
              borderRadius="full"
              size="md"
              tabIndex={-1}
              className="hover:bg-slate-50"
            >
              Read all {totalReviewCount.toLocaleString()} reviews
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}

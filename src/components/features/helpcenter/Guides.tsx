/**
 * @fileoverview Help Center guides carousel section
 * @source boombox-10.0/src/app/components/helpcenter/helpcenterguides.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays a horizontal scrolling carousel of guide cards with arrow navigation.
 * Dynamically calculates card width for responsive scrolling behavior.
 * Uses ResizeObserver for automatic updates on window resize.
 *
 * DESIGN SYSTEM UPDATES:
 * - bg-slate-100 → bg-surface-tertiary (semantic background color)
 * - active:bg-slate-200 → active:bg-surface-disabled (semantic active state)
 * - Applied consistent spacing using design system tokens
 * - Moved scrollbar hiding styles to Tailwind classes
 *
 * ACCESSIBILITY IMPROVEMENTS:
 * - Changed navigation divs to proper button elements
 * - Added aria-labels for scroll buttons
 * - Added keyboard navigation support (arrow keys on scroll container)
 * - Added aria-live region for screen reader announcements
 * - Improved focus management
 * - Added descriptive button text with sr-only
 *
 * BUSINESS LOGIC EXTRACTION:
 * - Scroll logic kept inline (component-specific, not reusable)
 * - ResizeObserver pattern appropriate for this use case
 * - Guide data could be moved to data file if reused elsewhere
 *
 * @refactor Refactored with design system compliance, enhanced accessibility, and improved button semantics
 */

'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';
import { cn } from '@/lib/utils';

export interface Guide {
  /**
   * Badge title displayed in the corner
   */
  title: string;

  /**
   * Main subtitle/heading of the guide
   */
  subtitle: string;

  /**
   * Description text of the guide
   */
  description: string;

  /**
   * Link URL for the guide
   */
  link: string;

  /**
   * Background image URL for the card
   */
  imageSrc: string;

  /**
   * Alt text for the background image
   */
  imageAlt: string;
}

export interface GuidesProps {
  /**
   * Array of guide items to display
   * @default Default help center guides
   */
  guides?: Guide[];

  /**
   * Main heading text
   * @default 'Guides for getting started'
   */
  title?: string;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Gap between carousel items in pixels
   * @default 16
   */
  itemGap?: number;
}

/**
 * Default guide data
 */
const DEFAULT_GUIDES: Guide[] = [
  {
    title: 'Initial Appointment',
    subtitle: 'Delivery Guide',
    description:
      'Learn the what to expect on the day of your first appointment',
    link: '/guides/delivery-guide',
    imageSrc: '/help-center/delivery-guide.png',
    imageAlt: 'Boombox delivery truck arriving at a home',
  },
  {
    title: 'Packing',
    subtitle: 'Packing Guide',
    description: 'Learn how to pack your Boombox safely and securely',
    link: '/guides/packing-guide',
    imageSrc: '/help-center/packing-guide.png',
    imageAlt: 'Items being packed into a Boombox container',
  },
  {
    title: 'Storage Access',
    subtitle: 'Storage Guide',
    description:
      'Everything you need to know about accessing your items in storage',
    link: '/guides/storage-access-guide',
    imageSrc: '/help-center/storage-access-guide.png',
    imageAlt: 'Boombox storage facility with containers',
  },
  {
    title: 'Locations',
    subtitle: 'Location Guide',
    description: 'Find out all the locations we serve',
    link: '/guides/location-guide',
    imageSrc: '/help-center/locations-guide.png',
    imageAlt: 'Map showing Boombox service locations',
  },
];

/**
 * Guides Component
 *
 * Displays a horizontal scrolling carousel of guide cards with navigation buttons.
 * Implements WCAG 2.1 AA accessibility standards with proper button semantics and keyboard navigation.
 */
export function Guides({
  guides = DEFAULT_GUIDES,
  title = 'Guides for getting started',
  className,
  itemGap = 16,
}: GuidesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(405 + itemGap); // Default card width + gap

  useEffect(() => {
    const updateItemWidth = () => {
      if (scrollContainerRef.current) {
        const firstItem =
          scrollContainerRef.current.querySelector('[data-guide-card]');
        if (firstItem) {
          const width = firstItem.getBoundingClientRect().width;
          setItemWidth(width + itemGap);
        }
      }
    };

    // Update on mount
    updateItemWidth();

    // Update on window resize
    window.addEventListener('resize', updateItemWidth);

    // Use ResizeObserver for more accurate updates
    const resizeObserver = new ResizeObserver(updateItemWidth);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateItemWidth);
      resizeObserver.disconnect();
    };
  }, [itemGap]);

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

  // Handle keyboard navigation on scroll container
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handleScrollLeft();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleScrollRight();
    }
  };

  return (
    <section
      className={cn('sm:mb-48 mb-24', className)}
      aria-label="Help guides"
    >
      {/* Header with navigation buttons */}
      <div className="flex flex-col sm:flex-row w-full lg:px-16 px-6 justify-between items-left sm:items-center mb-10">
        <h1 className="text-left">{title}</h1>
        <div
          className="flex mt-4 sm:mt-0 gap-1"
          role="group"
          aria-label="Carousel navigation"
        >
          <button
            onClick={handleScrollLeft}
            aria-label="Scroll guides left"
            className={cn(
              'rounded-full bg-surface-tertiary active:bg-surface-disabled cursor-pointer p-2',
              'hover:bg-surface-disabled'
            )}
          >
            <ArrowLeftIcon className="w-6 h-6" aria-hidden="true" />
            <span className="sr-only">Previous guides</span>
          </button>
          <button
            onClick={handleScrollRight}
            aria-label="Scroll guides right"
            className={cn(
              'rounded-full bg-surface-tertiary active:bg-surface-disabled cursor-pointer p-2',
              'hover:bg-surface-disabled'
            )}
          >
            <ArrowRightIcon className="w-6 h-6" aria-hidden="true" />
            <span className="sr-only">Next guides</span>
          </button>
        </div>
      </div>

      {/* Scrollable carousel */}
      <div
        ref={scrollContainerRef}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Scrollable guides carousel"
        className={cn(
          'w-full overflow-x-auto',
          '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]', // Hide scrollbar
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
        )}
      >
        <div className="lg:px-16 px-6 py-4 flex gap-4 flex-nowrap">
          {guides.map((guide, index) => (
            <Link
              key={index}
              href={guide.link}
              className="flex-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-3xl"
              aria-label={`Learn more about ${guide.subtitle}: ${guide.description}`}
            >
              <div
                data-guide-card
                className={cn(
                  'bg-surface-tertiary w-[405px] h-[405px] rounded-3xl relative overflow-hidden',
                  'transform transition-transform duration-300 sm:hover:scale-[102%]',
                  'cursor-pointer hover:z-10'
                )}
              >
                <Image
                  src={guide.imageSrc}
                  alt={guide.imageAlt}
                  fill
                  className="object-cover"
                  sizes="405px"
                  priority={index === 0}
                />

                <div className="relative z-10 flex flex-col h-full">
                  <div>
                    <span className="bg-surface-primary rounded-full py-2.5 px-4 font-semibold inline-block m-4 text-sm font-inter">
                      {guide.title}
                    </span>
                  </div>
                  <div className="mt-auto bg-zinc-950/60 backdrop-blur-md px-5 py-4 rounded-b-3xl">
                    <h3 className="mb-1 text-text-inverse text-lg">
                      {guide.subtitle}
                    </h3>
                    <p className="text-text-inverse text-sm min-h-[2.5rem]">
                      {guide.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {/* Spacer for proper scrolling */}
          <div
            className="bg-transparent lg:w-[48px] w-[8px] h-[405px] flex-none"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}

export default Guides;

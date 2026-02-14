/**
 * @fileoverview How It Works section component for the landing page.
 * @source boombox-10.0/src/app/components/landingpage/howitworksection.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays a horizontal scrolling section showcasing the 4-step process of using Boombox services.
 * Features:
 * - Responsive card layout with smooth horizontal scrolling
 * - Navigation buttons for left/right scrolling
 * - Dynamic width calculation using ResizeObserver for responsive behavior
 * - Links to detailed "How It Works" page
 *
 * DESIGN SYSTEM UPDATES:
 * - Replaced `bg-slate-100` with `bg-surface-tertiary` for card backgrounds
 * - Replaced `bg-slate-200` with `bg-surface-disabled` for active button states
 * - Replaced `bg-white` with `bg-surface-primary` for step badges
 * - Moved inline scrollbar hiding styles to Tailwind utilities
 * - Applied consistent spacing and padding using design system tokens
 *
 * ACCESSIBILITY IMPROVEMENTS:
 * - Uses `<section>` element with descriptive `aria-label`
 * - Navigation buttons are proper `<button>` elements with ARIA labels
 * - Keyboard navigation support for scroll container
 * - Proper heading hierarchy with `<h1>` and `<h2>`
 * - Links have descriptive accessible names
 * - Focus management for keyboard users
 *
 * BUSINESS LOGIC PRESERVED:
 * - Exact same ResizeObserver behavior for responsive width calculations
 * - Same smooth scroll navigation logic
 * - Same card dimensions and responsive breakpoints
 * - Same step content and structure
 *
 * @refactor Refactored to use design system, improve accessibility, and align with boombox-11.0 structure.
 */

'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';
import { cn } from '@/lib/utils';

/**
 * Step data interface
 */
interface Step {
  /**
   * Step number label (e.g., "Step 1")
   */
  title: string;
  /**
   * Step action/subtitle (e.g., "Request")
   */
  subtitle: string;
  /**
   * Step description text
   */
  description: string;
  /**
   * Optional background image URL for the card
   */
  image?: string;
}

export interface HowItWorksSectionProps {
  /**
   * Optional additional CSS classes for the section container
   */
  className?: string;

  /**
   * Optional custom step data (defaults to standard 4-step process)
   */
  steps?: Step[];

  /**
   * Target URL for step cards (defaults to '/howitworks')
   */
  linkUrl?: string;

  /**
   * Section heading (defaults to 'How it works')
   */
  heading?: string;
}

/**
 * Default steps for the How It Works process
 */
const DEFAULT_STEPS: Step[] = [
  {
    title: 'Step 1',
    subtitle: 'Request',
    description: "Book online. We'll arrive where and when you need us.",
    image: '/howitworks/step-1a.png',
  },
  {
    title: 'Step 2',
    subtitle: 'Pack',
    description:
      'Our team will help you pack your belongings safely and securely.',
    image: '/howitworks/step-2d.png',
  },
  {
    title: 'Step 3',
    subtitle: 'Store',
    description:
      'We provide a safe and secure storage solution for your items.',
    image: '/howitworks/step-3b.png',
  },
  {
    title: 'Step 4',
    subtitle: 'Deliver',
    description:
      'We deliver your items to your desired location at your convenience.',
    image: '/howitworks/step-4c.png',
  },
];

/**
 * HowItWorksSection Component
 *
 * Displays a horizontally scrollable section showing the Boombox service process.
 *
 * @example
 * ```tsx
 * <HowItWorksSection />
 * ```
 *
 * @example With custom steps
 * ```tsx
 * <HowItWorksSection
 *  steps={customSteps}
 *  linkUrl="/custom-page"
 *  heading="Our Process"
 * />
 * ```
 */
export function HowItWorksSection({
  className,
  steps = DEFAULT_STEPS,
  linkUrl = '/howitworks',
  heading = 'How it works',
}: HowItWorksSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(297.6 + 16); // Default to mobile width + gap

  // Update item width dynamically for responsive scrolling
  useEffect(() => {
    const updateItemWidth = () => {
      if (scrollContainerRef.current) {
        const firstItem =
          scrollContainerRef.current.querySelector('[data-step-card]');
        if (firstItem) {
          const width = firstItem.getBoundingClientRect().width;
          setItemWidth(width + 16); // width + gap (gap-4 = 16px)
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
  }, []);

  // Scroll to next/previous item
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

  return (
    <section
      className={cn('sm:mb-48 mb-24', className)}
      aria-labelledby="how-it-works-heading"
    >
      {/* Header with navigation buttons */}
      <div className="flex flex-col sm:flex-row w-full lg:px-16 px-6 justify-between items-left sm:items-center sm:mb-10 mb-4">
        <h1 id="how-it-works-heading" className="text-left">
          {heading}
        </h1>
        <div
          className="flex mt-4 sm:mt-0 gap-1"
          role="group"
          aria-label="Scroll navigation"
        >
          <button
            onClick={handleScrollLeft}
            className="rounded-full bg-surface-tertiary active:bg-surface-disabled hover:bg-surface-disabled cursor-pointer p-2"
            aria-label="Scroll left to previous step"
            type="button"
          >
            <ArrowLeftIcon className="w-6" aria-hidden="true" />
          </button>
          <button
            onClick={handleScrollRight}
            className="rounded-full bg-surface-tertiary active:bg-surface-disabled hover:bg-surface-disabled cursor-pointer p-2"
            aria-label="Scroll right to next step"
            type="button"
          >
            <ArrowRightIcon className="w-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="w-full overflow-x-auto scrollbar-hide"
        tabIndex={0}
        aria-label="How it works steps - use arrow keys or scroll to navigate"
      >
        <div className="lg:px-16 px-6 py-4 flex gap-4 flex-nowrap">
          {steps.map((step, index) => (
            <Link
              key={index}
              href={linkUrl}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-3xl shadow-none focus:shadow-none active:shadow-none active:ring-0"
              aria-label={`Learn more about ${step.subtitle}: ${step.description}`}
            >
              <div
                data-step-card
                className="bg-surface-tertiary w-[297.6px] sm:w-[372px] h-[569.6px] sm:h-[712px] rounded-3xl flex-none transform transition-transform duration-300 sm:hover:scale-[102%] cursor-pointer hover:z-10 relative overflow-hidden"
              >
                {/* Background image */}
                {step.image && (
                  <Image
                    src={step.image}
                    alt="" // Empty alt since decorative; main content has semantic meaning
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 298px, 372px"
                    priority={index === 0} // Prioritize first image for LCP
                  />
                )}

                {/* Optional gradient overlay for better text readability */}
                <div
                  className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent"
                  aria-hidden="true"
                />

                {/* Content overlay */}
                <div className="relative z-10">
                  <span className="bg-surface-primary rounded-full py-2.5 px-4 font-semibold inline-block m-4 text-sm font-inter">
                    {step.title}
                  </span>
                  <h2 className="ml-5 mb-2 text-text-inverse">
                    {step.subtitle}
                  </h2>
                  <p className="mx-5 text-text-inverse">{step.description}</p>
                </div>
              </div>
            </Link>
          ))}
          {/* Spacer for better scroll ending */}
          <div
            className="bg-transparent lg:w-[48px] w-[8px] h-[569.6px] sm:h-[712px] flex-none"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}

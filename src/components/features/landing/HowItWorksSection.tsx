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

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Draws the next image from a shuffle bag stored in sessionStorage.
 * Every image is shown once before the pool reshuffles, preventing repeats.
 */
function drawFromShuffleBag(storageKey: string, allImages: string[]): string {
  try {
    const stored = sessionStorage.getItem(storageKey);
    let remaining: string[] = stored ? JSON.parse(stored) : [];

    if (remaining.length === 0) {
      remaining = shuffleArray(allImages);
    }

    const selected = remaining.pop()!;
    sessionStorage.setItem(storageKey, JSON.stringify(remaining));
    return selected;
  } catch {
    return allImages[Math.floor(Math.random() * allImages.length)];
  }
}

const STEP_1_IMAGES = [
  '/howitworks/step-1-vertical/step-1.png',
  '/howitworks/step-1-vertical/step-1a.png',
  '/howitworks/step-1-vertical/step-1b.png',
  '/howitworks/step-1-vertical/step-1c.png',
  '/howitworks/step-1-vertical/step-1d.png',
  '/howitworks/step-1-vertical/step-1e.png',
  '/howitworks/step-1-vertical/step-1f.png',
  '/howitworks/step-1-vertical/step-1g.png',
  '/howitworks/step-1-vertical/step-1h.png',
  '/howitworks/step-1-vertical/step-1i.png',
];

const STEP_2_IMAGES = [
  '/howitworks/step-2-vertical/step-2a.png',
  '/howitworks/step-2-vertical/step-2b.png',
  '/howitworks/step-2-vertical/step-2c.png',
  '/howitworks/step-2-vertical/step-2d.png',
  '/howitworks/step-2-vertical/step-2e.png',
  '/howitworks/step-2-vertical/step-2f.png',
  '/howitworks/step-2-vertical/step-2g.png',
  '/howitworks/step-2-vertical/step-2h.png',
  '/howitworks/step-2-vertical/step-2i.png',
  '/howitworks/step-2-vertical/step-2j.png',
  '/howitworks/step-2-vertical/step-2k.png',
  '/howitworks/step-2-vertical/step-2l.png',
  '/howitworks/step-2-vertical/step-2m.png',
  '/howitworks/step-2-vertical/step-2n.png',
  '/howitworks/step-2-vertical/step-2o.png',
];

const STEP_4_IMAGES = [
  '/howitworks/step-4-vertical/step-4.png',
  '/howitworks/step-4-vertical/step-4a.png',
  '/howitworks/step-4-vertical/step-4b.png',
  '/howitworks/step-4-vertical/step-4c.png',
  '/howitworks/step-4-vertical/step-4d.png',
  '/howitworks/step-4-vertical/step-4e.png',
  '/howitworks/step-4-vertical/step-4f.png',
  '/howitworks/step-4-vertical/step-4g.png',
  '/howitworks/step-4-vertical/step-4h.png',
  '/howitworks/step-4-vertical/step-4i.png',
  '/howitworks/step-4-vertical/step-4j.png',
  '/howitworks/step-4-vertical/step-4k.png',
];

/**
 * Default steps for the How It Works process
 */
const DEFAULT_STEPS: Step[] = [
  {
    title: 'Step 1',
    subtitle: 'Request',
    description: "Book online. We'll arrive where and when you need us.",
    image: '/howitworks/step-1.png',
  },
  {
    title: 'Step 2',
    subtitle: 'Pack',
    description:
      'Pack your belongings safely and securely. Do it yourself or hire a local pro.',
    image: '/howitworks/step-2.png',
  },
  {
    title: 'Step 3',
    subtitle: 'Store',
    description:
      'We provide a safe and secure storage location for your items.',
    image: '/howitworks/step-3-3.png',
  },
  {
    title: 'Step 4',
    subtitle: 'Deliver',
    description:
      'We deliver your items to your desired address at your convenience.',
    image: '/howitworks/step-4.png',
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
  const [step1Image, setStep1Image] = useState(STEP_1_IMAGES[0]);
  const [step2Image, setStep2Image] = useState(STEP_2_IMAGES[0]);
  const [step4Image, setStep4Image] = useState(STEP_4_IMAGES[0]);

  useEffect(() => {
    setStep1Image(drawFromShuffleBag('hiw-step1', STEP_1_IMAGES));
    setStep2Image(drawFromShuffleBag('hiw-step2', STEP_2_IMAGES));
    setStep4Image(drawFromShuffleBag('hiw-step4', STEP_4_IMAGES));
  }, []);

  const resolvedSteps =
    steps === DEFAULT_STEPS
      ? steps.map((step, i) => {
          if (i === 0) return { ...step, image: step1Image };
          if (i === 1) return { ...step, image: step2Image };
          if (i === 3) return { ...step, image: step4Image };
          return step;
        })
      : steps;

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
          {resolvedSteps.map((step, index) => (
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
                  <h2 className="ml-5 mb-2 text-text-inverse drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                    {step.subtitle}
                  </h2>
                  <p className="mx-5 text-text-inverse drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                    {step.description}
                  </p>
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

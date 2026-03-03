/**
 * @fileoverview Items that fit in a Boombox section
 * @source boombox-10.0/src/app/components/storagecalculator/itemsthatfitsection.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays a horizontal scrollable list of large items that can fit in a Boombox
 * storage unit. Features smooth snap-to-item scrolling with navigation arrows.
 *
 * DESIGN SYSTEM UPDATES:
 * - Uses Next.js Image component for images
 * - Updated to use semantic color tokens (bg-surface-tertiary, text-text-primary)
 * - Applied design system button patterns for scroll controls
 * - Enhanced accessibility with proper ARIA labels and keyboard navigation
 *
 * @refactor
 * - Renamed from itemsthatfitsection.tsx to ItemsThatFitSection.tsx (PascalCase)
 * - Extracted scroll logic to useHorizontalScroll hook
 * - Uses Next.js Image for better performance
 * - Improved TypeScript interfaces for better type safety
 * - Enhanced accessibility with semantic HTML and ARIA attributes
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';
import { CheckIcon } from '@heroicons/react/20/solid';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';

interface ItemCard {
  icon: React.ReactNode;
  subtitle: string;
  description: string;
  imageSrc: string;
  imageAlt?: string;
}

/**
 * Main items that fit section component
 */
export function ItemsThatFitSection() {
  const { scrollContainerRef, handleScrollLeft, handleScrollRight } =
    useHorizontalScroll({
      gap: 16,
    });

  // Item content data
  const items: ItemCard[] = [
    {
      icon: <CheckIcon className="w-6 h-6" />,
      subtitle: 'King Mattress',
      description:
        'A Boombox can fit a California King mattress standing up. The height of the container is 90" giving you about 6 inches of clearance for your mattress.',
      imageSrc: '/storage-calculator/king-mattress-3.png',
    },
    {
      icon: <CheckIcon className="w-6 h-6" />,
      subtitle: '3 Seat Sofa',
      description:
        'The inside length of a Boombox is 90" and can fit most 3 seat sofas. Please make sure to measure before loading to make sure your sofa isn\'t longer than 90".',
      imageSrc: '/storage-calculator/three-seat-couch.png',
    },
    {
      icon: <CheckIcon className="w-6 h-6" />,
      subtitle: 'Large Dining Table',
      description:
        'Your Boombox can fit most 6 seat dining tables. As long as the table top is less than 90". We recommend taking the legs off your dining table before loading to ensure it is safely stored.',
      imageSrc: '/storage-calculator/dining-table.png',
    },
    {
      icon: <CheckIcon className="w-6 h-6" />,
      subtitle: '50 Medium Boxes',
      description:
        'The Boombox can fit up to 50 medium boxes with the following dimensions 18-1/8" x 18" x 16". Make sure to stack lighter boxes on top of heavier boxes.',
      imageSrc: '/storage-calculator/boxes.png',
    },
  ];

  return (
    <section
      className="sm:mb-48 mb-24"
      aria-labelledby="items-that-fit-heading"
    >
      {/* Header with navigation controls */}
      <div className="flex flex-col sm:flex-row w-full lg:px-16 px-6 justify-between items-left sm:items-center mb-10">
        <h1 id="items-that-fit-heading" className="text-left text-text-primary">
          What large items fit in a Boombox?
        </h1>
        <div
          className="flex mt-4 sm:mt-0 gap-2"
          role="group"
          aria-label="Scroll navigation"
        >
          <button
            onClick={handleScrollLeft}
            className="rounded-full bg-surface-tertiary active:bg-surface-disabled hover:bg-surface-disabled cursor-pointer p-2"
            aria-label="Scroll to previous item"
          >
            <ArrowLeftIcon
              className="w-6 text-text-primary"
              aria-hidden="true"
            />
          </button>
          <button
            onClick={handleScrollRight}
            className="rounded-full bg-surface-tertiary active:bg-surface-disabled hover:bg-surface-disabled cursor-pointer p-2"
            aria-label="Scroll to next item"
          >
            <ArrowRightIcon
              className="w-6 text-text-primary"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Scrollable items container */}
      <div
        id="scroll-container"
        className="w-full overflow-x-auto hide-scrollbar"
        ref={scrollContainerRef}
        tabIndex={0}
        role="region"
        aria-label="Scrollable items that fit in a Boombox"
      >
        <div
          id="item-container"
          className="lg:px-16 px-6 py-4 flex gap-4 flex-nowrap"
          role="list"
        >
          {items.map((item, index) => (
            <div key={index} role="listitem" className="flex-none">
              <article className="bg-surface-tertiary w-[297.6px] sm:w-[372px] h-[569.6px] sm:h-[712px] rounded-3xl transform transition-transform duration-300 sm:hover:scale-[102%] hover:z-10 relative overflow-hidden">
                {/* Background image */}
                <Image
                  src={item.imageSrc}
                  alt={item.imageAlt || `${item.subtitle} in Boombox storage`}
                  fill
                  className="object-cover"
                  loading="lazy"
                  quality={80}
                  sizes="(max-width: 640px) 297.6px, 372px"
                />

                {/* Gradient overlay for text readability */}
                <div
                  className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent"
                  aria-hidden="true"
                />

                {/* Content overlay */}
                <div className="relative z-10">
                  {/* Icon badge */}
                  <div className="bg-surface-primary rounded-full py-2.5 px-2.5 font-semibold inline-block ml-4 mt-4 mb-2 text-sm">
                    <span className="text-text-primary" aria-hidden="true">
                      {item.icon}
                    </span>
                  </div>

                  <h2 className="ml-5 mb-2 text-xl font-semibold text-text-inverse">
                    {item.subtitle}
                  </h2>
                  <p className="mx-5 text-text-inverse">{item.description}</p>
                </div>
              </article>
            </div>
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
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}

export default ItemsThatFitSection;

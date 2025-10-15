/**
 * @fileoverview Complete zip code list section with responsive pagination
 * @source boombox-10.0/src/app/components/locations/zipcodesection.tsx
 * @location src/components/features/locations/
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a paginated grid of all supported zip codes from the zip code pricing data.
 * Features:
 * - Responsive grid pagination that adapts to screen size
 * - Shows different numbers of zip codes per page based on viewport width
 * - Left/right navigation arrows for pagination
 * - Uses Chip component to display individual zip codes
 * - Automatically calculates grid layout based on responsive breakpoints
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded bg-slate-100 with bg-surface-tertiary for navigation buttons
 * - Applied design system hover states (hover:bg-surface-disabled)
 * - Used semantic color tokens for disabled states
 * - Consistent spacing and layout patterns
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Button elements instead of divs for navigation
 * - Proper ARIA labels for navigation buttons
 * - Screen reader announcements for pagination status
 * - Semantic section element with proper heading
 * - Keyboard navigation support
 * - Descriptive button labels
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Reused useResponsiveGridPagination hook (prevents code duplication)
 * - Memoized calculations through the hook
 * - Efficient event listener cleanup
 * 
 * @refactor Migrated with design system, reused useResponsiveGridPagination hook,
 * enhanced accessibility
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';
import { Chip } from '@/components/ui/primitives/Chip/Chip';
import { zipCodePrices } from '@/data/zipcodeprices';
import { useResponsiveGridPagination, DEFAULT_CITY_GRID_BREAKPOINTS } from '@/hooks/useResponsiveGridPagination';
import { cn } from '@/lib/utils/cn';

export interface ZipCodeSectionProps {
  /**
   * Section heading text
   * @default 'Complete zip code list'
   */
  heading?: string;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  
  /**
   * Additional CSS classes for the heading container
   */
  headingContainerClassName?: string;
  
  /**
   * Additional CSS classes for the grid container
   */
  gridClassName?: string;
}

export function ZipCodeSection({
  heading = 'Complete zip code list',
  className,
  headingContainerClassName,
  gridClassName,
}: ZipCodeSectionProps) {
  // Extract zip codes from pricing data
  const zipCodes = Object.keys(zipCodePrices);
  
  // Use responsive grid pagination hook (same as CitiesSection)
  const {
    currentPage,
    totalPages,
    currentItems: currentZipCodes,
    handlePrevPage,
    handleNextPage,
    gridColsClass,
    hasPrevPage,
    hasNextPage,
  } = useResponsiveGridPagination({
    items: zipCodes,
    breakpoints: DEFAULT_CITY_GRID_BREAKPOINTS,
  });
  
  return (
    <section
      className={cn('mt-12 sm:mt-24 lg:px-12 px-6 sm:mb-48 mb-24', className)}
      aria-labelledby="zip-code-section-title"
    >
      {/* Header with pagination controls */}
      <div
        className={cn(
          'flex flex-col sm:flex-row w-full justify-between items-left sm:items-center mb-10',
          headingContainerClassName
        )}
      >
        <h1 id="zip-code-section-title" className="mr-2">
          {heading}
        </h1>
        
        <nav aria-label="Zip codes pagination" className="flex mt-4 sm:mt-0 gap-1">
          <button
            onClick={handlePrevPage}
            disabled={!hasPrevPage}
            className={cn(
              'rounded-full p-2 transition-colors bg-surface-tertiary active:bg-surface-disabled focus-visible',
              {
                'opacity-50 cursor-not-allowed': !hasPrevPage,
                'cursor-pointer hover:bg-surface-disabled': hasPrevPage,
              }
            )}
            aria-label="Previous page of zip codes"
          >
            <ArrowLeftIcon className="w-6 h-6" aria-hidden="true" />
          </button>
          
          <button
            onClick={handleNextPage}
            disabled={!hasNextPage}
            className={cn(
              'rounded-full p-2 transition-colors bg-surface-tertiary active:bg-surface-disabled focus-visible',
              {
                'opacity-50 cursor-not-allowed': !hasNextPage,
                'cursor-pointer hover:bg-surface-disabled': hasNextPage,
              }
            )}
            aria-label="Next page of zip codes"
          >
            <ArrowRightIcon className="w-6 h-6" aria-hidden="true" />
          </button>
          
          <div role="status" aria-live="polite" className="sr-only">
            Page {currentPage} of {totalPages}
          </div>
        </nav>
      </div>
      
      {/* Zip codes grid */}
      <div
        className={cn('grid gap-4 lg:gap-6 text-nowrap', gridColsClass, gridClassName)}
        role="list"
        aria-label="Available service area zip codes"
      >
        {currentZipCodes.map((zip, index) => (
          <div key={index} role="listitem">
            <Link 
              href={`/locations?zipCode=${zip}`} 
              className="focus-visible"
              aria-label={`Check availability for zip code ${zip}`}
            >
              <Chip label={zip} className="w-full" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}


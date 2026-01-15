/**
 * @fileoverview Cities we serve section with responsive pagination
 * @source boombox-10.0/src/app/components/locations/citiessection.tsx
 * @location src/components/features/locations/ (moved from landing to locations domain)
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a paginated grid of Bay Area cities that adapts responsively to screen size.
 * Features navigation arrows for browsing through pages of cities with automatic column 
 * count adjustment based on viewport width.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded bg-slate-100 with design system surface colors (bg-surface-tertiary)
 * - Replaced hardcoded bg-slate-200 with hover states (hover:bg-surface-disabled)
 * - Applied consistent spacing patterns from layout system
 * - Enhanced accessibility with proper ARIA labels and keyboard navigation
 * 
 * BUSINESS LOGIC EXTRACTION:
 * - Extracted responsive pagination logic to useResponsiveGridPagination hook
 * - Reuses existing Chip component from design system
 * 
 * @refactor Extracted pagination logic to custom hook, applied design system, enhanced accessibility
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';
import { Chip } from '@/components/ui';
import { bayAreaCities } from '@/data/bayareacities';
import { 
 useResponsiveGridPagination,
 DEFAULT_CITY_GRID_BREAKPOINTS 
} from '@/hooks/useResponsiveGridPagination';
import { cn } from '@/lib/utils/cn';

export interface CitiesSectionProps {
 /**
  * Title for the cities section
  * @default "Cities we serve"
  */
 title?: string;
 
 /**
  * Additional CSS classes for the container
  */
 className?: string;
}

export const CitiesSection: React.FC<CitiesSectionProps> = ({ 
 title = "Cities we serve",
 className 
}) => {
 // Use responsive grid pagination hook
 const {
  currentPage,
  currentItems,
  totalPages,
  hasNextPage,
  hasPrevPage,
  handleNextPage,
  handlePrevPage,
  gridColsClass,
 } = useResponsiveGridPagination({
  items: bayAreaCities,
  breakpoints: DEFAULT_CITY_GRID_BREAKPOINTS,
 });

 return (
  <section 
   className={cn(
    'mt-12 sm:mt-24 lg:px-12 px-6 sm:mb-24 mb-12',
    className
   )}
   aria-labelledby="cities-section-title"
  >
   {/* Header with title and navigation */}
   <div className="flex flex-col sm:flex-row w-full justify-between items-left sm:items-center mb-10">
    <h1 id="cities-section-title" className="text-left">
     {title}
    </h1>
    
    {/* Pagination Navigation */}
    <nav 
     className="flex mt-4 sm:mt-0 gap-1" 
     aria-label="Cities pagination"
    >
     {/* Previous Page Button */}
     <button
      onClick={handlePrevPage}
      disabled={!hasPrevPage}
      className={cn(
       'rounded-full p-2',
       'bg-surface-tertiary hover:bg-surface-disabled',
       'focus-visible',
       {
        'opacity-50 cursor-not-allowed': !hasPrevPage,
        'cursor-pointer': hasPrevPage,
       }
      )}
      aria-label="Previous page of cities"
      aria-disabled={!hasPrevPage}
     >
      <ArrowLeftIcon 
       className="w-6 h-6" 
       aria-hidden="true"
      />
     </button>

     {/* Next Page Button */}
     <button
      onClick={handleNextPage}
      disabled={!hasNextPage}
      className={cn(
       'rounded-full p-2',
       'bg-surface-tertiary hover:bg-surface-disabled',
       'focus-visible',
       {
        'opacity-50 cursor-not-allowed': !hasNextPage,
        'cursor-pointer': hasNextPage,
       }
      )}
      aria-label="Next page of cities"
      aria-disabled={!hasNextPage}
     >
      <ArrowRightIcon 
       className="w-6 h-6" 
       aria-hidden="true"
      />
     </button>
    </nav>
    
    {/* Screen reader announcement for current page */}
    <div className="sr-only" role="status" aria-live="polite">
     Page {currentPage} of {totalPages}
    </div>
   </div>

   {/* Cities Grid */}
   <div 
    className={cn(
     'grid gap-4 lg:gap-6 text-nowrap',
     gridColsClass
    )}
    role="list"
    aria-label="Bay Area cities we serve"
   >
    {currentItems.map((location, index) => (
     <div key={`${location.city}-${index}`} role="listitem">
      <Link 
       href={location.link} 
       className="w-full focus-visible"
       aria-label={`View storage services in ${location.city}, ${location.county} County`}
      >
       <Chip 
        label={location.city} 
        variant="default"
        size="md"
        className="w-full cursor-pointer"
       />
      </Link>
     </div>
    ))}
   </div>
  </section>
 );
};


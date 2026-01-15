/**
 * @fileoverview Popular locations section with mobile pagination
 * @source boombox-10.0/src/app/components/locations/popularlocationssection.tsx
 * @location src/components/features/locations/
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a grid of popular storage locations with customer counts.
 * Features:
 * - Responsive grid layout (1 column mobile, 2 tablet, 3 desktop)
 * - Mobile-only pagination (shows 3 locations at a time on mobile)
 * - Desktop shows all locations
 * - Uses Card component to display location information
 * - Left/right navigation arrows on mobile
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded bg-slate-100 with bg-surface-tertiary for navigation buttons
 * - Applied design system hover states (hover:bg-surface-disabled)
 * - Used semantic color tokens for disabled states
 * - Consistent spacing and layout patterns
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added proper ARIA labels for navigation buttons
 * - Semantic section element with proper heading
 * - Screen reader announcements for pagination status
 * - Button elements instead of divs for navigation
 * - Keyboard navigation support
 * - Descriptive button labels
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Memoized resize event listener cleanup
 * - Efficient mobile detection with proper cleanup
 * 
 * @refactor Migrated with design system, enhanced accessibility, extracted data to separate file
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';
import { Card } from '@/components/ui';
import { popularLocations, type PopularLocation } from '@/data/popularlocations';
import { cn } from '@/lib/utils/cn';

export interface PopularLocationsSectionProps {
 /**
  * Section heading text
  * @default 'Popular storage locations'
  */
 heading?: string;
 
 /**
  * Array of locations to display (defaults to all popular locations)
  */
 locations?: PopularLocation[];
 
 /**
  * Number of locations to show per page on mobile
  * @default 3
  */
 locationsPerPage?: number;
 
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

export function PopularLocationsSection({
 heading = 'Popular storage locations',
 locations = popularLocations,
 locationsPerPage = 3,
 className,
 headingContainerClassName,
 gridClassName,
}: PopularLocationsSectionProps) {
 const [currentPage, setCurrentPage] = useState(1);
 const [isMobile, setIsMobile] = useState(false);
 
 // Detect mobile screen size
 useEffect(() => {
  const checkIfMobile = () => {
   setIsMobile(window.innerWidth < 768);
  };
  
  checkIfMobile();
  window.addEventListener('resize', checkIfMobile);
  
  return () => window.removeEventListener('resize', checkIfMobile);
 }, []);
 
 // Calculate pagination
 const totalPages = Math.ceil(locations.length / locationsPerPage);
 const startIndex = (currentPage - 1) * locationsPerPage;
 const endIndex = startIndex + locationsPerPage;
 const currentLocations = isMobile ? locations.slice(startIndex, endIndex) : locations;
 
 const handlePreviousPage = () => {
  if (currentPage > 1) {
   setCurrentPage(currentPage - 1);
  }
 };
 
 const handleNextPage = () => {
  if (currentPage < totalPages) {
   setCurrentPage(currentPage + 1);
  }
 };
 
 const hasPrevPage = currentPage > 1;
 const hasNextPage = currentPage < totalPages;
 
 return (
  <section
   className={cn('mt-12 sm:mt-24 lg:px-12 px-6 sm:mb-48 mb-24', className)}
   aria-labelledby="popular-locations-heading"
  >
   {/* Header with pagination controls */}
   <div
    className={cn(
     'flex flex-col sm:flex-row w-full justify-between items-left sm:items-center mb-10',
     headingContainerClassName
    )}
   >
    <h1 id="popular-locations-heading" className="mr-2">
     {heading}
    </h1>
    
    {/* Mobile-only pagination controls */}
    {isMobile && totalPages > 1 && (
     <nav
      aria-label="Popular locations pagination"
      className="flex mt-4 sm:mt-0"
     >
      <button
       onClick={handlePreviousPage}
       disabled={!hasPrevPage}
       className={cn(
        'rounded-full mr-1 p-2 bg-surface-tertiary active:bg-surface-disabled',
        {
         'opacity-50 cursor-not-allowed': !hasPrevPage,
         'cursor-pointer hover:bg-surface-disabled': hasPrevPage,
        }
       )}
       aria-label="Previous page of locations"
      >
       <ArrowLeftIcon className="w-6" aria-hidden="true" />
      </button>
      
      <button
       onClick={handleNextPage}
       disabled={!hasNextPage}
       className={cn(
        'rounded-full p-2 bg-surface-tertiary active:bg-surface-disabled',
        {
         'opacity-50 cursor-not-allowed': !hasNextPage,
         'cursor-pointer hover:bg-surface-disabled': hasNextPage,
        }
       )}
       aria-label="Next page of locations"
      >
       <ArrowRightIcon className="w-6" aria-hidden="true" />
      </button>
      
      <div role="status" aria-live="polite" className="sr-only">
       Page {currentPage} of {totalPages}
      </div>
     </nav>
    )}
   </div>
   
   {/* Location cards grid */}
   <div
    className={cn(
     'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
     gridClassName
    )}
    role="list"
    aria-label="Popular storage locations"
   >
    {currentLocations.map((location, index) => (
     <div key={index} role="listitem">
      <Card
       imageSrc={location.imageSrc}
       imageAlt={location.imageAlt}
       location={location.location}
       customerCount={location.customerCount}
       description={location.description}
       link={location.link}
       ariaLabel={`View storage services in ${location.location} - ${location.customerCount} ${location.description}`}
      />
     </div>
    ))}
   </div>
  </section>
 );
}


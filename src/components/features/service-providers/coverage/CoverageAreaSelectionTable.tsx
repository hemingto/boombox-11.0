"use client";

/**
 * @fileoverview Coverage area city selection table component for service providers
 * @source boombox-10.0/src/app/components/mover-account/coverageareaselectiontable.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Interactive city selection table with pagination for service providers to define their coverage area.
 * Features include individual city selection, select all functionality, and paginated grid view.
 * Provides visual feedback for selected cities and displays helpful guidance about service areas.
 * 
 * API ROUTES UPDATED:
 * - No API routes used directly (selection state managed by parent component)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design tokens:
 *  - bg-zinc-950 → bg-primary (selected city button)
 *  - text-white → text-text-inverse (selected city text)
 *  - bg-slate-100 → bg-surface-tertiary (unselected city button)
 *  - text-black → text-text-primary (unselected city text)
 *  - text-zinc-500 → text-text-secondary (note text)
 *  - text-zinc-950 → text-text-primary (note emphasis)
 *  - border-slate-100 → border-border (divider)
 * - Applied transition classes for smooth hover effects
 * - Used consistent spacing and padding from design system
 * 
 * ACCESSIBILITY ENHANCEMENTS:
 * - Added proper ARIA labels and roles for city selection
 * - Enhanced checkbox with proper labeling and association
 * - Added semantic HTML structure (fieldset, legend)
 * - Proper button states and disabled handling
 * - Added screen reader announcements for selection changes
 * - Keyboard navigation support maintained
 * - Proper focus management for grid items
 * 
 * @refactor Migrated from mover-account to service-providers/coverage folder structure.
 * Renamed from CitySelection to CoverageAreaSelectionTable for clarity. Applied design system
 * semantic color tokens throughout. Enhanced accessibility with proper ARIA labels and semantic HTML.
 * Added TypeScript interfaces for better type safety and callback patterns.
 */

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { bayAreaCities } from '@/data/bayareacities';

export interface CoverageAreaSelectionTableProps {
 /** Optional initial selected cities */
 initialSelectedCities?: string[];
 /** Optional callback when city selection changes */
 onSelectionChange?: (selectedCities: string[]) => void;
 /** Number of items per page */
 itemsPerPage?: number;
 /** Optional heading text */
 heading?: string;
 /** Optional note text override */
 noteText?: string;
 /** Optional className for additional styling */
 className?: string;
}

export const CoverageAreaSelectionTable: React.FC<CoverageAreaSelectionTableProps> = ({
 initialSelectedCities = [],
 onSelectionChange,
 itemsPerPage = 24,
 heading = 'Select the cities to include in your service area',
 noteText,
 className = '',
}) => {
 const [selectedCities, setSelectedCities] = useState<string[]>(initialSelectedCities);
 const [selectAll, setSelectAll] = useState(false);
 const [currentPage, setCurrentPage] = useState(1);

 // Handle selecting/deselecting a city
 const handleCitySelect = (city: string) => {
  let newSelectedCities: string[];
  
  if (selectedCities.includes(city)) {
   newSelectedCities = selectedCities.filter((c) => c !== city);
  } else {
   newSelectedCities = [...selectedCities, city];
  }
  
  setSelectedCities(newSelectedCities);
  setSelectAll(newSelectedCities.length === bayAreaCities.length);
  
  if (onSelectionChange) {
   onSelectionChange(newSelectedCities);
  }
 };

 // Handle selecting/deselecting all cities
 const handleSelectAll = () => {
  let newSelectedCities: string[];
  
  if (selectAll) {
   newSelectedCities = [];
  } else {
   newSelectedCities = bayAreaCities.map((c) => c.city);
  }
  
  setSelectedCities(newSelectedCities);
  setSelectAll(!selectAll);
  
  if (onSelectionChange) {
   onSelectionChange(newSelectedCities);
  }
 };

 // Pagination logic
 const totalPages = Math.ceil(bayAreaCities.length / itemsPerPage);
 const indexOfLastItem = currentPage * itemsPerPage;
 const indexOfFirstItem = indexOfLastItem - itemsPerPage;
 const currentItems = bayAreaCities.slice(indexOfFirstItem, indexOfLastItem);

 const nextPage = () => {
  setCurrentPage((prev) => Math.min(prev + 1, totalPages));
 };

 const prevPage = () => {
  setCurrentPage((prev) => Math.max(prev - 1, 1));
 };

 const defaultNoteText = (
  <>
   <strong className="text-text-primary">Note:</strong> We recommend starting with a 
   smaller service area to begin with and then expanding your service area once you are 
   able to better understand your schedule and capacity.
  </>
 );

 return (
  <div className={className} role="region" aria-label="Coverage area selection">
   {/* Header */}
   <h3 className="text-xl font-semibold mb-6 text-text-primary">
    {heading}
   </h3>

   {/* Select All Checkbox */}
   <div className="flex items-center mb-4">
    <input
     type="checkbox"
     id="select-all-cities"
     checked={selectAll}
     onChange={handleSelectAll}
     className="mr-2 w-4 h-4 accent-primary cursor-pointer focus:ring-2 focus:ring-border-focus focus:ring-offset-2 rounded"
     aria-label="Select all cities"
     aria-describedby="select-all-label"
    />
    <label 
     htmlFor="select-all-cities"
     id="select-all-label"
     className="text-sm text-text-primary cursor-pointer"
    >
     Select all cities ({bayAreaCities.length} total)
    </label>
   </div>

   {/* Selection Summary */}
   <div 
    className="mb-4 text-sm text-text-secondary"
    role="status"
    aria-live="polite"
    aria-atomic="true"
   >
    {selectedCities.length} {selectedCities.length === 1 ? 'city' : 'cities'} selected
   </div>

   {/* City Selection Grid */}
   <fieldset className="mb-6">
    <legend className="sr-only">City selection grid</legend>
    <div 
     className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
     role="group"
     aria-label="Cities available for selection"
    >
     {currentItems.map((cityObj) => {
      const isSelected = selectedCities.includes(cityObj.city);
      
      return (
       <button
        key={cityObj.city}
        onClick={() => handleCitySelect(cityObj.city)}
        className={`rounded-md px-4 py-2.5 font-inter text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 ${
         isSelected
          ? 'bg-primary text-text-inverse hover:bg-primary-hover active:bg-primary-active'
          : 'bg-surface-tertiary text-text-primary hover:bg-surface-secondary active:bg-surface-disabled'
        }`}
        aria-pressed={isSelected}
        aria-label={`${isSelected ? 'Deselect' : 'Select'} ${cityObj.city}`}
       >
        {cityObj.city}
       </button>
      );
     })}
    </div>
   </fieldset>

   {/* Pagination Controls */}
   <nav 
    className="flex justify-between items-center mt-4"
    aria-label="City selection pagination"
   >
    <button
     onClick={prevPage}
     disabled={currentPage === 1}
     className="p-2 bg-surface-tertiary rounded-full hover:bg-surface-secondary active:bg-surface-disabled disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2"
     aria-label="Previous page"
     aria-disabled={currentPage === 1}
    >
     <ChevronLeftIcon className="w-5 h-5 text-text-primary" aria-hidden="true" />
    </button>
    
    <span className="text-sm text-text-primary" aria-live="polite">
     Page {currentPage} of {totalPages}
    </span>
    
    <button
     onClick={nextPage}
     disabled={currentPage === totalPages}
     className="p-2 bg-surface-tertiary rounded-full hover:bg-surface-secondary active:bg-surface-disabled disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2"
     aria-label="Next page"
     aria-disabled={currentPage === totalPages}
    >
     <ChevronRightIcon className="w-5 h-5 text-text-primary" aria-hidden="true" />
    </button>
   </nav>

   {/* Note Section */}
   <div className="mt-6 border-t border-border pt-4">
    <p className="text-text-secondary text-sm">
     {noteText || defaultNoteText}
    </p>
   </div>
  </div>
 );
};

export default CoverageAreaSelectionTable;


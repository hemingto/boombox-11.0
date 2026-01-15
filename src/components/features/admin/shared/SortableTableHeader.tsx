/**
 * @fileoverview Sortable table header cell component for admin management tables
 * @source Extracted pattern from boombox-10.0 admin management pages
 * 
 * COMPONENT FUNCTIONALITY:
 * Reusable table header cell with sort functionality:
 * - Displays column label
 * - Shows sort direction icons (up/down/neutral)
 * - Handles click events to trigger sorting
 * - Applies design system colors for active/inactive states
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic text colors (text-text-primary, text-text-secondary)
 * - Consistent hover states with primary color
 * - Proper focus indicators for accessibility
 * 
 * @refactor Extracted from inline table header implementations across 8+ management pages
 */

'use client';

import React from 'react';
import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

export interface SortConfig<T = string> {
 column: T | null;
 direction: 'asc' | 'desc';
}

interface SortableTableHeaderProps<T = string> {
 /** Column label displayed in header */
 label: string;
 /** Unique identifier for this column */
 sortKey: T;
 /** Current sort configuration */
 currentSort: SortConfig<T>;
 /** Callback when header is clicked to change sort */
 onSort: (key: T) => void;
 /** Optional custom className for additional styling */
 className?: string;
}

/**
 * SortableTableHeader - Table header cell with sort functionality
 * 
 * @example
 * ```tsx
 * <SortableTableHeader
 *  label="First Name"
 *  sortKey="firstName"
 *  currentSort={sortConfig}
 *  onSort={handleSort}
 * />
 * ```
 */
export function SortableTableHeader<T extends string = string>({
 label,
 sortKey,
 currentSort,
 onSort,
 className = '',
}: SortableTableHeaderProps<T>) {
 const isSorted = currentSort.column === sortKey;
 const direction = isSorted ? currentSort.direction : null;

 return (
  <th
   scope="col"
   className={`px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-slate-200 ${className}`}
   onClick={() => onSort(sortKey)}
   role="button"
   tabIndex={0}
   onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
     e.preventDefault();
     onSort(sortKey);
    }
   }}
   aria-sort={
    !isSorted ? 'none' : direction === 'asc' ? 'ascending' : 'descending'
   }
  >
   <div className="flex items-center gap-2">
    <span>{label}</span>
    {!isSorted && (
     <ChevronUpDownIcon
      className="h-4 w-4 text-gray-500"
      aria-hidden="true"
     />
    )}
    {isSorted && direction === 'asc' && (
     <ChevronUpIcon
      className="h-4 w-4 text-indigo-600"
      aria-hidden="true"
     />
    )}
    {isSorted && direction === 'desc' && (
     <ChevronDownIcon
      className="h-4 w-4 text-indigo-600"
      aria-hidden="true"
     />
    )}
   </div>
  </th>
 );
}


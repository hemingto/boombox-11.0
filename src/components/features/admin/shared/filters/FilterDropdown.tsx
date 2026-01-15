/**
 * @fileoverview Filter dropdown with checkboxes (gold standard pattern)
 * @source Extracted from AdminJobsPage lines 371-467
 * 
 * COMPONENT FUNCTIONALITY:
 * - Dropdown trigger button with chevron
 * - Checkbox list inside dropdown
 * - "All" checkbox for selecting/deselecting all
 * - Click-outside-to-close behavior
 * - Proper z-index and positioning
 * 
 * DESIGN PATTERN:
 * - Uses AdminJobsPage gold standard
 * - Checkbox filters (better UX than toggle switches)
 * - "All" option with border separator
 * - Indigo focus colors
 * - Proper shadow and ring styling
 * 
 * KEY DIFFERENCES FROM OLD COMPONENTS:
 * - More flexible filter structure
 * - Built-in "All" checkbox support
 * - Cleaner separation of concerns
 * - Proper TypeScript generics
 * 
 * @goldstandard This is the superior pattern from AdminJobsPage
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FilterItem<TId extends string = string> {
  id: TId;
  label: string;
  checked: boolean;
}

interface FilterDropdownProps<TId extends string = string> {
  /** Button label */
  label: string;
  /** Array of filter items */
  filters: FilterItem<TId>[];
  /** Whether dropdown is open */
  isOpen: boolean;
  /** Toggle dropdown open/close */
  onToggle: () => void;
  /** Toggle individual filter */
  onToggleFilter: (filterId: TId) => void;
  /** Toggle all filters */
  onToggleAll: () => void;
  /** Whether all filters are selected */
  allSelected: boolean;
  /** Label for "all" option */
  allLabel?: string;
  /** Optional className for button */
  className?: string;
}

/**
 * FilterDropdown - Gold standard checkbox filter dropdown
 * 
 * @example
 * ```tsx
 * <FilterDropdown
 *   label="Status"
 *   filters={[
 *     { id: 'scheduled', label: 'Scheduled', checked: true },
 *     { id: 'complete', label: 'Complete', checked: true }
 *   ]}
 *   isOpen={showStatusFilter}
 *   onToggle={() => setShowStatusFilter(!showStatusFilter)}
 *   onToggleFilter={(id) => toggleStatusFilter(id)}
 *   onToggleAll={toggleAllStatuses}
 *   allSelected={allStatusesSelected}
 *   allLabel="All Statuses"
 * />
 * ```
 */
export function FilterDropdown<TId extends string = string>({
  label,
  filters,
  isOpen,
  onToggle,
  onToggleFilter,
  onToggleAll,
  allSelected,
  allLabel = 'All',
  className = '',
}: FilterDropdownProps<TId>) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onToggle();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className={`inline-flex items-center text-sm gap-x-1.5 rounded-md bg-white px-3 py-2.5 font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${className}`}
      >
        {label}
        <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {/* All option */}
            <div className="px-4 py-2 border-b border-gray-200">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <span className="text-sm text-gray-700">{allLabel}</span>
              </label>
            </div>
            {/* Individual filters */}
            {filters.map((filter) => (
              <div key={filter.id} className="px-4 py-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={filter.checked}
                    onChange={() => onToggleFilter(filter.id)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span className="text-sm text-gray-700 capitalize">{filter.label}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

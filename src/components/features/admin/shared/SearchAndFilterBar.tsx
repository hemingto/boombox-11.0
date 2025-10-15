/**
 * @fileoverview Search input and action filter toggle component for admin tables
 * @source Extracted pattern from boombox-10.0 admin management pages
 * 
 * COMPONENT FUNCTIONALITY:
 * Combined search and filtering controls for admin tables:
 * - Text search input with clear functionality
 * - Action filter toggles (e.g., "Approve vehicles", "Mark clean")
 * - Responsive layout with proper spacing
 * - Real-time search updates
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses input-field utility class for consistent styling
 * - Semantic colors for filter badges
 * - Proper focus states for accessibility
 * - Consistent spacing and layout
 * 
 * @refactor Extracted from inline search/filter implementations across 8+ management pages
 */

'use client';

import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useClickOutside } from '@/hooks/useClickOutside';

export interface ActionFilter {
  id: string;
  label: string;
  active: boolean;
}

interface SearchAndFilterBarProps {
  /** Current search query value */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Optional placeholder text for search input */
  searchPlaceholder?: string;
  /** Optional action filters */
  actionFilters?: ActionFilter[];
  /** Callback when action filter is toggled */
  onToggleFilter?: (filterId: string) => void;
  /** Whether filter menu is currently open */
  showFilterMenu?: boolean;
  /** Callback to toggle filter menu open/close */
  onToggleFilterMenu?: () => void;
}

/**
 * SearchAndFilterBar - Combined search and filter controls for admin tables
 * 
 * @example
 * ```tsx
 * <SearchAndFilterBar
 *   searchQuery={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   searchPlaceholder="Search drivers..."
 *   actionFilters={actionFilters}
 *   onToggleFilter={toggleFilter}
 *   showFilterMenu={showFilterMenu}
 *   onToggleFilterMenu={() => setShowFilterMenu(!showFilterMenu)}
 * />
 * ```
 */
export function SearchAndFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  actionFilters = [],
  onToggleFilter,
  showFilterMenu = false,
  onToggleFilterMenu,
}: SearchAndFilterBarProps) {
  const filterMenuRef = React.useRef<HTMLDivElement>(null);

  // Close filter menu when clicking outside
  useClickOutside(filterMenuRef, () => {
    if (showFilterMenu && onToggleFilterMenu) {
      onToggleFilterMenu();
    }
  });

  const hasActiveFilters = actionFilters.some(filter => filter.active);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon
            className="h-5 w-5 text-text-secondary"
            aria-hidden="true"
          />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input-field pl-10 w-full"
          placeholder={searchPlaceholder}
          aria-label="Search"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary hover:text-text-primary"
            aria-label="Clear search"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Action Filters */}
      {actionFilters.length > 0 && onToggleFilter && onToggleFilterMenu && (
        <div className="relative" ref={filterMenuRef}>
          <button
            type="button"
            onClick={onToggleFilterMenu}
            className={`btn-secondary inline-flex items-center gap-2 ${
              hasActiveFilters ? 'ring-2 ring-primary' : ''
            }`}
            aria-expanded={showFilterMenu}
            aria-haspopup="true"
            aria-label="Filter options"
          >
            <FunnelIcon className="h-5 w-5" aria-hidden="true" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-text-inverse text-xs font-medium">
                {actionFilters.filter(f => f.active).length}
              </span>
            )}
          </button>

          {showFilterMenu && (
            <div
              className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-md bg-surface-primary shadow-lg ring-1 ring-border focus:outline-none"
              role="menu"
              aria-orientation="vertical"
            >
              <div className="py-1">
                {actionFilters.map((filter) => (
                  <label
                    key={filter.id}
                    className="flex items-center px-4 py-2 text-sm text-text-primary hover:bg-surface-tertiary cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filter.active}
                      onChange={() => onToggleFilter(filter.id)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 mr-3"
                      aria-label={`Filter by ${filter.label}`}
                    />
                    <span>{filter.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


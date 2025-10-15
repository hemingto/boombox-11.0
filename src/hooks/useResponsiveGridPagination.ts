/**
 * @fileoverview Custom hook for responsive grid pagination with dynamic sizing
 * @source boombox-10.0/src/app/components/locations/citiessection.tsx (pagination logic lines 16-57)
 * 
 * HOOK FUNCTIONALITY:
 * - Manages responsive grid pagination that adapts to screen size
 * - Automatically adjusts items per row and rows per page based on viewport width
 * - Provides navigation functions and pagination metadata
 * - Handles window resize events for responsive behavior
 * 
 * USE CASES:
 * - City grid displays with responsive column counts
 * - Product grids that adapt to screen size
 * - Any paginated grid layout requiring responsive item counts
 * 
 * @refactor Extracted pagination logic from CitiesSection component into reusable hook
 */

import { useState, useEffect, useMemo } from 'react';

/**
 * Breakpoint configuration for responsive grid
 */
export interface ResponsiveBreakpoint {
  /** Maximum width for this breakpoint (in pixels) */
  maxWidth: number;
  /** Number of rows to show per page at this breakpoint */
  rowsPerPage: number;
  /** Number of items per row at this breakpoint */
  itemsPerRow: number;
}

/**
 * Configuration for responsive grid pagination
 */
export interface ResponsiveGridPaginationConfig<T> {
  /** Array of items to paginate */
  items: T[];
  /** Breakpoint configurations for responsive behavior */
  breakpoints: ResponsiveBreakpoint[];
  /** Initial page number (default: 1) */
  initialPage?: number;
}

/**
 * Return type for responsive grid pagination hook
 */
export interface UseResponsiveGridPaginationReturn<T> {
  // Current state
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Items to display on current page */
  currentItems: T[];
  /** Number of items per row at current breakpoint */
  itemsPerRow: number;
  /** Number of rows per page at current breakpoint */
  rowsPerPage: number;
  
  // Pagination metadata
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPrevPage: boolean;
  /** Total number of items */
  totalItems: number;
  /** Number of items per page at current breakpoint */
  itemsPerPage: number;
  
  // Navigation functions
  /** Navigate to next page */
  handleNextPage: () => void;
  /** Navigate to previous page */
  handlePrevPage: () => void;
  /** Navigate to specific page */
  goToPage: (page: number) => void;
  
  // Utility
  /** Tailwind grid columns class based on current itemsPerRow */
  gridColsClass: string;
}

/**
 * Default breakpoints matching boombox-10.0 CitiesSection behavior
 */
export const DEFAULT_CITY_GRID_BREAKPOINTS: ResponsiveBreakpoint[] = [
  { maxWidth: 640, rowsPerPage: 5, itemsPerRow: 3 },   // Mobile
  { maxWidth: 768, rowsPerPage: 5, itemsPerRow: 6 },   // Tablet small
  { maxWidth: 1024, rowsPerPage: 5, itemsPerRow: 6 },  // Tablet large
  { maxWidth: Infinity, rowsPerPage: 6, itemsPerRow: 7 }, // Desktop
];

/**
 * Get Tailwind grid columns class based on number of columns
 */
function getGridColsClass(cols: number): string {
  const gridClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
    10: 'grid-cols-10',
    11: 'grid-cols-11',
    12: 'grid-cols-12',
  };
  
  return gridClasses[cols] || 'grid-cols-1';
}

/**
 * Determine current breakpoint based on window width
 */
function getCurrentBreakpoint(
  width: number,
  breakpoints: ResponsiveBreakpoint[]
): ResponsiveBreakpoint {
  // Sort breakpoints by maxWidth ascending
  const sorted = [...breakpoints].sort((a, b) => a.maxWidth - b.maxWidth);
  
  // Find first breakpoint where width is less than maxWidth
  return sorted.find(bp => width < bp.maxWidth) || sorted[sorted.length - 1];
}

/**
 * Custom hook for responsive grid pagination
 * 
 * Manages pagination for grid layouts that adapt their column count and items per page
 * based on viewport width. Handles window resize events and provides navigation functions.
 * 
 * @example
 * ```tsx
 * const {
 *   currentItems,
 *   currentPage,
 *   totalPages,
 *   hasNextPage,
 *   hasPrevPage,
 *   handleNextPage,
 *   handlePrevPage,
 *   gridColsClass
 * } = useResponsiveGridPagination({
 *   items: cities,
 *   breakpoints: DEFAULT_CITY_GRID_BREAKPOINTS
 * });
 * ```
 */
export function useResponsiveGridPagination<T>(
  config: ResponsiveGridPaginationConfig<T>
): UseResponsiveGridPaginationReturn<T> {
  const { items, breakpoints, initialPage = 1 } = config;
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(
    breakpoints[breakpoints.length - 1].rowsPerPage
  );
  const [itemsPerRow, setItemsPerRow] = useState(
    breakpoints[breakpoints.length - 1].itemsPerRow
  );
  
  // Update pagination properties based on window width
  const updatePaginationProperties = () => {
    const width = window.innerWidth;
    const breakpoint = getCurrentBreakpoint(width, breakpoints);
    
    setRowsPerPage(breakpoint.rowsPerPage);
    setItemsPerRow(breakpoint.itemsPerRow);
  };
  
  // Set up resize listener
  useEffect(() => {
    updatePaginationProperties();
    window.addEventListener('resize', updatePaginationProperties);
    
    return () => window.removeEventListener('resize', updatePaginationProperties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Calculate pagination values
  const itemsPerPage = rowsPerPage * itemsPerRow;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);
  
  // Navigation functions
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };
  
  // Reset to page 1 when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);
  
  // Get grid columns class
  const gridColsClass = useMemo(
    () => getGridColsClass(itemsPerRow),
    [itemsPerRow]
  );
  
  return {
    // Current state
    currentPage,
    currentItems,
    itemsPerRow,
    rowsPerPage,
    
    // Pagination metadata
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    totalItems: items.length,
    itemsPerPage,
    
    // Navigation functions
    handleNextPage,
    handlePrevPage,
    goToPage,
    
    // Utility
    gridColsClass,
  };
}


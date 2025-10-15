/**
 * @fileoverview Custom hook for managing admin table state (sorting, columns, search, filters)
 * @source Extracted pattern from boombox-10.0 admin management pages
 * 
 * HOOK FUNCTIONALITY:
 * Manages all common table state:
 * - Column visibility toggle
 * - Sort configuration (column + direction)
 * - Search query state
 * - Action filter toggles
 * - Data sorting and filtering logic
 * 
 * BUSINESS LOGIC EXTRACTION:
 * - Consolidates duplicate state management from 8+ admin pages
 * - Provides consistent sorting and filtering behavior
 * - Reduces component complexity
 * 
 * @refactor Extracted from inline state management in admin management pages
 */

import { useState, useMemo } from 'react';
import type { Column } from '@/components/features/admin/shared/ColumnManagerMenu';
import type { SortConfig } from '@/components/features/admin/shared/SortableTableHeader';

interface UseAdminTableOptions<T extends string = string> {
  /** Initial columns configuration */
  initialColumns: Column<T>[];
  /** Initial sort configuration */
  initialSort?: SortConfig<T>;
  /** Initial action filters */
  initialFilters?: Record<string, boolean>;
}

interface UseAdminTableReturn<T extends string = string, D = any> {
  /** Current columns array */
  columns: Column<T>[];
  /** Toggle column visibility */
  toggleColumn: (columnId: T) => void;
  /** Current sort configuration */
  sortConfig: SortConfig<T>;
  /** Handle sort change */
  handleSort: (columnId: T) => void;
  /** Current search query */
  searchQuery: string;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Current action filters */
  actionFilters: Record<string, boolean>;
  /** Toggle action filter */
  toggleFilter: (filterId: string) => void;
  /** Get sorted and filtered data */
  getSortedAndFilteredData: (
    data: D[],
    sortFn?: (data: D[], config: SortConfig<T>) => D[],
    filterFn?: (data: D[], query: string, filters: Record<string, boolean>) => D[]
  ) => D[];
}

/**
 * useAdminTable - Manages admin table state (sorting, columns, search, filters)
 * 
 * @example
 * ```tsx
 * const {
 *   columns,
 *   toggleColumn,
 *   sortConfig,
 *   handleSort,
 *   searchQuery,
 *   setSearchQuery,
 *   actionFilters,
 *   toggleFilter,
 *   getSortedAndFilteredData
 * } = useAdminTable({
 *   initialColumns: defaultColumns,
 *   initialSort: { column: 'firstName', direction: 'asc' },
 *   initialFilters: { approve_drivers: false }
 * });
 * 
 * const processedData = getSortedAndFilteredData(
 *   drivers,
 *   customSortFn,
 *   customFilterFn
 * );
 * ```
 */
export function useAdminTable<T extends string = string, D = any>({
  initialColumns,
  initialSort = { column: null, direction: 'asc' },
  initialFilters = {},
}: UseAdminTableOptions<T>): UseAdminTableReturn<T, D> {
  // Column visibility state
  const [columns, setColumns] = useState<Column<T>[]>(initialColumns);

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(initialSort);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [actionFilters, setActionFilters] = useState<Record<string, boolean>>(initialFilters);

  /**
   * Toggle column visibility
   */
  const toggleColumn = (columnId: T) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  /**
   * Handle sort change
   */
  const handleSort = (columnId: T) => {
    setSortConfig(prev => {
      // If clicking same column, toggle direction
      if (prev.column === columnId) {
        return {
          column: columnId,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      // If clicking different column, set to asc
      return {
        column: columnId,
        direction: 'asc',
      };
    });
  };

  /**
   * Toggle action filter
   */
  const toggleFilter = (filterId: string) => {
    setActionFilters(prev => ({
      ...prev,
      [filterId]: !prev[filterId],
    }));
  };

  /**
   * Get sorted and filtered data
   * Allows custom sort and filter functions to be passed in
   */
  const getSortedAndFilteredData = (
    data: D[],
    sortFn?: (data: D[], config: SortConfig<T>) => D[],
    filterFn?: (data: D[], query: string, filters: Record<string, boolean>) => D[]
  ): D[] => {
    let result = [...data];

    // Apply filtering
    if (filterFn) {
      result = filterFn(result, searchQuery, actionFilters);
    } else if (searchQuery) {
      // Default filter: search in stringified object (simple fallback)
      result = result.filter(item =>
        JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    if (sortFn && sortConfig.column) {
      result = sortFn(result, sortConfig);
    }

    return result;
  };

  return {
    columns,
    toggleColumn,
    sortConfig,
    handleSort,
    searchQuery,
    setSearchQuery,
    actionFilters,
    toggleFilter,
    getSortedAndFilteredData,
  };
}


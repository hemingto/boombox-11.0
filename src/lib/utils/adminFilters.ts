/**
 * @fileoverview Filter management utilities (gold standard pattern)
 * @source Extracted from AdminJobsPage filtering logic
 * 
 * UTILITY FUNCTIONS:
 * - Toggle all filters at once
 * - Check if all filters are selected
 * - Apply combined filter logic
 * 
 * DESIGN PATTERN:
 * - Uses AdminJobsPage gold standard
 * - Generic type-safe implementations
 * - Reusable across all admin pages
 * 
 * @goldstandard This is the superior pattern from AdminJobsPage
 */

/**
 * Toggle all filters to a specific value
 * 
 * @example
 * ```tsx
 * const newFilters = toggleAllFilters(statusFilters, true);
 * // All filters set to true
 * ```
 */
export function toggleAllFilters<T extends string>(
  filters: Record<T, boolean>,
  newValue: boolean
): Record<T, boolean> {
  const result = {} as Record<T, boolean>;
  for (const key in filters) {
    result[key] = newValue;
  }
  return result;
}

/**
 * Check if all filters are selected
 * 
 * @example
 * ```tsx
 * const allSelected = areAllFiltersSelected(statusFilters);
 * // true if all filters are true
 * ```
 */
export function areAllFiltersSelected<T extends string>(
  filters: Record<T, boolean>
): boolean {
  return Object.values(filters).every(Boolean);
}

/**
 * Apply combined filters to data
 * 
 * @example
 * ```tsx
 * const filtered = applyFilters(
 *   jobs,
 *   (job) => statusFilters[job.status],
 *   (job) => !actionFilters.unassigned || !job.driver,
 *   (job) => job.jobCode.includes(searchQuery)
 * );
 * ```
 */
export function applyFilters<T>(
  data: T[],
  statusFilter: (item: T) => boolean,
  actionFilter: (item: T) => boolean,
  searchFilter: (item: T) => boolean
): T[] {
  return data.filter(item => 
    statusFilter(item) && actionFilter(item) && searchFilter(item)
  );
}


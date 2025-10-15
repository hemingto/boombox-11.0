/**
 * @fileoverview Sorting and pagination utilities for lists and collections
 * @source boombox-10.0/src/app/components/getquote/chooselabor.tsx (sorting and pagination logic)
 * @refactor Extracted sorting and pagination logic for reusability
 */

export type SortOption = "featured" | "price" | "rating" | "reviews";

export interface SortableItem {
  id: number | string;
  featured?: boolean;
  hourlyRate?: number;
  rating?: number;
  numberOfReviews?: number;
}

export interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export interface PaginationResult<T> {
  currentItems: T[];
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
}

/**
 * Sort options configuration for dropdowns
 */
export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price", label: "Price: Low to High" },
  { value: "rating", label: "Highest Rating" },
  { value: "reviews", label: "Most Trusted" },
];

/**
 * Sort an array of items based on the specified sort option
 * @param items - Array of items to sort
 * @param sortBy - Sort option to apply
 * @returns Sorted array
 */
export function sortItems<T extends SortableItem>(
  items: T[],
  sortBy: SortOption
): T[] {
  const sorted = [...items];
  
  switch (sortBy) {
    case "featured":
      return sorted.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
      
    case "price":
      return sorted.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
      
    case "rating":
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
    case "reviews":
      return sorted.sort((a, b) => (b.numberOfReviews || 0) - (a.numberOfReviews || 0));
      
    default:
      return sorted;
  }
}

/**
 * Paginate an array of items
 * @param items - Array of items to paginate
 * @param config - Pagination configuration
 * @returns Pagination result with current items and metadata
 */
export function paginateItems<T>(
  items: T[],
  config: PaginationConfig
): PaginationResult<T> {
  const { currentPage, itemsPerPage, totalItems } = config;
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  const currentItems = items.slice(startIndex, endIndex);
  
  return {
    currentItems,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    startIndex,
    endIndex,
  };
}

/**
 * Calculate next page number
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 * @returns Next page number (clamped to valid range)
 */
export function getNextPage(currentPage: number, totalPages: number): number {
  return Math.min(currentPage + 1, totalPages);
}

/**
 * Calculate previous page number
 * @param currentPage - Current page number
 * @returns Previous page number (clamped to valid range)
 */
export function getPrevPage(currentPage: number): number {
  return Math.max(currentPage - 1, 1);
}

/**
 * Get sort option label by value
 * @param value - Sort option value
 * @returns Sort option label or default
 */
export function getSortOptionLabel(value: SortOption): string {
  return SORT_OPTIONS.find(option => option.value === value)?.label || "Sort by";
}

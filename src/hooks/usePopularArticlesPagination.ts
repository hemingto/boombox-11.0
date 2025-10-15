/**
 * @fileoverview Custom hook for popular articles pagination with mobile responsiveness
 * @source boombox-10.0/src/app/components/blog/blogpopulararticles.tsx (pagination logic lines 58-88)
 * 
 * HOOK FUNCTIONALITY:
 * - Manages popular articles pagination state for mobile devices
 * - Provides navigation functions (next/prev page) 
 * - Handles responsive display (pagination only on mobile)
 * - Integrates with existing ContentService for data
 * 
 * UTILITIES REUSED:
 * - ContentService from @/lib/services/contentService (existing boombox-11.0 service)
 * 
 * @refactor Extracted pagination logic from BlogPopularArticles component using established
 * pagination patterns from useBlogPagination hook
 */

import { useState, useMemo } from 'react';
import { PopularArticle } from '@/types/content.types';
import { ContentService } from '@/lib/services/contentService';

/**
 * Popular articles pagination hook parameters
 */
export interface UsePopularArticlesPaginationParams {
  /** Articles per page (default: 3) */
  articlesPerPage?: number;
  /** Whether to enable mobile-only pagination (default: true) */
  mobileOnly?: boolean;
}

/**
 * Popular articles pagination hook return type
 */
export interface UsePopularArticlesPaginationReturn {
  /** Current page number */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Articles to display on current page */
  displayedArticles: PopularArticle[];
  /** All popular articles */
  allArticles: PopularArticle[];
  /** Whether pagination should be shown */
  showPagination: boolean;
  /** Whether there is a previous page */
  hasPrevPage: boolean;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Navigate to previous page */
  prevPage: () => void;
  /** Navigate to next page */
  nextPage: () => void;
  /** Set current page directly */
  setCurrentPage: (page: number) => void;
}

/**
 * Custom hook for managing popular articles pagination
 * 
 * Handles pagination state for popular articles with mobile-responsive behavior.
 * On desktop, shows all articles. On mobile, shows paginated articles.
 * 
 * @param params - Hook configuration parameters
 * @returns Pagination state and navigation functions
 */
export const usePopularArticlesPagination = (
  params: UsePopularArticlesPaginationParams = {}
): UsePopularArticlesPaginationReturn => {
  const {
    articlesPerPage = 3,
    mobileOnly = true,
  } = params;

  const [currentPage, setCurrentPage] = useState(1);

  // Get all popular articles from ContentService
  const allArticles = useMemo(() => {
    return ContentService.getPopularArticles();
  }, []);

  // Calculate pagination values
  const totalPages = Math.ceil(allArticles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;

  // Determine displayed articles based on mobile-only setting
  const displayedArticles = useMemo(() => {
    if (mobileOnly) {
      // For mobile-only pagination, we'll let the component handle responsive display
      // This hook provides the paginated slice for mobile use
      return allArticles.slice(startIndex, endIndex);
    }
    // If not mobile-only, always paginate
    return allArticles.slice(startIndex, endIndex);
  }, [allArticles, startIndex, endIndex, mobileOnly]);

  // Navigation functions
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Pagination state
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const showPagination = totalPages > 1;

  return {
    currentPage,
    totalPages,
    displayedArticles,
    allArticles,
    showPagination,
    hasPrevPage,
    hasNextPage,
    prevPage,
    nextPage,
    setCurrentPage,
  };
};

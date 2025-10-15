/**
 * @fileoverview Custom hook for blog pagination using existing utilities
 * @source boombox-10.0/src/app/components/blog/blogallarticles.tsx (pagination logic lines 141-178)
 * 
 * HOOK FUNCTIONALITY:
 * - Manages blog post pagination state
 * - Integrates with existing paginateItems utility from sortingUtils
 * - Provides navigation functions (next/prev page)
 * - Handles category filtering with page reset
 * 
 * UTILITIES REUSED:
 * - paginateItems from @/lib/utils/sortingUtils (existing boombox-11.0 utility)
 * 
 * @refactor Extracted pagination logic from BlogAllArticles component using established
 * pagination patterns from useMovingPartners hook
 */

import { useState, useMemo } from 'react';
import { paginateItems, PaginationConfig, PaginationResult } from '@/lib/utils/sortingUtils';
import { BlogPost, BlogCategory, BlogPaginationResult } from '@/types/content.types';

/**
 * Blog pagination hook parameters
 */
export interface UseBlogPaginationParams {
  /** Array of blog posts to paginate */
  blogPosts: BlogPost[];
  /** Number of posts per page (default: 3) */
  postsPerPage?: number;
  /** Selected category for filtering */
  selectedCategory: BlogCategory;
}

/**
 * Blog pagination hook return interface
 */
export interface UseBlogPaginationReturn {
  // Pagination data
  /** Current page posts */
  currentPosts: BlogPost[];
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPrevPage: boolean;
  
  // Navigation functions
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;
  /** Set specific page number */
  setCurrentPage: (page: number) => void;
  
  // Category handling
  /** Handle category change (resets to page 1) */
  handleCategoryChange: (category: BlogCategory) => void;
}

/**
 * Custom hook for blog pagination
 * 
 * Provides pagination functionality for blog posts with category filtering.
 * Uses existing paginateItems utility for consistent pagination behavior
 * across the application.
 * 
 * @param params - Hook configuration parameters
 * @returns Pagination state and navigation functions
 * 
 * @example
 * ```tsx
 * const { 
 *   currentPosts, 
 *   currentPage, 
 *   totalPages, 
 *   hasNextPage, 
 *   hasPrevPage,
 *   nextPage, 
 *   prevPage,
 *   handleCategoryChange 
 * } = useBlogPagination({
 *   blogPosts: allBlogPosts,
 *   postsPerPage: 3,
 *   selectedCategory: 'Tips and Tricks'
 * });
 * ```
 */
export function useBlogPagination(params: UseBlogPaginationParams): UseBlogPaginationReturn {
  const { 
    blogPosts, 
    postsPerPage = 3, 
    selectedCategory 
  } = params;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Filter posts by selected category
  const filteredPosts = useMemo(() => {
    return blogPosts.filter(post => post.category === selectedCategory);
  }, [blogPosts, selectedCategory]);

  // Calculate pagination using existing utility
  const paginationResult: PaginationResult<BlogPost> = useMemo(() => {
    const config: PaginationConfig = {
      currentPage,
      itemsPerPage: postsPerPage,
      totalItems: filteredPosts.length,
    };

    return paginateItems(filteredPosts, config);
  }, [filteredPosts, currentPage, postsPerPage]);

  // Navigation functions
  const nextPage = () => {
    if (paginationResult.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (paginationResult.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Handle category change with page reset
  const handleCategoryChange = (category: BlogCategory) => {
    setCurrentPage(1); // Reset to first page when category changes
  };

  return {
    // Pagination data
    currentPosts: paginationResult.currentItems,
    currentPage,
    totalPages: paginationResult.totalPages,
    hasNextPage: paginationResult.hasNextPage,
    hasPrevPage: paginationResult.hasPrevPage,
    
    // Navigation functions
    nextPage,
    prevPage,
    setCurrentPage,
    
    // Category handling
    handleCategoryChange,
  };
}

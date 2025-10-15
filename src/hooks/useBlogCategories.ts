/**
 * @fileoverview Custom hook for blog category management
 * @source boombox-10.0/src/app/components/blog/blogallarticles.tsx (category logic lines 141-202)
 * 
 * HOOK FUNCTIONALITY:
 * - Manages blog category selection state
 * - Provides category switching functionality
 * - Integrates with ContentService for category data
 * - Handles category validation
 * 
 * @refactor Extracted category management logic from BlogAllArticles component
 * following established hook patterns in boombox-11.0
 */

import { useState, useEffect } from 'react';
import { BlogCategory } from '@/types/content.types';
import { ContentService } from '@/lib/services/contentService';

/**
 * Blog categories hook parameters
 */
export interface UseBlogCategoriesParams {
  /** Initial category selection (default: 'Tips and Tricks') */
  initialCategory?: BlogCategory;
  /** Callback when category changes */
  onCategoryChange?: (category: BlogCategory) => void;
}

/**
 * Blog categories hook return interface
 */
export interface UseBlogCategoriesReturn {
  /** Available categories */
  categories: BlogCategory[];
  /** Currently selected category */
  selectedCategory: BlogCategory;
  /** Set selected category */
  setSelectedCategory: (category: BlogCategory) => void;
  /** Check if category is selected */
  isCategorySelected: (category: BlogCategory) => boolean;
  /** Get post count for category */
  getCategoryPostCount: (category: BlogCategory) => number;
}

/**
 * Custom hook for blog category management
 * 
 * Provides category selection state and utilities for blog filtering.
 * Integrates with ContentService for category data and validation.
 * 
 * @param params - Hook configuration parameters
 * @returns Category state and management functions
 * 
 * @example
 * ```tsx
 * const { 
 *   categories, 
 *   selectedCategory, 
 *   setSelectedCategory,
 *   isCategorySelected,
 *   getCategoryPostCount 
 * } = useBlogCategories({
 *   initialCategory: 'Tips and Tricks',
 *   onCategoryChange: (category) => console.log('Category changed:', category)
 * });
 * ```
 */
export function useBlogCategories(params: UseBlogCategoriesParams = {}): UseBlogCategoriesReturn {
  const { 
    initialCategory = 'Tips and Tricks', 
    onCategoryChange 
  } = params;

  // State
  const [selectedCategory, setSelectedCategoryState] = useState<BlogCategory>(initialCategory);
  const [categories] = useState<BlogCategory[]>(() => ContentService.getBlogCategories());

  // Handle category change with validation and callback
  const setSelectedCategory = (category: BlogCategory) => {
    // Validate category
    if (!ContentService.isValidCategory(category)) {
      console.warn(`Invalid blog category: ${category}`);
      return;
    }

    setSelectedCategoryState(category);
    
    // Call callback if provided
    if (onCategoryChange) {
      onCategoryChange(category);
    }
  };

  // Utility functions
  const isCategorySelected = (category: BlogCategory): boolean => {
    return selectedCategory === category;
  };

  const getCategoryPostCount = (category: BlogCategory): number => {
    return ContentService.getBlogPostCount(category);
  };

  // Validate initial category on mount
  useEffect(() => {
    if (!ContentService.isValidCategory(initialCategory)) {
      console.warn(`Invalid initial category: ${initialCategory}, defaulting to 'Tips and Tricks'`);
      setSelectedCategoryState('Tips and Tricks');
    }
  }, [initialCategory]);

  return {
    categories,
    selectedCategory,
    setSelectedCategory,
    isCategorySelected,
    getCategoryPostCount,
  };
}

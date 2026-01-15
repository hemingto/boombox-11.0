/**
 * @fileoverview Blog all articles component with pagination and category filtering
 * @source boombox-10.0/src/app/components/blog/blogallarticles.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays paginated list of blog articles with category filtering
 * - Provides category tabs for filtering articles by type
 * - Implements responsive pagination controls
 * - Uses design system colors and components
 * 
 * API ROUTES UPDATED:
 * - No API routes used (static content only)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with design system tokens (zinc-950 → primary, zinc-400 → text-secondary)
 * - Applied consistent spacing patterns from layout components
 * - Used semantic color classes for better maintainability
 * - Replaced manual mobile detection with Tailwind responsive classes
 * 
 * BUSINESS LOGIC EXTRACTED:
 * - Blog data moved to ContentService
 * - Pagination logic extracted to useBlogPagination hook
 * - Category management extracted to useBlogCategories hook
 * - Component now focuses purely on UI rendering
 * 
 * @refactor Extracted business logic into hooks and services, applied design system,
 * removed manual responsive detection, improved accessibility with ARIA labels
 */

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { cn } from '@/lib/utils/cn';
import { ContentService } from '@/lib/services/contentService';
import { useBlogPagination } from '@/hooks/useBlogPagination';
import { useBlogCategories } from '@/hooks/useBlogCategories';

/**
 * BlogAllArticles Component
 * 
 * Displays a paginated list of blog articles with category filtering.
 * Uses custom hooks for state management and existing design system components.
 */
export const BlogAllArticles: React.FC = () => {
  // Get blog data from service
  const allBlogPosts = ContentService.getAllBlogPosts();

  // Category management
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    isCategorySelected,
  } = useBlogCategories({
    initialCategory: 'Tips and Tricks',
  });

  // Pagination management
  const {
    currentPosts,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    handleCategoryChange,
  } = useBlogPagination({
    blogPosts: allBlogPosts,
    postsPerPage: 3,
    selectedCategory,
  });

  // Handle category selection with page reset
  const handleCategorySelect = (category: typeof selectedCategory) => {
    setSelectedCategory(category);
    handleCategoryChange(category);
  };

  return (
    <div className="w-full lg:px-16 sm:mb-48 mb-24 px-6">
      {/* Page Title */}
      <h1 className="sm:mb-12 mb-6 text-text-primary">All Articles</h1>

      {/* Category Tabs */}
      <div 
        className="flex w-full space-x-4 mb-6 text-nowrap overflow-x-auto scrollbar-hide whitespace-nowrap border-b border-border"
        role="tablist"
        aria-label="Blog categories"
      >
        {categories.map((category) => (
          <button
            key={category}
            role="tab"
            aria-selected={isCategorySelected(category)}
            aria-controls={`blog-posts-${category.toLowerCase().replace(/\s+/g, '-')}`}
            className={cn(
              "py-2 px-4 border-b-2 focus:outline-none",
              isCategorySelected(category)
                ? "border-primary text-text-primary"
                : "border-transparent text-text-secondary hover:border-border-focus"
            )}
            onClick={() => handleCategorySelect(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Blog Posts List */}
      <div 
        className="space-y-6"
        id={`blog-posts-${selectedCategory.toLowerCase().replace(/\s+/g, '-')}`}
        role="tabpanel"
        aria-labelledby={`tab-${selectedCategory.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {currentPosts.map((blog, index) => (
          <article 
            key={`${blog.link}-${index}`} 
            className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6"
          >
            {/* Thumbnail */}
            <div className="relative w-full h-32 sm:w-32 sm:h-32 md:w-56 md:h-56 shrink-0 rounded-lg bg-surface-secondary overflow-hidden group">
              <Link 
                href={blog.link}
                className="block w-full h-full transform transition-transform duration-300 hover:scale-[102%] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label={`Read article: ${blog.blogTitle}`}
              >
                <Image
                  src={blog.thumbnail}
                  alt={blog.blogTitle}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 128px, 224px"
                />
              </Link>
            </div>

            {/* Blog Info */}
            <div className="flex-1 min-w-0">
              <Link 
                href={blog.link}
                className="block group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                <h2 className="text-base sm:text-lg md:text-2xl mb-1 md:mb-2 text-text-primary line-clamp-2">
                  {blog.blogTitle}
                </h2>
              </Link>
              
              <Link 
                href={blog.link}
                className="block group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                <p className="text-sm sm:mb-4 text-text-primary line-clamp-3">
                  {blog.blogDescription}
                </p>
              </Link>
              
              <div className="mt-2">
                <Link 
                  href={blog.link}
                  className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  <p className="hidden sm:block text-xs text-text-tertiary">
                    by {blog.author} | {blog.readTime}
                  </p>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav 
          className="relative flex justify-center items-center mt-10 mx-auto"
          aria-label="Blog pagination"
        >
          {/* Previous Page Button */}
          <button
            onClick={prevPage}
            disabled={!hasPrevPage}
            className={cn(
              "absolute left-0 rounded-full p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              hasPrevPage
                ? "bg-surface-secondary hover:bg-surface-tertiary active:bg-surface-quaternary cursor-pointer text-text-primary"
                : "bg-surface-secondary opacity-50 cursor-not-allowed text-text-disabled"
            )}
            aria-label={hasPrevPage ? "Go to previous page" : "Previous page (disabled)"}
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          {/* Page Counter */}
          <div 
            className="text-sm text-text-secondary"
            aria-live="polite"
            aria-atomic="true"
          >
            Page {currentPage} of {totalPages}
          </div>

          {/* Next Page Button */}
          <button
            onClick={nextPage}
            disabled={!hasNextPage}
            className={cn(
              "absolute right-0 rounded-full p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              hasNextPage
                ? "bg-surface-secondary hover:bg-surface-tertiary active:bg-surface-quaternary cursor-pointer text-text-primary"
                : "bg-surface-secondary opacity-50 cursor-not-allowed text-text-disabled"
            )}
            aria-label={hasNextPage ? "Go to next page" : "Next page (disabled)"}
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </nav>
      )}
    </div>
  );
};

export default BlogAllArticles;

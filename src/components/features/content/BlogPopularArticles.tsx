"use client";

/**
 * @fileoverview Popular articles component with mobile pagination and responsive display
 * @source boombox-10.0/src/app/components/blog/blogpopulararticles.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays grid of popular articles with responsive layout
 * - Implements mobile-only pagination with navigation arrows
 * - Shows all articles on desktop, paginated articles on mobile
 * - Uses Card component for consistent article display
 * 
 * API ROUTES UPDATED:
 * - No API routes used (static content only)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with design system tokens (slate-100 → surface-secondary)
 * - Used semantic spacing classes for consistent margins and padding
 * - Applied design system border utilities (border-border)
 * - Replaced manual mobile detection with Tailwind responsive classes where possible
 * 
 * BUSINESS LOGIC EXTRACTED:
 * - Popular articles data moved to ContentService
 * - Pagination logic extracted to usePopularArticlesPagination hook
 * - Mobile detection preserved for pagination display logic
 * 
 * @refactor Migrated to content domain with design system compliance and extracted business logic
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';
import { Card } from '@/components/ui/primitives/Card';
import { usePopularArticlesPagination } from '@/hooks/usePopularArticlesPagination';

/**
 * Popular articles component
 * 
 * Displays a responsive grid of popular articles with mobile pagination.
 * On desktop, shows all articles in a grid. On mobile, shows paginated articles
 * with navigation arrows.
 */
export const BlogPopularArticles: React.FC = () => {
 const [isMobile, setIsMobile] = useState(false);

 // Use pagination hook for article management
 const {
  currentPage,
  totalPages,
  displayedArticles,
  allArticles,
  showPagination,
  hasPrevPage,
  hasNextPage,
  prevPage,
  nextPage,
 } = usePopularArticlesPagination({
  articlesPerPage: 3,
  mobileOnly: true,
 });

 // Mobile detection for pagination display
 useEffect(() => {
  const checkIfMobile = () => {
   setIsMobile(window.innerWidth < 768);
  };

  checkIfMobile();
  window.addEventListener('resize', checkIfMobile);

  return () => window.removeEventListener('resize', checkIfMobile);
 }, []);

 // Determine which articles to show based on screen size
 const articlesToShow = isMobile ? displayedArticles : allArticles;

 return (
  <div className="lg:mx-12 mx-6 sm:pb-24 sm:mb-24 pb-12 mb-12 md:border-b md:border-border">
   {/* Header with title and mobile pagination controls */}
   <div className="flex flex-col sm:flex-row w-full justify-between items-left sm:items-center mb-10">
    <h1 className="mr-2">Popular articles</h1>
    
    {/* Mobile pagination controls */}
    {isMobile && showPagination && (
     <div className="flex mt-4 sm:mt-0" role="navigation" aria-label="Popular articles pagination">
      <button
       onClick={hasPrevPage ? prevPage : undefined}
       disabled={!hasPrevPage}
       className={`rounded-full mr-1 bg-surface-secondary active:bg-surface-tertiary p-2 ${
        !hasPrevPage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-tertiary'
       }`}
       aria-label="Previous page"
       type="button"
      >
       <ArrowLeftIcon className="w-6 h-6" aria-hidden="true" />
      </button>
      <button
       onClick={hasNextPage ? nextPage : undefined}
       disabled={!hasNextPage}
       className={`rounded-full bg-surface-secondary active:bg-surface-tertiary p-2 ${
        !hasNextPage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-tertiary'
       }`}
       aria-label="Next page"
       type="button"
      >
       <ArrowRightIcon className="w-6 h-6" aria-hidden="true" />
      </button>
     </div>
    )}
   </div>

   {/* Articles grid */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {articlesToShow.map((article, index) => (
     <Card
      key={`${article.title}-${index}`}
      imageSrc={article.imageSrc}
      imageAlt={article.imageAlt}
      blogtitle={article.title}
      author={`${article.author} |`}
      readTime={article.readTime}
      link={article.link}
      ariaLabel={`Read article: ${article.title} by ${article.author}`}
     />
    ))}
   </div>

   {/* Screen reader information for pagination */}
   {isMobile && showPagination && (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
     Page {currentPage} of {totalPages}
    </div>
   )}
  </div>
 );
};

export default BlogPopularArticles;

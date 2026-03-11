'use client';

/**
 * @fileoverview Popular articles component with mobile pagination and responsive display
 * @source boombox-10.0/src/app/components/blog/blogpopulararticles.tsx
 * @refactor Migrated to accept props from server component instead of static ContentService
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';
import { Card } from '@/components/ui/primitives/Card';
import type { PopularArticle } from '@/types/content.types';

interface BlogPopularArticlesProps {
  articles: PopularArticle[];
}

export const BlogPopularArticles: React.FC<BlogPopularArticlesProps> = ({
  articles,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 3;

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const totalPages = Math.ceil(articles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const paginatedArticles = articles.slice(
    startIndex,
    startIndex + articlesPerPage
  );

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const showPagination = totalPages > 1;

  const articlesToShow = isMobile ? paginatedArticles : articles;

  return (
    <div className="lg:mx-12 mx-6 sm:pb-24 sm:mb-24 pb-12 mb-12 md:border-b md:border-border">
      <div className="flex flex-col sm:flex-row w-full justify-between items-left sm:items-center mb-10">
        <h1 className="mr-2">Popular articles</h1>

        {isMobile && showPagination && (
          <div
            className="flex mt-4 sm:mt-0"
            role="navigation"
            aria-label="Popular articles pagination"
          >
            <button
              onClick={
                hasPrevPage ? () => setCurrentPage(p => p - 1) : undefined
              }
              disabled={!hasPrevPage}
              className={`rounded-full mr-1 bg-surface-secondary active:bg-surface-tertiary p-2 ${
                !hasPrevPage
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:bg-surface-tertiary'
              }`}
              aria-label="Previous page"
              type="button"
            >
              <ArrowLeftIcon className="w-6 h-6" aria-hidden="true" />
            </button>
            <button
              onClick={
                hasNextPage ? () => setCurrentPage(p => p + 1) : undefined
              }
              disabled={!hasNextPage}
              className={`rounded-full bg-surface-secondary active:bg-surface-tertiary p-2 ${
                !hasNextPage
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:bg-surface-tertiary'
              }`}
              aria-label="Next page"
              type="button"
            >
              <ArrowRightIcon className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

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

      {isMobile && showPagination && (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Page {currentPage} of {totalPages}
        </div>
      )}
    </div>
  );
};

export default BlogPopularArticles;

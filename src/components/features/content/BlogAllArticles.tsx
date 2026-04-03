'use client';

/**
 * @fileoverview Blog all articles component with pagination and category filtering
 * @source boombox-10.0/src/app/components/blog/blogallarticles.tsx
 * @refactor Migrated to accept props from server component instead of static ContentService
 */

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { cn } from '@/lib/utils/cn';
import { paginateItems } from '@/lib/utils/sortingUtils';

interface BlogPostItem {
  category: string;
  thumbnail: string;
  blogTitle: string;
  blogDescription: string;
  author: string;
  readTime: string;
  datePublished: string;
  link: string;
}

interface BlogAllArticlesProps {
  posts: BlogPostItem[];
  categories: string[];
}

export const BlogAllArticles: React.FC<BlogAllArticlesProps> = ({
  posts,
  categories,
}) => {
  const MOST_RECENT = 'Most Recent';

  const allCategories = useMemo(() => {
    const tabs = [MOST_RECENT, ...categories.filter(c => c !== MOST_RECENT)];
    return tabs.length === 1 ? [MOST_RECENT] : tabs;
  }, [categories]);

  const [selectedCategory, setSelectedCategory] = useState(MOST_RECENT);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 3;

  const filteredPosts = useMemo(() => {
    let result = posts;

    if (selectedCategory !== MOST_RECENT) {
      result = posts.filter(p => p.category === selectedCategory);
    }

    return [...result].sort((a, b) => {
      const da = a.datePublished ? new Date(a.datePublished).getTime() : 0;
      const db = b.datePublished ? new Date(b.datePublished).getTime() : 0;
      return db - da;
    });
  }, [posts, selectedCategory]);

  const pagination = useMemo(
    () =>
      paginateItems(filteredPosts, {
        currentPage,
        itemsPerPage: postsPerPage,
        totalItems: filteredPosts.length,
      }),
    [filteredPosts, currentPage]
  );

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <div className="w-full lg:px-16 sm:mb-48 mb-24 px-6">
      <h1 className="sm:mb-12 mb-6 text-text-primary">All Articles</h1>

      <div
        className="flex w-full space-x-4 mb-6 text-nowrap overflow-x-auto scrollbar-hide whitespace-nowrap border-b border-border"
        role="tablist"
        aria-label="Blog categories"
      >
        {allCategories.map(category => (
          <button
            key={category}
            role="tab"
            aria-selected={selectedCategory === category}
            className={cn(
              'py-2 px-4 border-b-2 focus:outline-none',
              selectedCategory === category
                ? 'border-primary text-text-primary'
                : 'border-transparent text-text-primary hover:border-border-focus'
            )}
            onClick={() => handleCategorySelect(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="space-y-6" role="tabpanel">
        {pagination.currentItems.map((blog, index) => (
          <article
            key={`${blog.link}-${index}`}
            className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6"
          >
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

      {pagination.totalPages > 1 && (
        <nav
          className="relative flex justify-center items-center mt-10 mx-auto"
          aria-label="Blog pagination"
        >
          <button
            onClick={() => setCurrentPage(p => p - 1)}
            disabled={!pagination.hasPrevPage}
            className={cn(
              'absolute left-0 rounded-full p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              pagination.hasPrevPage
                ? 'bg-surface-secondary hover:bg-surface-tertiary active:bg-surface-quaternary cursor-pointer text-text-primary'
                : 'bg-surface-secondary opacity-50 cursor-not-allowed text-text-disabled'
            )}
            aria-label={
              pagination.hasPrevPage
                ? 'Go to previous page'
                : 'Previous page (disabled)'
            }
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          <div
            className="text-sm text-text-primary"
            aria-live="polite"
            aria-atomic="true"
          >
            Page {currentPage} of {pagination.totalPages}
          </div>

          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={!pagination.hasNextPage}
            className={cn(
              'absolute right-0 rounded-full p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              pagination.hasNextPage
                ? 'bg-surface-secondary hover:bg-surface-tertiary active:bg-surface-quaternary cursor-pointer text-text-primary'
                : 'bg-surface-secondary opacity-50 cursor-not-allowed text-text-disabled'
            )}
            aria-label={
              pagination.hasNextPage
                ? 'Go to next page'
                : 'Next page (disabled)'
            }
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </nav>
      )}
    </div>
  );
};

export default BlogAllArticles;

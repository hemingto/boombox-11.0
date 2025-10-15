/**
 * @fileoverview Video gallery component for training videos with filtering and pagination
 * @source boombox-10.0/src/app/components/mover-account/bestpracticesvideogallery.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays a paginated gallery of training videos for service providers with category filtering.
 * Features include:
 * - Filter dropdown for video categories (All, Packing, Transportation)
 * - Pagination controls for navigating through videos (3 per page)
 * - YouTube video embeds with responsive aspect ratio
 * - Click-outside detection for closing dropdown
 *
 * DESIGN SYSTEM UPDATES:
 * - Updated colors: `ring-slate-100` → `ring-border`, `bg-slate-100` → `bg-surface-tertiary`
 * - Updated text colors: `text-zinc-950` → `text-text-primary`, `text-gray-600` → `text-text-secondary`
 * - Applied semantic tokens for consistency
 * - Replaced custom shadow with design system shadow classes
 *
 * ACCESSIBILITY:
 * - Proper button roles for interactive elements
 * - Disabled state handling for pagination buttons
 * - Keyboard navigation support for dropdown
 * - ARIA labels for screen readers
 * - Semantic HTML structure with proper headings
 *
 * @refactor Extracted video data to constants file, replaced useEffect click-outside with useClickOutside hook
 */

'use client';

import { useState, useMemo, useRef } from 'react';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useClickOutside } from '@/hooks/useClickOutside';
import {
  TRAINING_VIDEOS,
  VIDEO_FILTER_OPTIONS,
  type VideoFilterOption,
} from '@/data/trainingVideos';

export function BestPracticesVideoGallery() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState<
    VideoFilterOption['value']
  >('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 3;

  // Use the centralized useClickOutside hook
  useClickOutside(filterRef, () => {
    setIsFilterOpen(false);
  });

  const filteredVideos = useMemo(() => {
    if (selectedFilter === 'all') return TRAINING_VIDEOS;
    return TRAINING_VIDEOS.filter(
      (video) => video.category === selectedFilter
    );
  }, [selectedFilter]);

  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVideos = filteredVideos.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleFilterChange = (filter: VideoFilterOption['value']) => {
    setSelectedFilter(filter);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  return (
    <div>
      {/* Filter Controls */}
      <div className="mb-4" ref={filterRef}>
        <div className="relative">
          <button
            type="button"
            className={`relative w-fit rounded-full px-3 py-2 cursor-pointer ${
              isFilterOpen
                ? 'ring-2 ring-border bg-surface-primary'
                : 'ring-1 ring-border bg-surface-tertiary'
            }`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-expanded={isFilterOpen}
            aria-haspopup="listbox"
            aria-label="Filter videos by category"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-primary">
                {VIDEO_FILTER_OPTIONS.find(
                  (option) => option.value === selectedFilter
                )?.label || 'Filter by'}
              </span>
              <svg
                className="shrink-0 w-3 h-3 text-text-primary ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>

          {isFilterOpen && (
            <div
              role="listbox"
              className="absolute w-fit min-w-36 left-0 z-10 mt-2 border border-border rounded-md bg-surface-primary shadow-custom-shadow"
            >
              {VIDEO_FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selectedFilter === option.value}
                  className="w-full flex justify-between items-center p-3 cursor-pointer hover:bg-surface-tertiary text-left"
                  onClick={() => handleFilterChange(option.value)}
                >
                  <span className="text-sm text-text-primary">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video List */}
      <div>
        {paginatedVideos.map((video) => (
          <div key={video.title} className="py-4">
            <h3 className="text-lg font-medium text-text-primary">
              {video.title}
            </h3>
            <iframe
              className="w-full aspect-video mt-2 rounded-md"
              src={video.link.replace('watch?v=', 'embed/')}
              title={video.title}
              allowFullScreen
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="relative flex justify-center items-center mt-8 mb-44">
          <button
            type="button"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className={`absolute left-0 rounded-full bg-surface-tertiary active:bg-surface-disabled p-2 ${
              currentPage === 1
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <ChevronLeftIcon className="w-4 h-4 text-text-secondary" />
          </button>
          <span className="text-sm mx-4 text-text-primary">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className={`absolute right-0 rounded-full bg-surface-tertiary active:bg-surface-disabled p-2 ${
              currentPage === totalPages
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <ChevronRightIcon className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      )}
    </div>
  );
}


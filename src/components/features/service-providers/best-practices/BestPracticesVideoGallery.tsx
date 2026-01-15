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
 * - Refactored to use FilterDropdown primitive component
 *
 * ACCESSIBILITY:
 * - Proper button roles for interactive elements
 * - Disabled state handling for pagination buttons
 * - Keyboard navigation support for dropdown
 * - ARIA labels for screen readers
 * - Semantic HTML structure with proper headings
 *
 * @refactor Extracted video data to constants file, replaced useEffect click-outside with useClickOutside hook
 * @refactor Replaced custom dropdown implementation with FilterDropdown primitive component
 */

'use client';

import { useState, useMemo } from 'react';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { FilterDropdown } from '@/components/ui/primitives';
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

  const itemsPerPage = 3;

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

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter as VideoFilterOption['value']);
    setCurrentPage(1);
  };

  return (
    <div>
      {/* Filter Controls */}
      <div className="mb-4">
        <FilterDropdown
          options={VIDEO_FILTER_OPTIONS}
          value={selectedFilter}
          onChange={handleFilterChange}
          placeholder="Filter by"
          ariaLabel="Filter videos by category"
        />
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
            className={`absolute left-0 rounded-full bg-surface-tertiary hover:bg-surface-secondary active:bg-surface-pressed p-2 flex items-center justify-center ${
              currentPage === 1
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <ChevronLeftIcon className="w-4 h-4 text-text-primary" />
          </button>
          <span className="text-sm mx-4 text-text-primary">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className={`absolute right-0 rounded-full bg-surface-tertiary hover:bg-surface-secondary active:bg-surface-pressed p-2 flex items-center justify-center ${
              currentPage === totalPages
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <ChevronRightIcon className="w-4 h-4 text-text-primary" />
          </button>
        </div>
      )}
    </div>
  );
}


/**
 * @fileoverview Job History component displaying past and upcoming jobs for service providers
 * @source boombox-10.0/src/app/components/mover-account/jobhistory.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays job history for movers and drivers
 * - Provides filtering (all, completed, upcoming, newest)
 * - Includes search functionality across job types and addresses
 * - Implements pagination for large datasets
 * - Shows job details with star ratings and feedback
 * - Integrates with JobHistoryPopup for detailed view
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors (text-zinc-950, text-slate-100, bg-slate-100) with semantic tokens
 * - Used design system colors: text-text-primary, text-text-secondary, bg-surface-tertiary
 * - Applied consistent hover and active states using design system colors
 * - Used global utility classes: input-field, btn-secondary
 * 
 * BUSINESS LOGIC EXTRACTION:
 * - Moved formatDateTime to @/lib/utils/dateUtils
 * - Used existing useClickOutside hook from @/hooks
 * - Extracted star rating component to reusable utility
 * 
 * @refactor Data fetching moved to parent page via useJobsPageData hook.
 * Component now accepts jobs as props for coordinated page-level loading.
 */

'use client';

import { useState, useRef } from 'react';
import { ClipboardDocumentListIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { useClickOutside } from '@/hooks/useClickOutside';
import { formatDateTime } from '@/lib/utils/dateUtils';
import { JobHistoryPopup } from './JobHistoryPopup';
import { Button } from '@/components/ui/primitives/Button/Button';
import type { HistoryJob } from '@/hooks/useJobsPageData';

// Re-export type for convenience
export type { HistoryJob };

interface JobHistoryProps {
  userType: 'mover' | 'driver';
  userId: string;
  /** Job history data to display */
  jobs: HistoryJob[];
}

type FilterOption = 'all' | 'completed' | 'upcoming' | 'newest';

/**
 * StarRating component for displaying feedback ratings
 */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center" role="img" aria-label={`${rating} out of 5 stars`}>
      {[...Array(5)].map((_, index) => (
        <StarIcon
          key={index}
          className={`h-4 w-4 ${
            index < rating ? 'text-text-primary' : 'text-border'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function JobHistory({ userType, userId, jobs }: JobHistoryProps) {
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showDetailsPopup, setShowDetailsPopup] = useState<number | null>(null);
  const itemsPerPage = 10;

  const filterRef = useRef<HTMLDivElement>(null);
  useClickOutside(filterRef, () => setIsFilterOpen(false));

  const isPackingSupplyRoute = (job: HistoryJob) => {
    return job.appointmentType === 'Packing Supply Delivery' && job.routeId;
  };

  const filteredJobs = jobs
    .filter(job => {
      const searchMatch = searchTerm === '' || 
        job.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.appointmentType.toLowerCase().includes(searchTerm.toLowerCase());
      
      const currentDate = new Date();
      const jobDate = new Date(job.date);
      
      switch (filterOption) {
        case 'completed':
          return searchMatch && jobDate < currentDate;
        case 'upcoming':
          return searchMatch && jobDate > currentDate;
        case 'newest':
          return searchMatch;
        default:
          return searchMatch;
      }
    })
    .sort((a, b) => {
      if (filterOption === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (jobs.length === 0) {
    return (
      <div className="bg-surface-primary rounded-md p-8 text-center">
        <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-text-secondary mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-text-tertiary">No completed jobs yet</h3>
        <p className="text-text-tertiary">
          Your job history will appear here once you start completing jobs
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search jobs..."
            className="input-field w-full sm:mb-4 mb-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search jobs"
          />
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              className={`relative w-fit rounded-full px-3 py-2 cursor-pointer ${
                isFilterOpen 
                  ? 'ring-2 ring-border bg-surface-primary' 
                  : 'ring-1 ring-border bg-surface-tertiary hover:bg-surface-disabled'
              }`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-label="Filter jobs"
              aria-expanded={isFilterOpen}
              aria-haspopup="true"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-primary text-nowrap">
                  {filterOption === 'all' ? 'All Jobs' :
                    filterOption === 'completed' ? 'Completed' :
                    filterOption === 'upcoming' ? 'Upcoming' :
                    'Newest First'}
                </span>
                <svg
                  className="shrink-0 w-3 h-3 text-text-primary ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isFilterOpen && (
              <div 
                className="absolute w-fit min-w-36 left-0 z-10 mt-2 border border-border rounded-md bg-surface-primary shadow-lg"
                role="menu"
                aria-label="Filter options"
              >
                {['all', 'completed', 'upcoming', 'newest'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="flex justify-between items-center p-3 w-full cursor-pointer hover:bg-surface-tertiary text-left"
                    onClick={() => {
                      setFilterOption(option as FilterOption);
                      setIsFilterOpen(false);
                    }}
                    role="menuitem"
                  >
                    <span className="text-sm text-text-primary capitalize">
                      {option === 'all' ? 'All Jobs' : option}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface-primary rounded-md">
        {/* Table Header */}
        <div className="grid grid-cols-5 border-b border-border py-3 px-4">
          <div className="text-sm font-medium text-text-secondary">Job Type</div>
          <div className="text-sm font-medium text-text-secondary">Address</div>
          <div className="text-sm font-medium text-text-secondary">Date & Time</div>
          <div className="text-sm font-medium text-text-secondary">Feedback</div>
          <div className="text-sm font-medium text-text-secondary text-right">Actions</div>
        </div>

        {/* Table Content */}
        {paginatedJobs.map((job) => (
          <div key={job.id} className="grid grid-cols-5 items-center py-4 border-b border-border last:border-none px-4">
            <div className="truncate pr-4">
              <p className="text-sm text-text-primary">{job.appointmentType}</p>
              {isPackingSupplyRoute(job) && (
                <p className="text-xs text-text-tertiary">
                  {job.totalStops} stops • ${job.estimatedPayout || 0} payout
                </p>
              )}
            </div>
            <div className="text-sm text-text-primary truncate pr-4">
              {job.address}
              {isPackingSupplyRoute(job) && job.routeStatus && (
                <div className="text-xs text-text-tertiary mt-1">
                  Status: {job.routeStatus.replace('_', ' ')}
                </div>
              )}
            </div>
            <div className="text-sm text-text-primary">{formatDateTime(job.date)}</div>
            <div>
              {isPackingSupplyRoute(job) ? (
                <div className="text-sm text-text-tertiary">
                  {job.routeStatus === 'completed' ? (
                    <span className="text-status-success">Route Completed</span>
                  ) : (
                    <span>Route {job.routeStatus}</span>
                  )}
                </div>
              ) : job.feedback ? (
                <StarRating rating={job.feedback.rating} />
              ) : (
                <span className="text-sm text-text-tertiary">No feedback yet</span>
              )}
            </div>
            <div className="text-right">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDetailsPopup(job.id)}
                aria-label={`View details for ${job.appointmentType}`}
              >
                More Details
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="relative flex justify-center items-center mt-8">
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`absolute left-0 rounded-full bg-surface-tertiary active:bg-surface-disabled p-2 ${
              currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-disabled'
            }`}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="w-4 h-4 text-text-secondary" />
          </button>

          <span className="text-sm text-text-primary">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`absolute right-0 rounded-full bg-surface-tertiary active:bg-surface-disabled p-2 ${
              currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-disabled'
            }`}
            aria-label="Next page"
          >
            <ChevronRightIcon className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      )}

      {/* Details Popup */}
      {showDetailsPopup && (
        <JobHistoryPopup
          isOpen={!!showDetailsPopup}
          onClose={() => setShowDetailsPopup(null)}
          job={jobs.find(job => job.id === showDetailsPopup) || null}
        />
      )}
    </div>
  );
}

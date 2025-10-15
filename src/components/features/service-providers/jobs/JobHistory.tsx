/**
 * @fileoverview Job History component displaying past and upcoming jobs for service providers
 * @source boombox-10.0/src/app/components/mover-account/jobhistory.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays job history for movers and drivers
 * - Fetches both regular appointments and packing supply delivery routes
 * - Provides filtering (all, completed, upcoming, newest)
 * - Includes search functionality across job types and addresses
 * - Implements pagination for large datasets
 * - Shows job details with star ratings and feedback
 * - Integrates with JobHistoryPopup for detailed view
 * 
 * API ROUTES UPDATED:
 * - Old: /api/drivers/${userId}/jobs → New: /api/drivers/[id]/jobs
 * - Old: /api/movers/${userId}/jobs → New: /api/moving-partners/[id]/jobs
 * - Old: /api/drivers/${userId}/packing-supply-routes → New: /api/drivers/[id]/packing-supply-routes
 * - Old: /api/movers/${userId}/packing-supply-routes → New: /api/moving-partners/[id]/packing-supply-routes
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
 * @refactor Extracted utilities to centralized locations, applied design system colors,
 * improved accessibility with proper ARIA labels, updated API routes to new structure
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ClipboardDocumentListIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { useClickOutside } from '@/hooks/useClickOutside';
import { formatDateTime } from '@/lib/utils/dateUtils';
import { JobHistoryPopup } from './JobHistoryPopup';

interface Job {
  id: number;
  address: string;
  date: string;
  time: string;
  appointmentType: string;
  numberOfUnits: number;
  planType: string;
  insuranceCoverage?: string;
  requestedStorageUnits?: {
    unitType: string;
    quantity: number;
  }[];
  serviceStartTime?: string; // Unix timestamp in milliseconds
  serviceEndTime?: string; // Unix timestamp in milliseconds
  user?: {
    firstName: string;
    lastName: string;
  };
  driver?: {
    firstName: string;
    lastName: string;
  };
  feedback?: {
    rating: number;
    comment: string;
    tipAmount: number;
  };
  // Packing supply route specific fields
  routeId?: string;
  routeStatus?: string;
  totalStops?: number;
  completedStops?: number;
  estimatedMiles?: number;
  estimatedDurationMinutes?: number;
  estimatedPayout?: number;
  payoutStatus?: string;
  orders?: any[];
  routeMetrics?: {
    totalDistance?: number;
    totalTime?: number;
    startTime?: Date;
    endTime?: Date;
  };
}

interface JobHistoryProps {
  userType: 'mover' | 'driver';
  userId: string;
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

export function JobHistory({ userType, userId }: JobHistoryProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showDetailsPopup, setShowDetailsPopup] = useState<number | null>(null);
  const itemsPerPage = 10;

  const filterRef = useRef<HTMLDivElement>(null);
  useClickOutside(filterRef, () => setIsFilterOpen(false));

  const fetchJobs = useCallback(async () => {
    try {
      // Determine API base path based on user type
      const apiBase = userType === 'mover' ? 'moving-partners' : 'drivers';
      
      // Fetch regular jobs
      const jobsResponse = await fetch(`/api/${apiBase}/${userId}/jobs`);
      if (!jobsResponse.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const jobsData = await jobsResponse.json();
      
      // Fetch packing supply routes
      let packingSupplyRoutes = [];
      try {
        const routesResponse = await fetch(`/api/${apiBase}/${userId}/packing-supply-routes`);
        if (routesResponse.ok) {
          const routesData = await routesResponse.json();
          // Convert routes to job format
          packingSupplyRoutes = routesData.map((route: any) => ({
            ...route,
            date: route.date || new Date().toISOString(),
            time: route.time || route.date || new Date().toISOString(),
          }));
        }
      } catch (routeError) {
        console.warn('Failed to fetch packing supply routes:', routeError);
      }
      
      // Combine jobs and routes
      const combinedJobs = [...jobsData, ...packingSupplyRoutes];
      setJobs(combinedJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  }, [userType, userId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const isPackingSupplyRoute = (job: Job) => {
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

  if (isLoading) {
    return (
      <div>
        <div className="bg-surface-primary rounded-md">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-border px-4">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="h-4 w-40 bg-surface-tertiary rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-24 bg-surface-tertiary rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-4 w-16 bg-surface-tertiary rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-surface-tertiary rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-status-bg-error p-3 mb-4 border border-border-error rounded-md">
        <p className="text-sm text-status-error">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center space-x-2 px-4 py-2 mt-2 bg-surface-tertiary hover:bg-surface-disabled active:bg-surface-disabled rounded-md text-sm transition-colors"
          aria-label="Retry loading jobs"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-surface-primary rounded-md p-8 text-center">
        <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h3 className="text-lg font-medium mb-2 text-text-primary">No completed jobs yet</h3>
        <p className="text-text-secondary">
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
              className={`relative w-fit rounded-full px-3 py-2 cursor-pointer transition-colors ${
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
                    className="flex justify-between items-center p-3 w-full cursor-pointer hover:bg-surface-tertiary transition-colors text-left"
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
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDetailsPopup(job.id)}
                aria-label={`View details for ${job.appointmentType}`}
              >
                More Details
              </button>
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
            className={`absolute left-0 rounded-full bg-surface-tertiary active:bg-surface-disabled p-2 transition-colors ${
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
            className={`absolute right-0 rounded-full bg-surface-tertiary active:bg-surface-disabled p-2 transition-colors ${
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


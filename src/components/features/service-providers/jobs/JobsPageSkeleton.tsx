/**
 * @fileoverview Page-level skeleton for Jobs page
 * Provides a unified loading state for the entire Jobs page to prevent layout shift.
 * 
 * This skeleton is shown while useJobsPageData fetches all job-related data.
 * Once data is loaded, the actual components render with the fetched data.
 */

'use client';

interface JobsPageSkeletonProps {
  /** Whether to show the job offers skeleton (drivers only) */
  showJobOffers?: boolean;
}

export function JobsPageSkeleton({ showJobOffers = false }: JobsPageSkeletonProps) {
  return (
    <div 
      className="animate-pulse"
      role="status"
      aria-busy="true"
      aria-label="Loading jobs page"
    >
      {/* Job Offers Skeleton (Drivers Only) */}
      {showJobOffers && (
        <section className="mb-12">
          <div className="max-w-5xl lg:px-16 px-6 mx-auto">
            {/* Header */}
            <div className="h-8 w-32 bg-surface-tertiary rounded mb-6" />
            
            {/* Offer Card */}
            <div className="rounded-md bg-white border border-slate-100 p-6 w-80 sm:w-96">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div className="h-6 bg-surface-tertiary rounded-full w-24" />
                  <div className="h-6 bg-surface-tertiary rounded-full w-20" />
                </div>
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-6 bg-surface-tertiary rounded w-3/4" />
                    <div className="h-4 bg-surface-tertiary rounded w-1/2" />
                  </div>
                  <div className="h-8 bg-surface-tertiary rounded w-12" />
                </div>
                <div className="h-px bg-surface-tertiary" />
                <div className="h-4 bg-surface-tertiary rounded w-2/3" />
                <div className="flex gap-3 pt-2">
                  <div className="h-10 bg-surface-tertiary rounded-full flex-1" />
                  <div className="h-10 bg-surface-tertiary rounded-full flex-1" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Jobs Skeleton */}
      <div className="max-w-5xl lg:px-16 px-6 mx-auto mb-12">
        {/* Header */}
        <div className="h-8 w-40 bg-surface-tertiary rounded mb-8" />
        
        {/* Filter and toggle */}
        <div className="flex justify-between items-start mb-6">
          <div className="h-9 w-24 bg-surface-tertiary rounded-full" />
          <div className="h-9 w-48 bg-surface-tertiary rounded-full" />
        </div>

        {/* Job Cards */}
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-md shadow-custom-shadow p-4">
              <div className="flex items-center space-x-4">
                {/* Map skeleton */}
                <div className="w-36 h-36 shrink-0 bg-surface-tertiary rounded-l-md" />
                
                {/* Content skeleton */}
                <div className="flex-1 h-36 relative">
                  {/* Status and menu skeleton */}
                  <div className="absolute top-0 right-0 flex items-center gap-4">
                    <div className="w-28 h-8 bg-surface-tertiary rounded-md" />
                    <div className="w-8 h-8 bg-surface-tertiary rounded-full" />
                  </div>

                  {/* Text content skeleton */}
                  <div className="h-full flex items-center">
                    <div className="space-y-2">
                      <div className="h-6 bg-surface-tertiary rounded w-64" />
                      <div className="h-5 bg-surface-tertiary rounded w-48" />
                      <div className="h-5 bg-surface-tertiary rounded w-56" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job History Skeleton */}
      <div className="max-w-5xl lg:px-16 px-6 mx-auto mt-12 sm:mt-24 mb-20 sm:mb-36">
        {/* Header */}
        <div className="h-8 w-32 bg-surface-tertiary rounded mb-8" />
        
        {/* Search and filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="h-10 bg-surface-tertiary rounded w-full sm:w-64" />
          <div className="h-10 w-28 bg-surface-tertiary rounded-full" />
        </div>

        {/* Table skeleton */}
        <div className="bg-surface-primary rounded-md">
          {/* Table Header */}
          <div className="grid grid-cols-5 border-b border-border py-3 px-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-surface-tertiary rounded w-20" />
            ))}
          </div>

          {/* Table Rows */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-border px-4">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="h-4 w-40 bg-surface-tertiary rounded mb-2" />
                  <div className="h-3 w-24 bg-surface-tertiary rounded" />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-4 w-16 bg-surface-tertiary rounded" />
                <div className="h-4 w-20 bg-surface-tertiary rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">Loading jobs, please wait...</span>
    </div>
  );
}


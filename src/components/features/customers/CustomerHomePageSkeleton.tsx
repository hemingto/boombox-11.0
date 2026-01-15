/**
 * @fileoverview Page-level skeleton for Customer Home Page
 * Provides a unified loading state for the entire customer dashboard to prevent layout shift.
 * 
 * This skeleton is shown while useCustomerHomePageData fetches all dashboard data.
 * Once data is loaded, the actual components render with the fetched data.
 */

'use client';

export function CustomerHomePageSkeleton() {
  return (
    <div 
      className="animate-pulse"
      role="status"
      aria-busy="true"
      aria-label="Loading customer dashboard"
    >
      {/* Info Cards Section Skeleton */}
      <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto mb-8">
        {/* Info Card Skeleton */}
        <div className="bg-surface-tertiary border border-border rounded-md p-6 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-white rounded w-48" />
              <div className="h-4 bg-white rounded w-full max-w-md" />
              <div className="h-8 bg-white rounded-full w-48 mt-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto sm:mb-8 mb-6">
        {/* Upcoming Section Header */}
        <div className="h-8 w-32 bg-surface-tertiary rounded mt-8 sm:mt-8 mb-4" />

        {/* Appointment Cards Skeleton */}
        <div className="flex flex-col sm:mb-4 mb-2">
          {[1, 2].map((i) => (
            <div key={i} className="mt-4">
              <div className="bg-white rounded-md shadow-custom-shadow overflow-hidden">
                {/* Map placeholder */}
                <div className="h-32 bg-surface-tertiary" />
                
                {/* Card content */}
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="h-6 bg-surface-tertiary rounded w-48" />
                      <div className="h-4 bg-surface-tertiary rounded w-32" />
                    </div>
                    <div className="h-8 w-8 bg-surface-tertiary rounded-full" />
                  </div>
                  <div className="h-4 bg-surface-tertiary rounded w-64" />
                  <div className="h-4 bg-surface-tertiary rounded w-56" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Storage Units Section Skeleton */}
      <div className="mb-24">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center lg:px-16 px-6 max-w-5xl mx-auto mb-8">
          {/* Section header */}
          <div className="h-8 w-48 bg-surface-tertiary rounded" />
          {/* Button skeleton (hidden on mobile) */}
          <div className="hidden sm:block h-10 w-40 bg-surface-tertiary rounded-full" />
        </div>
        
        <div className="lg:px-16 px-6 max-w-5xl w-full mx-auto space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-md shadow-custom-shadow p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Image placeholder */}
                <div className="w-full sm:w-48 h-48 bg-surface-tertiary rounded-md shrink-0" />
                
                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-surface-tertiary rounded w-32" />
                  <div className="space-y-2">
                    <div className="h-4 bg-surface-tertiary rounded w-40" />
                    <div className="h-4 bg-surface-tertiary rounded w-36" />
                    <div className="h-4 bg-surface-tertiary rounded w-48" />
                  </div>
                  {/* Description area */}
                  <div className="h-20 bg-surface-tertiary rounded w-full mt-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">Loading dashboard, please wait...</span>
    </div>
  );
}


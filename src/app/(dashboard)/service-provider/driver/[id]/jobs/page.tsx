/**
 * @fileoverview Driver jobs page - job offers, upcoming jobs, and history
 * @source boombox-10.0/src/app/driver-account-page/[id]/jobs/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group
 * 
 * PAGE STRUCTURE:
 * 1. JobOffers - Pending job offers requiring accept/decline (top priority)
 * 2. UpcomingJobs - Accepted jobs awaiting completion
 * 3. JobHistory - Completed past jobs
 * 
 * DATA FETCHING:
 * Uses useJobsPageData hook for centralized data fetching.
 * This enables a single loading state for the entire page,
 * preventing layout shift from sections appearing/disappearing.
 */

'use client';

import { use } from 'react';
import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import { JobOffers } from '@/components/features/service-providers/jobs/JobOffers';
import { UpcomingJobs } from '@/components/features/service-providers/jobs/UpcomingJobs';
import { JobHistory } from '@/components/features/service-providers/jobs/JobHistory';
import { JobsPageSkeleton } from '@/components/features/service-providers/jobs/JobsPageSkeleton';
import { useJobsPageData } from '@/hooks/useJobsPageData';

// Define a type for the resolved params for clarity
type PageParams = {
  id: string;
};

export default function DriverJobsPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const driverId = actualParams.id;

  const {
    jobOffers,
    upcomingJobs,
    jobHistory,
    isLoading,
    error,
    setJobOffers,
    setUpcomingJobs,
    acceptOffer,
  } = useJobsPageData({ userType: 'driver', userId: driverId });

  return (
    <>
      <SubPageHero
        title="Jobs"
        description="View job offers, upcoming jobs, and job history"
        userType="driver"
        userId={driverId}
      />
      
      {isLoading ? (
        <JobsPageSkeleton showJobOffers />
      ) : error ? (
        <div className="max-w-5xl lg:px-16 px-6 mx-auto">
          <div
            className="bg-status-error/10 p-4 mb-4 border border-status-error rounded-md"
            role="alert"
          >
            <p className="text-sm text-status-error">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-status-error underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      ) : (
        <>
          <JobOffers 
            driverId={driverId} 
            offers={jobOffers}
            onOffersChange={setJobOffers}
            onAcceptOffer={acceptOffer}
          />
          <UpcomingJobs 
            userType="driver" 
            userId={driverId}
            appointments={upcomingJobs}
            onAppointmentsChange={setUpcomingJobs}
          />
          <div className="max-w-5xl lg:px-16 px-6 mx-auto mt-12 sm:mt-24 mb-20 sm:mb-36">
            <h2 className="text-2xl mb-8">Job History</h2>
            <JobHistory 
              userType="driver" 
              userId={driverId}
              jobs={jobHistory}
            />
          </div>
        </>
      )}
    </>
  );
}

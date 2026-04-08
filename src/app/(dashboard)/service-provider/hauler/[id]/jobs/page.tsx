/**
 * @fileoverview Hauler jobs page - upcoming haul jobs and job history
 * Mirrors the mover jobs page structure, using shared components
 * with hauler-specific data fetching via useJobsPageData.
 *
 * PAGE STRUCTURE:
 * 1. UpcomingJobs - Scheduled/in-progress haul jobs
 * 2. JobHistory - Completed past haul jobs
 *
 * DATA FETCHING:
 * Uses useJobsPageData hook with userType='hauler'.
 * Fetches from /api/hauling-partners/[id]/upcoming-jobs and /api/hauling-partners/[id]/jobs.
 */

'use client';

import { use } from 'react';
import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import { UpcomingJobs } from '@/components/features/service-providers/jobs/UpcomingJobs';
import { JobHistory } from '@/components/features/service-providers/jobs/JobHistory';
import { JobsPageSkeleton } from '@/components/features/service-providers/jobs/JobsPageSkeleton';
import { useJobsPageData } from '@/hooks/useJobsPageData';

type PageParams = {
  id: string;
};

export default function HaulerJobsPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const haulerId = actualParams.id;

  const { upcomingJobs, jobHistory, isLoading, error, setUpcomingJobs } =
    useJobsPageData({ userType: 'hauler', userId: haulerId });

  return (
    <>
      <SubPageHero
        title="Jobs"
        description="View your upcoming haul jobs and job history"
        userType="hauler"
        userId={haulerId}
      />

      {isLoading ? (
        <JobsPageSkeleton />
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
          <UpcomingJobs
            userType="hauler"
            userId={haulerId}
            appointments={upcomingJobs}
            onAppointmentsChange={setUpcomingJobs}
          />
          <div className="max-w-5xl lg:px-16 px-6 mx-auto mt-12 sm:mt-24 mb-20 sm:mb-36">
            <h2 className="text-2xl mb-8">Job History</h2>
            <JobHistory userType="hauler" userId={haulerId} jobs={jobHistory} />
          </div>
        </>
      )}
    </>
  );
}

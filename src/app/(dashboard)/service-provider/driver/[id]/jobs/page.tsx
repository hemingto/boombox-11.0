/**
 * @fileoverview Driver jobs page - upcoming and history
 * @source boombox-10.0/src/app/driver-account-page/[id]/jobs/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group
 */

'use client';

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import { UpcomingJobs } from '@/components/features/service-providers/jobs/UpcomingJobs';
import { JobHistory } from '@/components/features/service-providers/jobs/JobHistory';
import { use } from 'react';

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

  return (
    <>
      <SubPageHero
        title="Jobs"
        description="View your upcoming jobs and job history"
        userType="driver"
        userId={driverId}
      />
      <UpcomingJobs userType="driver" userId={driverId} />
      <div className="max-w-5xl lg:px-16 px-6 mx-auto mt-12 sm:mt-24 mb-20 sm:mb-36">
        <h2 className="text-2xl mb-8">Job History</h2>
        <JobHistory userType="driver" userId={driverId} />
      </div>
    </>
  );
}


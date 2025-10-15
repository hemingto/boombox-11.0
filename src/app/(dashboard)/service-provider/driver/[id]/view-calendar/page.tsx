/**
 * @fileoverview Driver view calendar with upcoming jobs
 * @source boombox-10.0/src/app/driver-account-page/[id]/view-calendar/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group
 */

'use client';

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import { CalendarUpcomingJobs } from '@/components/features/service-providers/calendar/CalendarUpcomingJobs';
import { use } from 'react';

// Define a type for the resolved params for clarity
type PageParams = {
  id: string;
};

export default function DriverViewCalendarPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const driverId = actualParams.id;

  return (
    <>
      <SubPageHero
        title="Calendar"
        description="View your upcoming jobs on the calendar"
        userType="driver"
        userId={driverId}
      />
      <CalendarUpcomingJobs userType="driver" userId={driverId} />
    </>
  );
}


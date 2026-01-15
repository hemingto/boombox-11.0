/**
 * @fileoverview Driver view calendar with upcoming jobs
 * @source boombox-10.0/src/app/driver-account-page/[id]/view-calendar/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group
 * 
 * UPDATED: Replaced CalendarUpcomingJobs with CalendarView component.
 * Now displays a full calendar view with all appointments and shows an amber
 * warning banner when there are no upcoming jobs scheduled.
 */

'use client';

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import { CalendarView } from '@/components/features/service-providers/calendar/CalendarView';
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
      <div className="lg:px-16 px-6 max-w-5xl w-full mx-auto mb-10">
        <CalendarView 
          userType="driver" 
          userId={driverId}
          showEmptyWarning={true}
          emptyWarningMessage="You currently have no upcoming jobs scheduled. Once a job has been accepted it will show on your calendar here."
        />
      </div>
    </>
  );
}

/**
 * @fileoverview Driver calendar availability page
 * @source boombox-10.0/src/app/driver-account-page/[id]/calendar/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group
 */

'use client';

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import CalendarView from '@/components/features/service-providers/calendar/CalendarView';
import CalendarWeeklyAvailability from '@/components/features/service-providers/calendar/CalendarWeeklyAvailability';
import BlockedDates from '@/components/features/service-providers/calendar/BlockedDates';
import { use } from 'react';

// Define a type for the resolved params for clarity
type PageParams = {
  id: string;
};

export default function DriverCalendarPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const driverId = actualParams.id;

  return (
    <>
      <SubPageHero
        title="Availability"
        description="Set when you are available to work"
        userType="driver"
        userId={driverId}
      />
      <div className="lg:px-16 px-6 max-w-5xl mx-auto mb-96 sm:mb-60">
        <CalendarWeeklyAvailability userType="driver" userId={driverId} />
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Blocked Dates</h2>
          <BlockedDates userType="driver" userId={driverId} />
        </div>
      </div>
    </>
  );
}


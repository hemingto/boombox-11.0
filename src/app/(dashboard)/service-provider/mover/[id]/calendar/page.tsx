/**
 * @fileoverview Mover calendar availability page
 * @source boombox-10.0/src/app/mover-account-page/[id]/calendar/page.tsx
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

export default function MoverCalendarPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const moverId = actualParams.id;

  return (
    <>
      <SubPageHero
        title="Availability"
        description="Set when you are available to work"
        userType="mover"
        userId={moverId}
      />
      <div className="lg:px-16 px-6 max-w-7xl mx-auto">
        <CalendarWeeklyAvailability userType="mover" userId={moverId} />
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Blocked Dates</h2>
          <BlockedDates userType="mover" userId={moverId} />
        </div>
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Calendar View</h2>
          <CalendarView userType="mover" userId={moverId} />
        </div>
      </div>
    </>
  );
}


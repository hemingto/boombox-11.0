'use client';

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import CalendarWeeklyAvailability from '@/components/features/service-providers/calendar/CalendarWeeklyAvailability';
import BlockedDates from '@/components/features/service-providers/calendar/BlockedDates';
import { use } from 'react';

type PageParams = {
  id: string;
};

export default function HaulerCalendarPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const haulerId = actualParams.id;

  return (
    <>
      <SubPageHero
        title="Availability"
        description="Set when you are available to work"
        userType="hauler"
        userId={haulerId}
      />
      <div className="lg:px-16 px-6 max-w-5xl mx-auto mb-96 sm:mb-60">
        <CalendarWeeklyAvailability userType="hauler" userId={haulerId} />
        <div className="mt-12">
          <BlockedDates userType="hauler" userId={haulerId} />
        </div>
      </div>
    </>
  );
}

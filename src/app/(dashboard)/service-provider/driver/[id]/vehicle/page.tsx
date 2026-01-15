/**
 * @fileoverview Driver vehicle management page
 * @source boombox-10.0/src/app/driver-account-page/[id]/vehicle/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group
 */

'use client';

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import AddedVehicle from '@/components/features/service-providers/vehicle/AddedVehicle';
import { use } from 'react';

// Define a type for the resolved params for clarity
type PageParams = {
  id: string;
};

export default function DriverVehiclePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const driverId = actualParams.id;

  return (
    <>
      <SubPageHero
        title="Vehicle information"
        description="Add vehicle or update insurance information"
        userType="driver"
        userId={driverId}
      />
      <AddedVehicle userId={driverId} userType="driver" />
    </>
  );
}


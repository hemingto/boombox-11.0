/**
 * @fileoverview Driver add vehicle page
 * @source boombox-10.0/src/app/driver-account-page/[id]/vehicle/add-vehicle/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group with AddVehicleForm
 */

'use client';

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import { AddVehicleForm } from '@/components/features/drivers/AddVehicleForm';
import { use } from 'react';

// Define a type for the resolved params for clarity
type PageParams = {
  id: string;
};

export default function DriverAddVehiclePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const driverId = actualParams.id;

  return (
    <>
      <SubPageHero
        title="Add Vehicle"
        description="Add a new vehicle to your account"
        userType="driver"
        userId={driverId}
      />
      <AddVehicleForm userId={driverId} userType="driver" />
    </>
  );
}


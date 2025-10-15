/**
 * @fileoverview Mover add vehicle page
 * @source boombox-10.0/src/app/mover-account-page/[id]/vehicle/add-vehicle/page.tsx
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

export default function MoverAddVehiclePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const moverId = actualParams.id;

  return (
    <>
      <SubPageHero
        title="Add Vehicle"
        description="Add a new vehicle to your account"
        userType="mover"
        userId={moverId}
      />
      <AddVehicleForm userId={moverId} userType="mover" />
    </>
  );
}


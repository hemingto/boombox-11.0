/**
 * @fileoverview Mover vehicle management page
 * @source boombox-10.0/src/app/mover-account-page/[id]/vehicle/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group
 */

'use client';

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import { VehicleInfoTable } from '@/components/features/service-providers/vehicle/VehicleInfoTable';
import { use } from 'react';

// Define a type for the resolved params for clarity
type PageParams = {
  id: string;
};

export default function MoverVehiclePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const moverId = actualParams.id;

  return (
    <>
      <SubPageHero
        title="Vehicles"
        description="Manage your vehicles"
        userType="mover"
        userId={moverId}
      />
      <div className="lg:px-16 px-6 max-w-5xl mx-auto">
        <VehicleInfoTable driverId={moverId} />
      </div>
    </>
  );
}


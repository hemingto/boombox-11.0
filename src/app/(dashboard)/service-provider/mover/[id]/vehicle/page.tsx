/**
 * @fileoverview Mover vehicle management page
 * @source boombox-10.0/src/app/mover-account-page/[id]/vehicle/page.tsx
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
        title="Vehicle information"
        description="Add vehicle or update insurance information"
        userType="mover"
        userId={moverId}
      />
      <AddedVehicle userId={moverId} userType="mover" />
    </>
  );
}


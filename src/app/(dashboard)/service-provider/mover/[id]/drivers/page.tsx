/**
 * @fileoverview Mover drivers management page (unique to movers)
 * @source boombox-10.0/src/app/mover-account-page/[id]/drivers/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group
 */

'use client';

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import { DriverContent } from '@/components/features/service-providers/drivers/DriverContent';
import { use } from 'react';

// Define a type for the resolved params for clarity
type PageParams = {
  id: string;
};

export default function MoverDriversPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const moverId = actualParams.id;

  return (
    <>
      <SubPageHero
        title="Drivers"
        description="Manage your drivers"
        userType="mover"
        userId={moverId}
      />
      <DriverContent userType="mover" userId={moverId} />
    </>
  );
}


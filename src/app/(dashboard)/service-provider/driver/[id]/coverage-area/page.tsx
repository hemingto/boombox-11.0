/**
 * @fileoverview Driver coverage area management page
 * @source boombox-10.0/src/app/driver-account-page/[id]/coverage-area/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group
 */

'use client';

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import { CoverageAreaContent } from '@/components/features/service-providers/coverage/CoverageAreaContent';
import { use } from 'react';

// Define a type for the resolved params for clarity
type PageParams = {
  id: string;
};

export default function DriverCoverageAreaPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const driverId = actualParams.id;

  return (
    <>
      <SubPageHero
        title="Coverage Area"
        description="Manage where you can accept jobs"
        userType="driver"
        userId={driverId}
      />
      <CoverageAreaContent userType="driver" userId={driverId} />
    </>
  );
}


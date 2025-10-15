/**
 * @fileoverview Mover coverage area management page
 * @source boombox-10.0/src/app/mover-account-page/[id]/coverage-area/page.tsx
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

export default function MoverCoverageAreaPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const moverId = actualParams.id;

  return (
    <>
      <SubPageHero
        title="Coverage Area"
        description="Manage where you can accept jobs"
        userType="mover"
        userId={moverId}
      />
      <CoverageAreaContent userType="mover" userId={moverId} />
    </>
  );
}


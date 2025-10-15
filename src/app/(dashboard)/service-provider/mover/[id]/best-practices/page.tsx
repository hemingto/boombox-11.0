/**
 * @fileoverview Mover best practices guide page
 * @source boombox-10.0/src/app/mover-account-page/[id]/best-practices/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group
 */

'use client';

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import { BestPracticesContent } from '@/components/features/service-providers/resources/BestPracticesContent';
import { use } from 'react';

// Define a type for the resolved params for clarity
type PageParams = {
  id: string;
};

export default function MoverBestPracticesPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const moverId = actualParams.id;

  return (
    <>
      <SubPageHero
        title="Best Practices"
        description="Tips and guidelines for successful jobs"
        userType="mover"
        userId={moverId}
      />
      <BestPracticesContent userType="mover" userId={moverId} />
    </>
  );
}


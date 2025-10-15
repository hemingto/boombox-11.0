/**
 * @fileoverview Mover account information page
 * @source boombox-10.0/src/app/mover-account-page/[id]/account-information/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group
 */

import { AccountInfoContent } from '@/components/features/service-providers/account/AccountInfoContent';
import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';

// Define a type for the resolved params for clarity
type PageParams = {
  id: string;
};

export default async function MoverAccountInformation({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const resolvedParams = await params;
  const moverId = resolvedParams.id;

  return (
    <div className="min-h-[1500px]">
      <SubPageHero
        title="Account information"
        description="Manage your account information"
        userType="mover"
        userId={moverId}
      />
      <AccountInfoContent userType="mover" userId={moverId} />
    </div>
  );
}


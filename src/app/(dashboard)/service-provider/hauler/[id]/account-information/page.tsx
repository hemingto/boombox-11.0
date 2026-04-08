/**
 * @fileoverview Hauler account information page
 * @refactor Migrated to use SubPageHero + AccountInfoContent pattern
 */

import { AccountInfoContent } from '@/components/features/service-providers/account/AccountInfoContent';
import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';

type PageParams = {
  id: string;
};

export default async function HaulerAccountInformation({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const resolvedParams = await params;
  const haulerId = resolvedParams.id;

  return (
    <div className="min-h-[1500px]">
      <SubPageHero
        title="Account information"
        description="Manage your account information"
        userType="hauler"
        userId={haulerId}
      />
      <AccountInfoContent userType="hauler" userId={haulerId} />
    </div>
  );
}

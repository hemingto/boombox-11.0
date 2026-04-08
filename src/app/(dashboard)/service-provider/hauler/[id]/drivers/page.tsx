/**
 * @fileoverview Hauler drivers management page
 * Mirrors the mover drivers page using shared DriverContent / DriverInvites components.
 * Converted to Server Component to support Server Component composition.
 */

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import { DriverContent } from '@/components/features/service-providers/drivers/DriverContent';
import { DriverInvites } from '@/components/features/service-providers/drivers/DriverInvites';

type PageParams = {
  id: string;
};

export default async function HaulerDriversPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = await params;
  const haulerId = actualParams.id;

  return (
    <>
      <SubPageHero
        title="Drivers"
        description="Manage your drivers"
        userType="hauler"
        userId={haulerId}
      />
      <DriverContent
        partnerId={haulerId}
        userType="hauler"
        driverInvites={<DriverInvites partnerId={haulerId} userType="hauler" />}
      />
    </>
  );
}

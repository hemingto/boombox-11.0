/**
 * @fileoverview Mover drivers management page (unique to movers)
 * @source boombox-10.0/src/app/mover-account-page/[id]/drivers/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group
 * Converted to Server Component to properly support Server Component composition
 */

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import { DriverContent } from '@/components/features/service-providers/drivers/DriverContent';
import { DriverInvites } from '@/components/features/service-providers/drivers/DriverInvites';

// Define a type for the params
type PageParams = {
  id: string;
};

// Server Component - can now use async directly
export default async function MoverDriversPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = await params;
  const moverId = actualParams.id;

  return (
    <>
      <SubPageHero
        title="Drivers"
        description="Manage your drivers"
        userType="mover"
        userId={moverId}
      />
      {/* Pass DriverInvites Server Component as a prop to Client Component */}
      <DriverContent 
        moverId={moverId}
        driverInvites={<DriverInvites moverId={moverId} />}
      />
    </>
  );
}

/**
 * @fileoverview Hauler route information page
 * Displays the hauling route between Stockton and SSF warehouses
 */

'use client';

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import { RouteInformationContent } from '@/components/features/service-providers/coverage/RouteInformationContent';
import { use } from 'react';

type PageParams = {
  id: string;
};

export default function HaulerRouteInformationPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const haulerId = actualParams.id;

  return (
    <>
      <SubPageHero
        title="Route Information"
        description="View your hauling route between warehouses"
        userType="hauler"
        userId={haulerId}
      />
      <RouteInformationContent userId={haulerId} />
    </>
  );
}

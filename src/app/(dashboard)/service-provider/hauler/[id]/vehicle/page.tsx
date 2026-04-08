'use client';

import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';
import AddedVehicle from '@/components/features/service-providers/vehicle/AddedVehicle';
import { use } from 'react';

type PageParams = {
  id: string;
};

export default function HaulerVehiclePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const haulerId = actualParams.id;

  return (
    <>
      <SubPageHero
        title="Vehicle information"
        description="Add vehicle or update insurance information"
        userType="hauler"
        userId={haulerId}
      />
      <AddedVehicle userId={haulerId} userType="hauler" />
    </>
  );
}

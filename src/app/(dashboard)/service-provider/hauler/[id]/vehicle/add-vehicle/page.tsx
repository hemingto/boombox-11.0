'use client';

import { DriverSignupHero } from '@/components/features/drivers/DriverSignupHero';
import { AddVehicleForm } from '@/components/features/drivers/AddVehicleForm';
import { use } from 'react';

type PageParams = {
  id: string;
};

export default function HaulerAddVehiclePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const haulerId = actualParams.id;

  return (
    <>
      <DriverSignupHero
        title="Add Vehicle"
        description="Add a vehicle to your hauler profile"
      />
      <AddVehicleForm userId={haulerId} userType="hauler" />
    </>
  );
}

/**
 * @fileoverview Driver account dashboard page
 * @source boombox-10.0/src/app/driver-account-page/[id]/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group with proper SEO metadata
 */

import type { Metadata } from 'next';
import { MoverAccountHero } from '@/components/features/service-providers/account/MoverAccountHero';
import { MoverAccountHomepage } from '@/components/features/service-providers/account/MoverAccountHomepage';
import { prisma } from '@/lib/database/prismaClient';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Driver Dashboard | Boombox Storage',
  description: 'Manage your driver account, view jobs, and track earnings',
};

// These options are for server components
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Define a type for the resolved params for clarity
type PageParams = {
  id: string;
};

export default async function DriverDashboardPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;
  const driverId = id;

  if (!driverId) {
    redirect('/login');
  }

  // Just fetch the user's first name
  const driver = await prisma.driver.findUnique({
    where: { id: parseInt(driverId) },
    select: { firstName: true },
  });

  if (!driver) {
    return <div>Driver not found</div>;
  }

  return (
    <div className="mb-12 sm:mb-24">
      <MoverAccountHero displayName={driver.firstName} />
      <MoverAccountHomepage userType="driver" userId={driverId} />
    </div>
  );
}


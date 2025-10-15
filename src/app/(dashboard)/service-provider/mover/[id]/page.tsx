/**
 * @fileoverview Mover account dashboard page
 * @source boombox-10.0/src/app/mover-account-page/[id]/page.tsx
 * @refactor Migrated to (dashboard)/service-provider route group with proper SEO metadata
 */

import type { Metadata } from 'next';
import { MoverAccountHero } from '@/components/features/service-providers/account/MoverAccountHero';
import { MoverAccountHomepage } from '@/components/features/service-providers/account/MoverAccountHomepage';
import { prisma } from '@/lib/database/prismaClient';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Mover Dashboard | Boombox Storage',
  description: 'Manage your moving partner account, view jobs, and track earnings',
};

// These options are for server components
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Define a type for the resolved params for clarity
type PageParams = {
  id: string;
};

export default async function MoverDashboardPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id: moverId } = await params;

  if (!moverId) {
    redirect('/login');
  }

  // Just fetch the user's first name
  const mover = await prisma.movingPartner.findUnique({
    where: { id: parseInt(moverId) },
    select: { name: true },
  });

  if (!mover) {
    return <div>Mover not found</div>;
  }

  return (
    <div className="mb-12 sm:mb-24">
      <MoverAccountHero displayName={mover.name} />
      <MoverAccountHomepage userType="mover" userId={moverId} />
    </div>
  );
}


import type { Metadata } from 'next';
import { MoverAccountHero } from '@/components/features/service-providers/account/MoverAccountHero';
import { MoverAccountHomepage } from '@/components/features/service-providers/account/MoverAccountHomepage';
import { prisma } from '@/lib/database/prismaClient';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Hauler Dashboard | Boombox Storage',
  description:
    'Manage your hauling partner account, view jobs, and track earnings',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageParams = { id: string };

export default async function HaulerDashboardPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id: haulerId } = await params;

  if (!haulerId) {
    redirect('/login');
  }

  const hauler = await prisma.haulingPartner.findUnique({
    where: { id: parseInt(haulerId) },
    select: { name: true },
  });

  if (!hauler) {
    return <div>Hauling partner not found</div>;
  }

  return (
    <div className="mb-12 sm:mb-24">
      <MoverAccountHero displayName={hauler.name} />
      <MoverAccountHomepage userType="hauler" userId={haulerId} />
    </div>
  );
}

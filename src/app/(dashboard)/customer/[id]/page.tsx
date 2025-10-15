/**
 * @fileoverview Customer dashboard main page
 * @source boombox-10.0/src/app/user-page/[id]/page.tsx
 * @refactor Migrated to (dashboard)/customer route group with proper authentication
 */

import { prisma } from '@/lib/database/prismaClient';
import { UserPageHero, CompleteUserPage } from '@/components/features/customers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomerDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Wait for the id to resolve
  const { id: userId } = await params;

  if (!userId) {
    redirect('/login');
  }

  // Fetch user
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId, 10) },
    select: { firstName: true },
  });

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="mb-12 sm:mb-24">
      <UserPageHero firstName={user.firstName} />
      <CompleteUserPage userId={userId} />
    </div>
  );
}


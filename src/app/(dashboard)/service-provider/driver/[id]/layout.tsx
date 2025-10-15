/**
 * @fileoverview Driver dashboard layout with MoverNavbar and UserProvider
 * @source boombox-10.0/src/app/driver-account-page/[id]/layout.tsx
 * @refactor Migrated to route group structure with existing components
 */

'use client';

import { MoverNavbar } from '@/components/ui/navigation/MoverNavbar';
import { UserProvider } from '@/contexts/UserContext';
import { useParams } from 'next/navigation';

export default function DriverLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams();
  const driverId = (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? '';

  if (!driverId) {
    return <div>Loading driver...</div>;
  }

  return (
    <UserProvider userId={driverId}>
      <MoverNavbar userType="driver" userId={driverId} />
      {children}
    </UserProvider>
  );
}


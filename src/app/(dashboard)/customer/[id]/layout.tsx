/**
 * @fileoverview Customer dashboard layout with user navigation
 * @source boombox-10.0/src/app/user-page/[id]/layout.tsx
 * @refactor Migrated to (dashboard)/customer route group with UserProvider
 */

'use client';

import React from 'react';
import { UserNavbar } from '@/components/ui/navigation/UserNavbar';
import { useParams } from 'next/navigation';
import { UserProvider } from '@/contexts/UserContext';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const userId =
    (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? '';

  if (!userId) {
    return <div>Loading user...</div>;
  }

  return (
    <UserProvider userId={userId}>
      <UserNavbar
        userId={userId}
        showAddStorageButton={true}
        showAccessStorageButton={true}
      />
      {children}
    </UserProvider>
  );
}


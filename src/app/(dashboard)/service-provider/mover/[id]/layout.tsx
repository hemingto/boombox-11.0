/**
 * @fileoverview Mover dashboard layout with MoverNavbar and UserProvider
 * @source boombox-10.0/src/app/mover-account-page/[id]/layout.tsx
 * @refactor Migrated to route group structure with existing components
 */

'use client';

import { MoverNavbar } from '@/components/ui/navigation/MoverNavbar';
import { UserProvider } from '@/contexts/UserContext';
import { useParams } from 'next/navigation';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';
import { SessionExpirationModal } from '@/components/ui/session/SessionExpirationModal';

export default function MoverLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams();
  const moverId = (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? '';
  
  // Monitor session expiration
  const { showWarning, secondsRemaining, isExpired, resetMonitor } = useSessionMonitor();

  if (!moverId) {
    return <div>Loading mover...</div>;
  }

  return (
    <UserProvider userId={moverId}>
      <MoverNavbar userType="mover" userId={moverId} />
      {children}
      
      {/* Session expiration modal */}
      <SessionExpirationModal
        open={showWarning}
        secondsRemaining={secondsRemaining}
        isExpired={isExpired}
        onReauthenticated={resetMonitor}
      />
    </UserProvider>
  );
}


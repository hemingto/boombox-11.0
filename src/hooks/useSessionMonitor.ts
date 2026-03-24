/**
 * @fileoverview Session monitoring hook that auto-redirects to login on expiry
 * @source Created for boombox-11.0 session expiration handling
 *
 * HOOK FUNCTIONALITY:
 * - Monitors NextAuth session expiration timing
 * - Automatically signs out and redirects to login when session expires
 * - Checks session status every 30 seconds
 */

'use client';

import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { isSessionExpiringSoon, SESSION_MAX_AGE } from '@/lib/utils';

/**
 * Hook to monitor session expiration and auto-redirect to login.
 *
 * Checks session status every 30 seconds. When the session has expired,
 * signs the user out and redirects to the login page automatically.
 *
 * @example
 * ```tsx
 * useSessionMonitor();
 * ```
 */
export function useSessionMonitor(): void {
  const { data: session, status } = useSession();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session) {
      return;
    }

    const sessionCreated = (session as any).created;
    if (!sessionCreated) {
      console.warn(
        'Session missing created timestamp, cannot monitor expiration'
      );
      return;
    }

    const checkSessionStatus = async () => {
      if (redirectingRef.current) return;

      const { isExpired } = isSessionExpiringSoon(
        sessionCreated,
        SESSION_MAX_AGE
      );

      if (isExpired) {
        redirectingRef.current = true;
        await signOut({ redirect: false });
        window.location.href = '/login';
      }
    };

    checkSessionStatus();

    const interval = setInterval(checkSessionStatus, 30 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [session, status]);
}

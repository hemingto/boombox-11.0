/**
 * @fileoverview Session monitoring hook for tracking session expiration
 * @source Created for boombox-11.0 session expiration handling
 * 
 * HOOK FUNCTIONALITY:
 * - Monitors NextAuth session expiration timing
 * - Triggers warning modal 5 minutes before session expires
 * - Provides countdown timer for UI display
 * - Checks session status every 30 seconds
 * - Handles both expiring-soon and already-expired states
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  isSessionExpiringSoon,
  SESSION_MAX_AGE,
  SESSION_WARNING_THRESHOLD,
} from '@/lib/utils/sessionUtils';

export interface UseSessionMonitorReturn {
  /**
   * Whether to show the session expiration warning modal
   */
  showWarning: boolean;
  
  /**
   * Number of seconds remaining until session expires
   */
  secondsRemaining: number;
  
  /**
   * Whether the session has already expired
   */
  isExpired: boolean;
  
  /**
   * Dismiss the warning modal (useful if user re-authenticates)
   */
  dismissWarning: () => void;
  
  /**
   * Reset the monitor after successful re-authentication
   */
  resetMonitor: () => void;
}

/**
 * Hook to monitor session expiration and trigger warnings
 * 
 * Checks session status every 30 seconds and shows warning modal
 * when session is within 5 minutes of expiring.
 * 
 * @returns Object containing warning state and control functions
 * 
 * @example
 * ```tsx
 * const { showWarning, secondsRemaining, isExpired, dismissWarning } = useSessionMonitor();
 * 
 * return (
 *   <>
 *     <YourPageContent />
 *     <SessionExpirationModal 
 *       open={showWarning}
 *       secondsRemaining={secondsRemaining}
 *       isExpired={isExpired}
 *       onClose={dismissWarning}
 *     />
 *   </>
 * );
 * ```
 */
export function useSessionMonitor(): UseSessionMonitorReturn {
  const { data: session, status } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  
  const dismissWarning = useCallback(() => {
    setShowWarning(false);
  }, []);
  
  const resetMonitor = useCallback(() => {
    setShowWarning(false);
    setSecondsRemaining(0);
    setIsExpired(false);
  }, []);
  
  useEffect(() => {
    // Only monitor if user is authenticated
    if (status !== 'authenticated' || !session) {
      return;
    }
    
    // Check if session has the created timestamp
    const sessionCreated = (session as any).created;
    if (!sessionCreated) {
      console.warn('Session missing created timestamp, cannot monitor expiration');
      return;
    }
    
    // Function to check session status
    const checkSessionStatus = () => {
      const { isExpiring, secondsRemaining: remaining, isExpired: expired } = 
        isSessionExpiringSoon(sessionCreated, SESSION_MAX_AGE, SESSION_WARNING_THRESHOLD);
      
      setSecondsRemaining(remaining);
      setIsExpired(expired);
      
      // Show warning if expiring soon or already expired
      if (isExpiring || expired) {
        setShowWarning(true);
      }
    };
    
    // Check immediately
    checkSessionStatus();
    
    // Set up interval to check every 30 seconds
    const interval = setInterval(checkSessionStatus, 30 * 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [session, status]);
  
  return {
    showWarning,
    secondsRemaining,
    isExpired,
    dismissWarning,
    resetMonitor,
  };
}


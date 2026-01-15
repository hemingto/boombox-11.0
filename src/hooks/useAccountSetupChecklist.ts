/**
 * @fileoverview Custom hook for account setup checklist management
 * @source boombox-10.0/src/app/components/mover-account/accountsetupchecklist.tsx
 * @refactor Extracted checklist state management and business logic from component
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type ChecklistStatus,
  type ChecklistData,
  isChecklistComplete,
} from '@/lib/services/accountSetupChecklistUtils';
import {
  getDriverChecklistStatus,
  getMoverChecklistStatus,
} from '@/lib/services/accountSetupChecklistService';

interface UseAccountSetupChecklistParams {
  userId: string;
  userType: 'driver' | 'mover';
}

interface UseAccountSetupChecklistReturn {
  // Data
  checklistStatus: ChecklistStatus | null;
  isApproved: boolean;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'INACTIVE';
  hasMovingPartner: boolean;
  applicationComplete: boolean;
  activeMessageShown: boolean;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refetch: () => Promise<void>;
}

export function useAccountSetupChecklist(
  params: UseAccountSetupChecklistParams
): UseAccountSetupChecklistReturn {
  const { userId, userType } = params;

  // State
  const [checklistStatus, setChecklistStatus] = useState<ChecklistStatus | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'ACTIVE' | 'INACTIVE'>('PENDING');
  const [hasMovingPartner, setHasMovingPartner] = useState(false);
  const [applicationComplete, setApplicationComplete] = useState(false);
  const [activeMessageShown, setActiveMessageShown] = useState(false);
  
  // Ref to track if we've already called the API to mark message as shown
  const hasMarkedMessageRef = useRef(false);

  // Fetch checklist data
  const fetchChecklistData = useCallback(async () => {
    if (!userId) {
      setError('User ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let data: ChecklistData;

      if (userType === 'driver') {
        data = await getDriverChecklistStatus(userId);
      } else {
        data = await getMoverChecklistStatus(userId);
      }

      setChecklistStatus(data.checklistStatus);
      setIsApproved(data.isApproved);
      setApplicationComplete(data.applicationComplete || false);
      
      if (userType === 'mover') {
        setStatus(data.status || 'PENDING');
      }
      
      if (userType === 'driver') {
        setHasMovingPartner(data.hasMovingPartner || false);
      }

      // Set activeMessageShown from database value, BUT if we've already marked the message
      // as shown locally (hasMarkedMessageRef), don't let the refetch overwrite it with 'true'
      // This prevents the race condition where a parallel fetch returns after the mark API
      if (hasMarkedMessageRef.current && data.activeMessageShown === true) {
        // We already marked it locally and the DB confirms it - keep showing the message
        // by NOT updating state (leave activeMessageShown as false so message stays visible)
      } else {
        setActiveMessageShown(data.activeMessageShown || false);
      }

      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load checklist data';
      setError(errorMessage);
      console.error('Error fetching checklist data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, userType]);

  // Auto-update application complete status when checklist is complete
  useEffect(() => {
    const updateApplicationComplete = async () => {
      if (!checklistStatus || !userId || applicationComplete) {
        return;
      }

      const isComplete = isChecklistComplete(
        checklistStatus,
        userType,
        isApproved,
        hasMovingPartner
      );

      if (isComplete) {
        try {
          const endpoint =
            userType === 'driver'
              ? `/api/drivers/${userId}/application-complete`
              : `/api/moving-partners/${userId}/application-complete`;

          const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              error: 'Failed to parse error response',
            }));
            console.error(
              `Failed to update application complete status:`,
              errorData.error || response.statusText
            );
            return;
          }

          setApplicationComplete(true);
          console.log(
            `${userType} with ID ${userId} application marked as complete.`
          );
        } catch (error) {
          console.error('Error updating application complete status:', error);
        }
      }
    };

    updateApplicationComplete();
  }, [checklistStatus, userId, userType, isApproved, applicationComplete, hasMovingPartner]);

  // Auto-update mover status from APPROVED to ACTIVE
  useEffect(() => {
    const updateMoverStatus = async () => {
      if (userType !== 'mover' || status === 'ACTIVE' || !userId) {
        return;
      }

      try {
        const response = await fetch(`/api/moving-partners/${userId}/profile`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Failed to fetch mover data:', errorData);
          // Don't throw - just log the error and continue
          // This prevents the checklist from breaking if the profile fetch fails
          return;
        }
        
        const moverData = await response.json();

        // Debug logging to understand why auto-update might not trigger
        console.log('[Auto-update check]', {
          isApproved: moverData.isApproved,
          onfleetTeamId: moverData.onfleetTeamId,
          approvedDriversCount: moverData.approvedDrivers?.length ?? 0,
          currentStatus: status
        });

        // Check if conditions for ACTIVE status are met
        if (
          moverData.isApproved &&
          moverData.onfleetTeamId &&
          moverData.approvedDrivers &&
          moverData.approvedDrivers.length > 0
        ) {
          // Trigger status update
          const updateResponse = await fetch(
            `/api/moving-partners/${userId}/update-status`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (!updateResponse.ok) {
            const errorData = await updateResponse.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Failed to update mover status:', errorData.error || 'Unknown error');
            // Don't throw - just log the error and continue
            return;
          }

          const updatedMover = await updateResponse.json();
          setStatus('ACTIVE');
          // NOTE: Do NOT refetch here - it causes a race condition where the refetch
          // overwrites activeMessageShown with the updated value before the user sees the message
        }
      } catch (error) {
        console.error('Error updating mover status:', error);
        // Don't propagate the error - this is a background update
        // The main checklist should still function even if this fails
      }
    };

    if (userId && userType === 'mover') {
      updateMoverStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userType, status]);

  // Reset hasMarkedMessageRef when status/approval changes
  useEffect(() => {
    if (userType === 'mover' && status !== 'ACTIVE') {
      hasMarkedMessageRef.current = false;
    }
    if (userType === 'driver' && !isApproved) {
      hasMarkedMessageRef.current = false;
    }
  }, [userType, status, isApproved]);

  // Mark active message as shown in database AFTER component has rendered
  // This runs after the message is displayed, so the user sees it once
  useEffect(() => {
    const shouldMarkForMover = userType === 'mover' && status === 'ACTIVE' && !activeMessageShown;
    const shouldMarkForDriver = userType === 'driver' && isApproved && !activeMessageShown;
    
    if ((shouldMarkForMover || shouldMarkForDriver) && !hasMarkedMessageRef.current && userId && !isLoading) {
      hasMarkedMessageRef.current = true;
      
      const endpoint =
        userType === 'driver'
          ? `/api/drivers/${userId}/mark-active-message-shown`
          : `/api/moving-partners/${userId}/mark-active-message-shown`;

      fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          if (!response.ok) {
            console.error('Failed to mark active message as shown');
            hasMarkedMessageRef.current = false;
          } else {
            console.log(`✅ Active message marked as shown for ${userType} ${userId}`);
          }
        })
        .catch(error => {
          console.error('Error marking active message as shown:', error);
          hasMarkedMessageRef.current = false;
        });
    }
  }, [userType, status, isApproved, activeMessageShown, userId, isLoading]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchChecklistData();
  }, [fetchChecklistData]);

  return {
    // Data
    checklistStatus,
    isApproved,
    status,
    hasMovingPartner,
    applicationComplete,
    activeMessageShown,
    
    // Loading and error states
    isLoading,
    error,
    
    // Actions
    refetch: fetchChecklistData,
  };
}


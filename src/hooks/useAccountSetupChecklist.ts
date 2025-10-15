/**
 * @fileoverview Custom hook for account setup checklist management
 * @source boombox-10.0/src/app/components/mover-account/accountsetupchecklist.tsx
 * @refactor Extracted checklist state management and business logic from component
 */

import { useState, useEffect, useCallback } from 'react';
import {
  type ChecklistStatus,
  type ChecklistData,
  getDriverChecklistStatus,
  getMoverChecklistStatus,
  isChecklistComplete,
} from '@/lib/services/accountSetupChecklistService';

interface UseAccountSetupChecklistParams {
  userId: string;
  userType: 'driver' | 'mover';
}

interface UseAccountSetupChecklistReturn {
  // Data
  checklistStatus: ChecklistStatus | null;
  isApproved: boolean;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE';
  hasMovingPartner: boolean;
  applicationComplete: boolean;
  showActiveMessage: boolean;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refetch: () => Promise<void>;
  acknowledgeActiveMessage: () => void;
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
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'ACTIVE'>('PENDING');
  const [hasMovingPartner, setHasMovingPartner] = useState(false);
  const [applicationComplete, setApplicationComplete] = useState(false);
  const [showActiveMessage, setShowActiveMessage] = useState(false);

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
        isApproved
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
  }, [checklistStatus, userId, userType, isApproved, applicationComplete]);

  // Auto-update mover status from APPROVED to ACTIVE
  useEffect(() => {
    const updateMoverStatus = async () => {
      if (userType !== 'mover' || status === 'ACTIVE') {
        return;
      }

      try {
        const response = await fetch(`/api/moving-partners/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch mover data');
        
        const moverData = await response.json();

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
            const errorData = await updateResponse.json();
            throw new Error(
              errorData.error || 'Failed to update mover status'
            );
          }

          setStatus('ACTIVE');
        }
      } catch (error) {
        console.error('Error updating mover status:', error);
      }
    };

    if (userId && userType === 'mover') {
      updateMoverStatus();
    }
  }, [userId, userType, status]);

  // Show active message timer (24 hours)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (status === 'ACTIVE') {
      setShowActiveMessage(true);
      // Set timer to hide message after 24 hours (86400000ms)
      timer = setTimeout(() => {
        setShowActiveMessage(false);
      }, 86400000);
    }

    // Cleanup timer on unmount or when status changes
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [status]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchChecklistData();
  }, [fetchChecklistData]);

  const acknowledgeActiveMessage = useCallback(() => {
    setShowActiveMessage(false);
  }, []);

  return {
    // Data
    checklistStatus,
    isApproved,
    status,
    hasMovingPartner,
    applicationComplete,
    showActiveMessage,
    
    // Loading and error states
    isLoading,
    error,
    
    // Actions
    refetch: fetchChecklistData,
    acknowledgeActiveMessage,
  };
}


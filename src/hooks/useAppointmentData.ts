/**
 * @fileoverview Custom hook for fetching and managing appointment data for editing
 * @source boombox-10.0/src/app/components/edit-appointment/editaccessstorageappointment.tsx (fetchAppointmentDetails)
 * 
 * HOOK FUNCTIONALITY:
 * - Fetches appointment details for editing using appointment ID
 * - Manages loading, error, and success states
 * - Transforms appointment data to form-compatible format
 * - Handles API errors gracefully with user-friendly messages
 * - Supports refetch capability for manual data refresh
 * 
 * API ROUTES UPDATED:
 * - Old: GET /api/appointments/${appointmentId}/getAppointmentDetails → New: GET /api/orders/appointments/${appointmentId}/details
 * 
 * @refactor Extracted from EditAccessStorageAppointment component to follow established hook patterns
 * and improve reusability, testability, and separation of concerns
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { AppointmentDetailsResponse, UseAppointmentDataReturn } from '@/types/accessStorage.types';
import { 
  fetchAppointmentDetails, 
  AppointmentDataServiceOptions,
  transformAppointmentDataForForm,
  validateAppointmentOwnership
} from '@/lib/services/appointmentDataService';
import { AppointmentErrorType } from '@/components/ui/error';

/**
 * Custom hook for fetching appointment data for editing
 * 
 * Automatically fetches appointment data on mount using the provided appointment ID
 * and provides loading/error states for UI feedback.
 * 
 * @param appointmentId - The ID of the appointment to fetch
 * @returns Object containing appointment data, loading state, error state, and utility functions
 * 
 * @example
 * ```tsx
 * const { appointmentData, isLoading, error, refetch } = useAppointmentData(appointmentId);
 * 
 * if (isLoading) return <LoadingState />;
 * if (error) return <ErrorState error={error} />;
 * if (!appointmentData) return <EmptyState />;
 * 
 * return <EditForm initialData={appointmentData} />;
 * ```
 */
export function useAppointmentData(appointmentId?: string): UseAppointmentDataReturn {
  const { data: session, status } = useSession();
  const [appointmentData, setAppointmentData] = useState<AppointmentDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<AppointmentErrorType | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  /**
   * Fetch appointment data using service layer
   */
  const fetchAppointmentData = useCallback(async (): Promise<void> => {
    if (!appointmentId) {
      setError('No appointment ID provided');
      setIsLoading(false);
      return;
    }

    // Wait for session to be loaded
    if (status === 'loading') {
      return;
    }

    // Check if user is authenticated
    if (status === 'unauthenticated' || !session?.user?.id) {
      setError('You must be logged in to view appointment details');
      setErrorType('unauthorized');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setErrorType(null);

      // Use the client-side appointment data service
      const result = await fetchAppointmentDetails(appointmentId, {
        timeout: 15000,
        retries: 2 // Reduce retries since we'll handle retry at component level
      });

      if (!result.success || !result.data) {
        const errorMessage = result.error || 'Failed to fetch appointment data';
        
        // Categorize error type based on error message
        let categorizedErrorType: AppointmentErrorType = 'unknown_error';
        
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          categorizedErrorType = 'not_found';
        } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
          categorizedErrorType = 'unauthorized';
        } else if (errorMessage.includes('Access denied') || errorMessage.includes('403')) {
          categorizedErrorType = 'unauthorized';
        } else if (errorMessage.includes('Network error') || errorMessage.includes('fetch')) {
          categorizedErrorType = 'network_error';
        } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
          categorizedErrorType = 'server_error';
        } else if (errorMessage.includes('Invalid') || errorMessage.includes('validation')) {
          categorizedErrorType = 'validation_error';
        }
        
        setErrorType(categorizedErrorType);
        throw new Error(errorMessage);
      }

      // Validate appointment ownership
      const isOwner = validateAppointmentOwnership(result.data, session.user.id);
      
      if (!isOwner) {
        setError('You do not have permission to view this appointment');
        setErrorType('unauthorized');
        setIsLoading(false);
        return;
      }
      
      // Data is already in the correct format from the client service
      setAppointmentData(result.data);
      setError(null);
      setErrorType(null);
      setRetryCount(0); // Reset retry count on success
    } catch (fetchError) {
      console.error('Error fetching appointment data:', fetchError);
      
      // Set user-friendly error message
      const errorMessage = fetchError instanceof Error 
        ? fetchError.message 
        : 'An unexpected error occurred while loading appointment data';
      
      setError(errorMessage);
      setAppointmentData(null);
      
      // If error type wasn't set above, categorize based on error
      if (!errorType) {
        if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          setErrorType('network_error');
        } else if (errorMessage.includes('cancelled')) {
          setErrorType('network_error');
        } else {
          setErrorType('unknown_error');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, session, status]);

  /**
   * Refetch appointment data (useful for manual refresh)
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchAppointmentData();
  }, [fetchAppointmentData]);

  /**
   * Retry with exponential backoff
   */
  const retry = useCallback(async (): Promise<void> => {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    // Add delay with exponential backoff (1s, 2s, 4s, etc.)
    const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 8000);
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    await fetchAppointmentData();
  }, [fetchAppointmentData, retryCount]);

  // Fetch appointment data on mount and when appointmentId changes
  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentData();
    } else {
      setIsLoading(false);
      setError(null);
      setAppointmentData(null);
    }
  }, [appointmentId, fetchAppointmentData, session, status]);

  return {
    appointmentData,
    isLoading,
    error,
    errorType,
    retryCount,
    refetch,
    retry,
    fetchAppointmentData,
    populateFormFromAppointment: () => {
      if (!appointmentData) return {};
      return transformAppointmentDataForForm(appointmentData);
    },
    validateAppointmentOwnership: (userId: string) => {
      if (!appointmentData) return false;
      return validateAppointmentOwnership(appointmentData, userId);
    },
    isReady: !!appointmentData && !isLoading && !error,
    hasError: !!error,
    canRetry: !!error && retryCount < 3 // Allow up to 3 retries
  };
}

export default useAppointmentData;

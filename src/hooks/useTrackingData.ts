/**
 * @fileoverview Custom hook for fetching and managing appointment tracking data
 * @source boombox-10.0/src/app/tracking/[token]/page.tsx (extracted API logic)
 * 
 * HOOK FUNCTIONALITY:
 * - Fetches appointment tracking data using secure token verification
 * - Manages loading, error, and success states
 * - Provides real-time tracking information for customer-facing interfaces
 * - Handles API errors gracefully with user-friendly messages
 * - Supports refetch capability for manual data refresh
 * 
 * API ROUTES UPDATED:
 * - Old: POST /api/tracking/verify → New: POST /api/customers/tracking/verify
 * 
 * @refactor Extracted from TrackingPage component to follow established hook patterns
 * and improve reusability, testability, and separation of concerns
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Timer data interface for elapsed time tracking
 */
export interface TimerData {
  type: 'timer';
  startTime: string;
  endTime?: string;
}

/**
 * Individual tracking step interface
 */
export interface TrackingStep {
  status: 'complete' | 'in_transit' | 'pending';
  title: string;
  timestamp: string;
  action?: {
    label: string;
    trackingUrl?: string;
    url?: string;
    iconName?: 'MapIcon' | 'ClockIcon' | 'DocumentCurrencyDollarIcon' | 'StarIcon';
    timerData?: TimerData;
  };
  secondaryAction?: {
    label: string;
    url?: string;
    iconName?: 'MapIcon' | 'ClockIcon' | 'DocumentCurrencyDollarIcon' | 'StarIcon';
  };
}

/**
 * Delivery unit interface representing a single storage unit delivery
 */
export interface DeliveryUnit {
  id: string;
  status: 'in_transit' | 'complete' | 'pending';
  unitNumber: number;
  totalUnits: number;
  provider: string;
  steps: TrackingStep[];
}

/**
 * Main appointment tracking data interface
 */
export interface AppointmentTrackingProps {
  appointmentDate: Date;
  deliveryUnits: DeliveryUnit[];
  location: {
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  appointmentType: string;
}

/**
 * Hook return interface
 */
export interface UseTrackingDataReturn {
  /** Appointment tracking data (null while loading or on error) */
  appointmentData: AppointmentTrackingProps | null;
  /** Loading state indicator */
  isLoading: boolean;
  /** Error message if request fails */
  error: string | null;
  /** Function to manually refetch tracking data */
  refetch: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Custom hook for fetching appointment tracking data
 * 
 * Automatically fetches tracking data on mount using the provided token
 * and provides loading/error states for UI feedback.
 * 
 * @param token - Secure tracking token for appointment verification
 * @returns Object containing tracking data, loading state, error state, and utility functions
 * 
 * @example
 * ```tsx
 * const { appointmentData, isLoading, error, refetch } = useTrackingData(token);
 * 
 * if (isLoading) return <LoadingState />;
 * if (error) return <ErrorState error={error} />;
 * if (!appointmentData) return <EmptyState />;
 * 
 * return <AppointmentTracking {...appointmentData} />;
 * ```
 */
export function useTrackingData(token: string): UseTrackingDataReturn {
  const [appointmentData, setAppointmentData] = useState<AppointmentTrackingProps | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch tracking data from API
   */
  const fetchTrackingData = useCallback(async (): Promise<void> => {
    if (!token) {
      setError('No tracking token provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use migrated API route from api-routes-migration-tracking.md
      const response = await fetch('/api/customers/tracking/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        // Handle different HTTP error codes
        if (response.status === 401) {
          throw new Error('Invalid or expired tracking link');
        } else if (response.status === 404) {
          throw new Error('Appointment not found');
        } else {
          throw new Error(`Failed to load tracking data: ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }

      // Transform date strings to Date objects if needed
      const transformedData: AppointmentTrackingProps = {
        ...data,
        appointmentDate: new Date(data.appointmentDate)
      };

      setAppointmentData(transformedData);
      setError(null);
    } catch (fetchError) {
      console.error('Error fetching tracking data:', fetchError);
      
      // Set user-friendly error message
      const errorMessage = fetchError instanceof Error 
        ? fetchError.message 
        : 'An unexpected error occurred while loading tracking data';
      
      setError(errorMessage);
      setAppointmentData(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refetch tracking data (useful for manual refresh)
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchTrackingData();
  }, [fetchTrackingData]);

  // Fetch tracking data on mount and when token changes
  useEffect(() => {
    if (token) {
      fetchTrackingData();
    } else {
      setIsLoading(false);
      setError('No tracking token provided');
      setAppointmentData(null);
    }
  }, [token, fetchTrackingData]);

  return {
    appointmentData,
    isLoading,
    error,
    refetch,
    clearError,
  };
}

export default useTrackingData;

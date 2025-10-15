/**
 * @fileoverview Custom hook for fetching and managing storage unit availability
 * @source boombox-10.0/src/app/components/reusablecomponents/storageunitcounter.tsx (extracted API logic)
 * 
 * HOOK FUNCTIONALITY:
 * - Fetches available storage unit count from API
 * - Manages loading and error states
 * - Provides real-time availability data
 * - Handles API errors gracefully with fallback values
 * 
 * API ROUTES UPDATED:
 * - Old: /api/storage-units/available-count → New: /api/orders/storage-units/available-count
 * 
 * @refactor Extracted from StorageUnitCounter component to follow established hook patterns
 * and improve reusability across components that need availability data
 */

import { useState, useEffect } from 'react';

/**
 * Storage unit availability response interface
 */
interface StorageUnitAvailabilityResponse {
  availableCount: number;
  error?: string;
}

/**
 * Hook return interface
 */
export interface UseStorageUnitAvailabilityReturn {
  /** Number of available storage units (null while loading) */
  availableUnits: number | null;
  /** Whether the request is currently loading */
  isLoading: boolean;
  /** Error message if request failed */
  error: string | null;
  /** Function to manually refresh availability data */
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching storage unit availability
 * 
 * Automatically fetches availability data on mount and provides
 * loading/error states for UI feedback.
 * 
 * @returns Object containing availability data, loading state, error state, and refetch function
 * 
 * @example
 * ```tsx
 * const { availableUnits, isLoading, error, refetch } = useStorageUnitAvailability();
 * 
 * if (isLoading) return <div>Loading availability...</div>;
 * if (error) return <div>Error: {error}</div>;
 * 
 * return (
 *   <div>
 *     {availableUnits} units available
 *     <button onClick={refetch}>Refresh</button>
 *   </div>
 * );
 * ```
 */
export function useStorageUnitAvailability(): UseStorageUnitAvailabilityReturn {
  const [availableUnits, setAvailableUnits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch available storage units from API
   */
  const fetchAvailableUnits = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/orders/storage-units/available-count');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch available units: ${response.statusText}`);
      }
      
      const data: StorageUnitAvailabilityResponse = await response.json();
      
      // Validate response structure
      if (typeof data.availableCount === 'number') {
        setAvailableUnits(data.availableCount);
      } else {
        console.error("Invalid availableCount in response:", data);
        // Default to 0 if response is malformed but don't throw error
        setAvailableUnits(0);
        setError("Invalid response format");
      }
    } catch (fetchError) {
      console.error("Error fetching available units:", fetchError);
      
      // Set error message for UI display
      const errorMessage = fetchError instanceof Error 
        ? fetchError.message 
        : 'Unknown error occurred';
      setError(errorMessage);
      
      // Default to 0 on error to be safe and prevent UI breaking
      setAvailableUnits(0);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refetch availability data (useful for manual refresh)
   */
  const refetch = async (): Promise<void> => {
    await fetchAvailableUnits();
  };

  // Fetch availability on mount
  useEffect(() => {
    fetchAvailableUnits();
  }, []);

  return {
    availableUnits,
    isLoading,
    error,
    refetch,
  };
}

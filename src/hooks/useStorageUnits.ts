/**
 * @fileoverview Storage unit data fetching hook for Access Storage form
 * @source boombox-10.0/src/app/components/access-storage/accessstoragestep1.tsx (storage unit fetching logic)
 * @refactor Extracted storage unit data fetching and formatting into dedicated hook
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import {
  StorageUnitUsage,
  FormattedStorageUnit,
  UseStorageUnitsReturn,
  StorageUnitsApiResponse
} from '@/types/accessStorage.types';
import { storageUnitsApiResponseSchema } from '@/lib/validations/accessStorage.validations';

interface UseStorageUnitsParams {
  userId?: string;
  autoFetch?: boolean;
}

export function useStorageUnits(params: UseStorageUnitsParams = {}): UseStorageUnitsReturn {
  const { userId: paramUserId, autoFetch = true } = params;
  const { data: session } = useSession();
  const userId = paramUserId || session?.user?.id;

  // State
  const [rawStorageUnits, setRawStorageUnits] = useState<StorageUnitUsage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== DATA FORMATTING =====

  const formattedStorageUnits = useMemo((): FormattedStorageUnit[] => {
    return rawStorageUnits.map((unit) => ({
      id: unit.storageUnit.id.toString(),
      imageSrc: unit.mainImage || '/img/golden-gate.png',
      title: `Boombox ${unit.storageUnit.storageUnitNumber}`,
      pickUpDate: new Date(unit.usageStartDate).toLocaleDateString(),
      lastAccessedDate: unit.returnDate
        ? new Date(unit.returnDate).toLocaleDateString()
        : unit.usageStartDate
        ? new Date(unit.usageStartDate).toLocaleDateString()
        : 'Has not been accessed',
      description: unit.description || 'No description provided',
      location: unit.location
    }));
  }, [rawStorageUnits]);

  // ===== API INTEGRATION =====

  const fetchStorageUnits = useCallback(async (): Promise<void> => {
    if (!userId) {
      setError('User authentication required to fetch storage units');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 🚨 CRITICAL: Use new API route from api-routes-migration-tracking.md
      // OLD: /api/storageUnitsByUser
      // NEW: /api/customers/storage-units-by-customer
      const response = await fetch(`/api/customers/storage-units-by-customer?userId=${userId}`);
      
      const responseData = await response.json();

      if (!response.ok) {
        // Try to get error message from response body
        const errorMessage = responseData?.error?.message || responseData?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Validate response structure
      const validationResult = storageUnitsApiResponseSchema.safeParse(responseData);
      
      if (!validationResult.success) {
        console.error('Invalid API response structure:', validationResult.error);
        throw new Error('Invalid response format from server');
      }

      const data = validationResult.data;

      if (data.success && data.data) {
        setRawStorageUnits(data.data as StorageUnitUsage[]);
        setError(null);
      } else if (data.success && data.data === undefined) {
        // Handle malformed response where success is true but data is undefined
        setRawStorageUnits([]);
        setError('Invalid response format');
      } else {
        setRawStorageUnits([]);
        setError(data.message || 'Failed to fetch storage units');
      }
    } catch (error: any) {
      console.error('Error fetching storage units:', error);
      setRawStorageUnits([]);
      setError(error.message || 'An unexpected error occurred while fetching storage units');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // ===== AUTO-FETCH ON MOUNT =====

  useEffect(() => {
    if (autoFetch && userId) {
      fetchStorageUnits();
    }
  }, [autoFetch, userId, fetchStorageUnits]);

  // ===== UTILITY FUNCTIONS =====

  const getStorageUnitById = useCallback((id: string): FormattedStorageUnit | null => {
    return formattedStorageUnits.find(unit => unit.id === id) || null;
  }, [formattedStorageUnits]);

  const getStorageUnitsByIds = useCallback((ids: string[]): FormattedStorageUnit[] => {
    return formattedStorageUnits.filter(unit => ids.includes(unit.id));
  }, [formattedStorageUnits]);

  const getAllStorageUnitIds = useCallback((): string[] => {
    return formattedStorageUnits.map(unit => unit.id);
  }, [formattedStorageUnits]);

  const hasStorageUnits = useMemo((): boolean => {
    return formattedStorageUnits.length > 0;
  }, [formattedStorageUnits]);

  const storageUnitCount = useMemo((): number => {
    return formattedStorageUnits.length;
  }, [formattedStorageUnits]);

  // ===== VALIDATION HELPERS =====

  const validateStorageUnitSelection = useCallback((
    selectedIds: string[],
    isEndStorageTerm: boolean = false
  ): { isValid: boolean; error: string | null } => {
    if (selectedIds.length === 0) {
      return { isValid: false, error: 'Please select at least one unit' };
    }

    // Check if all selected IDs exist
    const invalidIds = selectedIds.filter(id => !formattedStorageUnits.some(unit => unit.id === id));
    if (invalidIds.length > 0) {
      return { 
        isValid: false, 
        error: `Invalid storage unit selection: ${invalidIds.join(', ')}` 
      };
    }

    // For end storage term, all units must be selected
    if (isEndStorageTerm && selectedIds.length !== formattedStorageUnits.length) {
      return { 
        isValid: false, 
        error: 'All storage units must be selected when ending storage term' 
      };
    }

    return { isValid: true, error: null };
  }, [formattedStorageUnits]);

  // ===== SELECTION HELPERS =====

  const selectAllUnits = useCallback((): string[] => {
    return getAllStorageUnitIds();
  }, [getAllStorageUnitIds]);

  const clearSelection = useCallback((): string[] => {
    return [];
  }, []);

  const toggleUnitSelection = useCallback((
    unitId: string, 
    currentSelection: string[]
  ): string[] => {
    if (currentSelection.includes(unitId)) {
      return currentSelection.filter(id => id !== unitId);
    } else {
      return [...currentSelection, unitId];
    }
  }, []);

  // ===== REFRESH AND RETRY =====

  const refetch = useCallback(async (): Promise<void> => {
    await fetchStorageUnits();
  }, [fetchStorageUnits]);

  const retry = useCallback(async (): Promise<void> => {
    setError(null);
    await fetchStorageUnits();
  }, [fetchStorageUnits]);

  // ===== LOADING STATES =====

  const isEmpty = useMemo((): boolean => {
    return !isLoading && !error && formattedStorageUnits.length === 0;
  }, [isLoading, error, formattedStorageUnits.length]);

  const hasError = useMemo((): boolean => {
    return !!error;
  }, [error]);

  const isReady = useMemo((): boolean => {
    return !isLoading && !error;
  }, [isLoading, error]);

  return {
    // Data
    storageUnits: formattedStorageUnits,
    rawStorageUnits,
    
    // State
    isLoading,
    error,
    isEmpty,
    hasError,
    isReady,
    hasStorageUnits,
    storageUnitCount,
    
    // Actions
    fetchStorageUnits,
    refetch,
    refreshStorageUnits: refetch, // Alias for backward compatibility
    retry,
    
    // Utility functions
    getStorageUnitById,
    findStorageUnitById: getStorageUnitById, // Alias for backward compatibility
    getStorageUnitsByIds,
    getAllStorageUnitIds,
    
    // Selection helpers
    selectAllUnits,
    clearSelection,
    toggleUnitSelection,
    
    // Validation
    validateStorageUnitSelection,
  };
}

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
  /** Appointment ID to exclude from pending appointment checks (for edit mode) */
  excludeAppointmentId?: string;
}

export function useStorageUnits(params: UseStorageUnitsParams = {}): UseStorageUnitsReturn {
  const { userId: paramUserId, autoFetch = true, excludeAppointmentId } = params;
  const { data: session } = useSession();
  const userId = paramUserId || session?.user?.id;

  console.log('🎯 [useStorageUnits] Hook initialized with:', {
    paramUserId,
    autoFetch,
    sessionData: session,
    sessionUserId: session?.user?.id,
    finalUserId: userId
  });

  // State
  const [rawStorageUnits, setRawStorageUnits] = useState<StorageUnitUsage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== DATA FORMATTING =====

  const formattedStorageUnits = useMemo((): FormattedStorageUnit[] => {
    console.log('🔄 [useStorageUnits] Formatting storage units. Raw count:', rawStorageUnits.length);
    
    const formatted = rawStorageUnits.map((unit) => {
      // Check for pending access storage appointment
      const pendingRequest = unit.storageUnit?.accessRequests?.[0];
      const pendingAppointment = pendingRequest?.appointment ? {
        id: pendingRequest.appointment.id,
        date: new Date(pendingRequest.appointment.date).toLocaleDateString(),
        status: pendingRequest.appointment.status
      } : null;
      
      console.log('🔧 [useStorageUnits] Formatting unit:', {
        id: unit.storageUnit?.id,
        storageUnitNumber: unit.storageUnit?.storageUnitNumber,
        usageStartDate: unit.usageStartDate,
        returnDate: unit.returnDate,
        hasReturnDate: !!unit.returnDate,
        hasPendingAppointment: !!pendingAppointment
      });
      
      return {
        id: unit.storageUnit.id.toString(),
        imageSrc: unit.mainImage || '/placeholder.jpg',
        title: `Boombox ${unit.storageUnit.storageUnitNumber}`,
        pickUpDate: new Date(unit.usageStartDate).toLocaleDateString(),
        lastAccessedDate: unit.returnDate
          ? new Date(unit.returnDate).toLocaleDateString()
          : unit.usageStartDate
          ? new Date(unit.usageStartDate).toLocaleDateString()
          : 'Has not been accessed',
        description: unit.description || 'No description provided',
        location: unit.location,
        pendingAppointment
      };
    });
    
    console.log('✅ [useStorageUnits] Formatted storage units:', formatted.length, 'units');
    console.log('📋 [useStorageUnits] Formatted unit IDs:', formatted.map(u => u.id));
    
    return formatted;
  }, [rawStorageUnits]);

  // ===== API INTEGRATION =====

  const fetchStorageUnits = useCallback(async (): Promise<void> => {
    console.log('🔍 [useStorageUnits] fetchStorageUnits called');
    console.log('👤 [useStorageUnits] userId:', userId);
    
    if (!userId) {
      console.log('❌ [useStorageUnits] No userId available - cannot fetch storage units');
      setError('User authentication required to fetch storage units');
      setIsLoading(false);
      return;
    }

    console.log('⏳ [useStorageUnits] Starting fetch...');
    setIsLoading(true);
    setError(null);

    try {
      // 🚨 CRITICAL: Use new API route from api-routes-migration-tracking.md
      // OLD: /api/storageUnitsByUser
      // NEW: /api/customers/storage-units-by-customer
      let apiUrl = `/api/customers/storage-units-by-customer?userId=${userId}`;
      // In edit mode, exclude the current appointment from pending appointment checks
      if (excludeAppointmentId) {
        apiUrl += `&excludeAppointmentId=${excludeAppointmentId}`;
      }
      console.log('📡 [useStorageUnits] Fetching from:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('📥 [useStorageUnits] Response status:', response.status, response.statusText);
      
      const responseData = await response.json();
      console.log('📦 [useStorageUnits] Response data:', responseData);

      if (!response.ok) {
        // Try to get error message from response body
        const errorMessage = responseData?.error?.message || responseData?.message || `HTTP error! status: ${response.status}`;
        console.log('❌ [useStorageUnits] HTTP error:', errorMessage);
        throw new Error(errorMessage);
      }

      // Validate response structure
      console.log('🔍 [useStorageUnits] Validating response with Zod schema...');
      const validationResult = storageUnitsApiResponseSchema.safeParse(responseData);
      
      if (!validationResult.success) {
        console.error('❌ [useStorageUnits] Validation failed:', validationResult.error);
        console.error('❌ [useStorageUnits] Validation errors:', JSON.stringify(validationResult.error.errors, null, 2));
        throw new Error('Invalid response format from server');
      }

      console.log('✅ [useStorageUnits] Validation passed');
      const data = validationResult.data;
      console.log('📊 [useStorageUnits] Parsed data:', data);

      if (data.success && data.data) {
        console.log('✅ [useStorageUnits] Setting storage units:', data.data.length, 'units found');
        console.log('📋 [useStorageUnits] Storage unit IDs:', data.data.map((u: any) => u.storageUnit?.id || u.id));
        setRawStorageUnits(data.data as StorageUnitUsage[]);
        setError(null);
      } else if (data.success && data.data === undefined) {
        // Handle malformed response where success is true but data is undefined
        console.log('⚠️ [useStorageUnits] Success but no data - malformed response');
        setRawStorageUnits([]);
        setError('Invalid response format');
      } else {
        console.log('⚠️ [useStorageUnits] API returned failure:', data.message);
        setRawStorageUnits([]);
        setError(data.message || 'Failed to fetch storage units');
      }
    } catch (error: any) {
      console.error('❌ [useStorageUnits] Error fetching storage units:', error);
      console.error('❌ [useStorageUnits] Error stack:', error.stack);
      setRawStorageUnits([]);
      setError(error.message || 'An unexpected error occurred while fetching storage units');
    } finally {
      console.log('🏁 [useStorageUnits] Fetch complete. Loading state set to false');
      setIsLoading(false);
    }
  }, [userId, excludeAppointmentId]);

  // ===== AUTO-FETCH ON MOUNT =====

  useEffect(() => {
    console.log('🔄 [useStorageUnits] useEffect triggered. Checking conditions:', {
      autoFetch,
      userId,
      shouldFetch: autoFetch && userId
    });
    
    if (autoFetch && userId) {
      console.log('✅ [useStorageUnits] Conditions met - calling fetchStorageUnits()');
      fetchStorageUnits();
    } else {
      console.log('❌ [useStorageUnits] Conditions NOT met - NOT fetching storage units');
      if (!autoFetch) console.log('  - autoFetch is false');
      if (!userId) console.log('  - userId is missing/falsy');
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

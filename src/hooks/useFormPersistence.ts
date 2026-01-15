/**
 * @fileoverview Form persistence and URL state synchronization hook
 * @source boombox-10.0/src/app/components/access-storage/accessstorageform.tsx (URL parameter handling)
 * @refactor Created centralized form persistence system with URL synchronization
 */

import { useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AccessStorageFormState,
  AccessStorageStep,
  DeliveryReason,
  UseFormPersistenceReturn
} from '@/types/accessStorage.types';

interface UseFormPersistenceParams {
  formState: AccessStorageFormState;
  onFormStateRestore?: (state: Partial<AccessStorageFormState>) => void;
  enableLocalStorage?: boolean;
  enableUrlSync?: boolean;
}

const STORAGE_KEY = 'accessStorageForm';
const URL_PARAMS_TO_PERSIST = [
  'zipCode',
  'deliveryReason',
  'address',
  'selectedPlan'
] as const;

export function useFormPersistence(params: UseFormPersistenceParams): UseFormPersistenceReturn {
  const {
    formState,
    onFormStateRestore,
    enableLocalStorage = true,
    enableUrlSync = true
  } = params;
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // ===== LOCAL STORAGE PERSISTENCE =====

  const saveFormState = useCallback((state: Partial<AccessStorageFormState>) => {
    if (!enableLocalStorage) return;

    try {
      // Only save serializable data (exclude functions, refs, etc.)
      const serializableState = {
        deliveryReason: state.deliveryReason,
        address: state.address,
        zipCode: state.zipCode,
        cityName: state.cityName,
        selectedStorageUnits: state.selectedStorageUnits,
        selectedPlan: state.selectedPlan,
        selectedPlanName: state.selectedPlanName,
        planType: state.planType,
        scheduledDate: state.scheduledDate?.toISOString(),
        scheduledTimeSlot: state.scheduledTimeSlot,
        loadingHelpPrice: state.loadingHelpPrice,
        loadingHelpDescription: state.loadingHelpDescription,
        parsedLoadingHelpPrice: state.parsedLoadingHelpPrice,
        description: state.description,
        appointmentType: state.appointmentType,
        calculatedTotal: state.calculatedTotal,
        monthlyStorageRate: state.monthlyStorageRate,
        monthlyInsuranceRate: state.monthlyInsuranceRate,
        currentStep: state.currentStep,
        // Coordinates need special handling
        coordinates: state.coordinates ? {
          lat: state.coordinates.lat,
          lng: state.coordinates.lng
        } : null,
        // Labor selection
        selectedLabor: state.selectedLabor,
        movingPartnerId: state.movingPartnerId,
        thirdPartyMovingPartnerId: state.thirdPartyMovingPartnerId,
        // Timestamp for expiration
        savedAt: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableState));
    } catch (error) {
      console.warn('Failed to save form state to localStorage:', error);
    }
  }, [enableLocalStorage]);

  const loadFormState = useCallback((): Partial<AccessStorageFormState> | null => {
    if (!enableLocalStorage) return null;

    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (!savedData) return null;

      const parsedData = JSON.parse(savedData);
      
      // Check if data is expired (24 hours)
      const savedAt = new Date(parsedData.savedAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      // Convert date strings back to Date objects
      const restoredState: Partial<AccessStorageFormState> = {
        ...parsedData,
        scheduledDate: parsedData.scheduledDate ? new Date(parsedData.scheduledDate) : null,
      };

      // Remove the savedAt timestamp from the restored state
      delete (restoredState as any).savedAt;

      return restoredState;
    } catch (error) {
      console.warn('Failed to load form state from localStorage:', error);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }, [enableLocalStorage]);

  const clearPersistedState = useCallback(() => {
    if (!enableLocalStorage) return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear persisted form state:', error);
    }
  }, [enableLocalStorage]);

  // ===== URL SYNCHRONIZATION =====

  const syncWithUrl = useCallback((
    state?: Partial<AccessStorageFormState>
  ) => {
    if (!enableUrlSync) return;

    const params = new URLSearchParams(searchParams.toString());
    
    // Update other parameters if state is provided
    if (state) {
      if (state.zipCode) {
        params.set('zipCode', state.zipCode);
      }
      
      if (state.deliveryReason) {
        params.set('deliveryReason', state.deliveryReason);
      }
      
      if (state.address) {
        params.set('address', encodeURIComponent(state.address));
      }
      
      if (state.selectedPlan) {
        params.set('selectedPlan', state.selectedPlan);
      }
    }

    // Use router.push to update URL without page refresh
    router.push(`?${params.toString()}`);
  }, [enableUrlSync, router, searchParams]);

  const loadStateFromUrl = useCallback((): Partial<AccessStorageFormState> | null => {
    if (!enableUrlSync) return null;

    const urlState: Partial<AccessStorageFormState> = {};
    let hasData = false;

    // Extract zip code
    const zipCode = searchParams.get('zipCode');
    if (zipCode) {
      urlState.zipCode = zipCode;
      hasData = true;
    }

    // Extract delivery reason
    const deliveryReason = searchParams.get('deliveryReason');
    if (deliveryReason && Object.values(DeliveryReason).includes(deliveryReason as DeliveryReason)) {
      urlState.deliveryReason = deliveryReason as DeliveryReason;
      hasData = true;
    }

    // Extract address
    const address = searchParams.get('address');
    if (address) {
      urlState.address = decodeURIComponent(address);
      hasData = true;
    }

    // Extract selected plan
    const selectedPlan = searchParams.get('selectedPlan');
    if (selectedPlan) {
      urlState.selectedPlan = selectedPlan;
      hasData = true;
    }

    return hasData ? urlState : null;
  }, [enableUrlSync, searchParams]);

  // ===== AUTOMATIC PERSISTENCE =====

  // Save form state to localStorage whenever it changes
  useEffect(() => {
    if (enableLocalStorage) {
      const timeoutId = setTimeout(() => {
        saveFormState(formState);
      }, 1000); // Debounce saves by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [formState, saveFormState, enableLocalStorage]);

  // Load initial state from URL and localStorage on mount
  useEffect(() => {
    if (!onFormStateRestore) return;

    // Priority: URL params > localStorage > defaults
    const urlState = loadStateFromUrl();
    const localStorageState = loadFormState();

    const combinedState = {
      ...localStorageState,
      ...urlState // URL params take precedence
    };

    if (Object.keys(combinedState).length > 0) {
      onFormStateRestore(combinedState);
    }
  }, []); // Only run on mount

  // ===== UTILITY FUNCTIONS =====

  const getPersistedValue = useCallback(<K extends keyof AccessStorageFormState>(
    key: K
  ): AccessStorageFormState[K] | null => {
    const urlState = loadStateFromUrl();
    const localState = loadFormState();
    
    // URL takes precedence over localStorage
    return urlState?.[key] ?? localState?.[key] ?? null;
  }, [loadStateFromUrl, loadFormState]);

  const hasPersistedData = useCallback((): boolean => {
    const urlState = loadStateFromUrl();
    const localState = loadFormState();
    
    return !!(urlState && Object.keys(urlState).length > 0) || 
           !!(localState && Object.keys(localState).length > 0);
  }, [loadStateFromUrl, loadFormState]);

  const getFormStateAge = useCallback((): number | null => {
    if (!enableLocalStorage) return null;

    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (!savedData) return null;

      const parsedData = JSON.parse(savedData);
      const savedAt = new Date(parsedData.savedAt);
      const now = new Date();
      
      return Math.floor((now.getTime() - savedAt.getTime()) / (1000 * 60)); // Age in minutes
    } catch (error) {
      return null;
    }
  }, [enableLocalStorage]);

  // ===== CLEANUP =====

  const clearAllPersistedData = useCallback(() => {
    clearPersistedState();
    
    if (enableUrlSync) {
      // Clear URL parameters
      const params = new URLSearchParams();
      router.push(`?${params.toString()}`);
    }
  }, [clearPersistedState, enableUrlSync, router]);

  return {
    // Core persistence functions
    saveFormState,
    loadFormState,
    clearPersistedState,
    
    // URL synchronization
    syncWithUrl,
    loadStateFromUrl,
    
    // Utility functions
    getPersistedValue,
    hasPersistedData,
    getFormStateAge,
    
    // Cleanup
    clearAllPersistedData,
  };
}

/**
 * @fileoverview Form persistence and URL state synchronization hook for Add Storage
 * @source boombox-10.0/src/app/components/add-storage/userpageaddstorageform.tsx (URL parameter handling)
 * @refactor Created centralized form persistence system with URL synchronization adapted from AccessStorage patterns
 */

import { useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AddStorageFormState,
  AddStorageStep,
  AddStorageFormPersistenceData,
  UseFormPersistenceReturn,
  PlanType,
} from '@/types/addStorage.types';
import { validatePersistenceData } from '@/lib/validations/addStorage.validations';

interface UseAddStorageFormPersistenceParams {
  formState: AddStorageFormState;
  onFormStateRestore?: (state: Partial<AddStorageFormState>) => void;
  enableLocalStorage?: boolean;
  enableUrlSync?: boolean;
}

const STORAGE_KEY = 'addStorageForm';
const URL_PARAMS_TO_PERSIST = [
  'zipCode',
  'step',
  'storageUnitCount',
  'selectedPlan',
  'planType'
] as const;

export function useAddStorageFormPersistence(
  params: UseAddStorageFormPersistenceParams
): UseFormPersistenceReturn {
  const {
    formState,
    onFormStateRestore,
    enableLocalStorage = true,
    enableUrlSync = true,
  } = params;

  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Serialize form state for persistence
   */
  const serializeFormState = useCallback((state: AddStorageFormState): AddStorageFormPersistenceData => {
    return {
      step: state.currentStep,
      storageUnitCount: state.storageUnit.count,
      zipCode: state.addressInfo.zipCode,
      selectedPlan: state.selectedPlan || undefined,
      planType: state.planType as any || undefined,
    };
  }, []);

  /**
   * Deserialize persistence data to partial form state
   */
  const deserializeToFormState = useCallback((
    data: AddStorageFormPersistenceData
  ): Partial<AddStorageFormState> => {
    const partialState: Partial<AddStorageFormState> = {};

    if (data.step !== undefined) {
      partialState.currentStep = data.step as AddStorageStep;
    }

    if (data.storageUnitCount !== undefined) {
      partialState.storageUnit = {
        count: data.storageUnitCount,
        text: getStorageUnitText(data.storageUnitCount),
      };
    }

    if (data.zipCode !== undefined) {
      partialState.addressInfo = {
        ...formState.addressInfo,
        zipCode: data.zipCode,
      };
    }

    if (data.selectedPlan !== undefined) {
      partialState.selectedPlan = data.selectedPlan;
    }

    if (data.planType !== undefined) {
      partialState.planType = data.planType as PlanType;
    }

    return partialState;
  }, [formState.addressInfo]);

  /**
   * Get storage unit text based on count (reusing function pattern)
   */
  function getStorageUnitText(count: number): string {
    switch (count) {
      case 1:
        return 'studio apartment';
      case 2:
        return '1 bedroom apt';
      case 3:
        return '2 bedroom apt';
      case 4:
      case 5:
        return 'full house';
      default:
        return 'studio apartment';
    }
  }

  /**
   * Save form state to localStorage
   */
  const saveToLocalStorage = useCallback((data: AddStorageFormPersistenceData) => {
    if (!enableLocalStorage || typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save form state to localStorage:', error);
    }
  }, [enableLocalStorage]);

  /**
   * Load form state from localStorage
   */
  const loadFromLocalStorage = useCallback((): AddStorageFormPersistenceData | null => {
    if (!enableLocalStorage || typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      const validation = validatePersistenceData(parsed);
      
      return validation.success ? validation.data : null;
    } catch (error) {
      console.warn('Failed to load form state from localStorage:', error);
      return null;
    }
  }, [enableLocalStorage]);

  /**
   * Clear localStorage
   */
  const clearLocalStorage = useCallback(() => {
    if (!enableLocalStorage || typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }, [enableLocalStorage]);

  /**
   * Update URL parameters with form state
   */
  const updateUrlParams = useCallback((data: AddStorageFormPersistenceData) => {
    if (!enableUrlSync) return;

    const params = new URLSearchParams(searchParams.toString());
    
    // Update URL parameters
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && URL_PARAMS_TO_PERSIST.includes(key as any)) {
        params.set(key, String(value));
      }
    });

    // Use shallow routing to avoid page refresh
    const newUrl = `?${params.toString()}`;
    if (newUrl !== `?${searchParams.toString()}`) {
      router.push(newUrl);
    }
  }, [enableUrlSync, router, searchParams]);

  /**
   * Load form state from URL parameters
   */
  const loadFromUrlParams = useCallback((): AddStorageFormPersistenceData => {
    const data: AddStorageFormPersistenceData = {};

    // Extract values from URL parameters
    const step = searchParams.get('step');
    if (step) {
      const stepNumber = parseInt(step, 10);
      if (stepNumber >= 1 && stepNumber <= 4) {
        data.step = stepNumber;
      }
    }

    const storageUnitCount = searchParams.get('storageUnitCount');
    if (storageUnitCount) {
      const count = parseInt(storageUnitCount, 10);
      if (count >= 1 && count <= 5) {
        data.storageUnitCount = count;
      }
    }

    const zipCode = searchParams.get('zipCode');
    if (zipCode && zipCode.length >= 5) {
      data.zipCode = zipCode;
    }

    const selectedPlan = searchParams.get('selectedPlan');
    if (selectedPlan) {
      data.selectedPlan = selectedPlan;
    }

    const planType = searchParams.get('planType');
    if (planType) {
      data.planType = planType as any;
    }

    return data;
  }, [searchParams]);

  /**
   * Persist current form state
   */
  const persistFormState = useCallback((data: AddStorageFormPersistenceData) => {
    const validation = validatePersistenceData(data);
    if (!validation.success) {
      console.warn('Invalid persistence data:', validation.error);
      return;
    }

    const validData = validation.data;

    // Save to localStorage
    saveToLocalStorage(validData);

    // Update URL parameters
    updateUrlParams(validData);
  }, [saveToLocalStorage, updateUrlParams]);

  /**
   * Restore form state from all sources
   */
  const restoreFormState = useCallback((): AddStorageFormPersistenceData => {
    // Priority: URL params > localStorage
    const urlData = loadFromUrlParams();
    const localStorageData = loadFromLocalStorage();

    // Merge data with URL params taking priority
    const mergedData: AddStorageFormPersistenceData = {
      ...localStorageData,
      ...urlData,
    };

    return mergedData;
  }, [loadFromUrlParams, loadFromLocalStorage]);

  /**
   * Clear all persisted state
   */
  const clearPersistedState = useCallback(() => {
    clearLocalStorage();
    
    if (enableUrlSync) {
      // Clear URL parameters
      const params = new URLSearchParams();
      router.push(`?${params.toString()}`);
    }
  }, [clearLocalStorage, enableUrlSync, router]);

  /**
   * Auto-persist form state when it changes
   */
  useEffect(() => {
    const persistenceData = serializeFormState(formState);
    persistFormState(persistenceData);
  }, [
    formState.currentStep,
    formState.storageUnit.count,
    formState.addressInfo.zipCode,
    formState.selectedPlan,
    formState.planType,
    serializeFormState,
    persistFormState,
  ]);

  /**
   * Restore form state on mount
   */
  useEffect(() => {
    const restoredData = restoreFormState();
    
    if (Object.keys(restoredData).length > 0) {
      const partialFormState = deserializeToFormState(restoredData);
      onFormStateRestore?.(partialFormState);
    }
  }, []);

  return {
    persistFormState,
    restoreFormState,
    clearPersistedState,
  };
}

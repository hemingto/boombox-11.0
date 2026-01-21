/**
 * @fileoverview Main form state management hook for Add Storage form
 * @source boombox-10.0/src/app/components/add-storage/userpageaddstorageform.tsx (25+ useState hooks)
 * @refactor Consolidated all form state management into single custom hook following AccessStorageForm patterns
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import {
  AddStorageFormState,
  AddStorageFormErrors,
  AddStorageStep,
  PlanType,
  SelectedLabor,
  AddressInfo,
  StorageUnitConfig,
  SchedulingInfo,
  PricingInfo,
  StepValidationResult,
  UseAddStorageFormReturn,
  DEFAULT_ADD_STORAGE_FORM_STATE,
  DEFAULT_ADD_STORAGE_FORM_ERRORS,
} from '@/types/addStorage.types';
import { InsuranceOption } from '@/types/insurance';
import {
  validateFormStep,
  validateCompleteForm,
} from '@/lib/validations/addStorage.validations';
import { parseLoadingHelpPrice } from '@/lib/utils';

interface UseAddStorageFormParams {
  initialStorageUnitCount?: number;
  initialZipCode?: string;
  onStepChange?: (step: AddStorageStep) => void;
  onSubmissionSuccess?: (appointmentId: number) => void;
}

export function useAddStorageForm(params: UseAddStorageFormParams = {}): UseAddStorageFormReturn {
  const { 
    initialStorageUnitCount = 1, 
    initialZipCode = '', 
    onStepChange, 
    onSubmissionSuccess 
  } = params;
  
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Initialize form state with URL parameters
  const [formState, setFormState] = useState<AddStorageFormState>({
    ...DEFAULT_ADD_STORAGE_FORM_STATE,
    addressInfo: {
      ...DEFAULT_ADD_STORAGE_FORM_STATE.addressInfo,
      zipCode: initialZipCode,
    },
    storageUnit: {
      count: initialStorageUnitCount,
      text: getStorageUnitText(initialStorageUnitCount),
    },
  });

  const [errors, setErrors] = useState<AddStorageFormErrors>(DEFAULT_ADD_STORAGE_FORM_ERRORS);
  
  // Content ref for plan details animation
  const contentRef = useRef<HTMLDivElement>(null!);

  /**
   * Get storage unit text based on count (reusing existing function pattern)
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
   * Parse loading help price from string format (reusing existing utility)
   */
  const parseLoadingHelpPriceCallback = useCallback((price: string): number => {
    return parseLoadingHelpPrice(price);
  }, []);

  /**
   * Update form state with partial updates
   */
  const updateFormState = useCallback((updates: Partial<AddStorageFormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Update address information
   */
  const updateAddressInfo = useCallback((addressInfo: AddressInfo) => {
    setFormState(prev => ({
      ...prev,
      addressInfo,
    }));
    clearError('addressError');
  }, []);

  /**
   * Update storage unit configuration
   */
  const updateStorageUnit = useCallback((count: number, text: string) => {
    setFormState(prev => ({
      ...prev,
      storageUnit: { count, text },
    }));
  }, []);

  /**
   * Update plan selection with comprehensive state updates
   */
  const updatePlanSelection = useCallback((planId: string, planName: string, planType: string) => {
    const updates: Partial<AddStorageFormState> = {
      selectedPlan: planId,
      selectedPlanName: planName,
      planType: planType as PlanType,
    };

    // Handle DIY plan special case
    if (planName === 'Do It Yourself Plan') {
      updates.selectedLabor = {
        id: 'Do It Yourself Plan',
        price: '$0/hr',
        title: 'Do It Yourself Plan',
      };
      updates.pricing = {
        ...formState.pricing,
        loadingHelpPrice: '$0/hr',
        loadingHelpDescription: 'Free! 1st hr',
        parsedLoadingHelpPrice: 0,
      };
      updates.movingPartnerId = null;
      updates.thirdPartyMovingPartnerId = null;
    } else if (planName === 'Full Service Plan') {
      // Reset labor selection for Full Service Plan
      updates.selectedLabor = null;
      updates.pricing = {
        ...formState.pricing,
        loadingHelpPrice: '$189/hr',
        loadingHelpDescription: 'estimate',
      };
      updates.movingPartnerId = null;
      updates.thirdPartyMovingPartnerId = null;
    }

    setFormState(prev => ({ ...prev, ...updates }));
    clearError('planError');
  }, [formState.pricing]);

  /**
   * Update labor selection with comprehensive state management
   */
  const updateLaborSelection = useCallback((labor: SelectedLabor | null) => {
    if (!labor) {
      setFormState(prev => ({
        ...prev,
        selectedLabor: null,
        movingPartnerId: null,
        thirdPartyMovingPartnerId: null,
      }));
      return;
    }

    const formattedPrice = `$${labor.price}/hr`;
    const parsedPrice = parseLoadingHelpPriceCallback(formattedPrice);
    
    const updates: Partial<AddStorageFormState> = {
      selectedLabor: { 
        ...labor, 
        price: formattedPrice 
      },
      selectedPlanName: labor.title,
      pricing: {
        ...formState.pricing,
        loadingHelpPrice: formattedPrice,
        parsedLoadingHelpPrice: parsedPrice,
        loadingHelpDescription: labor.id === 'Do It Yourself Plan' ? 'Free 1st hr' : 
                                labor.id.startsWith('thirdParty-') ? 'Third-party estimate' : 
                                'Full Service Plan',
      },
      planType: labor.id === 'Do It Yourself Plan' ? PlanType.DIY :
                labor.id.startsWith('thirdParty-') ? PlanType.THIRD_PARTY :
                PlanType.FULL_SERVICE,
      selectedPlan: labor.id === 'Do It Yourself Plan' ? 'option1' : 'option2',
      movingPartnerId: labor.id === 'Do It Yourself Plan' ? null :
                      labor.id.startsWith('thirdParty-') ? null :
                      parseInt(labor.id, 10),
      thirdPartyMovingPartnerId: labor.id.startsWith('thirdParty-') ? 
                                parseInt(labor.id.replace('thirdParty-', ''), 10) : null,
    };

    setFormState(prev => ({ ...prev, ...updates }));
    clearError('laborError');
  }, [formState.pricing, parseLoadingHelpPriceCallback]);

  /**
   * Update insurance selection
   */
  const updateInsurance = useCallback((insurance: InsuranceOption | null) => {
    setFormState(prev => ({
      ...prev,
      selectedInsurance: insurance,
    }));
    clearError('insuranceError');
  }, []);

  /**
   * Update scheduling information
   */
  const updateScheduling = useCallback((date: Date | null, timeSlot: string | null) => {
    setFormState(prev => ({
      ...prev,
      scheduling: {
        scheduledDate: date,
        scheduledTimeSlot: timeSlot,
      },
    }));
    clearError('scheduleError');

    // Reset labor selection if not DIY plan (following original logic)
    if (formState.planType !== PlanType.DIY) {
      setFormState(prev => ({
        ...prev,
        selectedLabor: null,
        movingPartnerId: null,
        thirdPartyMovingPartnerId: null,
      }));
      clearError('unavailableLaborError');
      clearError('laborError');
    }
  }, [formState.planType]);

  /**
   * Update pricing information
   */
  const updatePricing = useCallback((pricing: Partial<PricingInfo>) => {
    setFormState(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        ...pricing,
      },
    }));
  }, []);

  /**
   * Validate a specific form step
   */
  const validateStep = useCallback((step: AddStorageStep): StepValidationResult => {
    const stepErrors: Partial<AddStorageFormErrors> = {};
    let isValid = true;

    switch (step) {
      case AddStorageStep.ADDRESS_AND_PLAN:
        if (!formState.addressInfo.address) {
          stepErrors.addressError = "Please enter your address by selecting from the verified dropdown options";
          isValid = false;
        }
        if (!formState.selectedPlan) {
          stepErrors.planError = "Please choose a service plan option";
          isValid = false;
        }
        if (!formState.selectedInsurance) {
          stepErrors.insuranceError = "Please select an insurance option";
          isValid = false;
        }
        break;

      case AddStorageStep.SCHEDULING:
        if (!formState.scheduling.scheduledDate || !formState.scheduling.scheduledTimeSlot) {
          stepErrors.scheduleError = "Please select a date and time slot";
          isValid = false;
        }
        break;

      case AddStorageStep.LABOR_SELECTION:
        if (formState.planType !== PlanType.DIY && !formState.selectedLabor) {
          stepErrors.laborError = "Please choose a moving help option";
          isValid = false;
        }
        break;

      case AddStorageStep.CONFIRMATION:
        // Validation handled in submission
        break;

      default:
        isValid = false;
        break;
    }

    return { isValid, errors: stepErrors };
  }, [formState]);

  /**
   * Set a specific error
   */
  const setError = useCallback((errorKey: keyof AddStorageFormErrors, error: string | null) => {
    setErrors(prev => ({
      ...prev,
      [errorKey]: error,
    }));
  }, []);

  /**
   * Clear specific error
   */
  const clearError = useCallback((errorKey: keyof AddStorageFormErrors) => {
    setErrors(prev => ({
      ...prev,
      [errorKey]: null,
    }));
  }, []);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFormState({
      ...DEFAULT_ADD_STORAGE_FORM_STATE,
      addressInfo: {
        ...DEFAULT_ADD_STORAGE_FORM_STATE.addressInfo,
        zipCode: initialZipCode,
      },
      storageUnit: {
        count: initialStorageUnitCount,
        text: getStorageUnitText(initialStorageUnitCount),
      },
    });
    setErrors(DEFAULT_ADD_STORAGE_FORM_ERRORS);
  }, [initialZipCode, initialStorageUnitCount]);

  /**
   * Toggle plan details visibility
   */
  const togglePlanDetails = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      isPlanDetailsVisible: !prev.isPlanDetailsVisible,
    }));
  }, []);

  /**
   * Update content height for plan details animation
   */
  const updateContentHeight = useCallback(() => {
    if (formState.isPlanDetailsVisible && contentRef.current) {
      setFormState(prev => ({
        ...prev,
        contentHeight: contentRef.current?.scrollHeight || null,
      }));
    }
  }, [formState.isPlanDetailsVisible]);

  // Memoized return object for performance
  const returnValue = useMemo((): UseAddStorageFormReturn => ({
    formState,
    errors,
    updateFormState,
    updateAddressInfo,
    updateStorageUnit,
    updatePlanSelection,
    updateLaborSelection,
    updateInsurance,
    updateScheduling,
    updatePricing,
    validateStep,
    setError,
    clearError,
    resetForm,
    togglePlanDetails: togglePlanDetails,
    updateContentHeight,
    contentRef,
  }), [
    formState,
    errors,
    updateFormState,
    updateAddressInfo,
    updateStorageUnit,
    updatePlanSelection,
    updateLaborSelection,
    updateInsurance,
    updateScheduling,
    updatePricing,
    validateStep,
    setError,
    clearError,
    resetForm,
    togglePlanDetails,
    updateContentHeight,
  ]);

  return returnValue;
}

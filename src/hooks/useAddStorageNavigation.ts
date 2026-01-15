/**
 * @fileoverview Step navigation logic hook for Add Storage form
 * @source boombox-10.0/src/app/components/add-storage/userpageaddstorageform.tsx (step navigation logic)
 * @refactor Extracted step navigation and URL synchronization logic into dedicated hook following AccessStorageNavigation patterns
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AddStorageStep,
  PlanType,
  AddStorageNavigationState,
  UseAddStorageNavigationReturn,
} from '@/types/addStorage.types';

interface UseAddStorageNavigationParams {
  planType?: string;
  onStepChange?: (step: AddStorageStep) => void;
  validateStep?: (step: AddStorageStep) => boolean;
}

export function useAddStorageNavigation(
  params: UseAddStorageNavigationParams = {}
): UseAddStorageNavigationReturn {
  const { planType, onStepChange, validateStep } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Always start at step 1 (URL persistence disabled)
  const getInitialStep = useCallback((): AddStorageStep => {
    return AddStorageStep.ADDRESS_AND_PLAN; // Always start at step 1
  }, []);

  const [currentStep, setCurrentStep] = useState<AddStorageStep>(getInitialStep);

  // No-op: URL persistence disabled
  const updateUrl = useCallback((step: AddStorageStep) => {
    // No-op: URL persistence disabled
  }, []);

  // Scroll to top when step changes (following original behavior)
  const scrollToTop = useCallback(() => {
    window.scrollTo(0, 0);
  }, []);

  /**
   * Navigate to a specific step with validation
   */
  const goToStep = useCallback((step: AddStorageStep) => {
    // Only validate if moving forward (not backward)
    // Users should always be able to go back to previous steps
    const isMovingForward = step > currentStep;
    if (isMovingForward && validateStep && !validateStep(currentStep)) {
      return false;
    }

    setCurrentStep(step);
    updateUrl(step);
    
    // Scroll to top for steps 2-4 (following original behavior)
    if (step > AddStorageStep.ADDRESS_AND_PLAN) {
      scrollToTop();
    }
    
    // Notify parent component of step change
    onStepChange?.(step);
    
    return true;
  }, [currentStep, validateStep, updateUrl, scrollToTop, onStepChange]);

  /**
   * Navigate to next step with conditional logic
   */
  const goToNextStep = useCallback(() => {
    let nextStep: AddStorageStep;

    switch (currentStep) {
      case AddStorageStep.ADDRESS_AND_PLAN:
        nextStep = AddStorageStep.SCHEDULING;
        break;
        
      case AddStorageStep.SCHEDULING:
        // Skip labor selection for DIY plan
        if (planType === PlanType.DIY) {
          nextStep = AddStorageStep.CONFIRMATION;
        } else {
          nextStep = AddStorageStep.LABOR_SELECTION;
        }
        break;
        
      case AddStorageStep.LABOR_SELECTION:
        nextStep = AddStorageStep.CONFIRMATION;
        break;
        
      case AddStorageStep.CONFIRMATION:
        // Already at final step
        return false;
        
      default:
        return false;
    }

    return goToStep(nextStep);
  }, [currentStep, planType, goToStep]);

  /**
   * Navigate to previous step with conditional logic
   */
  const goToPreviousStep = useCallback(() => {
    let previousStep: AddStorageStep;

    switch (currentStep) {
      case AddStorageStep.ADDRESS_AND_PLAN:
        // Already at first step
        return false;
        
      case AddStorageStep.SCHEDULING:
        previousStep = AddStorageStep.ADDRESS_AND_PLAN;
        break;
        
      case AddStorageStep.LABOR_SELECTION:
        previousStep = AddStorageStep.SCHEDULING;
        break;
        
      case AddStorageStep.CONFIRMATION:
        // Go back to scheduling for DIY, labor selection for others
        if (planType === PlanType.DIY) {
          previousStep = AddStorageStep.SCHEDULING;
        } else {
          previousStep = AddStorageStep.LABOR_SELECTION;
        }
        break;
        
      default:
        return false;
    }

    return goToStep(previousStep);
  }, [currentStep, planType, goToStep]);

  /**
   * Check if user can proceed from current step
   */
  const canProceed = useCallback((step: AddStorageStep): boolean => {
    if (validateStep) {
      return validateStep(step);
    }
    return true;
  }, [validateStep]);

  /**
   * Check if user can go back from current step
   */
  const canGoBack = useCallback((): boolean => {
    return currentStep > AddStorageStep.ADDRESS_AND_PLAN;
  }, [currentStep]);

  /**
   * Check if user can proceed to next step
   */
  const canProceedToNext = useCallback((): boolean => {
    return currentStep < AddStorageStep.CONFIRMATION && canProceed(currentStep);
  }, [currentStep, canProceed]);

  /**
   * Get step title for display
   */
  const getStepTitle = useCallback((step: AddStorageStep): string => {
    switch (step) {
      case AddStorageStep.ADDRESS_AND_PLAN:
        return 'Address & Plan Selection';
      case AddStorageStep.SCHEDULING:
        return 'Schedule Appointment';
      case AddStorageStep.LABOR_SELECTION:
        return 'Choose Moving Help';
      case AddStorageStep.CONFIRMATION:
        return 'Confirm Appointment';
      default:
        return 'Add Storage';
    }
  }, []);

  /**
   * Get step progress percentage
   */
  const getStepProgress = useCallback((step: AddStorageStep): number => {
    const totalSteps = planType === PlanType.DIY ? 3 : 4; // Skip labor selection for DIY
    let adjustedStep = step;
    
    // Adjust step number for DIY plan (skip labor selection)
    if (planType === PlanType.DIY && step === AddStorageStep.CONFIRMATION) {
      adjustedStep = 3 as AddStorageStep;
    }
    
    return Math.round((adjustedStep / totalSteps) * 100);
  }, [planType]);

  /**
   * Navigation state object
   */
  const navigationState: AddStorageNavigationState = {
    currentStep,
    canProceedToNext: canProceedToNext(),
    canGoBack: canGoBack(),
  };

  return {
    currentStep,
    navigationState,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    canProceed,
    canGoBack,
    canProceedToNext,
    getStepTitle,
    getStepProgress,
  };
}

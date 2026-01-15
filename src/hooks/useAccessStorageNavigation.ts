/**
 * @fileoverview Step navigation logic hook for Access Storage form
 * @source boombox-10.0/src/app/components/access-storage/accessstorageform.tsx (step navigation logic)
 * @refactor Extracted step navigation and URL synchronization logic into dedicated hook
 */

import { useState, useCallback } from 'react';
import {
  AccessStorageStep,
  PlanType,
  STEP_TITLES,
  ACCESS_STORAGE_STEPS,
  UseAccessStorageNavigationReturn
} from '@/types/accessStorage.types';

interface UseAccessStorageNavigationParams {
  planType?: string;
  onStepChange?: (step: AccessStorageStep) => void;
  validateStep?: (step: AccessStorageStep) => boolean;
}

export function useAccessStorageNavigation(
  params: UseAccessStorageNavigationParams = {}
): UseAccessStorageNavigationReturn {
  const { planType, onStepChange, validateStep } = params;
  
  // Always start at step 1 (URL persistence disabled)
  const getInitialStep = useCallback((): AccessStorageStep => {
    return AccessStorageStep.DELIVERY_PURPOSE; // Always start at step 1
  }, []);

  const [currentStep, setCurrentStep] = useState<AccessStorageStep>(getInitialStep);

  // No-op: URL persistence disabled
  const updateUrl = useCallback((step: AccessStorageStep) => {
    // No-op: URL persistence disabled
  }, []);

  // ===== NAVIGATION LOGIC =====

  const goToStep = useCallback((step: AccessStorageStep) => {
    // Validate that the step is within bounds
    if (!ACCESS_STORAGE_STEPS.includes(step)) {
      console.warn(`Invalid step: ${step}. Must be between 1 and 4.`);
      return;
    }

    // Skip labor selection step for DIY plan
    if (step === AccessStorageStep.LABOR_SELECTION && planType === PlanType.DO_IT_YOURSELF) {
      // If trying to go to labor selection with DIY, go to confirmation instead
      step = AccessStorageStep.CONFIRMATION;
    }

    setCurrentStep(step);
    updateUrl(step);
    
    // Scroll to top when changing steps (except for step 1)
    if (step > AccessStorageStep.DELIVERY_PURPOSE) {
      window.scrollTo(0, 0);
    }

    // Call callback if provided
    if (onStepChange) {
      onStepChange(step);
    }
  }, [planType, updateUrl, onStepChange]);

  const goToNextStep = useCallback(() => {
    // Validate current step before proceeding
    if (validateStep && !validateStep(currentStep)) {
      return;
    }

    let nextStep: AccessStorageStep;

    switch (currentStep) {
      case AccessStorageStep.DELIVERY_PURPOSE:
        nextStep = AccessStorageStep.SCHEDULING;
        break;
      case AccessStorageStep.SCHEDULING:
        // Skip labor selection for DIY plan
        nextStep = planType === PlanType.DO_IT_YOURSELF 
          ? AccessStorageStep.CONFIRMATION 
          : AccessStorageStep.LABOR_SELECTION;
        break;
      case AccessStorageStep.LABOR_SELECTION:
        nextStep = AccessStorageStep.CONFIRMATION;
        break;
      case AccessStorageStep.CONFIRMATION:
        // Already at the last step
        return;
      default:
        return;
    }

    goToStep(nextStep);
  }, [currentStep, planType, validateStep, goToStep]);

  const goToPreviousStep = useCallback(() => {
    let prevStep: AccessStorageStep;

    switch (currentStep) {
      case AccessStorageStep.DELIVERY_PURPOSE:
        // Already at the first step
        return;
      case AccessStorageStep.SCHEDULING:
        prevStep = AccessStorageStep.DELIVERY_PURPOSE;
        break;
      case AccessStorageStep.LABOR_SELECTION:
        prevStep = AccessStorageStep.SCHEDULING;
        break;
      case AccessStorageStep.CONFIRMATION:
        // Skip labor selection for DIY plan when going back
        prevStep = planType === PlanType.DO_IT_YOURSELF 
          ? AccessStorageStep.SCHEDULING 
          : AccessStorageStep.LABOR_SELECTION;
        break;
      default:
        return;
    }

    goToStep(prevStep);
  }, [currentStep, planType, goToStep]);

  // ===== NAVIGATION STATE =====

  const canGoBack = currentStep > AccessStorageStep.DELIVERY_PURPOSE;

  const canGoForward = currentStep < AccessStorageStep.CONFIRMATION;

  const getStepTitle = useCallback((step: AccessStorageStep): string => {
    return STEP_TITLES[step] || 'Unknown Step';
  }, []);

  const getProgressPercentage = useCallback((): number => {
    // Calculate progress based on current step
    // For DIY plan, there are effectively 3 steps (skip labor selection)
    const totalSteps = planType === PlanType.DO_IT_YOURSELF ? 3 : 4;
    let adjustedStep = currentStep;
    
    // Adjust step number for DIY plan (confirmation becomes step 3 instead of 4)
    if (planType === PlanType.DO_IT_YOURSELF && currentStep === AccessStorageStep.CONFIRMATION) {
      adjustedStep = 3 as AccessStorageStep;
    }
    
    return Math.round((adjustedStep / totalSteps) * 100);
  }, [currentStep, planType]);

  // ===== SPECIALIZED NAVIGATION HANDLERS =====

  const goBackFromConfirmation = useCallback(() => {
    // Smart back navigation from confirmation step
    if (planType === PlanType.DO_IT_YOURSELF) {
      goToStep(AccessStorageStep.SCHEDULING);
    } else {
      goToStep(AccessStorageStep.LABOR_SELECTION);
    }
  }, [planType, goToStep]);

  const goBackToStep1 = useCallback(() => {
    goToStep(AccessStorageStep.DELIVERY_PURPOSE);
  }, [goToStep]);

  const goBackToStep2 = useCallback(() => {
    goToStep(AccessStorageStep.SCHEDULING);
  }, [goToStep]);

  // ===== STEP FLOW HELPERS =====

  const getNextStepFromCurrent = useCallback((): AccessStorageStep | null => {
    switch (currentStep) {
      case AccessStorageStep.DELIVERY_PURPOSE:
        return AccessStorageStep.SCHEDULING;
      case AccessStorageStep.SCHEDULING:
        return planType === PlanType.DO_IT_YOURSELF 
          ? AccessStorageStep.CONFIRMATION 
          : AccessStorageStep.LABOR_SELECTION;
      case AccessStorageStep.LABOR_SELECTION:
        return AccessStorageStep.CONFIRMATION;
      case AccessStorageStep.CONFIRMATION:
        return null; // No next step
      default:
        return null;
    }
  }, [currentStep, planType]);

  const getPreviousStepFromCurrent = useCallback((): AccessStorageStep | null => {
    switch (currentStep) {
      case AccessStorageStep.DELIVERY_PURPOSE:
        return null; // No previous step
      case AccessStorageStep.SCHEDULING:
        return AccessStorageStep.DELIVERY_PURPOSE;
      case AccessStorageStep.LABOR_SELECTION:
        return AccessStorageStep.SCHEDULING;
      case AccessStorageStep.CONFIRMATION:
        return planType === PlanType.DO_IT_YOURSELF 
          ? AccessStorageStep.SCHEDULING 
          : AccessStorageStep.LABOR_SELECTION;
      default:
        return null;
    }
  }, [currentStep, planType]);

  const isStepAccessible = useCallback((step: AccessStorageStep): boolean => {
    // Step 1 is always accessible
    if (step === AccessStorageStep.DELIVERY_PURPOSE) return true;
    
    // Labor selection step is not accessible for DIY plan
    if (step === AccessStorageStep.LABOR_SELECTION && planType === PlanType.DO_IT_YOURSELF) {
      return false;
    }
    
    // Other steps are accessible if they're not beyond the current step
    return step <= currentStep;
  }, [currentStep, planType]);

  const getVisibleSteps = useCallback((): AccessStorageStep[] => {
    if (planType === PlanType.DO_IT_YOURSELF) {
      // Skip labor selection step for DIY plan
      return [
        AccessStorageStep.DELIVERY_PURPOSE,
        AccessStorageStep.SCHEDULING,
        AccessStorageStep.CONFIRMATION
      ];
    }
    
    return [...ACCESS_STORAGE_STEPS];
  }, [planType]);

  return {
    // Current state
    currentStep,
    canGoBack,
    canGoForward,
    
    // Navigation actions
    goToStep,
    goToNextStep,
    goToPreviousStep,
    
    // Specialized navigation
    goBackFromConfirmation,
    goBackToStep1,
    goBackToStep2,
    
    // Step information
    getStepTitle,
    getProgressPercentage,
    
    // Step flow helpers
    getNextStepFromCurrent,
    getPreviousStepFromCurrent,
    isStepAccessible,
    getVisibleSteps,
  };
}

/**
 * @fileoverview Main hook for GetQuote form state and validation
 * @source Consolidated from boombox-10.0/src/app/components/getquote/getquoteform.tsx
 * 
 * Primary orchestrator hook that provides access to GetQuote context and adds
 * validation logic for each step. This hook is designed to be used within
 * components wrapped by GetQuoteProvider.
 * 
 * NOTE: This hook assumes GetQuoteProvider context is available.
 * The actual provider implementation will be created in TASK_011.
 */

import { useCallback } from 'react';
import type { GetQuoteContextValue } from '@/types';

/**
 * Validate email format
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Main hook for GetQuote form with validation
 * 
 * This hook will be fully implemented once GetQuoteProvider is created in TASK_011.
 * For now, it provides the interface and validation logic structure.
 * 
 * @returns GetQuote state, actions, and validation methods
 * 
 * @example
 * ```tsx
 * function GetQuoteStep() {
 *   const {
 *     // State
 *     currentStep,
 *     address,
 *     selectedPlanName,
 *     
 *     // Actions
 *     setAddress,
 *     nextStep,
 *     
 *     // Validation
 *     validateCurrentStep,
 *     handleNext,
 *     
 *     // Utilities
 *     getButtonText,
 *     shouldShowLabor
 *   } = useGetQuoteForm();
 * }
 * ```
 */
export function useGetQuoteForm() {
  // This will be replaced with actual context consumption in TASK_011
  // const { state, actions } = useGetQuoteContext();
  
  // Placeholder for development - will be replaced with context
  const state = {} as GetQuoteContextValue['state'];
  const actions = {} as GetQuoteContextValue['actions'];
  
  /**
   * Validate Step 1: Address, Plan, Insurance
   */
  const validateStep1 = useCallback((): boolean => {
    let isValid = true;
    
    if (!state.address) {
      // Will set address error via actions
      isValid = false;
    }
    
    if (!state.selectedPlanName) {
      // Will set plan error via actions
      isValid = false;
    }
    
    if (!state.selectedInsurance) {
      // Will set insurance error via actions
      isValid = false;
    }
    
    return isValid;
  }, [state]);
  
  /**
   * Validate Step 2: Schedule
   */
  const validateStep2 = useCallback((): boolean => {
    if (!state.scheduledDate || !state.scheduledTimeSlot) {
      // Will set schedule error via actions
      return false;
    }
    return true;
  }, [state]);
  
  /**
   * Validate Step 3: Labor (only for Full Service Plan)
   */
  const validateStep3 = useCallback((): boolean => {
    if (state.selectedPlanName === 'Full Service Plan' && !state.selectedLabor) {
      // Will set labor error via actions
      return false;
    }
    return true;
  }, [state]);
  
  /**
   * Validate Step 4: Contact info and payment
   */
  const validateStep4 = useCallback((): boolean => {
    let isValid = true;
    
    if (!state.firstName) isValid = false;
    if (!state.lastName) isValid = false;
    if (!validateEmail(state.email)) isValid = false;
    if (!state.phoneNumber) isValid = false;
    
    return isValid;
  }, [state]);
  
  /**
   * Validate current step before proceeding
   */
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    actions.clearAllErrors();
    
    switch (state.currentStep) {
      case 1:
        return validateStep1();
      case 2:
        return validateStep2();
      case 3:
        return validateStep3();
      case 4:
        return validateStep4();
      default:
        return true;
    }
  }, [state.currentStep, validateStep1, validateStep2, validateStep3, validateStep4, actions]);
  
  /**
   * Handle step progression with validation
   */
  const handleNext = useCallback(async () => {
    const isValid = await validateCurrentStep();
    
    if (isValid) {
      if (state.currentStep === 4) {
        // Trigger submission instead of going to next step
        await actions.submitQuote();
      } else {
        actions.nextStep();
      }
    }
  }, [state.currentStep, validateCurrentStep, actions]);
  
  /**
   * Get button text for current step
   */
  const getButtonText = useCallback((): string => {
    const buttonTexts: Record<number, string> = {
      1: 'Schedule Appointment',
      2: 'Reserve Appointment',
      3: 'Select Movers',
      4: 'Confirm Appointment',
    };
    
    return buttonTexts[state.currentStep] || 'Continue';
  }, [state.currentStep]);
  
  /**
   * Determine if labor selection should be shown
   */
  const shouldShowLabor = state.selectedPlanName === 'Full Service Plan';
  
  return {
    // State
    ...state,
    
    // Actions
    ...actions,
    
    // Validation
    validateCurrentStep,
    handleNext,
    
    // Utilities
    getButtonText,
    shouldShowLabor,
  };
}


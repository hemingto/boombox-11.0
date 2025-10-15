/**
 * @fileoverview Context provider for GetQuote form state management
 * @source boombox-10.0/src/app/components/getquote/getquoteform.tsx (state management)
 * 
 * PROVIDER FUNCTIONALITY:
 * Centralizes state management for entire quote flow using React Context and useReducer.
 * Consolidates 50+ useState hooks into a single, manageable state object with typed actions.
 * Provides state and action methods to all child components. Handles step navigation,
 * validation, and data persistence across the 5-step quote flow.
 * 
 * STEP FLOW:
 * 1. QuoteBuilder - Address, storage units, plan, insurance
 * 2. Scheduler - Date and time selection
 * 3. ChooseLabor - Moving partner selection (conditional - skipped for DIY)
 * 4. ConfirmAppointment - Payment and contact info
 * 5. VerifyPhoneNumber - Phone verification
 * 
 * @refactor Consolidated 50+ useState hooks into single reducer-based provider
 */

'use client';

import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type {
  GetQuoteFormState,
  GetQuoteFormActions,
  GetQuoteContextValue,
  InsuranceOption,
  StripeErrors,
} from '@/types/getQuote.types';
import { getStorageUnitText } from '@/lib/utils/storageUtils';
import {
  getQuoteStep1Schema,
  getQuoteStep2Schema,
  contactInfoSchema,
  laborSelectionSchema,
} from '@/lib/validations/getQuote.validations';

// ==================== INITIAL STATE ====================

const INITIAL_STATE: GetQuoteFormState = {
  // Step 1: Build Quote
  address: '',
  cityName: '',
  zipCode: '',
  coordinates: null,
  addressError: null,
  storageUnitCount: 1,
  storageUnitText: 'studio apartment',
  selectedPlan: '',
  selectedPlanName: '',
  planType: '',
  isPlanDetailsVisible: false,
  planError: null,
  selectedInsurance: null,
  insuranceError: null,
  
  // Step 2: Scheduling
  scheduledDate: null,
  scheduledTimeSlot: null,
  scheduleError: null,
  
  // Step 3: Labor Selection
  selectedLabor: null,
  loadingHelpPrice: '---',
  loadingHelpDescription: '',
  parsedLoadingHelpPrice: 0,
  movingPartnerId: null,
  thirdPartyMovingPartnerId: null,
  laborError: null,
  unavailableLaborError: null,
  
  // Step 4: Confirm Appointment
  firstName: '',
  firstNameError: null,
  lastName: '',
  lastNameError: null,
  email: '',
  emailError: null,
  phoneNumber: '',
  phoneError: null,
  stripeCustomerId: null,
  stripeErrors: {},
  
  // Step 5: Phone Verification
  userId: null,
  verificationCodeSent: false,
  
  // Pricing
  calculatedTotal: 0,
  monthlyStorageRate: 0,
  monthlyInsuranceRate: 0,
  
  // UI State
  currentStep: 1,
  isSubmitting: false,
  submitError: null,
  
  // Metadata
  appointmentType: 'Initial Pickup',
};

// ==================== ACTION TYPES ====================

type GetQuoteAction =
  // Address & Location
  | { type: 'SET_ADDRESS'; payload: { address: string; zipCode: string; coordinates: google.maps.LatLngLiteral; cityName: string } }
  | { type: 'CLEAR_ADDRESS_ERROR' }
  
  // Storage Units
  | { type: 'SET_STORAGE_UNIT_COUNT'; payload: { count: number; text: string } }
  
  // Plan Selection
  | { type: 'SET_PLAN'; payload: { id: string; planName: string; description: string } }
  | { type: 'SET_PLAN_TYPE'; payload: string }
  | { type: 'TOGGLE_PLAN_DETAILS' }
  | { type: 'CLEAR_PLAN_ERROR' }
  
  // Insurance
  | { type: 'SET_INSURANCE'; payload: InsuranceOption | null }
  | { type: 'CLEAR_INSURANCE_ERROR' }
  
  // Scheduling
  | { type: 'SET_SCHEDULE'; payload: { date: Date; timeSlot: string } }
  | { type: 'CLEAR_SCHEDULE_ERROR' }
  
  // Labor
  | { type: 'SET_LABOR'; payload: { id: string; price: string; title: string; onfleetTeamId?: string } }
  | { type: 'CLEAR_LABOR_ERROR' }
  | { type: 'SET_UNAVAILABLE_LABOR_ERROR'; payload: { hasError: boolean; message?: string } }
  
  // Contact Info
  | { type: 'SET_FIRST_NAME'; payload: string }
  | { type: 'SET_LAST_NAME'; payload: string }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_PHONE_NUMBER'; payload: string }
  | { type: 'CLEAR_CONTACT_ERRORS' }
  
  // Payment
  | { type: 'SET_STRIPE_CUSTOMER_ID'; payload: string }
  | { type: 'SET_STRIPE_ERRORS'; payload: StripeErrors }
  
  // Pricing
  | { type: 'SET_CALCULATED_TOTAL'; payload: number }
  | { type: 'SET_MONTHLY_STORAGE_RATE'; payload: number }
  | { type: 'SET_MONTHLY_INSURANCE_RATE'; payload: number }
  
  // Navigation
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'GO_TO_STEP'; payload: number }
  
  // Submission
  | { type: 'SET_IS_SUBMITTING'; payload: boolean }
  | { type: 'SET_SUBMIT_ERROR'; payload: string | null }
  | { type: 'SET_USER_ID'; payload: number }
  | { type: 'SET_VERIFICATION_CODE_SENT'; payload: boolean }
  
  // Utilities
  | { type: 'SET_VALIDATION_ERRORS'; payload: Partial<GetQuoteFormState> }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'RESET_FORM' };

// ==================== REDUCER ====================

function getQuoteReducer(state: GetQuoteFormState, action: GetQuoteAction): GetQuoteFormState {
  switch (action.type) {
    // Address & Location
    case 'SET_ADDRESS':
      return {
        ...state,
        address: action.payload.address,
        zipCode: action.payload.zipCode,
        coordinates: action.payload.coordinates,
        cityName: action.payload.cityName,
        addressError: null,
      };
    
    case 'CLEAR_ADDRESS_ERROR':
      return { ...state, addressError: null };
    
    // Storage Units
    case 'SET_STORAGE_UNIT_COUNT':
      return {
        ...state,
        storageUnitCount: action.payload.count,
        storageUnitText: action.payload.text,
      };
    
    // Plan Selection
    case 'SET_PLAN': {
      const { id, planName } = action.payload;
      const isDIY = planName === 'Do It Yourself Plan';
      
      return {
        ...state,
        selectedPlan: id,
        selectedPlanName: planName,
        selectedLabor: null,
        movingPartnerId: null,
        planError: null,
        // Update pricing based on plan
        loadingHelpPrice: isDIY ? '$0/hr' : '$189/hr',
        loadingHelpDescription: isDIY ? 'Free! 1st hr' : 'estimate',
        planType: isDIY ? 'Do It Yourself Plan' : 'Full Service Plan',
      };
    }
    
    case 'SET_PLAN_TYPE':
      return { ...state, planType: action.payload };
    
    case 'TOGGLE_PLAN_DETAILS':
      return { ...state, isPlanDetailsVisible: !state.isPlanDetailsVisible };
    
    case 'CLEAR_PLAN_ERROR':
      return { ...state, planError: null };
    
    // Insurance
    case 'SET_INSURANCE':
      return { ...state, selectedInsurance: action.payload, insuranceError: null };
    
    case 'CLEAR_INSURANCE_ERROR':
      return { ...state, insuranceError: null };
    
    // Scheduling
    case 'SET_SCHEDULE': {
      const shouldResetLabor = state.selectedPlanName === 'Full Service Plan';
      
      return {
        ...state,
        scheduledDate: action.payload.date,
        scheduledTimeSlot: action.payload.timeSlot,
        scheduleError: null,
        // Reset labor selection when schedule changes (for Full Service)
        ...(shouldResetLabor && {
          selectedLabor: null,
          movingPartnerId: null,
          unavailableLaborError: null,
          laborError: null,
        }),
      };
    }
    
    case 'CLEAR_SCHEDULE_ERROR':
      return { ...state, scheduleError: null };
    
    // Labor
    case 'SET_LABOR': {
      const { id, price, title, onfleetTeamId } = action.payload;
      const formattedPrice = `$${price}/hr`;
      const parsedPrice = parseLoadingHelpPrice(formattedPrice);
      const isDIY = id === 'Do It Yourself Plan';
      const isThirdParty = id.startsWith('thirdParty-');
      
      return {
        ...state,
        selectedLabor: { id, price: formattedPrice, title, onfleetTeamId },
        parsedLoadingHelpPrice: parsedPrice,
        loadingHelpPrice: formattedPrice,
        selectedPlanName: title,
        loadingHelpDescription: isDIY
          ? 'Free 1st hr'
          : isThirdParty
          ? 'Third-party estimate'
          : 'Full Service Plan',
        planType: isDIY
          ? 'Do It Yourself Plan'
          : isThirdParty
          ? 'Third Party Loading Help'
          : 'Full Service Plan',
        selectedPlan: isDIY ? 'option1' : 'option2',
        movingPartnerId: isDIY ? null : isThirdParty ? null : parseInt(id, 10),
        thirdPartyMovingPartnerId: isThirdParty ? parseInt(id.replace('thirdParty-', ''), 10) : null,
        laborError: null,
      };
    }
    
    case 'CLEAR_LABOR_ERROR':
      return { ...state, laborError: null };
    
    case 'SET_UNAVAILABLE_LABOR_ERROR':
      return {
        ...state,
        unavailableLaborError: action.payload.hasError
          ? action.payload.message || 'Previously selected mover is unavailable. Please choose another.'
          : null,
      };
    
    // Contact Info
    case 'SET_FIRST_NAME':
      return { ...state, firstName: action.payload, firstNameError: null };
    
    case 'SET_LAST_NAME':
      return { ...state, lastName: action.payload, lastNameError: null };
    
    case 'SET_EMAIL':
      return { ...state, email: action.payload, emailError: null };
    
    case 'SET_PHONE_NUMBER':
      return { ...state, phoneNumber: action.payload, phoneError: null };
    
    case 'CLEAR_CONTACT_ERRORS':
      return {
        ...state,
        firstNameError: null,
        lastNameError: null,
        emailError: null,
        phoneError: null,
      };
    
    // Payment
    case 'SET_STRIPE_CUSTOMER_ID':
      return { ...state, stripeCustomerId: action.payload };
    
    case 'SET_STRIPE_ERRORS':
      return { ...state, stripeErrors: action.payload };
    
    // Pricing
    case 'SET_CALCULATED_TOTAL':
      return { ...state, calculatedTotal: action.payload };
    
    case 'SET_MONTHLY_STORAGE_RATE':
      return { ...state, monthlyStorageRate: action.payload };
    
    case 'SET_MONTHLY_INSURANCE_RATE':
      return { ...state, monthlyInsuranceRate: action.payload };
    
    // Navigation
    case 'NEXT_STEP': {
      // Validate current step before advancing
      const validation = validateStep(state.currentStep, state);
      
      if (!validation.isValid) {
        // Set validation errors and don't advance
        return { ...state, ...validation.errors };
      }
      
      // Advance to next step if validation passes
      const nextStep = getNextStep(state.currentStep, state.selectedPlanName);
      return { ...state, currentStep: nextStep };
    }
    
    case 'PREVIOUS_STEP': {
      const prevStep = getPreviousStep(state.currentStep, state.selectedPlanName);
      return { ...state, currentStep: prevStep };
    }
    
    case 'GO_TO_STEP':
      return { ...state, currentStep: action.payload };
    
    // Submission
    case 'SET_IS_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    
    case 'SET_SUBMIT_ERROR':
      return { ...state, submitError: action.payload };
    
    case 'SET_USER_ID':
      return { ...state, userId: action.payload };
    
    case 'SET_VERIFICATION_CODE_SENT':
      return { ...state, verificationCodeSent: action.payload };
    
    // Utilities
    case 'SET_VALIDATION_ERRORS':
      return { ...state, ...action.payload };
    
    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        addressError: null,
        planError: null,
        insuranceError: null,
        scheduleError: null,
        laborError: null,
        unavailableLaborError: null,
        firstNameError: null,
        lastNameError: null,
        emailError: null,
        phoneError: null,
        submitError: null,
        stripeErrors: {},
      };
    
    case 'RESET_FORM':
      return INITIAL_STATE;
    
    default:
      return state;
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Parse loading help price from formatted string
 * @param price - Formatted price string (e.g., "$189/hr")
 * @returns Numeric price value
 */
function parseLoadingHelpPrice(price: string): number {
  if (price !== '---') {
    const priceMatch = price.match(/\$(\d+)/);
    if (priceMatch) {
      return parseInt(priceMatch[1], 10);
    }
  }
  return 0;
}

/**
 * Get next step with conditional logic for DIY plan
 * DIY plan skips Step 3 (labor selection)
 */
function getNextStep(currentStep: number, selectedPlanName: string): number {
  if (currentStep === 2 && selectedPlanName === 'Do It Yourself Plan') {
    return 4; // Skip Step 3 for DIY
  }
  return currentStep + 1;
}

/**
 * Get previous step with conditional logic for DIY plan
 * When going back from Step 4, DIY plan returns to Step 2
 */
function getPreviousStep(currentStep: number, selectedPlanName: string): number {
  if (currentStep === 4 && selectedPlanName === 'Do It Yourself Plan') {
    return 2; // Skip Step 3 when going back for DIY
  }
  return Math.max(1, currentStep - 1);
}

/**
 * Validate current step before allowing progression
 * Returns validation errors for each step's required fields
 */
function validateStep(step: number, state: GetQuoteFormState): { isValid: boolean; errors: Partial<GetQuoteFormState> } {
  const errors: Partial<GetQuoteFormState> = {};
  
  try {
    switch (step) {
      case 1: { // QuoteBuilder - Address, storage, plan, insurance (Zod validated)
        const step1Data = {
          address: state.address,
          zipCode: state.zipCode,
          cityName: state.cityName,
          coordinates: state.coordinates,
          storageUnitCount: state.storageUnitCount,
          storageUnitText: state.storageUnitText,
          selectedPlan: state.selectedPlan,
          selectedPlanName: state.selectedPlanName,
          planType: state.planType,
          selectedInsurance: state.selectedInsurance,
        };
        
        const result = getQuoteStep1Schema.safeParse(step1Data);
        
        if (!result.success) {
          const zodErrors = result.error.flatten().fieldErrors;
          
          // Map Zod errors to state error fields
          if (zodErrors.address || zodErrors.zipCode || zodErrors.cityName || zodErrors.coordinates) {
            errors.addressError = zodErrors.address?.[0] || zodErrors.zipCode?.[0] || zodErrors.cityName?.[0] || 'Please enter a valid address';
          }
          if (zodErrors.selectedPlan || zodErrors.selectedPlanName || zodErrors.planType) {
            errors.planError = zodErrors.selectedPlan?.[0] || zodErrors.selectedPlanName?.[0] || 'Please select a plan';
          }
          if (zodErrors.selectedInsurance) {
            errors.insuranceError = zodErrors.selectedInsurance?.[0] || 'Please select an insurance option';
          }
        }
        break;
      }
      
      case 2: { // Scheduler - Date and time (Zod validated)
        const step2Data = {
          scheduledDate: state.scheduledDate,
          scheduledTimeSlot: state.scheduledTimeSlot,
        };
        
        const result = getQuoteStep2Schema.safeParse(step2Data);
        
        if (!result.success) {
          const zodErrors = result.error.flatten().fieldErrors;
          errors.scheduleError = zodErrors.scheduledDate?.[0] || zodErrors.scheduledTimeSlot?.[0] || 'Please select a date and time';
        }
        break;
      }
      
      case 3: { // ChooseLabor - Labor selection (Full Service only, Zod validated)
        // Only validate if Full Service plan
        if (state.selectedPlanName !== 'Do It Yourself Plan') {
          const step3Data = {
            selectedLabor: state.selectedLabor,
            movingPartnerId: state.movingPartnerId,
            parsedLoadingHelpPrice: state.parsedLoadingHelpPrice,
          };
          
          const result = laborSelectionSchema.safeParse(step3Data);
          
          if (!result.success || !state.selectedLabor) {
            errors.laborError = 'Please select a moving partner';
          }
        }
        break;
      }
      
      case 4: { // ConfirmAppointment - Contact info (Zod validated, payment validated by Stripe)
        const step4Data = {
          firstName: state.firstName,
          lastName: state.lastName,
          email: state.email,
          phoneNumber: state.phoneNumber,
        };
        
        const result = contactInfoSchema.safeParse(step4Data);
        
        if (!result.success) {
          const zodErrors = result.error.flatten().fieldErrors;
          
          // Map Zod errors to state error fields
          if (zodErrors.firstName) {
            errors.firstNameError = zodErrors.firstName[0];
          }
          if (zodErrors.lastName) {
            errors.lastNameError = zodErrors.lastName[0];
          }
          if (zodErrors.email) {
            errors.emailError = zodErrors.email[0];
          }
          if (zodErrors.phoneNumber) {
            errors.phoneError = zodErrors.phoneNumber[0];
          }
        }
        break;
      }
      
      case 5: // VerifyPhoneNumber - No validation needed (handled by component)
        break;
        
      default:
        break;
    }
  } catch (error) {
    // Fallback to manual validation if Zod parsing fails unexpectedly
    console.error('Validation error:', error);
    
    // Basic fallback validation
    if (step === 1) {
      if (!state.address) errors.addressError = 'Please enter a valid address';
      if (!state.selectedPlan) errors.planError = 'Please select a plan';
      if (!state.selectedInsurance) errors.insuranceError = 'Please select an insurance option';
    } else if (step === 2) {
      if (!state.scheduledDate || !state.scheduledTimeSlot) {
        errors.scheduleError = 'Please select a date and time';
      }
    } else if (step === 3) {
      if (state.selectedPlanName !== 'Do It Yourself Plan' && !state.selectedLabor) {
        errors.laborError = 'Please select a moving partner';
      }
    } else if (step === 4) {
      if (!state.firstName) errors.firstNameError = 'First name is required';
      if (!state.lastName) errors.lastNameError = 'Last name is required';
      if (!state.email) errors.emailError = 'Please enter a valid email address';
      if (!state.phoneNumber) errors.phoneError = 'Please enter a valid phone number';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ==================== CONTEXT CREATION ====================

const GetQuoteContext = createContext<GetQuoteContextValue | null>(null);

// ==================== PROVIDER PROPS ====================

interface GetQuoteProviderProps {
  children: React.ReactNode;
  initialStorageUnitCount?: number;
  initialZipCode?: string;
}

// ==================== PROVIDER COMPONENT ====================

export function GetQuoteProvider({
  children,
  initialStorageUnitCount = 1,
  initialZipCode = '',
}: GetQuoteProviderProps) {
  const [state, dispatch] = useReducer(getQuoteReducer, {
    ...INITIAL_STATE,
    storageUnitCount: initialStorageUnitCount,
    storageUnitText: getStorageUnitText(initialStorageUnitCount),
    zipCode: initialZipCode,
  });

  // ==================== ACTION CREATORS ====================
  // Create actions object with dispatch-based functions
  // These are stable because dispatch is stable from useReducer

  const actions: GetQuoteFormActions = useMemo(() => ({
    // Address & Location
    setAddress: (address: string, zipCode: string, coordinates: google.maps.LatLngLiteral, cityName: string) => {
      dispatch({ type: 'SET_ADDRESS', payload: { address, zipCode, coordinates, cityName } });
    },
    
    clearAddressError: () => {
      dispatch({ type: 'CLEAR_ADDRESS_ERROR' });
    },
    
    // Storage Units
    setStorageUnitCount: (count: number, text: string) => {
      dispatch({ type: 'SET_STORAGE_UNIT_COUNT', payload: { count, text } });
    },
    
    // Plan Selection
    setPlan: (id: string, planName: string, description: string) => {
      dispatch({ type: 'SET_PLAN', payload: { id, planName, description } });
    },
    
    setPlanType: (planType: string) => {
      dispatch({ type: 'SET_PLAN_TYPE', payload: planType });
    },
    
    togglePlanDetails: () => {
      dispatch({ type: 'TOGGLE_PLAN_DETAILS' });
    },
    
    clearPlanError: () => {
      dispatch({ type: 'CLEAR_PLAN_ERROR' });
    },
    
    // Insurance
    setInsurance: (insurance: InsuranceOption | null) => {
      dispatch({ type: 'SET_INSURANCE', payload: insurance });
    },
    
    clearInsuranceError: () => {
      dispatch({ type: 'CLEAR_INSURANCE_ERROR' });
    },
    
    // Scheduling
    setSchedule: (date: Date, timeSlot: string) => {
      dispatch({ type: 'SET_SCHEDULE', payload: { date, timeSlot } });
    },
    
    clearScheduleError: () => {
      dispatch({ type: 'CLEAR_SCHEDULE_ERROR' });
    },
    
    // Labor
    setLabor: (id: string, price: string, title: string, onfleetTeamId?: string) => {
      dispatch({ type: 'SET_LABOR', payload: { id, price, title, onfleetTeamId } });
    },
    
    clearLaborError: () => {
      dispatch({ type: 'CLEAR_LABOR_ERROR' });
    },
    
    setUnavailableLaborError: (hasError: boolean, message?: string) => {
      dispatch({ type: 'SET_UNAVAILABLE_LABOR_ERROR', payload: { hasError, message } });
    },
    
    // Contact Info
    setFirstName: (name: string) => {
      dispatch({ type: 'SET_FIRST_NAME', payload: name });
    },
    
    setLastName: (name: string) => {
      dispatch({ type: 'SET_LAST_NAME', payload: name });
    },
    
    setEmail: (email: string) => {
      dispatch({ type: 'SET_EMAIL', payload: email });
    },
    
    setPhoneNumber: (phone: string) => {
      dispatch({ type: 'SET_PHONE_NUMBER', payload: phone });
    },
    
    clearContactErrors: () => {
      dispatch({ type: 'CLEAR_CONTACT_ERRORS' });
    },
    
    // Payment
    setStripeCustomerId: (id: string) => {
      dispatch({ type: 'SET_STRIPE_CUSTOMER_ID', payload: id });
    },
    
    setStripeErrors: (errors: StripeErrors) => {
      dispatch({ type: 'SET_STRIPE_ERRORS', payload: errors });
    },
    
    // Submission
    setUserId: (id: number) => {
      dispatch({ type: 'SET_USER_ID', payload: id });
    },
    
    setSubmitError: (error: string | null) => {
      dispatch({ type: 'SET_SUBMIT_ERROR', payload: error });
    },
    
    // Pricing
    setCalculatedTotal: (total: number) => {
      dispatch({ type: 'SET_CALCULATED_TOTAL', payload: total });
    },
    
    setMonthlyStorageRate: (rate: number) => {
      dispatch({ type: 'SET_MONTHLY_STORAGE_RATE', payload: rate });
    },
    
    setMonthlyInsuranceRate: (rate: number) => {
      dispatch({ type: 'SET_MONTHLY_INSURANCE_RATE', payload: rate });
    },
    
    // Navigation
    nextStep: () => {
      dispatch({ type: 'NEXT_STEP' });
    },
    
    previousStep: () => {
      dispatch({ type: 'PREVIOUS_STEP' });
    },
    
    goToStep: (step: number) => {
      dispatch({ type: 'GO_TO_STEP', payload: step });
    },
    
    // Validation
    validateCurrentStep: () => {
      const validation = validateStep(state.currentStep, state);
      
      if (!validation.isValid) {
        // Set validation errors
        dispatch({ type: 'SET_VALIDATION_ERRORS', payload: validation.errors });
        return false;
      }
      
      return true;
    },
    
    // Submission (placeholder - will be implemented in Sub-Task 11F)
    submitQuote: async () => {
      // TODO: Implement in Sub-Task 11F
      console.log('Quote submission to be implemented in Sub-Task 11F');
    },
    
    // Utilities
    clearAllErrors: () => {
      dispatch({ type: 'CLEAR_ALL_ERRORS' });
    },
    
    resetForm: () => {
      dispatch({ type: 'RESET_FORM' });
    },
  }), [dispatch, state]);

  // ==================== CONTEXT VALUE ====================

  const contextValue: GetQuoteContextValue = useMemo(
    () => ({
      state,
      actions,
    }),
    [state, actions]
  );

  return (
    <GetQuoteContext.Provider value={contextValue}>
      {children}
    </GetQuoteContext.Provider>
  );
}

// ==================== CUSTOM HOOK ====================

/**
 * Hook to access GetQuote context
 * @throws Error if used outside GetQuoteProvider
 */
export function useGetQuoteContext(): GetQuoteContextValue {
  const context = useContext(GetQuoteContext);
  
  if (!context) {
    throw new Error('useGetQuoteContext must be used within GetQuoteProvider');
  }
  
  return context;
}


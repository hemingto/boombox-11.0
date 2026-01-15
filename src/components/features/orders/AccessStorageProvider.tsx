/**
 * @fileoverview Access Storage form provider with React Hook Form integration
 * @source boombox-10.0/src/app/components/access-storage/accessstorageform.tsx (form state management)
 * @refactor Created centralized form provider with React Hook Form and Zod validation
 */

'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useForm, FormProvider, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import {
  AccessStorageFormState,
  AccessStorageStep,
  DeliveryReason,
  AppointmentType,
  DEFAULT_FORM_STATE,
  UseAccessStorageFormReturn,
  UseAccessStorageNavigationReturn,
  UseStorageUnitsReturn,
  UseFormPersistenceReturn,
  UseAppointmentDataReturn,
  AppointmentDetailsResponse
} from '@/types/accessStorage.types';
import { accessStorageFormStateSchema } from '@/lib/validations/accessStorage.validations';
import { useAccessStorageForm } from '@/hooks/useAccessStorageForm';
import { useAccessStorageNavigation } from '@/hooks/useAccessStorageNavigation';
import { useStorageUnits } from '@/hooks/useStorageUnits';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useAppointmentData } from '@/hooks/useAppointmentData';

// ===== CONTEXT INTERFACES =====

interface AccessStorageContextValue {
  // React Hook Form methods
  form: UseFormReturn<AccessStorageFormState>;
  
  // Custom hooks
  formHook: UseAccessStorageFormReturn;
  navigationHook: UseAccessStorageNavigationReturn;
  storageUnitsHook: UseStorageUnitsReturn;
  persistenceHook: UseFormPersistenceReturn;
  appointmentDataHook?: UseAppointmentDataReturn;
  
  // Computed values
  isFormValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  
  // Edit mode properties
  isEditMode: boolean;
  appointmentId?: string;
  
  // Form actions
  resetForm: () => void;
  submitForm: () => Promise<void>;
}

// ===== CONTEXT CREATION =====

const AccessStorageContext = createContext<AccessStorageContextValue | null>(null);

// ===== PROVIDER PROPS =====

interface AccessStorageProviderProps {
  children: React.ReactNode;
  mode?: 'create' | 'edit';
  appointmentId?: string;
  initialZipCode?: string;
  userId?: string;
  onStepChange?: (step: AccessStorageStep) => void;
  onSubmissionSuccess?: (appointmentId: number) => void;
  enablePersistence?: boolean;
}

// ===== PROVIDER COMPONENT =====

export function AccessStorageProvider({
  children,
  mode = 'create',
  appointmentId,
  initialZipCode = '',
  userId,
  onStepChange,
  onSubmissionSuccess,
  enablePersistence = true
}: AccessStorageProviderProps) {
  const searchParams = useSearchParams();

  console.log('🎪 [AccessStorageProvider] Initializing with:', {
    mode,
    appointmentId,
    userId,
    initialZipCode
  });

  // Initialize React Hook Form with Zod validation
  const form = useForm<AccessStorageFormState>({
    resolver: zodResolver(accessStorageFormStateSchema),
    defaultValues: {
      ...DEFAULT_FORM_STATE,
      zipCode: initialZipCode || searchParams?.get('zipCode') || ''
    },
    mode: 'onChange', // Validate on change for real-time feedback
    reValidateMode: 'onChange'
  });

  // Initialize custom hooks
  const formHook = useAccessStorageForm({
    initialZipCode,
    mode,
    appointmentId,
    onStepChange,
    onSubmissionSuccess
  });

  const navigationHook = useAccessStorageNavigation({
    planType: form.watch('planType'),
    onStepChange,
    validateStep: (step) => {
      const formValues = form.getValues();
      
      switch (step) {
        case AccessStorageStep.DELIVERY_PURPOSE:
          // Validate step 1: delivery reason, address, storage units, and plan
          if (!formValues.deliveryReason) {
            formHook.setError('deliveryReasonError', 'Please select a delivery purpose');
            return false;
          }
          if (!formValues.address || formValues.address.trim() === '') {
            formHook.setError('addressError', 'Please enter a delivery address');
            return false;
          }
          if (!formValues.selectedStorageUnits || formValues.selectedStorageUnits.length === 0) {
            formHook.setError('storageUnitError', 'Please select at least one storage unit');
            return false;
          }
          if (!formValues.selectedPlan) {
            formHook.setError('planError', 'Please select a plan');
            return false;
          }
          return true;
          
        case AccessStorageStep.SCHEDULING:
          // Validate step 2: date and time must be selected
          if (!formValues.scheduledDate || !formValues.scheduledTimeSlot) {
            formHook.setError('scheduleError', 'Please select a date and time');
            return false;
          }
          return true;
          
        case AccessStorageStep.LABOR_SELECTION:
          // Validate step 3: labor selection (only for Full Service)
          if (formValues.planType !== 'Do It Yourself Plan' && !formValues.selectedLabor) {
            formHook.setError('laborError', 'Please select a moving partner');
            return false;
          }
          return true;
          
        case AccessStorageStep.CONFIRMATION:
          // Step 4: no additional validation needed
          return true;
          
        default:
          return true;
      }
    }
  });

  const storageUnitsHook = useStorageUnits({
    userId,
    autoFetch: true,
    // In edit mode, exclude the current appointment from pending checks
    // so the unit being edited isn't disabled
    excludeAppointmentId: mode === 'edit' ? appointmentId : undefined
  });

  const persistenceHook = useFormPersistence({
    formState: form.getValues(),
    onFormStateRestore: (restoredState) => {
      // Restore form state from persistence
      Object.entries(restoredState).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.setValue(key as keyof AccessStorageFormState, value, {
            shouldValidate: false,
            shouldDirty: false
          });
        }
      });
    },
    enableLocalStorage: enablePersistence && mode === 'create', // Only persist in create mode
    enableUrlSync: enablePersistence
  });

  // ===== EDIT MODE: APPOINTMENT DATA FETCHING =====
  
  const isEditMode = mode === 'edit';
  const appointmentDataHook = useAppointmentData(isEditMode ? appointmentId : undefined);

  // ===== FORM SYNCHRONIZATION =====
  
  // Track if we're syncing to prevent loops
  const isSyncingRef = useRef(false);
  
  // Store refs for functions to avoid stale closures
  const updateFormStateRef = useRef(formHook.updateFormState);
  const saveFormStateRef = useRef(persistenceHook.saveFormState);
  updateFormStateRef.current = formHook.updateFormState;
  saveFormStateRef.current = persistenceHook.saveFormState;

  // Sync React Hook Form with custom form hook (one-way: RHF -> custom hook)
  // Note: We don't sync in the other direction to avoid infinite loops
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (isSyncingRef.current) return;
      
      isSyncingRef.current = true;
      try {
        // Update custom hook state when React Hook Form changes
        updateFormStateRef.current(data as AccessStorageFormState);
        
        // Sync with persistence
        if (enablePersistence) {
          saveFormStateRef.current(data as Partial<AccessStorageFormState>);
        }
      } finally {
        isSyncingRef.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [form, enablePersistence]);

  // Note: Removed bidirectional sync (formHook -> RHF) to prevent infinite loops
  // React Hook Form is the source of truth, custom hook syncs from it

  // ===== EDIT MODE: FORM PRE-POPULATION =====
  
  // Track if form has been populated to prevent infinite loops
  const hasPopulatedFormRef = useRef(false);

  // Pre-populate form when appointment data is loaded in edit mode
  useEffect(() => {
    // Only populate once when appointment data is loaded
    if (
      isEditMode && 
      appointmentDataHook?.appointmentData && 
      !appointmentDataHook.isLoading &&
      !hasPopulatedFormRef.current
    ) {
      hasPopulatedFormRef.current = true;
      const appointment = appointmentDataHook.appointmentData;
      
      // Helper function to safely parse date and create time slot
      const parseAppointmentDateTime = (dateString: string | Date | null): { date: Date | null; timeSlot: string | null } => {
        if (!dateString) return { date: null, timeSlot: null };
        
        const appointmentDate = new Date(dateString);
        if (isNaN(appointmentDate.getTime())) return { date: null, timeSlot: null };
        
        const hour = appointmentDate.getHours();
        const nextHour = (hour + 1) % 24;
        
        const format12Hour = (h: number) => {
          const twelveHour = h % 12 || 12;
          const period = h >= 12 ? 'pm' : 'am';
          return `${twelveHour}${period}`;
        };
        
        const timeSlot = `${format12Hour(hour)}-${format12Hour(nextHour)}`;
        
        return { date: appointmentDate, timeSlot };
      };

      // Parse date and time
      const { date: scheduledDate, timeSlot: scheduledTimeSlot } = parseAppointmentDateTime(appointment.date);
      
      // Extract city name from address
      const cityName = appointment.address ? appointment.address.split(',')[1]?.trim() || '' : '';
      
      // Map storage unit IDs to strings
      const storageUnitIds = appointment.requestedStorageUnits?.map((unit) => unit.storageUnitId.toString()) || [];
      
      // Determine plan type and related fields
      let selectedPlan = '';
      let selectedPlanName = '';
      let loadingHelpPrice = '---';
      let loadingHelpDescription = '';
      let planType = appointment.planType || '';
      let selectedLabor = null;
      let movingPartnerId = appointment.movingPartner?.id || null;
      let thirdPartyMovingPartnerId = appointment.thirdPartyMovingPartner?.id || null;
      let parsedLoadingHelpPrice = appointment.loadingHelpPrice || 0;

      if (appointment.planType === 'Full Service Plan') {
        selectedPlan = 'option2';
        selectedPlanName = appointment.movingPartner?.name || 'Full Service Plan';
        loadingHelpPrice = appointment.movingPartner?.hourlyRate ? `$${appointment.movingPartner.hourlyRate}/hr` : '$189/hr';
        loadingHelpDescription = appointment.movingPartner?.id ? 'Full Service Plan' : 'estimate';
        
        if (appointment.movingPartner?.id) {
          selectedLabor = {
            id: appointment.movingPartner.id.toString(),
            price: appointment.movingPartner.hourlyRate ? `$${appointment.movingPartner.hourlyRate}/hr` : '$189/hr',
            title: appointment.movingPartner.name || 'Full Service Plan',
            onfleetTeamId: appointment.movingPartner.onfleetTeamId
          };
        }
      } else if (appointment.planType === 'Do It Yourself Plan') {
        selectedPlan = 'option1';
        selectedPlanName = 'Do It Yourself Plan';
        loadingHelpPrice = '$0';
        loadingHelpDescription = 'Free!';
        selectedLabor = { id: 'option1', price: '$0/hr', title: 'Do It Yourself Plan' };
      } else if (appointment.planType === 'Third Party Loading Help') {
        selectedPlan = 'option2';
        selectedPlanName = appointment.thirdPartyMovingPartner?.name || 'Third Party Loading Help';
        loadingHelpPrice = '$192/hr';
        loadingHelpDescription = 'Third-party estimate';
        
        if (appointment.thirdPartyMovingPartner?.id) {
          selectedLabor = {
            id: `thirdParty-${appointment.thirdPartyMovingPartner.id}`,
            price: '$192/hr',
            title: appointment.thirdPartyMovingPartner.name || 'Third Party Loading Help'
          };
        }
      }

      // Get Stripe customer ID
      const stripeCustomerId = appointment.user?.stripeCustomerId || appointment.additionalInfo?.stripeCustomerId || null;

      // Pre-populate form with appointment data
      const formUpdates: Partial<AccessStorageFormState> = {
        // Basic appointment info
        address: appointment.address || '',
        zipCode: appointment.zipcode || '',
        cityName,
        description: appointment.description || '',
        deliveryReason: appointment.deliveryReason as DeliveryReason || null,
        
        // Date and time
        scheduledDate,
        scheduledTimeSlot,
        
        // Storage units
        selectedStorageUnits: storageUnitIds,
        
        // Plan and labor
        selectedPlan,
        selectedPlanName,
        planType,
        loadingHelpPrice,
        loadingHelpDescription,
        selectedLabor,
        
        // Partner IDs
        movingPartnerId,
        thirdPartyMovingPartnerId,
        
        // Pricing
        parsedLoadingHelpPrice,
        monthlyStorageRate: appointment.monthlyStorageRate || 0,
        monthlyInsuranceRate: appointment.monthlyInsuranceRate || 0,
        calculatedTotal: appointment.quotedPrice || 0,
        
        // Additional data
        appointmentType: (appointment.appointmentType as AppointmentType) || AppointmentType.STORAGE_UNIT_ACCESS,
        
        // Edit mode specific fields
        stripeCustomerId
      };

      // Apply updates to form (using isSyncingRef to prevent the watch callback from triggering)
      isSyncingRef.current = true;
      try {
        Object.entries(formUpdates).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            form.setValue(key as keyof AccessStorageFormState, value, {
              shouldValidate: false,
              shouldDirty: false
            });
          }
        });

        // Update custom hook state using ref
        updateFormStateRef.current(formUpdates as AccessStorageFormState);
      } finally {
        isSyncingRef.current = false;
      }
      
      console.log('Form pre-populated with appointment data:', formUpdates);
    }
  }, [isEditMode, appointmentDataHook?.appointmentData, appointmentDataHook?.isLoading, form]);

  // ===== STORAGE UNITS INTEGRATION =====

  // Auto-select all units when delivery reason is "End storage term"
  useEffect(() => {
    const deliveryReason = form.watch('deliveryReason');
    const currentSelectedUnits = form.watch('selectedStorageUnits');
    
    if (deliveryReason === DeliveryReason.END_STORAGE_TERM && storageUnitsHook.hasStorageUnits) {
      const allUnitIds = storageUnitsHook.getAllStorageUnitIds();
      
      // Only update if the selection is different
      if (JSON.stringify(currentSelectedUnits) !== JSON.stringify(allUnitIds)) {
        form.setValue('selectedStorageUnits', allUnitIds, {
          shouldValidate: true,
          shouldDirty: true
        });
      }
    }
  }, [form.watch('deliveryReason'), storageUnitsHook.storageUnits, form]);

  // ===== NAVIGATION INTEGRATION =====

  // Sync navigation step with form state
  useEffect(() => {
    const currentStep = form.watch('currentStep');
    if (currentStep !== navigationHook.currentStep) {
      form.setValue('currentStep', navigationHook.currentStep, {
        shouldValidate: false,
        shouldDirty: false
      });
    }
  }, [navigationHook.currentStep, form]);

  // ===== COMPUTED VALUES =====

  const contextValue = useMemo<AccessStorageContextValue>(() => {
    const { isValid, isDirty, isSubmitting } = form.formState;

    return {
      // React Hook Form methods
      form,
      
      // Custom hooks
      formHook,
      navigationHook,
      storageUnitsHook,
      persistenceHook,
      appointmentDataHook: isEditMode ? appointmentDataHook : undefined,
      
      // Computed values
      isFormValid: isValid,
      isDirty,
      isSubmitting: isSubmitting || formHook.flags.isSubmitting || (appointmentDataHook?.isLoading ?? false),
      
      // Edit mode properties
      isEditMode,
      appointmentId,
      
      // Form actions
      resetForm: () => {
        form.reset(DEFAULT_FORM_STATE);
        formHook.resetForm();
        if (enablePersistence) {
          persistenceHook.clearPersistedState();
        }
      },
      
      submitForm: async () => {
        console.log('🏁 [AccessStorageProvider.submitForm] Starting...');
        console.log('🏁 [AccessStorageProvider.submitForm] Form state:', form.getValues());
        
        // Validate form before submission
        console.log('🔍 [AccessStorageProvider.submitForm] Triggering form validation...');
        const isValid = await form.trigger();
        console.log('🔍 [AccessStorageProvider.submitForm] Form isValid:', isValid);
        console.log('🔍 [AccessStorageProvider.submitForm] Form errors:', form.formState.errors);
        
        if (!isValid) {
          console.error('❌ [AccessStorageProvider.submitForm] Form validation failed, cannot submit');
          console.error('❌ [AccessStorageProvider.submitForm] Errors:', form.formState.errors);
          
          // Set user-friendly errors on the form hook so they're displayed
          const { errors } = form.formState;
          if (errors.deliveryReason) {
            formHook.setError('deliveryReasonError', errors.deliveryReason.message || 'Please select a delivery reason');
          }
          if (errors.address) {
            formHook.setError('addressError', errors.address.message || 'Please enter a valid address');
          }
          if (errors.selectedStorageUnits) {
            formHook.setError('storageUnitError', errors.selectedStorageUnits.message || 'Please select at least one storage unit');
          }
          if (errors.selectedPlan) {
            formHook.setError('planError', errors.selectedPlan.message || 'Please select a plan');
          }
          if (errors.scheduledDate || errors.scheduledTimeSlot) {
            formHook.setError('scheduleError', 'Please select a date and time');
          }
          if (errors.selectedLabor) {
            formHook.setError('laborError', errors.selectedLabor.message || 'Please select loading help');
          }
          
          // Set a general submit error so user knows something went wrong
          formHook.setError('submitError', 'Please fill in all required fields before submitting');
          
          return;
        }
        
        console.log('✅ [AccessStorageProvider.submitForm] Form validation passed. Calling formHook.submitForm...');
        // Submit using the custom hook (will handle edit vs create mode internally)
        await formHook.submitForm();
        console.log('✅ [AccessStorageProvider.submitForm] Submission complete');
      }
    };
  }, [
    form,
    formHook,
    navigationHook,
    storageUnitsHook,
    persistenceHook,
    appointmentDataHook,
    isEditMode,
    appointmentId,
    enablePersistence
  ]);

  // ===== ERROR SYNCHRONIZATION =====

  // Store ref for setError to avoid stale closures
  const setErrorRef = useRef(formHook.setError);
  const formHookErrorsRef = useRef(formHook.errors);
  setErrorRef.current = formHook.setError;
  formHookErrorsRef.current = formHook.errors;

  // Sync React Hook Form errors with custom hook errors
  useEffect(() => {
    const { errors } = form.formState;
    
    // Map React Hook Form errors to custom hook error format
    const errorMappings: Record<string, 'deliveryReasonError' | 'addressError' | 'planError' | 'storageUnitError' | 'laborError' | 'scheduleError'> = {
      'deliveryReason': 'deliveryReasonError',
      'address': 'addressError',
      'selectedPlan': 'planError',
      'selectedStorageUnits': 'storageUnitError',
      'selectedLabor': 'laborError',
      'scheduledDate': 'scheduleError',
      'scheduledTimeSlot': 'scheduleError'
    };

    Object.entries(errorMappings).forEach(([formField, errorField]) => {
      const error = errors[formField as keyof AccessStorageFormState];
      const errorMessage = error?.message || null;
      
      if (formHookErrorsRef.current[errorField] !== errorMessage) {
        setErrorRef.current(errorField, errorMessage);
      }
    });
  }, [form.formState.errors]);

  return (
    <AccessStorageContext.Provider value={contextValue}>
      <FormProvider {...form}>
        {children}
      </FormProvider>
    </AccessStorageContext.Provider>
  );
}

// ===== CUSTOM HOOK FOR CONTEXT =====

/**
 * Custom hook to access the Access Storage form context
 * @returns Access Storage context value
 * @throws Error if used outside of AccessStorageProvider
 */
export function useAccessStorageContext(): AccessStorageContextValue {
  const context = useContext(AccessStorageContext);
  
  if (!context) {
    throw new Error(
      'useAccessStorageContext must be used within an AccessStorageProvider. ' +
      'Make sure to wrap your component with <AccessStorageProvider>.'
    );
  }
  
  return context;
}

// ===== CONVENIENCE HOOKS =====

/**
 * Hook to access React Hook Form methods
 */
export function useAccessStorageForm_RHF(): UseFormReturn<AccessStorageFormState> {
  const { form } = useAccessStorageContext();
  return form;
}

/**
 * Hook to access form state and actions
 */
export function useAccessStorageFormState() {
  const { formHook, isFormValid, isDirty, isSubmitting } = useAccessStorageContext();
  
  return {
    formState: formHook.formState,
    errors: formHook.errors,
    flags: formHook.flags,
    isFormValid,
    isDirty,
    isSubmitting,
    
    // Actions
    updateFormState: formHook.updateFormState,
    setError: formHook.setError,
    clearError: formHook.clearError,
    clearAllErrors: formHook.clearAllErrors,
    togglePlanDetails: formHook.togglePlanDetails,
  };
}

/**
 * Hook to access navigation state and actions
 */
export function useAccessStorageNavigation_Context() {
  const { navigationHook } = useAccessStorageContext();
  return navigationHook;
}

/**
 * Hook to access storage units data
 */
export function useAccessStorageUnits() {
  const { storageUnitsHook } = useAccessStorageContext();
  return storageUnitsHook;
}

/**
 * Hook to access form persistence
 */
export function useAccessStoragePersistence() {
  const { persistenceHook } = useAccessStorageContext();
  return persistenceHook;
}

/**
 * Hook to access form submission
 */
export function useAccessStorageSubmission() {
  const { submitForm, resetForm, isSubmitting } = useAccessStorageContext();
  
  return {
    submitForm,
    resetForm,
    isSubmitting,
  };
}

// ===== FIELD-SPECIFIC HOOKS =====

/**
 * Hook for delivery reason field
 */
export function useDeliveryReasonField() {
  const form = useAccessStorageForm_RHF();
  const { formHook } = useAccessStorageContext();
  
  return {
    value: form.watch('deliveryReason'),
    error: formHook.errors.deliveryReasonError,
    onChange: (value: DeliveryReason | null) => {
      form.setValue('deliveryReason', value, { shouldValidate: true });
      formHook.handleDeliveryReasonChange(value);
    },
    clearError: () => formHook.clearError('deliveryReasonError')
  };
}

/**
 * Hook for address field
 */
export function useAddressField() {
  const form = useAccessStorageForm_RHF();
  const { formHook } = useAccessStorageContext();
  
  return {
    value: form.watch('address'),
    zipCode: form.watch('zipCode'),
    coordinates: form.watch('coordinates'),
    cityName: form.watch('cityName'),
    error: formHook.errors.addressError,
    onChange: (
      newAddress: string,
      newZipCode: string,
      newCoordinates: google.maps.LatLngLiteral,
      newCityName: string
    ) => {
      // Update React Hook Form (source of truth for display)
      form.setValue('address', newAddress, { shouldValidate: true });
      form.setValue('zipCode', newZipCode, { shouldValidate: true });
      form.setValue('coordinates', newCoordinates, { shouldValidate: false });
      form.setValue('cityName', newCityName, { shouldValidate: false });
      
      // Also update custom hook state
      formHook.handleAddressChange(newAddress, newZipCode, newCoordinates, newCityName);
    },
    clearError: () => formHook.clearError('addressError')
  };
}

/**
 * Hook for storage unit selection field
 */
export function useStorageUnitSelectionField() {
  const form = useAccessStorageForm_RHF();
  const { formHook } = useAccessStorageContext();
  
  return {
    selectedIds: form.watch('selectedStorageUnits'),
    error: formHook.errors.storageUnitError,
    onChange: (selectedIds: string[]) => {
      form.setValue('selectedStorageUnits', selectedIds, { shouldValidate: true });
      formHook.handleStorageUnitSelection(selectedIds);
    },
    clearError: () => formHook.clearError('storageUnitError')
  };
}

/**
 * Hook for plan selection field
 */
export function usePlanSelectionField() {
  const form = useAccessStorageForm_RHF();
  const { formHook } = useAccessStorageContext();
  
  return {
    selectedPlan: form.watch('selectedPlan'),
    selectedPlanName: form.watch('selectedPlanName'),
    planType: form.watch('planType'),
    error: formHook.errors.planError,
    onChange: (id: string, planNameFromRadio: string, descriptionFromRadio: string) => {
      // Update React Hook Form (source of truth for display)
      form.setValue('selectedPlan', id, { shouldValidate: true });
      
      // Set plan-specific values based on selection
      if (planNameFromRadio === 'Do It Yourself Plan') {
        form.setValue('planType', 'Do It Yourself Plan', { shouldValidate: true });
        form.setValue('selectedPlanName', 'Do It Yourself Plan', { shouldValidate: false });
        form.setValue('loadingHelpPrice', '$0', { shouldValidate: false });
        form.setValue('loadingHelpDescription', 'No loading help', { shouldValidate: false });
        form.setValue('parsedLoadingHelpPrice', 0, { shouldValidate: false });
        form.setValue('selectedLabor', {
          id: 'Do It Yourself Plan',
          price: '$0',
          title: 'Do It Yourself Plan'
        }, { shouldValidate: false });
        form.setValue('movingPartnerId', null, { shouldValidate: false });
        form.setValue('thirdPartyMovingPartnerId', null, { shouldValidate: false });
      } else if (planNameFromRadio === 'Full Service Plan') {
        form.setValue('planType', 'Full Service Plan', { shouldValidate: true });
        form.setValue('selectedPlanName', 'Full Service Plan', { shouldValidate: false });
        form.setValue('loadingHelpPrice', '$189/hr', { shouldValidate: false });
        form.setValue('loadingHelpDescription', 'estimate', { shouldValidate: false });
        form.setValue('selectedLabor', null, { shouldValidate: false });
        form.setValue('movingPartnerId', null, { shouldValidate: false });
        form.setValue('thirdPartyMovingPartnerId', null, { shouldValidate: false });
      }
      
      // Also update custom hook state
      formHook.handleInitialPlanChoice(id, planNameFromRadio, descriptionFromRadio);
    },
    clearError: () => formHook.clearError('planError')
  };
}

/**
 * Hook to access appointment data in edit mode
 */
export function useAccessStorageAppointmentData() {
  const { appointmentDataHook, isEditMode, appointmentId } = useAccessStorageContext();
  
  if (!isEditMode) {
    return {
      appointmentData: null,
      isLoading: false,
      error: null,
      errorType: null,
      retryCount: 0,
      refetch: async () => {},
      retry: async () => {},
      clearError: () => {},
      hasAppointmentData: false,
      canRetry: false,
      isEditMode: false,
      appointmentId: undefined
    };
  }
  
  return {
    appointmentData: appointmentDataHook?.appointmentData || null,
    isLoading: appointmentDataHook?.isLoading || false,
    error: appointmentDataHook?.error || null,
    errorType: appointmentDataHook?.errorType || null,
    retryCount: appointmentDataHook?.retryCount || 0,
    refetch: appointmentDataHook?.refetch || (async () => {}),
    retry: appointmentDataHook?.retry || (async () => {}),
    clearError: () => {}, // Not available in UseAppointmentDataReturn, provide empty function
    hasAppointmentData: !!appointmentDataHook?.appointmentData,
    canRetry: appointmentDataHook?.canRetry || false,
    isEditMode: true,
    appointmentId,
    appointmentId
  };
}

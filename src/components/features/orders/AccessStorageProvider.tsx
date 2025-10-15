/**
 * @fileoverview Access Storage form provider with React Hook Form integration
 * @source boombox-10.0/src/app/components/access-storage/accessstorageform.tsx (form state management)
 * @refactor Created centralized form provider with React Hook Form and Zod validation
 */

'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
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
  onStepChange,
  onSubmissionSuccess,
  enablePersistence = true
}: AccessStorageProviderProps) {
  const searchParams = useSearchParams();

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
      // Use React Hook Form validation synchronously
      return form.formState.isValid;
    }
  });

  const storageUnitsHook = useStorageUnits({
    autoFetch: true
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

  // Sync React Hook Form with custom form hook
  useEffect(() => {
    const subscription = form.watch((data) => {
      // Update custom hook state when React Hook Form changes
      formHook.updateFormState(data as AccessStorageFormState);
      
      // Sync with persistence
      if (enablePersistence) {
        persistenceHook.saveFormState(data as Partial<AccessStorageFormState>);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, formHook, persistenceHook, enablePersistence]);

  // Sync custom hook changes back to React Hook Form
  useEffect(() => {
    const formState = formHook.formState;
    const currentValues = form.getValues();
    
    // Check if there are differences and update React Hook Form
    const hasChanges = Object.keys(formState).some(key => {
      const formKey = key as keyof AccessStorageFormState;
      return formState[formKey] !== currentValues[formKey];
    });

    if (hasChanges) {
      Object.entries(formState).forEach(([key, value]) => {
        const formKey = key as keyof AccessStorageFormState;
        if (value !== currentValues[formKey]) {
          form.setValue(formKey, value, {
            shouldValidate: false,
            shouldDirty: true
          });
        }
      });
    }
  }, [formHook.formState, form]);

  // ===== EDIT MODE: FORM PRE-POPULATION =====

  // Pre-populate form when appointment data is loaded in edit mode
  useEffect(() => {
    if (isEditMode && appointmentDataHook?.appointmentData && !appointmentDataHook.isLoading) {
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
        appointmentType: (appointment.appointmentType as AppointmentType) || AppointmentType.STORAGE_UNIT_ACCESS
      };

      // Apply updates to form
      Object.entries(formUpdates).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.setValue(key as keyof AccessStorageFormState, value, {
            shouldValidate: false,
            shouldDirty: false
          });
        }
      });

      // Update custom hook state
      formHook.updateFormState(formUpdates as AccessStorageFormState);
      
      console.log('Form pre-populated with appointment data:', formUpdates);
    }
  }, [isEditMode, appointmentDataHook?.appointmentData, appointmentDataHook?.isLoading, form, formHook]);

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
        // Validate form before submission
        const isValid = await form.trigger();
        
        if (!isValid) {
          console.warn('Form validation failed, cannot submit');
          return;
        }
        
        // Submit using the custom hook (will handle edit vs create mode internally)
        await formHook.submitForm();
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

  // Sync React Hook Form errors with custom hook errors
  useEffect(() => {
    const { errors } = form.formState;
    
    // Map React Hook Form errors to custom hook error format
    const errorMappings: Record<string, keyof typeof formHook.errors> = {
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
      
      if (formHook.errors[errorField] !== errorMessage) {
        formHook.setError(errorField, errorMessage);
      }
    });
  }, [form.formState.errors, formHook]);

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
    onChange: formHook.handleAddressChange,
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
    onChange: formHook.handleInitialPlanChoice,
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
      isEditMode: false
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
    appointmentId
  };
}

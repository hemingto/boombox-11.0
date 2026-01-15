/**
 * @fileoverview Add Storage form provider with React Hook Form integration
 * @source boombox-10.0/src/app/components/add-storage/userpageaddstorageform.tsx (form state management)
 * @refactor Created centralized form provider with React Hook Form and Zod validation following AccessStorageProvider patterns
 */

'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useForm, FormProvider, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AddStorageFormState,
  AddStorageStep,
  PlanType,
  DEFAULT_ADD_STORAGE_FORM_STATE,
  UseAddStorageFormReturn,
  UseAddStorageNavigationReturn,
  UseAddStorageSubmissionReturn,
  UseFormPersistenceReturn,
} from '@/types/addStorage.types';
import { addStorageFormSchema } from '@/lib/validations/addStorage.validations';
import { useAddStorageForm } from '@/hooks/useAddStorageForm';
import { useAddStorageNavigation } from '@/hooks/useAddStorageNavigation';
import { useAddStorageSubmission } from '@/hooks/useAddStorageSubmission';
import { useAddStorageFormPersistence } from '@/hooks/useAddStorageFormPersistence';
import { useAppointmentData } from '@/hooks/useAppointmentData';
import { UseAppointmentDataReturn } from '@/types/accessStorage.types';
import { insuranceOptions } from '@/data/insuranceOptions';

// ===== CONTEXT INTERFACES =====

interface AddStorageContextValue {
  // React Hook Form methods
  form: UseFormReturn<any>;
  
  // Custom hooks
  formHook: UseAddStorageFormReturn;
  navigationHook: UseAddStorageNavigationReturn;
  submissionHook: UseAddStorageSubmissionReturn;
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
  
  // User context
  userId: string | undefined;
}

// ===== CONTEXT CREATION =====

const AddStorageContext = createContext<AddStorageContextValue | null>(null);

// ===== PROVIDER PROPS =====

interface AddStorageProviderProps {
  children: React.ReactNode;
  mode?: 'create' | 'edit';
  appointmentId?: string;
  initialStorageUnitCount?: number;
  initialZipCode?: string;
  onSubmissionSuccess?: (appointmentId: number) => void;
  onStepChange?: (step: AddStorageStep) => void;
}

// ===== PROVIDER COMPONENT =====

export function AddStorageProvider({
  children,
  mode = 'create',
  appointmentId,
  initialStorageUnitCount = 1,
  initialZipCode = '',
  onSubmissionSuccess,
  onStepChange,
}: AddStorageProviderProps) {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  
  const isEditMode = mode === 'edit';
  
  // Fetch appointment data if in edit mode
  const appointmentDataHook = useAppointmentData(isEditMode ? appointmentId : undefined);

  // Initialize form with React Hook Form
  const form = useForm({
    resolver: zodResolver(addStorageFormSchema),
    defaultValues: {
      ...DEFAULT_ADD_STORAGE_FORM_STATE,
      addressInfo: {
        ...DEFAULT_ADD_STORAGE_FORM_STATE.addressInfo,
        zipCode: initialZipCode,
      },
      storageUnit: {
        count: initialStorageUnitCount,
        text: getStorageUnitText(initialStorageUnitCount),
      },
    },
    mode: 'onChange', // Validate on change for better UX
  });

  // Initialize custom hooks
  const formHook = useAddStorageForm({
    initialStorageUnitCount,
    initialZipCode,
    onStepChange,
    onSubmissionSuccess,
  });

  const navigationHook = useAddStorageNavigation({
    planType: formHook.formState.planType,
    onStepChange,
    validateStep: (step) => formHook.validateStep(step).isValid,
  });

  const submissionHook = useAddStorageSubmission(
    mode,
    appointmentId,
    appointmentDataHook.appointmentData ? parseInt(String(appointmentDataHook.appointmentData.numberOfUnits), 10) : undefined
  );

  const persistenceHook = useAddStorageFormPersistence({
    formState: formHook.formState,
    onFormStateRestore: (restoredState) => {
      formHook.updateFormState(restoredState);
    },
    enableLocalStorage: false, // Disabled: start fresh every time
    enableUrlSync: false, // Disabled: start fresh every time
  });
  
  // ===== EDIT MODE: POPULATE FORM FROM APPOINTMENT DATA =====
  
  // Track if form has been populated to prevent infinite loops
  const hasPopulatedFormRef = useRef(false);
  
  // Store updateFormState in a ref to avoid dependency issues
  const updateFormStateRef = useRef(formHook.updateFormState);
  updateFormStateRef.current = formHook.updateFormState;
  
  useEffect(() => {
    // Only populate once when appointment data is loaded
    if (
      isEditMode && 
      appointmentDataHook.appointmentData && 
      !appointmentDataHook.isLoading &&
      !hasPopulatedFormRef.current
    ) {
      hasPopulatedFormRef.current = true;
      const appointment = appointmentDataHook.appointmentData;
      
      // Transform appointment data to form state
      const numberOfUnits = parseInt(String(appointment.numberOfUnits), 10) || 1;
      const validatedNumberOfUnits = isNaN(numberOfUnits) || numberOfUnits < 1 ? 1 : numberOfUnits;
      
      // Determine plan type
      let determinedPlanType = 'Do It Yourself Plan';
      let selectedPlanId = 'option1';
      
      if (appointment.planType === 'Full Service Plan' || appointment.planType === 'Third Party Loading Help') {
        determinedPlanType = appointment.planType;
        selectedPlanId = 'option2';
      } else if (appointment.planType === 'Do It Yourself Plan') {
        determinedPlanType = 'Do It Yourself Plan';
        selectedPlanId = 'option1';
      }
      
      // Map insurance coverage from API to insurance option object
      // The API returns the label (e.g., "Standard Insurance Coverage") 
      // We need to find the matching option from insuranceOptions
      const mappedInsuranceOption = appointment.insuranceCoverage 
        ? insuranceOptions.find(opt => 
            opt.label === appointment.insuranceCoverage || 
            opt.value === appointment.insuranceCoverage?.toLowerCase().replace(/ /g, '-')
          ) || null
        : null;
      
      // Update form hook state using ref to avoid stale closure
      updateFormStateRef.current({
        addressInfo: {
          address: appointment.address || '',
          zipCode: appointment.zipcode || '',
          coordinates: null,
          cityName: appointment.address?.split(',')[1]?.trim() || '',
        },
        storageUnit: {
          count: validatedNumberOfUnits,
          text: getStorageUnitText(validatedNumberOfUnits),
        },
        selectedPlan: selectedPlanId,
        selectedPlanName: appointment.planType || 'Do It Yourself Plan',
        planType: determinedPlanType as PlanType,
        selectedInsurance: mappedInsuranceOption,
        description: appointment.description || '',
        pricing: {
          monthlyStorageRate: appointment.monthlyStorageRate || 0,
          monthlyInsuranceRate: appointment.monthlyInsuranceRate || 0,
          parsedLoadingHelpPrice: appointment.loadingHelpPrice || 0,
          loadingHelpPrice: appointment.loadingHelpPrice ? `$${appointment.loadingHelpPrice}/hr` : '$0',
          loadingHelpDescription: determinedPlanType === 'Full Service Plan' ? 'Full Service Plan' : 
                                  determinedPlanType === 'Third Party Loading Help' ? 'Third-party estimate' : 'Free!',
          calculatedTotal: 0,
        },
        movingPartnerId: appointment.movingPartner?.id || null,
        thirdPartyMovingPartnerId: appointment.thirdPartyMovingPartner?.id || null,
        scheduling: {
          scheduledDate: appointment.date ? new Date(appointment.date) : null,
          scheduledTimeSlot: appointment.date ? (() => {
            const appointmentDate = new Date(appointment.date);
            const hour = appointmentDate.getHours();
            const nextHour = (hour + 1) % 24;
            const format12Hour = (h: number) => {
              const hour12 = h % 12 || 12;
              const period = h >= 12 ? 'pm' : 'am';
              return `${hour12}${period}`;
            };
            return `${format12Hour(hour)}-${format12Hour(nextHour)}`;
          })() : null,
        },
        selectedLabor: appointment.planType === 'Full Service Plan' && appointment.movingPartner ? {
          id: appointment.movingPartner.id.toString(),
          price: `$${appointment.movingPartner.hourlyRate || '189'}/hr`,
          title: appointment.movingPartner.name || 'Full Service Plan',
          onfleetTeamId: appointment.movingPartner.onfleetTeamId,
        } : appointment.planType === 'Third Party Loading Help' && appointment.thirdPartyMovingPartner ? {
          id: `thirdParty-${appointment.thirdPartyMovingPartner.id}`,
          price: '$192',
          title: appointment.thirdPartyMovingPartner.name || 'Third Party Loading Help',
        } : appointment.planType === 'Do It Yourself Plan' ? {
          id: 'option1',
          price: '$0',
          title: 'Do It Yourself Plan',
        } : null,
      });
    }
  }, [isEditMode, appointmentDataHook.appointmentData, appointmentDataHook.isLoading]);

  /**
   * Get storage unit text based on count
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

  // Note: We removed the bidirectional sync between React Hook Form and custom hook
  // to prevent infinite loops. The custom hooks manage state directly.

  // Computed values
  const isFormValid = useMemo(() => {
    return form.formState.isValid;
  }, [form.formState.isValid]);

  const isDirty = useMemo(() => {
    return form.formState.isDirty;
  }, [form.formState.isDirty]);

  const isSubmitting = useMemo(() => {
    return submissionHook.submissionState.isSubmitting;
  }, [submissionHook.submissionState.isSubmitting]);

  // Form actions
  const resetForm = () => {
    form.reset();
    formHook.resetForm();
  };

  const submitForm = async () => {
    if (!userId) {
      throw new Error('Your session has expired. Please refresh the page to continue.');
    }

    // Validate form before submission
    const isValid = await form.trigger();
    if (!isValid) {
      throw new Error('Please fix form errors before submitting');
    }

    // Submit using custom hook
    await submissionHook.submitForm(formHook.formState, userId);
  };

  // Context value
  const contextValue: AddStorageContextValue = useMemo(() => ({
    form,
    formHook,
    navigationHook,
    submissionHook,
    persistenceHook,
    appointmentDataHook,
    isFormValid,
    isDirty,
    isSubmitting,
    isEditMode,
    appointmentId,
    resetForm,
    submitForm,
    userId,
  }), [
    form,
    formHook,
    navigationHook,
    submissionHook,
    persistenceHook,
    appointmentDataHook,
    isFormValid,
    isDirty,
    isSubmitting,
    isEditMode,
    appointmentId,
    userId,
  ]);

  return (
    <AddStorageContext.Provider value={contextValue}>
      <FormProvider {...form}>
        {children}
      </FormProvider>
    </AddStorageContext.Provider>
  );
}

// ===== CONTEXT HOOK =====

/**
 * Hook to access Add Storage context
 * Must be used within AddStorageProvider
 */
export function useAddStorageContext(): AddStorageContextValue {
  const context = useContext(AddStorageContext);
  
  if (!context) {
    throw new Error('useAddStorageContext must be used within AddStorageProvider');
  }
  
  return context;
}

// ===== CONVENIENCE HOOKS =====

/**
 * Hook to access form methods
 */
export function useAddStorageFormContext() {
  const { form } = useAddStorageContext();
  return form;
}

/**
 * Hook to access custom form hook
 */
export function useAddStorageFormHook() {
  const { formHook } = useAddStorageContext();
  return formHook;
}

/**
 * Hook to access navigation hook
 */
export function useAddStorageNavigationHook() {
  const { navigationHook } = useAddStorageContext();
  return navigationHook;
}

/**
 * Hook to access submission hook
 */
export function useAddStorageSubmissionHook() {
  const { submissionHook } = useAddStorageContext();
  return submissionHook;
}

/**
 * Hook to access form state
 */
export function useAddStorageFormState() {
  const { formHook } = useAddStorageContext();
  return formHook.formState;
}

/**
 * Hook to access form errors
 */
export function useAddStorageFormErrors() {
  const { formHook } = useAddStorageContext();
  return formHook.errors;
}

/**
 * Hook to check if form can be submitted
 */
export function useAddStorageCanSubmit() {
  const { isFormValid, userId, submissionHook, formHook } = useAddStorageContext();
  
  return useMemo(() => {
    return (
      isFormValid &&
      !!userId &&
      !submissionHook.submissionState.isSubmitting &&
      submissionHook.canSubmit(formHook.formState)
    );
  }, [isFormValid, userId, submissionHook, formHook.formState]);
}

// ===== COMPONENT EXPORTS =====

export default AddStorageProvider;

/**
 * @fileoverview Add Storage form provider with React Hook Form integration
 * @source boombox-10.0/src/app/components/add-storage/userpageaddstorageform.tsx (form state management)
 * @refactor Created centralized form provider with React Hook Form and Zod validation following AccessStorageProvider patterns
 */

'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useForm, FormProvider, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AddStorageFormState,
  AddStorageStep,
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

// ===== CONTEXT INTERFACES =====

interface AddStorageContextValue {
  // React Hook Form methods
  form: UseFormReturn<any>;
  
  // Custom hooks
  formHook: UseAddStorageFormReturn;
  navigationHook: UseAddStorageNavigationReturn;
  submissionHook: UseAddStorageSubmissionReturn;
  persistenceHook: UseFormPersistenceReturn;
  
  // Computed values
  isFormValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  
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
  initialStorageUnitCount?: number;
  initialZipCode?: string;
  onSubmissionSuccess?: (appointmentId: number) => void;
  onStepChange?: (step: AddStorageStep) => void;
}

// ===== PROVIDER COMPONENT =====

export function AddStorageProvider({
  children,
  initialStorageUnitCount = 1,
  initialZipCode = '',
  onSubmissionSuccess,
  onStepChange,
}: AddStorageProviderProps) {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userId = session?.user?.id;

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

  const submissionHook = useAddStorageSubmission();

  const persistenceHook = useAddStorageFormPersistence({
    formState: formHook.formState,
    onFormStateRestore: (restoredState) => {
      formHook.updateFormState(restoredState);
    },
    enableLocalStorage: true,
    enableUrlSync: true,
  });

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

  // Sync React Hook Form with custom form hook
  useEffect(() => {
    const subscription = form.watch((value) => {
      // Update custom hook state when React Hook Form changes
      if (value) {
        formHook.updateFormState(value as AddStorageFormState);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, formHook]);

  // Sync custom form hook with React Hook Form
  useEffect(() => {
    form.reset(formHook.formState);
  }, [
    formHook.formState.currentStep,
    formHook.formState.addressInfo,
    formHook.formState.storageUnit,
    formHook.formState.selectedPlan,
    formHook.formState.selectedInsurance,
    formHook.formState.scheduling,
    form,
  ]);

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
      throw new Error('User not authenticated');
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
    isFormValid,
    isDirty,
    isSubmitting,
    resetForm,
    submitForm,
    userId,
  }), [
    form,
    formHook,
    navigationHook,
    submissionHook,
    persistenceHook,
    isFormValid,
    isDirty,
    isSubmitting,
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

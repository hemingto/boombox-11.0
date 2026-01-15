/**
 * @fileoverview Form submission handling hook for Add Storage form
 * @source boombox-10.0/src/app/components/add-storage/userpageaddstorageform.tsx (submission logic)
 * @refactor Extracted form submission logic into dedicated hook with proper error handling
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AddStorageFormState,
  AddStorageSubmissionState,
  AddStorageSubmissionPayload,
  UseAddStorageSubmissionReturn,
} from '@/types/addStorage.types';
import { validateSubmissionPayload } from '@/lib/validations/addStorage.validations';
import { parseAppointmentTime } from '@/lib/utils';

export function useAddStorageSubmission(
  mode: 'create' | 'edit' = 'create',
  appointmentId?: string,
  originalStorageUnitCount?: number
): UseAddStorageSubmissionReturn {
  const router = useRouter();
  
  const [submissionState, setSubmissionState] = useState<AddStorageSubmissionState>({
    isSubmitting: false,
    submitError: null,
  });
  
  const isEditMode = mode === 'edit';

  /**
   * Clear submission error
   */
  const clearSubmissionError = useCallback(() => {
    setSubmissionState(prev => ({
      ...prev,
      submitError: null,
    }));
  }, []);

  /**
   * Create appointment date time from form state
   */
  const createAppointmentDateTime = useCallback((formState: AddStorageFormState): Date | null => {
    const { scheduledDate, scheduledTimeSlot } = formState.scheduling;
    
    if (!scheduledDate || !scheduledTimeSlot) {
      return null;
    }

    return parseAppointmentTime(scheduledDate, scheduledTimeSlot);
  }, []);

  /**
   * Build submission payload from form state
   */
  const buildSubmissionPayload = useCallback((
    formState: AddStorageFormState, 
    userId: string
  ): AddStorageSubmissionPayload | null => {
    const appointmentDateTime = createAppointmentDateTime(formState);
    
    if (!appointmentDateTime) {
      return null;
    }

    const payload: AddStorageSubmissionPayload = {
      userId,
      address: formState.addressInfo.address,
      zipCode: formState.addressInfo.zipCode,
      storageUnitCount: formState.storageUnit.count,
      selectedInsurance: formState.selectedInsurance,
      appointmentDateTime: appointmentDateTime.toISOString(),
      planType: formState.planType,
      description: formState.description?.trim() || 'No added info',
      parsedLoadingHelpPrice: formState.pricing.parsedLoadingHelpPrice,
      monthlyStorageRate: formState.pricing.monthlyStorageRate,
      monthlyInsuranceRate: formState.pricing.monthlyInsuranceRate,
      calculatedTotal: formState.pricing.calculatedTotal,
      appointmentType: formState.appointmentType,
      movingPartnerId: formState.movingPartnerId,
      thirdPartyMovingPartnerId: formState.thirdPartyMovingPartnerId,
    };
    
    // For edit mode, calculate additional units if storage count increased
    if (isEditMode && originalStorageUnitCount) {
      const additionalUnitsCount = formState.storageUnit.count - originalStorageUnitCount;
      if (additionalUnitsCount > 0) {
        (payload as any).additionalUnitsCount = additionalUnitsCount;
      }
    }

    return payload;
  }, [createAppointmentDateTime, isEditMode, originalStorageUnitCount]);

  /**
   * Submit the form to the API
   */
  const submitForm = useCallback(async (
    formState: AddStorageFormState, 
    userId: string
  ): Promise<void> => {
    try {
      setSubmissionState({
        isSubmitting: true,
        submitError: null,
      });

      // Build and validate payload
      const payload = buildSubmissionPayload(formState, userId);
      
      if (!payload) {
        throw new Error('Invalid date or time selected. Please go back and re-select.');
      }

      // Validate payload with Zod schema
      const validationResult = validateSubmissionPayload(payload);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map(err => err.message).join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }

      // Choose API endpoint and method based on mode
      const apiUrl = isEditMode && appointmentId
        ? `/api/orders/appointments/${appointmentId}/edit`
        : '/api/orders/add-additional-storage';
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      // Add appointmentId to payload for edit mode
      const finalPayload = isEditMode && appointmentId
        ? { ...payload, appointmentId: parseInt(appointmentId, 10) }
        : payload;

      // Submit to API
      const response = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Submission failed:', errorData);
        // API may return error in 'error' or 'message' field, also check for 'details'
        const errorMessage = errorData.error || errorData.message || 
          (errorData.details ? (typeof errorData.details === 'string' ? errorData.details : JSON.stringify(errorData.details)) : null) ||
          `Failed to ${isEditMode ? 'update' : 'schedule'} appointment. Please try again.`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`Appointment ${isEditMode ? 'updated' : 'added'} successfully:`, data);

      // Refresh and redirect to user page
      await router.refresh();
      router.push(`/customer/${userId}`);

      setSubmissionState({
        isSubmitting: false,
        submitError: null,
      });

    } catch (error: any) {
      console.error('Error submitting the form:', error);
      
      setSubmissionState({
        isSubmitting: false,
        submitError: error.message || 'An unexpected error occurred. Please try again.',
      });
      
      // Re-throw error so calling component can handle it if needed
      throw error;
    }
  }, [buildSubmissionPayload, router, isEditMode, appointmentId]);

  /**
   * Validate form before submission
   */
  const validateBeforeSubmission = useCallback((formState: AddStorageFormState): string | null => {
    // Check appointment date time
    const appointmentDateTime = createAppointmentDateTime(formState);
    if (!appointmentDateTime) {
      return 'Invalid date or time selected. Please go back and re-select.';
    }

    // Check required fields
    if (!formState.addressInfo.address) {
      return 'Address is required.';
    }

    if (!formState.selectedPlan) {
      return 'Please select a service plan.';
    }

    if (!formState.selectedInsurance) {
      return 'Please select an insurance option.';
    }

    // Check labor selection for non-DIY plans
    if (formState.planType !== 'Do It Yourself Plan' && !formState.selectedLabor) {
      return 'Please choose a moving help option.';
    }

    return null;
  }, [createAppointmentDateTime]);

  /**
   * Check if form is ready for submission
   */
  const canSubmit = useCallback((formState: AddStorageFormState): boolean => {
    return validateBeforeSubmission(formState) === null;
  }, [validateBeforeSubmission]);

  return {
    submissionState,
    submitForm,
    clearSubmissionError,
    validateBeforeSubmission,
    canSubmit,
  };
}

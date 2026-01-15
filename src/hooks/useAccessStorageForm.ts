/**
 * @fileoverview Main form state management hook for Access Storage form
 * @source boombox-10.0/src/app/components/access-storage/accessstorageform.tsx (25+ useState hooks)
 * @refactor Consolidated all form state management into single custom hook
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import {
  AccessStorageFormState,
  AccessStorageFormErrors,
  AccessStorageFormFlags,
  AccessStorageStep,
  DeliveryReason,
  PlanType,
  AppointmentType,
  SelectedLabor,
  DEFAULT_FORM_STATE,
  DEFAULT_FORM_ERRORS,
  DEFAULT_FORM_FLAGS,
  UseAccessStorageFormReturn,
  AccessStorageSubmissionData
} from '@/types/accessStorage.types';
import {
  stepValidationMap,
  validateAccessStorageSubmission,
  validateStorageUnitSelection,
  validateAppointmentDateTime,
  validateLaborSelection
} from '@/lib/validations/accessStorage.validations';
import { UpdateAppointmentRequestSchema } from '@/lib/validations/api.validations';
import { z } from 'zod';

interface UseAccessStorageFormParams {
  initialZipCode?: string;
  mode?: 'create' | 'edit';
  appointmentId?: string;
  onStepChange?: (step: AccessStorageStep) => void;
  onSubmissionSuccess?: (appointmentId: number) => void;
}

export function useAccessStorageForm(params: UseAccessStorageFormParams = {}): UseAccessStorageFormReturn {
  const { initialZipCode = '', mode = 'create', appointmentId, onStepChange, onSubmissionSuccess } = params;
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Form state
  const [formState, setFormState] = useState<AccessStorageFormState>({
    ...DEFAULT_FORM_STATE,
    zipCode: initialZipCode
  });

  // Error state
  const [errors, setErrors] = useState<AccessStorageFormErrors>(DEFAULT_FORM_ERRORS);

  // Flags state
  const [flags, setFlags] = useState<AccessStorageFormFlags>(DEFAULT_FORM_FLAGS);

  // Content height ref for plan details animation
  const contentRef = useRef<HTMLDivElement>(null);

  // ===== FORM STATE MANAGEMENT =====

  const updateFormState = useCallback((updates: Partial<AccessStorageFormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  const setError = useCallback((field: keyof AccessStorageFormErrors, error: string | null) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearError = useCallback((field: keyof AccessStorageFormErrors) => {
    setErrors(prev => ({ ...prev, [field]: null }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors(DEFAULT_FORM_ERRORS);
  }, []);

  // ===== SPECIALIZED FORM HANDLERS =====

  const handleAddressChange = useCallback((
    newAddress: string,
    newZipCode: string,
    newCoordinates: google.maps.LatLngLiteral,
    newCityName: string
  ) => {
    updateFormState({
      address: newAddress,
      zipCode: newZipCode,
      coordinates: newCoordinates,
      cityName: newCityName
    });
    clearError('addressError');
  }, [updateFormState, clearError]);

  const handleDeliveryReasonChange = useCallback((reason: DeliveryReason | null) => {
    const updates: Partial<AccessStorageFormState> = {
      deliveryReason: reason,
      appointmentType: reason === DeliveryReason.END_STORAGE_TERM 
        ? AppointmentType.END_STORAGE_TERM 
        : AppointmentType.STORAGE_UNIT_ACCESS
    };

    // Auto-select all units if ending storage term
    if (reason === DeliveryReason.END_STORAGE_TERM) {
      // This will be handled by the component when storage units are loaded
      updates.selectedStorageUnits = [];
    } else {
      updates.selectedStorageUnits = [];
    }

    updateFormState(updates);
    clearError('deliveryReasonError');
  }, [updateFormState, clearError]);

  const handleStorageUnitSelection = useCallback((selectedIds: string[]) => {
    updateFormState({ selectedStorageUnits: selectedIds });
    clearError('storageUnitError');
  }, [updateFormState, clearError]);

  const handleInitialPlanChoice = useCallback((
    id: string, 
    planNameFromRadio: string, 
    descriptionFromRadio: string
  ) => {
    const updates: Partial<AccessStorageFormState> = {
      selectedPlan: id
    };

    if (planNameFromRadio === 'Do It Yourself Plan') {
      updates.planType = PlanType.DO_IT_YOURSELF;
      updates.selectedPlanName = 'Do It Yourself Plan';
      updates.loadingHelpPrice = '$0';
      updates.loadingHelpDescription = 'No loading help';
      updates.parsedLoadingHelpPrice = 0;
      updates.selectedLabor = {
        id: 'Do It Yourself Plan',
        price: '$0',
        title: 'Do It Yourself Plan'
      };
      updates.movingPartnerId = null;
      updates.thirdPartyMovingPartnerId = null;
    } else if (planNameFromRadio === 'Full Service Plan') {
      updates.planType = PlanType.FULL_SERVICE;
      updates.selectedPlanName = 'Full Service Plan';
      updates.loadingHelpPrice = '$189/hr';
      updates.loadingHelpDescription = 'estimate';
      updates.selectedLabor = null;
      updates.movingPartnerId = null;
      updates.thirdPartyMovingPartnerId = null;
    }

    updateFormState(updates);
    clearError('planError');
  }, [updateFormState, clearError]);

  const parseLoadingHelpPrice = useCallback((price: string): number => {
    if (price !== '---') {
      const priceMatch = price.match(/\$(\d+)/);
      if (priceMatch) {
        return parseInt(priceMatch[1], 10);
      }
    }
    return 0;
  }, []);

  const handleLaborChange = useCallback((
    id: string, 
    price: string, 
    title: string, 
    onfleetTeamId?: string
  ) => {
    const formattedPrice = `$${price}/hr`;
    const parsedPrice = parseLoadingHelpPrice(formattedPrice);
    
    const updates: Partial<AccessStorageFormState> = {
      selectedLabor: { id, price: formattedPrice, title, onfleetTeamId },
      parsedLoadingHelpPrice: parsedPrice,
      loadingHelpPrice: formattedPrice,
      selectedPlanName: title,
      loadingHelpDescription: id === 'Do It Yourself Plan' ? 'No loading help' :
                            id.startsWith('thirdParty-') ? 'Third-party estimate' : 
                            'Full Service estimate',
      planType: id === 'Do It Yourself Plan' ? PlanType.DO_IT_YOURSELF :
                id.startsWith('thirdParty-') ? PlanType.THIRD_PARTY :
                PlanType.FULL_SERVICE,
      selectedPlan: id === 'Do It Yourself Plan' ? 'option1' : 'option2',
      movingPartnerId: id === 'Do It Yourself Plan' ? null :
                      id.startsWith('thirdParty-') ? null :
                      parseInt(id, 10),
      thirdPartyMovingPartnerId: id.startsWith('thirdParty-') ? 
        parseInt(id.replace('thirdParty-', ''), 10) : null
    };

    updateFormState(updates);
    clearError('laborError');
  }, [updateFormState, clearError, parseLoadingHelpPrice]);

  const handleDateTimeSelected = useCallback((date: Date, timeSlot: string) => {
    updateFormState({
      scheduledDate: date,
      scheduledTimeSlot: timeSlot
    });
    clearError('scheduleError');
    
    // Reset labor selection if not DIY plan (moving partners need to be re-selected for new time)
    if (formState.planType !== PlanType.DO_IT_YOURSELF) {
      updateFormState({
        selectedLabor: null,
        movingPartnerId: null,
        thirdPartyMovingPartnerId: null
      });
      clearError('laborError');
      clearError('unavailableLaborError');
    }
  }, [formState.planType, updateFormState, clearError]);

  const handleUnavailableLabor = useCallback((hasError: boolean, message?: string) => {
    setError('unavailableLaborError', hasError ? (message || "Mover unavailable. Choose another.") : null);
  }, [setError]);

  // ===== APPOINTMENT DATE/TIME CALCULATION =====

  const getAppointmentDateTime = useCallback((): Date | null => {
    if (!formState.scheduledDate || !formState.scheduledTimeSlot) return null;
    
    const newAppointmentDateTime = new Date(formState.scheduledDate);
    const [timeSlotStart] = formState.scheduledTimeSlot.split('-'); 
    const timeRegex = /(\d{1,2})(?:\:(\d{2}))?(am|pm)/i;
    const timeMatch = timeSlotStart.match(timeRegex);
    
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3].toLowerCase();
      
      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0; 
      
      newAppointmentDateTime.setHours(hours, minutes, 0, 0);
      return newAppointmentDateTime;
    }
    
    console.error("Failed to parse timeSlotStart from:", formState.scheduledTimeSlot);
    return null; 
  }, [formState.scheduledDate, formState.scheduledTimeSlot]);

  const combinedDateTimeForLabor = useMemo(() => {
    return getAppointmentDateTime();
  }, [getAppointmentDateTime]);

  // ===== VALIDATION =====

  const validateStep = useCallback((step: AccessStorageStep): boolean => {
    const validator = stepValidationMap[step];
    if (!validator) return true;

    let stepData: any = {};
    
    switch (step) {
      case AccessStorageStep.DELIVERY_PURPOSE:
        stepData = {
          deliveryReason: formState.deliveryReason,
          address: formState.address,
          zipCode: formState.zipCode,
          coordinates: formState.coordinates,
          cityName: formState.cityName,
          selectedStorageUnits: formState.selectedStorageUnits,
          selectedPlan: formState.selectedPlan,
          selectedPlanName: formState.selectedPlanName,
          planType: formState.planType
        };
        break;
      case AccessStorageStep.SCHEDULING:
        stepData = {
          scheduledDate: formState.scheduledDate,
          scheduledTimeSlot: formState.scheduledTimeSlot
        };
        break;
      case AccessStorageStep.LABOR_SELECTION:
        stepData = {
          selectedLabor: formState.selectedLabor,
          movingPartnerId: formState.movingPartnerId,
          thirdPartyMovingPartnerId: formState.thirdPartyMovingPartnerId,
          loadingHelpPrice: formState.loadingHelpPrice,
          loadingHelpDescription: formState.loadingHelpDescription,
          parsedLoadingHelpPrice: formState.parsedLoadingHelpPrice,
          planType: formState.planType
        };
        break;
      case AccessStorageStep.CONFIRMATION:
        stepData = {
          description: formState.description,
          appointmentType: formState.appointmentType,
          calculatedTotal: formState.calculatedTotal
        };
        break;
    }

    console.log(`Validating step ${step} with data:`, stepData);
    const result = validator(stepData);
    console.log(`Validation result for step ${step}:`, result);
    
    if (!result.isValid) {
      // Set errors from validation result
      Object.entries(result.errors).forEach(([field, error]) => {
        setError(field as keyof AccessStorageFormErrors, error as string);
      });
    }

    return result.isValid;
  }, [formState, setError]);

  const canProceedToNextStep = useCallback((): boolean => {
    return validateStep(formState.currentStep);
  }, [formState.currentStep, validateStep]);

  // ===== HELPER FUNCTIONS =====

  /**
   * Maps API field names to form field names for error handling
   */
  const mapApiFieldToFormField = useCallback((apiField: string): keyof AccessStorageFormErrors | null => {
    const fieldMapping: Record<string, keyof AccessStorageFormErrors> = {
      'address': 'addressError',
      'zipCode': 'addressError',
      'appointmentDateTime': 'scheduleError',
      'scheduledDate': 'scheduleError',
      'scheduledTimeSlot': 'scheduleError',
      'planType': 'planError',
      'selectedPlanName': 'planError',
      'deliveryReason': 'deliveryReasonError',
      'selectedStorageUnits': 'storageUnitError',
      'storageUnitCount': 'storageUnitError',
      'selectedLabor': 'laborError',
      'movingPartnerId': 'laborError',
      'thirdPartyMovingPartnerId': 'laborError'
    };
    
    return fieldMapping[apiField] || null;
  }, []);

  // ===== FORM SUBMISSION =====

  const submitForm = useCallback(async (): Promise<void> => {
    console.log('🚀 [submitForm] Starting form submission...');
    console.log('🚀 [submitForm] Mode:', mode);
    console.log('🚀 [submitForm] AppointmentId:', appointmentId);
    console.log('🚀 [submitForm] UserId:', userId);
    console.log('🚀 [submitForm] Form State:', formState);
    
    // Validate all steps before submission
    clearAllErrors();
    
    // Validate Step 1: Delivery Purpose
    console.log('🔍 [submitForm] Validating Step 1...');
    const step1Valid = validateStep(AccessStorageStep.DELIVERY_PURPOSE);
    console.log('🔍 [submitForm] Step 1 valid:', step1Valid);
    if (!step1Valid) {
      console.error('❌ [submitForm] Step 1 validation failed. Cannot proceed to submission.');
      // Don't return yet, validate all steps to show all errors
    }
    
    console.log('🔍 [submitForm] Validating Step 2...');
    const step2Valid = validateStep(AccessStorageStep.SCHEDULING);
    console.log('🔍 [submitForm] Step 2 valid:', step2Valid);
    if (!step2Valid) {
      console.error('❌ [submitForm] Step 2 validation failed. Cannot proceed to submission.');
    }
    
    console.log('🔍 [submitForm] Validating Step 3...');
    const step3Valid = validateStep(AccessStorageStep.LABOR_SELECTION);
    console.log('🔍 [submitForm] Step 3 valid:', step3Valid);
    if (!step3Valid) {
      console.error('❌ [submitForm] Step 3 validation failed. Cannot proceed to submission.');
    }
    
    if (!step1Valid || !step2Valid || !step3Valid) {
      console.error('❌ [submitForm] Validation failed. Stopping submission.');
      console.error('❌ [submitForm] Which steps failed:', JSON.stringify({ step1Valid, step2Valid, step3Valid }, null, 2));
      // Note: errors state might not be updated yet due to async setState
      // The actual errors are logged in the validateStep function above
      setError('submitError', 'Please ensure all form fields are filled out correctly before submitting.');
      return;
    }
    
    console.log('✅ [submitForm] All validations passed!');
    console.log('✅ [submitForm] Validation summary:', JSON.stringify({ step1Valid, step2Valid, step3Valid }, null, 2));

    console.log('🔍 [submitForm] Getting appointment date time...');
    const appointmentDateTime = getAppointmentDateTime();
    console.log('🔍 [submitForm] Appointment date time:', appointmentDateTime);
    
    if (!appointmentDateTime) {
      console.error('❌ [submitForm] Invalid appointment date/time');
      setError('scheduleError', 'Invalid date or time. Please re-select.');
      return;
    }

    if (!userId) {
      console.error('❌ [submitForm] No userId found - session expired');
      setError('submitError', 'Your session has expired. Please refresh the page to continue.');
      return;
    }

    // Additional validation for edit mode
    if (mode === 'edit' && !appointmentId) {
      console.error('❌ [submitForm] Edit mode requires appointmentId');
      setError('submitError', 'Appointment ID is required for editing');
      return;
    }

    console.log('✅ [submitForm] All validations passed. Setting isSubmitting flag...');
    setFlags(prev => ({ ...prev, isSubmitting: true }));
    clearError('submitError');

    try {
      const finalDescription = formState.description?.trim() || "No added info";

      // Prepare submission data based on mode
      const baseSubmissionData: AccessStorageSubmissionData = {
        userId,
        address: formState.address,
        zipCode: formState.zipCode,
        selectedPlanName: formState.selectedPlanName,
        appointmentDateTime: appointmentDateTime.toISOString(),
        deliveryReason: formState.deliveryReason!,
        planType: formState.planType,
        selectedStorageUnits: formState.selectedStorageUnits,
        description: finalDescription,
        appointmentType: formState.appointmentType,
        parsedLoadingHelpPrice: formState.parsedLoadingHelpPrice,
        calculatedTotal: formState.calculatedTotal,
        movingPartnerId: formState.movingPartnerId,
        thirdPartyMovingPartnerId: formState.thirdPartyMovingPartnerId,
        includeUserData: true
      };

      // Determine if we're in edit mode
      const isEditMode = mode === 'edit';
      
      // Format data specifically for edit mode API
      const submissionData = isEditMode ? {
        userId: baseSubmissionData.userId,
        address: baseSubmissionData.address,
        zipCode: baseSubmissionData.zipCode,
        appointmentDateTime: baseSubmissionData.appointmentDateTime,
        planType: baseSubmissionData.planType,
        deliveryReason: baseSubmissionData.deliveryReason,
        selectedStorageUnits: baseSubmissionData.selectedStorageUnits.map(id => parseInt(id, 10)),
        storageUnitCount: baseSubmissionData.selectedStorageUnits.length,
        description: baseSubmissionData.description,
        appointmentType: baseSubmissionData.appointmentType,
        loadingHelpPrice: formState.loadingHelpPrice,
        parsedLoadingHelpPrice: baseSubmissionData.parsedLoadingHelpPrice,
        monthlyStorageRate: formState.monthlyStorageRate || 0,
        monthlyInsuranceRate: formState.monthlyInsuranceRate || 0,
        calculatedTotal: baseSubmissionData.calculatedTotal,
        movingPartnerId: baseSubmissionData.movingPartnerId,
        thirdPartyMovingPartnerId: baseSubmissionData.thirdPartyMovingPartnerId,
        selectedLabor: formState.selectedLabor,
        status: 'Scheduled',
        stripeCustomerId: formState.stripeCustomerId || undefined
      } : baseSubmissionData;

      // Validate submission data using the appropriate schema based on mode
      console.log('🔍 [submitForm] Validating submission data...');
      console.log('🔍 [submitForm] Mode:', isEditMode ? 'edit' : 'create');
      console.log('🔍 [submitForm] Submission data:', submissionData);
      
      let validationResult: { isValid: boolean; data: any; errors: Record<string, string> };
      
      if (isEditMode) {
        // Use UpdateAppointmentRequestSchema for edit mode
        try {
          const validatedData = UpdateAppointmentRequestSchema.parse(submissionData);
          validationResult = { isValid: true, data: validatedData, errors: {} };
        } catch (error) {
          if (error instanceof z.ZodError) {
            const errors: Record<string, string> = {};
            error.errors.forEach((err) => {
              const field = err.path[0] as string;
              errors[`${field}Error`] = err.message;
            });
            validationResult = { isValid: false, data: null, errors };
          } else {
            validationResult = { isValid: false, data: null, errors: { submitError: 'Form validation failed' } };
          }
        }
      } else {
        // Use accessStorageSubmissionSchema for create mode
        validationResult = validateAccessStorageSubmission(submissionData);
      }
      
      console.log('🔍 [submitForm] Validation result:', validationResult);
      
      if (!validationResult.isValid) {
        console.error('❌ [submitForm] Submission data validation failed:', validationResult.errors);
        Object.entries(validationResult.errors).forEach(([field, error]) => {
          setError(field as keyof AccessStorageFormErrors, error as string);
        });
        return;
      }

      // 🚨 CRITICAL: Use correct API route based on mode
      // CREATE: /api/orders/access-storage-unit (POST)
      // EDIT: /api/orders/appointments/[id]/edit (PUT)
      const apiUrl = isEditMode 
        ? `/api/orders/appointments/${appointmentId}/edit`
        : '/api/orders/access-storage-unit';
      const method = isEditMode ? 'PUT' : 'POST';
      
      console.log('🌐 [submitForm] Making API request...');
      console.log('🌐 [submitForm] URL:', apiUrl);
      console.log('🌐 [submitForm] Method:', method);
      console.log('🌐 [submitForm] Request body:', validationResult.data);
      
      // Create AbortController for request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(apiUrl, {
          method,
          headers: { 
            'Content-Type': 'application/json',
            // Add cache control for edit requests to prevent stale data
            ...(isEditMode && { 'Cache-Control': 'no-cache' })
          },
          body: JSON.stringify(validationResult.data),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        console.log('🌐 [submitForm] Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

      if (!response.ok) {
        console.error('❌ [submitForm] API request failed with status:', response.status);
        const errorData = await response.json();
        console.error('❌ [submitForm] Error data:', errorData);
        
        // Handle specific error cases for edit mode
        if (isEditMode) {
          // Handle conflict resolution for concurrent edits
          if (response.status === 409) {
            setError('submitError', 
              'This appointment has been modified by another user. Please refresh and try again.'
            );
            return;
          }
          
          // Handle appointment not found
          if (response.status === 404) {
            setError('submitError', 
              'Appointment not found. It may have been cancelled or moved.'
            );
            return;
          }
          
          // Handle validation errors
          if (response.status === 400 && errorData.validationErrors) {
            // Map validation errors to form fields
            Object.entries(errorData.validationErrors).forEach(([field, error]) => {
              const formField = mapApiFieldToFormField(field);
              if (formField) {
                setError(formField, error as string);
              }
            });
            setError('submitError', 'Please correct the highlighted fields and try again.');
            return;
          }
          
          // Generic edit error
          // API may return error in 'error', 'message', or 'details' field
          const errorMessage = errorData.error || errorData.message || 
            (errorData.details ? (typeof errorData.details === 'string' ? errorData.details : JSON.stringify(errorData.details)) : null) ||
            'Failed to update appointment. Please try again.';
          setError('submitError', errorMessage);
        } else {
          // Create mode error handling
          // API may return error in 'error', 'message', or 'details' field
          const errorMessage = errorData.error || errorData.message || 
            (errorData.details ? (typeof errorData.details === 'string' ? errorData.details : JSON.stringify(errorData.details)) : null) ||
            'Failed to schedule access. Please try again.';
          setError('submitError', errorMessage);
        }
        return;
      }

      console.log('✅ [submitForm] API request successful');
      const data = await response.json();
      console.log('✅ [submitForm] Response data:', data);
      
      // Enhanced response processing for edit mode
      if (isEditMode && data.data) {
        // Handle any warnings or notifications from the API
        if (data.data.warnings && data.data.warnings.length > 0) {
          console.warn('Appointment update warnings:', data.data.warnings);
        }
        
        // Handle driver reassignment notifications
        if (data.data.driverReassigned) {
          console.info('Driver was reassigned due to plan changes');
        }
        
        // Handle moving partner changes
        if (data.data.movingPartnerChanged) {
          console.info('Moving partner was updated');
        }
      }

      // Success - handle callback and redirect
      if (onSubmissionSuccess) {
        const resultAppointmentId = isEditMode 
          ? (appointmentId ? parseInt(appointmentId, 10) : data.data?.appointmentId)
          : data.data?.appointmentId;
        
        if (resultAppointmentId) {
          onSubmissionSuccess(resultAppointmentId);
        }
      }

      router.refresh();
      router.push(`/customer/${userId}`);
      
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Handle specific fetch errors
        if (fetchError.name === 'AbortError') {
          setError('submitError', 
            isEditMode 
              ? 'Request timed out while updating appointment. Please try again.'
              : 'Request timed out while scheduling appointment. Please try again.'
          );
        } else if (fetchError.message?.includes('Failed to fetch')) {
          setError('submitError', 
            'Network error. Please check your connection and try again.'
          );
        } else {
          setError('submitError', fetchError.message || "An unexpected error occurred.");
        }
      }
    } catch (error: any) {
      setError('submitError', error.message || "An unexpected error occurred.");
    } finally {
      setFlags(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [
    formState,
    userId,
    getAppointmentDateTime,
    setError,
    clearError,
    setFlags,
    onSubmissionSuccess,
    router,
    mode,
    appointmentId,
    mapApiFieldToFormField
  ]);

  const resetForm = useCallback(() => {
    setFormState({ ...DEFAULT_FORM_STATE, zipCode: initialZipCode });
    setErrors(DEFAULT_FORM_ERRORS);
    setFlags(DEFAULT_FORM_FLAGS);
  }, [initialZipCode]);

  // ===== PLAN DETAILS ANIMATION =====

  const togglePlanDetails = useCallback(() => {
    const newVisibility = !formState.isPlanDetailsVisible;
    let newHeight = null;
    
    if (newVisibility && contentRef.current) {
      newHeight = contentRef.current.scrollHeight;
    }
    
    updateFormState({
      isPlanDetailsVisible: newVisibility,
      contentHeight: newHeight
    });
  }, [formState.isPlanDetailsVisible, updateFormState]);

  return {
    // Form state
    formState,
    errors,
    flags,
    
    // Form actions
    updateFormState,
    setError,
    clearError,
    clearAllErrors,
    
    // Specialized handlers
    handleAddressChange,
    handleDeliveryReasonChange,
    handleStorageUnitSelection,
    handleInitialPlanChoice,
    handleLaborChange,
    handleDateTimeSelected,
    handleUnavailableLabor,
    togglePlanDetails,
    
    // Step validation
    validateStep,
    canProceedToNextStep,
    
    // Form submission
    submitForm,
    resetForm,
    
    // Computed values
    getAppointmentDateTime,
    combinedDateTimeForLabor,
    
    // Refs
    contentRef,
  };
}

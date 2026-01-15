/**
 * @fileoverview Access Storage form main container component
 * @source boombox-10.0/src/app/components/access-storage/accessstorageform.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Main container component for the access storage form that orchestrates a multi-step form flow
 * for customers to schedule storage unit access or end storage term appointments. Manages form
 * state, navigation between steps, API integration, and submission workflow.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/accessStorageUnit → New: /api/orders/access-storage-unit
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors (bg-zinc-950, text-red-500) with semantic tokens (bg-primary, text-status-error)
 * - Updated loading overlay to use design system colors and spacing
 * - Applied consistent error message styling with form-error class
 * - Used semantic color tokens for backgrounds and text throughout
 * 
 * @refactor Massive refactoring: Replaced 25+ useState hooks with custom hooks architecture,
 * integrated React Hook Form with Zod validation, extracted business logic to services,
 * added comprehensive error handling, and implemented form persistence with URL synchronization.
 */

'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { MyQuote, ChooseLabor } from '@/components/features/orders';
import { Scheduler } from '@/components/forms';
import { LoadingOverlay } from '@/components/ui/primitives';
import {
  useAccessStorageFormState,
  useAccessStorageNavigation_Context,
  useAccessStorageSubmission,
  useAccessStorageAppointmentData,
  useAccessStorageForm_RHF
} from './AccessStorageProvider';
import { AccessStorageStep, MY_QUOTE_BUTTON_TEXTS, MOBILE_MY_QUOTE_BUTTON_TEXTS } from '@/types/accessStorage.types';
import AccessStorageStep1 from './AccessStorageStep1';
import AccessStorageConfirmAppointment from './AccessStorageConfirmAppointment';
import { parseAppointmentTime } from '@/lib/utils';

// ===== MAIN FORM COMPONENT =====

/**
 * AccessStorageForm - Main form component for accessing storage units
 * 
 * This component must be wrapped with AccessStorageProvider at the page level.
 * It uses context directly (matching the AddStorageForm pattern).
 * 
 * @example
 * // In your page component:
 * <AccessStorageProvider mode="create" userId={userId}>
 *   <AccessStorageForm />
 * </AccessStorageProvider>
 */
function AccessStorageForm() {
  // Access context hooks
  const { formState, errors, isSubmitting, setError, updateFormState } = useAccessStorageFormState();
  const { currentStep, goToStep, goToNextStep } = useAccessStorageNavigation_Context();
  const form = useAccessStorageForm_RHF(); // React Hook Form for direct value updates
  const { submitForm } = useAccessStorageSubmission();
  const { 
    isLoading: isLoadingAppointment, 
    isEditMode,
    appointmentId
  } = useAccessStorageAppointmentData();

  // ===== COMBINED DATE TIME FOR LABOR SELECTION =====
  
  // Combine scheduled date and time slot for moving partner search
  const combinedDateTimeForLabor = useMemo(() => {
    return formState.scheduledDate && formState.scheduledTimeSlot
      ? parseAppointmentTime(
          formState.scheduledDate,
          formState.scheduledTimeSlot
        )
      : null;
  }, [formState.scheduledDate, formState.scheduledTimeSlot]);

  // ===== STABLE CALLBACKS FOR MYQUOTE =====
  
  // These callbacks need to be stable to prevent infinite loops in useQuote
  const handleCalculateTotal = useCallback((total: number) => {
    form.setValue('calculatedTotal', total, { shouldValidate: false });
    updateFormState({ calculatedTotal: total });
  }, [form, updateFormState]);

  const handleSetMonthlyStorageRate = useCallback((rate: number) => {
    form.setValue('monthlyStorageRate', rate, { shouldValidate: false });
    updateFormState({ monthlyStorageRate: rate });
  }, [form, updateFormState]);

  const handleSetMonthlyInsuranceRate = useCallback((rate: number) => {
    form.setValue('monthlyInsuranceRate', rate, { shouldValidate: false });
    updateFormState({ monthlyInsuranceRate: rate });
  }, [form, updateFormState]);

  // ===== STEP CONTENT RENDERING =====

  const renderStepContent = () => {
    switch (currentStep) {
      case AccessStorageStep.DELIVERY_PURPOSE:
        return <AccessStorageStep1 />;
        
      case AccessStorageStep.SCHEDULING:
        return (
          <Scheduler 
            planType={formState.planType === 'Do It Yourself Plan' ? 'DIY' : 'FULL_SERVICE'}
            numberOfUnits={formState.selectedStorageUnits.length || 1}
            onDateTimeSelected={(date: Date, timeSlot: string) => {
              // Update React Hook Form (source of truth for validation)
              form.setValue('scheduledDate', date, { shouldValidate: true });
              form.setValue('scheduledTimeSlot', timeSlot, { shouldValidate: true });
              // Also update custom hook state
              updateFormState({
                scheduledDate: date,
                scheduledTimeSlot: timeSlot
              });
            }}
            initialSelectedDate={formState.scheduledDate ?? undefined}
            initialSelectedTimeSlot={formState.scheduledTimeSlot ?? undefined}
            excludeAppointmentId={isEditMode ? appointmentId : undefined}
            goBackToStep1={() => goToStep(AccessStorageStep.DELIVERY_PURPOSE)}
            hasError={!!errors.scheduleError}
            errorMessage={errors.scheduleError}
            isEditMode={isEditMode}
            minimumDaysInAdvance={2}
          />
        );
        
      case AccessStorageStep.LABOR_SELECTION:
        if (formState.planType === 'Do It Yourself Plan') {
          return <div className="text-text-secondary">Loading confirmation...</div>;
        }
        return (
          <ChooseLabor 
            goBackToStep1={() => goToStep(AccessStorageStep.SCHEDULING)}
            onLaborSelect={(id: string, price: string, title: string, onfleetTeamId?: string) => {
              const formattedPrice = `$${price}/hr`;
              const parsedPrice = parseInt(price, 10) || 0;
              
              const selectedLabor = { id, price: formattedPrice, title, onfleetTeamId };
              const planType = id === 'Do It Yourself Plan' ? 'Do It Yourself Plan' :
                        id.startsWith('thirdParty-') ? 'Third Party Loading Help' :
                        'Full Service Plan';
              
              // Determine moving partner IDs from labor selection
              const movingPartnerId = id === 'Do It Yourself Plan' ? null :
                                     id.startsWith('thirdParty-') ? null :
                                     parseInt(id, 10);
              const thirdPartyMovingPartnerId = id.startsWith('thirdParty-') ? 
                parseInt(id.replace('thirdParty-', ''), 10) : null;
              
              // Update React Hook Form (source of truth for validation)
              form.setValue('selectedLabor', selectedLabor, { shouldValidate: true });
              form.setValue('planType', planType, { shouldValidate: true });
              form.setValue('selectedPlanName', title, { shouldValidate: false });
              form.setValue('loadingHelpPrice', formattedPrice, { shouldValidate: false });
              form.setValue('parsedLoadingHelpPrice', parsedPrice, { shouldValidate: false });
              form.setValue('movingPartnerId', movingPartnerId, { shouldValidate: false });
              form.setValue('thirdPartyMovingPartnerId', thirdPartyMovingPartnerId, { shouldValidate: false });
              
              // Also update custom hook state
              updateFormState({
                selectedLabor,
                parsedLoadingHelpPrice: parsedPrice,
                loadingHelpPrice: formattedPrice,
                selectedPlanName: title,
                loadingHelpDescription: id === 'Do It Yourself Plan' ? 'No loading help' :
                                      id.startsWith('thirdParty-') ? 'Third-party estimate' : 
                                      'Full Service estimate',
                planType,
                selectedPlan: id === 'Do It Yourself Plan' ? 'option1' : 'option2',
                movingPartnerId,
                thirdPartyMovingPartnerId
              });
            }}
            laborError={errors.laborError || errors.unavailableLaborError}
            clearLaborError={() => {
              setError('laborError', null);
              setError('unavailableLaborError', null);
            }}
            selectedLabor={formState.selectedLabor}
            planType={formState.planType}
            cityName={formState.cityName}
            selectedDateObject={combinedDateTimeForLabor}
            onMovingPartnerSelect={(partnerId: number | null) => {
              form.setValue('movingPartnerId', partnerId, { shouldValidate: false });
              updateFormState({ movingPartnerId: partnerId });
            }}
            onPlanTypeChange={(newPlanType: string) => {
              form.setValue('planType', newPlanType, { shouldValidate: true });
              updateFormState({ planType: newPlanType });
            }}
            onUnavailableLaborChange={(hasError: boolean, message?: string) => {
              setError('unavailableLaborError', hasError ? (message || "Mover unavailable. Choose another.") : null);
            }}
            appointmentId={undefined}
          />
        );
        
      case AccessStorageStep.CONFIRMATION:
        return (
          <AccessStorageConfirmAppointment 
            goBackToStep1={() => goToStep(AccessStorageStep.DELIVERY_PURPOSE)}
            goBackToStep2={() => {
              const targetStep = formState.planType === 'Do It Yourself Plan' 
                ? AccessStorageStep.SCHEDULING 
                : AccessStorageStep.LABOR_SELECTION;
              goToStep(targetStep);
            }}
            selectedPlanName={formState.selectedPlanName}
          />
        );
        
      default:
        return <AccessStorageStep1 />;
    }
  };

  // ===== HANDLE SUBMIT OR PROCEED =====

  const handleSubmitOrProceed = useCallback(() => {
    // At the confirmation step, submit the form
    if (currentStep === AccessStorageStep.CONFIRMATION) {
      submitForm();
      return;
    }

    // For other steps, navigate to the next step
    goToNextStep();
  }, [currentStep, submitForm, goToNextStep]);

  // ===== MY QUOTE PROPS =====

  const myQuoteTitle = formState.deliveryReason === "End storage term" 
    ? "End storage term" 
    : "Storage access";

  const myQuoteProps = useMemo(() => ({
    title: myQuoteTitle,
    showSendQuoteEmail: false,
    address: formState.address,
    scheduledDate: formState.scheduledDate,
    scheduledTimeSlot: formState.scheduledTimeSlot,
    selectedPlanName: formState.selectedPlanName,
    loadingHelpPrice: formState.loadingHelpPrice,
    loadingHelpDescription: formState.loadingHelpDescription,
    zipCode: formState.zipCode,
    coordinates: formState.coordinates,
    handleSubmit: handleSubmitOrProceed,
    currentStep,
    accessStorageUnitCount: formState.selectedStorageUnits.length,
    onCalculateTotal: handleCalculateTotal,
    setMonthlyStorageRate: handleSetMonthlyStorageRate,
    setMonthlyInsuranceRate: handleSetMonthlyInsuranceRate,
    isAccessStorage: true,
    buttonTexts: MY_QUOTE_BUTTON_TEXTS,
    deliveryReason: formState.deliveryReason,
    
    // Disable button when required fields are not filled
    // Use React Hook Form values directly to avoid stale custom hook state race conditions
    isButtonDisabled: 
      // Step 1: Require all fields
      (currentStep === AccessStorageStep.DELIVERY_PURPOSE && (
        !form.watch('deliveryReason') ||
        !form.watch('address') ||
        (form.watch('selectedStorageUnits') || []).length === 0 ||
        !form.watch('selectedPlan')
      )) ||
      // Step 2: Require date and time
      (currentStep === AccessStorageStep.SCHEDULING && (
        !form.watch('scheduledDate') || !form.watch('scheduledTimeSlot')
      )) ||
      // Step 3: Require labor selection for Full Service
      (currentStep === AccessStorageStep.LABOR_SELECTION && 
        form.watch('planType') !== 'Do It Yourself Plan' && !form.watch('selectedLabor')
      ),
  }), [
    myQuoteTitle,
    formState.address,
    formState.scheduledDate,
    formState.scheduledTimeSlot,
    formState.selectedPlanName,
    formState.loadingHelpPrice,
    formState.loadingHelpDescription,
    formState.zipCode,
    formState.coordinates,
    formState.selectedStorageUnits.length,
    formState.deliveryReason,
    formState.calculatedTotal,
    currentStep,
    handleSubmitOrProceed,
    handleCalculateTotal,
    handleSetMonthlyStorageRate,
    handleSetMonthlyInsuranceRate
  ]);

  const mobileMyQuoteProps = useMemo(() => ({
    ...myQuoteProps,
    buttonTexts: MOBILE_MY_QUOTE_BUTTON_TEXTS,
  }), [myQuoteProps]);

  // ===== SCROLL TO TOP ON STEP CHANGE =====

  useEffect(() => {
    if (currentStep > AccessStorageStep.DELIVERY_PURPOSE) { 
      window.scrollTo(0, 0);
    }
  }, [currentStep]);

  return (
    <div className="md:flex gap-x-8 lg:gap-x-16 mt-12 sm:mt-24 lg:px-16 px-6 justify-center mb-10 sm:mb-64 items-start">
      {/* Loading overlay for edit mode data fetch */}
      {isEditMode && isLoadingAppointment && (
        <LoadingOverlay 
          visible={true}
          message="Loading appointment details..."
          spinnerSize="xl"
        />
      )}
      
      {/* Loading overlay for form submission */}
      <LoadingOverlay 
        visible={isSubmitting && currentStep === AccessStorageStep.CONFIRMATION}
        message={isEditMode ? "Updating your appointment..." : "Processing your request..."}
        spinnerSize="xl"
      />
      
      {/* Step Content */}
      {renderStepContent()}
      
      {/* Quote Sidebar */}
      <div className="basis-1/2 md:mr-auto sticky top-5 max-w-md sm:h-[500px]">
        {/* Error Messages */}
        {(errors.laborError && currentStep === AccessStorageStep.LABOR_SELECTION && formState.planType !== 'Do It Yourself Plan') && (
          <div 
            className="text-status-error text-sm mb-2 text-center md:text-left" 
            role="alert" 
            aria-live="polite"
          >
            {errors.laborError}
          </div>
        )}
        
        {(errors.unavailableLaborError && currentStep === AccessStorageStep.LABOR_SELECTION && formState.planType !== 'Do It Yourself Plan') && (
          <div 
            className="text-status-error text-sm mb-2 text-center md:text-left" 
            role="alert" 
            aria-live="polite"
          >
            {errors.unavailableLaborError}
          </div>
        )}
        
        {errors.submitError && currentStep === AccessStorageStep.CONFIRMATION && (
          <div 
            className="text-status-error text-sm mb-2 text-center md:text-left" 
            role="alert" 
            aria-live="polite"
          >
            {errors.submitError}
          </div>
        )}
        
        {/* Quote Components */}
        <div className="hidden md:block">
          <MyQuote {...myQuoteProps} />
        </div>
        <div className="block md:hidden">
          <MyQuote {...mobileMyQuoteProps} />
        </div>
        
      </div>
    </div>
  );
}

// ===== EXPORT =====

export default AccessStorageForm;

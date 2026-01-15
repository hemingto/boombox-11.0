/**
 * @fileoverview Add Storage Form - Main container component for adding additional storage units
 * @source boombox-10.0/src/app/components/add-storage/userpageaddstorageform.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Multi-step form for adding additional storage units to existing customer accounts
 * - Handles address input, storage unit selection, plan selection, scheduling, and confirmation
 * - Integrates with MyQuote component for pricing display and ChooseLabor for moving help selection
 * - Supports both DIY and Full Service plans with conditional labor selection step
 * - Maintains form state across steps with URL synchronization for browser navigation
 * 
 * API ROUTES UPDATED:
 * - Old: /api/addAdditionalStorage → New: /api/orders/add-additional-storage
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors (bg-zinc-950, text-red-500) with semantic tokens (bg-primary, text-status-error)
 * - Applied design system loading overlay and error styling
 * - Used semantic color classes for consistent theming
 * 
 * @refactor Replaced 25+ useState hooks with 4 custom hooks, extracted business logic to services,
 * updated to use modern Next.js patterns with client-side routing and form context
 */

'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Context
import { useAddStorageContext } from './AddStorageProvider';

// Components
import { MyQuote, ChooseLabor } from '@/components/features/orders';
import { Scheduler } from '@/components/forms';
import { HelpIcon } from '@/components/icons';
import { LoadingOverlay } from '@/components/ui/primitives/LoadingOverlay';

// Step components
import AddStorageStep1 from '@/components/features/orders/AddStorageStep1';
import AddStorageConfirmAppointment from '@/components/features/orders/AddStorageConfirmAppointment';

// Types
import { AddStorageStep, PlanType } from '@/types/addStorage.types';
import { parseAppointmentTime } from '@/lib/utils';

interface AddStorageFormProps {
  initialStorageUnitCount?: number;
  initialZipCode?: string;
}

function AddStorageForm({ 
  initialStorageUnitCount = 1, 
  initialZipCode = '' 
}: AddStorageFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id as string | undefined;
  
  // Access all hooks from context (provider manages all state)
  const { 
    isEditMode,
    appointmentId,
    appointmentDataHook,
    formHook,
    navigationHook,
    submissionHook,
    persistenceHook,
  } = useAddStorageContext();

  // Destructure for easier access
  const {
    formState,
    errors,
    updateFormState,
    updateAddressInfo,
    updateStorageUnit,
    updatePlanSelection,
    updateLaborSelection,
    updateInsurance,
    updateScheduling,
    updatePricing,
    validateStep,
    setError,
    clearError,
    togglePlanDetails,
    contentRef,
  } = formHook;

  const {
    currentStep,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    canProceed,
  } = navigationHook;

  const {
    submissionState,
    submitForm,
    clearSubmissionError,
  } = submissionHook;

  // Handle form submission or step progression
  const handleSubmitOrProceed = async () => {
    clearSubmissionError();

    if (currentStep === AddStorageStep.CONFIRMATION) {
      // Final submission
      if (!userId) {
        console.error('User not authenticated');
        // Show user-friendly error message
        submissionHook.submissionState.submitError = 'Your session has expired. Please refresh the page to continue.';
        return;
      }

      const appointmentDateTime = formState.scheduling.scheduledDate && formState.scheduling.scheduledTimeSlot
        ? parseAppointmentTime(
            formState.scheduling.scheduledDate,
            formState.scheduling.scheduledTimeSlot
          )
        : null;

      if (!appointmentDateTime) {
        clearError('scheduleError');
        // Set schedule error through form state
        return;
      }

      try {
        await submitForm(formState, userId);
        // On success, redirect to customer page
        await router.refresh();
        router.push(`/customer/${userId}`);
      } catch (error) {
        console.error('Form submission failed:', error);
        // Error is handled by the submission hook
      }
    } else {
      // Step progression
      const validation = validateStep(currentStep);
      if (validation.isValid) {
        goToNextStep();
      } else {
        // Set errors from validation
        Object.entries(validation.errors).forEach(([key, value]) => {
          if (value) {
            setError(key as keyof typeof errors, value as string);
          }
        });
      }
    }
  };

  // Handle labor selection with comprehensive state updates
  const handleLaborChange = (id: string, price: string, title: string, onfleetTeamId?: string) => {
    updateLaborSelection({
      id,
      price,
      title,
      onfleetTeamId,
    });
  };

  // Handle date/time selection
  const handleDateTimeSelected = (date: Date, timeSlot: string) => {
    updateScheduling(date, timeSlot);
  };

  // Handle unavailable labor error (memoized to prevent infinite loops)
  const handleUnavailableLabor = useCallback((hasError: boolean, message?: string) => {
    if (hasError) {
      // Handle unavailable labor error
      console.warn('Labor unavailable:', message);
    } else {
      clearError('unavailableLaborError');
    }
  }, [clearError]);

  // Scheduler plan type mapping
  const schedulerPlanType = useMemo(() => {
    if (formState.selectedPlan === 'option1' || formState.planType === PlanType.DIY) {
      return 'DIY';
    }
    return 'FULL_SERVICE';
  }, [formState.selectedPlan, formState.planType]);

  // Combined date time for labor selection
  const combinedDateTimeForLabor = useMemo(() => {
    return formState.scheduling.scheduledDate && formState.scheduling.scheduledTimeSlot
      ? parseAppointmentTime(
          formState.scheduling.scheduledDate,
          formState.scheduling.scheduledTimeSlot
        )
      : null;
  }, [formState.scheduling.scheduledDate, formState.scheduling.scheduledTimeSlot]);

  // MyQuote button texts by step
  const myQuoteButtonTexts: { [step: number]: string } = isEditMode ? {
    1: "Continue",
    2: "Schedule Appointment", 
    3: "Select Movers",
    4: "Edit Appointment",
  } : {
    1: "Schedule Appointment",
    2: "Reserve Appointment", 
    3: "Select Movers",
    4: "Confirm Appointment",
  };

  const mobileMyQuoteButtonTexts: { [step: number]: string } = isEditMode ? {
    1: "Continue",
    2: "Schedule",
    3: "Add Movers", 
    4: "Edit",
  } : {
    1: "Schedule",
    2: "Reserve",
    3: "Add Movers", 
    4: "Confirm",
  };

  // Stable callback references to prevent infinite loops
  const handleCalculateTotal = useCallback((total: number) => {
    updatePricing({ calculatedTotal: total });
  }, [updatePricing]);

  const handleSetMonthlyStorageRate = useCallback((rate: number) => {
    updatePricing({ monthlyStorageRate: rate });
  }, [updatePricing]);

  const handleSetMonthlyInsuranceRate = useCallback((rate: number) => {
    updatePricing({ monthlyInsuranceRate: rate });
  }, [updatePricing]);

  // MyQuote props configuration
  const myQuoteProps = {
    title: isEditMode ? "Edit storage quote" : "New storage quote",
    showSendQuoteEmail: false,
    address: formState.addressInfo.address,
    scheduledDate: formState.scheduling.scheduledDate,
    scheduledTimeSlot: formState.scheduling.scheduledTimeSlot,
    storageUnitCount: formState.storageUnit.count,
    storageUnitText: formState.storageUnit.text,
    selectedPlanName: formState.selectedPlanName,
    loadingHelpPrice: formState.pricing.loadingHelpPrice,
    loadingHelpDescription: formState.pricing.loadingHelpDescription,
    selectedInsurance: formState.selectedInsurance,
    zipCode: formState.addressInfo.zipCode,
    coordinates: formState.addressInfo.coordinates,
    handleSubmit: handleSubmitOrProceed,
    currentStep,
    onCalculateTotal: handleCalculateTotal,
    setMonthlyStorageRate: handleSetMonthlyStorageRate,
    setMonthlyInsuranceRate: handleSetMonthlyInsuranceRate,
    isAccessStorage: false,
    buttonTexts: myQuoteButtonTexts,
  };

  const mobileMyQuoteProps = {
    ...myQuoteProps,
    buttonTexts: mobileMyQuoteButtonTexts,
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case AddStorageStep.ADDRESS_AND_PLAN:
        return (
          <AddStorageStep1
            formState={formState}
            errors={errors}
            onAddressChange={updateAddressInfo}
            onStorageUnitChange={updateStorageUnit}
            onPlanChange={(planId: string, planName: string, planType: string) => updatePlanSelection(planId, planName, planType)}
            onInsuranceChange={updateInsurance}
            onTogglePlanDetails={togglePlanDetails}
            onClearError={clearError}
            contentRef={contentRef}
          />
        );

      case AddStorageStep.SCHEDULING:
        return (
          <Scheduler
            planType={schedulerPlanType}
            numberOfUnits={formState.storageUnit.count}
            onDateTimeSelected={handleDateTimeSelected}
            initialSelectedDate={formState.scheduling.scheduledDate ?? undefined}
            initialSelectedTimeSlot={formState.scheduling.scheduledTimeSlot ?? undefined}
            excludeAppointmentId={isEditMode ? appointmentId : undefined}
            goBackToStep1={() => goToStep(AddStorageStep.ADDRESS_AND_PLAN)}
            hasError={!!errors.scheduleError}
            errorMessage={errors.scheduleError}
          />
        );

      case AddStorageStep.LABOR_SELECTION:
        if (formState.planType === PlanType.DIY) {
          return <p className="text-text-secondary">Loading confirmation...</p>;
        }
        return (
          <ChooseLabor
            goBackToStep1={() => goToStep(AddStorageStep.SCHEDULING)}
            onLaborSelect={handleLaborChange}
            laborError={errors.laborError || errors.unavailableLaborError}
            clearLaborError={() => {
              clearError('laborError');
              clearError('unavailableLaborError');
            }}
            selectedLabor={formState.selectedLabor}
            planType={formState.planType}
            cityName={formState.addressInfo.cityName}
            selectedDateObject={combinedDateTimeForLabor}
            onMovingPartnerSelect={(id: number | null) => {
              updateFormState({ movingPartnerId: id });
            }}
            onPlanTypeChange={(planType: string) => {
              updateFormState({ planType: planType as any });
            }}
            onUnavailableLaborChange={handleUnavailableLabor}
            appointmentId={undefined}
          />
        );

      case AddStorageStep.CONFIRMATION:
        return (
          <AddStorageConfirmAppointment
            formState={formState}
            onDescriptionChange={(description: string) => {
              updateFormState({ description });
            }}
            onGoBack={goToPreviousStep}
          />
        );

      default:
        return (
          <AddStorageStep1
            formState={formState}
            errors={errors}
            onAddressChange={updateAddressInfo}
            onStorageUnitChange={updateStorageUnit}
            onPlanChange={(planId: string, planName: string, planType: string) => updatePlanSelection(planId, planName, planType)}
            onInsuranceChange={updateInsurance}
            onTogglePlanDetails={togglePlanDetails}
            onClearError={clearError}
            contentRef={contentRef}
          />
        );
    }
  };

  return (
    <main 
      className="md:flex gap-x-8 lg:gap-x-16 mt-12 sm:mt-24 lg:px-16 px-6 justify-center mb-10 sm:mb-64 items-start"
      role="main"
      aria-label={isEditMode ? "Edit storage form" : "Add storage form"}
    >
      {/* Loading overlay for edit mode data fetch */}
      {isEditMode && appointmentDataHook?.isLoading && (
        <LoadingOverlay 
          visible={true}
          message="Loading appointment details..."
          spinnerSize="xl"
        />
      )}
      
      {/* Loading overlay for form submission */}
      <LoadingOverlay 
        visible={submissionState.isSubmitting && currentStep === AddStorageStep.CONFIRMATION}
        message={isEditMode ? "Updating your appointment..." : "Processing your request..."}
        spinnerSize="xl"
      />
      
      {/* Step content */}
      <section 
        className="basis-1/2"
        role="form"
        aria-label={`Add storage form - Step ${currentStep} of 4`}
        aria-live="polite"
      >
        {renderStepContent()}
      
      {/* Error messages */}
      {(errors.laborError && currentStep === AddStorageStep.LABOR_SELECTION && formState.planType !== PlanType.DIY) && (
          <div className="bg-status-bg-error p-4 rounded-md max-w-lg mx-auto md:mx-0 md:ml-auto">
            <p 
              className="text-status-error text-sm text-center md:text-left"
              role="alert"
              aria-live="assertive"
            >
              {errors.laborError}
            </p>
          </div>
        )}
        {(errors.unavailableLaborError && currentStep === AddStorageStep.LABOR_SELECTION && formState.planType !== PlanType.DIY) && (
          <div className="bg-status-bg-error p-4 rounded-md max-w-lg mx-auto md:mx-0 md:ml-auto">
            <p 
              className="text-status-error text-sm text-center md:text-left"
              role="alert"
              aria-live="assertive"
            >
              {errors.unavailableLaborError}
            </p>
          </div>
        )}
        {submissionState.submitError && currentStep === AddStorageStep.CONFIRMATION && (
          
          <div className="bg-status-bg-error p-4 rounded-md max-w-lg mx-auto md:mx-0 md:ml-auto">
            <p 
              className="text-status-error text-sm text-center md:text-left"
              role="alert"
              aria-live="assertive"
            >
              {submissionState.submitError}
            </p>
          </div>
        )}
      </section>
      
      {/* Quote sidebar */}
      <aside 
        className="basis-1/2 md:mr-auto sticky top-5 max-w-md sm:h-[500px]"
        role="complementary"
        aria-label="Quote summary and help information"
      >
        
        
        {/* Quote components */}
        <MyQuote {...myQuoteProps} />
        <div className="md:hidden">
          <MyQuote {...mobileMyQuoteProps} />
        </div>
      </aside>
    </main>
  );
}

export default AddStorageForm;

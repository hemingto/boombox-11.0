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

import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { MyQuote, ChooseLabor } from '@/components/features/orders';
import { HelpIcon } from '@/components/icons';
import { Scheduler } from '@/components/forms';
import { LoadingOverlay } from '@/components/ui/primitives';
import { AppointmentLoadingSkeleton } from '@/components/ui/loading';
import { AppointmentErrorState, AppointmentErrorType } from '@/components/ui/error';
import {
  AccessStorageProvider,
  useAccessStorageContext,
  useAccessStorageFormState,
  useAccessStorageNavigation_Context,
  useAccessStorageUnits,
  useAccessStorageSubmission,
  useAccessStorageAppointmentData
} from './AccessStorageProvider';
import { AccessStorageStep, MY_QUOTE_BUTTON_TEXTS, MOBILE_MY_QUOTE_BUTTON_TEXTS } from '@/types/accessStorage.types';
import AccessStorageStep1 from './AccessStorageStep1';
import AccessStorageConfirmAppointment from './AccessStorageConfirmAppointment';

// ===== MAIN FORM COMPONENT =====

interface AccessStorageFormProps {
  mode?: 'create' | 'edit';
  appointmentId?: string;
  initialZipCode?: string;
  onSubmissionSuccess?: (appointmentId: number) => void;
}

function AccessStorageFormContent() {
  // Access context hooks
  const { formState, errors, isSubmitting } = useAccessStorageFormState();
  const { currentStep, goToStep } = useAccessStorageNavigation_Context();
  const { submitForm } = useAccessStorageSubmission();
  const { 
    isLoading: isLoadingAppointment, 
    error: appointmentError, 
    errorType: appointmentErrorType,
    retry: retryAppointmentLoad,
    canRetry,
    isEditMode 
  } = useAccessStorageAppointmentData();
  
  // Get search params for error handling
  const searchParams = useSearchParams();

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
              // This will be handled by the form context
            }}
            initialSelectedDate={formState.scheduledDate ?? undefined}
            goBackToStep1={() => goToStep(AccessStorageStep.DELIVERY_PURPOSE)}
            hasError={!!errors.scheduleError}
            errorMessage={errors.scheduleError}
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
              // This will be handled by the form context
            }}
            laborError={errors.laborError || errors.unavailableLaborError}
            clearLaborError={() => {
              // This will be handled by the form context
            }}
            selectedLabor={formState.selectedLabor}
            planType={formState.planType}
            cityName={formState.cityName}
            selectedDateObject={formState.scheduledDate}
            onMovingPartnerSelect={(partnerId: number | null) => {
              // This will be handled by the form context
            }}
            onPlanTypeChange={(planType: string) => {
              // This will be handled by the form context
            }}
            onUnavailableLaborChange={(hasError: boolean, message?: string) => {
              // This will be handled by the form context
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
    handleSubmit: submitForm,
    currentStep,
    accessStorageUnitCount: formState.selectedStorageUnits.length,
    onCalculateTotal: (total: number) => {
      // This will be handled by the form context
    },
    setMonthlyStorageRate: (rate: number) => {
      // This will be handled by the form context
    },
    setMonthlyInsuranceRate: (rate: number) => {
      // This will be handled by the form context
    },
    isAccessStorage: true,
    buttonTexts: isEditMode ? {
      1: "Continue",
      2: "Schedule Appointment", 
      3: "Select Movers",
      4: "Update Appointment"
    } : MY_QUOTE_BUTTON_TEXTS,
    deliveryReason: formState.deliveryReason,
    
    // Edit mode specific props
    isEditMode,
    appointmentId: searchParams.get('appointmentId') || undefined,
    originalTotal: formState.calculatedTotal || undefined,
    showPriceComparison: isEditMode && !!formState.calculatedTotal,
    editModeTitle: isEditMode ? `Edit ${myQuoteTitle}` : undefined,
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
    submitForm,
    isEditMode,
    searchParams
  ]);

  const mobileMyQuoteProps = useMemo(() => ({
    ...myQuoteProps,
    buttonTexts: isEditMode ? {
      1: "Continue",
      2: "Schedule", 
      3: "Add Movers",
      4: "Update"
    } : MOBILE_MY_QUOTE_BUTTON_TEXTS,
  }), [myQuoteProps, isEditMode]);

  // ===== SCROLL TO TOP ON STEP CHANGE =====

  useEffect(() => {
    if (currentStep > AccessStorageStep.DELIVERY_PURPOSE) { 
      window.scrollTo(0, 0);
    }
  }, [currentStep]);

  // Show loading skeleton while fetching appointment data in edit mode
  if (isEditMode && isLoadingAppointment) {
    return <AppointmentLoadingSkeleton />;
  }

  // Show enhanced error state if appointment data failed to load in edit mode
  if (isEditMode && appointmentError) {
    const appointmentId = searchParams.get('appointmentId') || undefined;
    const userId = searchParams.get('userId') || undefined;
    
    return (
      <AppointmentErrorState
        errorType={appointmentErrorType || 'unknown_error'}
        errorMessage={appointmentError}
        appointmentId={appointmentId}
        userId={userId}
        onRetry={canRetry ? retryAppointmentLoad : undefined}
        onGoHome={() => {
          if (userId) {
            window.location.href = `/user-page/${userId}`;
          } else {
            window.history.back();
          }
        }}
      />
    );
  }

  return (
    <div className="md:flex gap-x-8 lg:gap-x-16 mt-12 sm:mt-24 lg:px-16 px-6 justify-center mb-10 sm:mb-64 items-start">
      {/* Loading Overlay */}
      {isSubmitting && currentStep === AccessStorageStep.CONFIRMATION && (
        <LoadingOverlay 
          visible={true}
          message={isEditMode ? "Updating your appointment..." : "Processing your request..."}
          className="fixed inset-0 bg-primary bg-opacity-50 flex flex-col items-center justify-center z-50"
          aria-label={isEditMode ? "Updating appointment" : "Processing appointment request"}
        />
      )}
      
      {/* Step Content */}
      {renderStepContent()}
      
      {/* Quote Sidebar */}
      <div className="basis-1/2 md:mr-auto sticky top-5 max-w-md sm:h-[500px]">
        {/* Error Messages */}
        {errors.scheduleError && currentStep === AccessStorageStep.SCHEDULING && (
          <div 
            className="text-status-error text-sm mb-2 text-center md:text-left" 
            role="alert" 
            aria-live="polite"
          >
            {errors.scheduleError}
          </div>
        )}
        
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
        
        {/* Help Section */}
        <div className="hidden px-4 pt-6 md:block">
          {isEditMode && (
            <div className="mb-4">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel editing? Any unsaved changes will be lost.')) {
                    window.history.back();
                  }
                }}
                className="btn-secondary w-full text-sm"
                type="button"
              >
                Cancel Changes
              </button>
            </div>
          )}
          <div className="flex items-center">
            <HelpIcon className="w-8 h-8 text-text-primary mr-4 shrink-0" />
            <div>
              <p className="text-xs text-text-secondary">
                Need help? Send us an email at help@boomboxstorage.com if you have any questions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== EXPORTED COMPONENT WITH PROVIDER =====

export default function AccessStorageForm({ 
  mode = 'create',
  appointmentId,
  initialZipCode, 
  onSubmissionSuccess 
}: AccessStorageFormProps) {
  const searchParams = useSearchParams();
  const zipCodeFromUrl = searchParams.get('zipCode') || '';
  const finalInitialZipCode = initialZipCode || zipCodeFromUrl;

  return (
    <AccessStorageProvider
      mode={mode}
      appointmentId={appointmentId}
      initialZipCode={finalInitialZipCode}
      onSubmissionSuccess={onSubmissionSuccess}
      enablePersistence={mode === 'create'} // Only enable persistence in create mode
    >
      <AccessStorageFormContent />
    </AccessStorageProvider>
  );
}

/**
 * @fileoverview Main GetQuote form orchestrator with multi-step flow
 * @source boombox-10.0/src/app/components/getquote/getquoteform.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Multi-step quote form orchestrator managing the complete booking flow:
 * 1. Address and storage unit selection (QuoteBuilder) ✅
 * 2. Scheduling (date/time) (Scheduler) ✅
 * 3. Labor selection (ChooseLabor) - conditional for Full Service ✅
 * 4. Payment and confirmation (ConfirmAppointment) ✅
 * 5. Phone verification (VerifyPhoneNumber) ✅
 * 
 * REFACTORING NOTES:
 * - Reduced from 50+ useState hooks to GetQuoteProvider context
 * - Extracted business logic to custom hooks
 * - Clean separation: UI rendering here, logic in provider/hooks
 * - Two-column responsive layout: form (left) + MyQuote sidebar (right)
 * - Conditional step navigation: DIY plan skips Step 3
 * 
 * @refactor Reduced from 768 lines with 50+ useState hooks to clean provider pattern
 */

'use client';

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { GetQuoteProvider, useGetQuoteContext } from './GetQuoteProvider';
import { QuoteBuilder } from './QuoteBuilder';
import Scheduler from '@/components/forms/Scheduler';
import { ChooseLabor } from '../ChooseLabor';
import { ConfirmAppointment } from './ConfirmAppointment';
import { VerifyPhoneNumber } from './VerifyPhoneNumber';
import { MyQuote } from '../MyQuote';
import { getStripePromise } from '@/lib/integrations/stripeClientSide';
import { useQuoteSubmission } from '@/hooks/useQuoteSubmission';
import type { InsuranceOption } from '@/types/insurance';
import type { QuoteSubmissionData } from '@/types';

/**
 * Inner component that consumes both GetQuote context and Stripe hooks
 * Separated to allow GetQuoteProvider and Elements to wrap it
 */
function GetQuoteFormContent() {
  const { state, actions } = useGetQuoteContext();
  const { currentStep } = state;
  
  // Stripe submission hook
  const { 
    isSubmitting, 
    error: submissionError, 
    submitQuote
  } = useQuoteSubmission();

  // Local state for QuoteBuilder plan details expansion
  const [contentHeight, setContentHeight] = React.useState<number | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // Update content height when plan details toggle
  React.useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [state.isPlanDetailsVisible]);

  // ==================== STEP 1 CALLBACKS ====================
  
  const handleAddressChange = useCallback((
    address: string,
    zipCode: string,
    coordinates: google.maps.LatLngLiteral,
    cityName: string
  ) => {
    actions.setAddress(address, zipCode, coordinates, cityName);
  }, [actions]);

  const handleStorageUnitChange = useCallback((count: number, text: string) => {
    actions.setStorageUnitCount(count, text);
  }, [actions]);

  const handlePlanChange = useCallback((
    id: string,
    planName: string,
    description: string
  ) => {
    actions.setPlan(id, planName, description);
  }, [actions]);

  const handlePlanTypeChange = useCallback((planType: string) => {
    actions.setPlanType(planType);
  }, [actions]);

  const handleInsuranceChange = useCallback((insurance: InsuranceOption | null) => {
    actions.setInsurance(insurance);
  }, [actions]);

  const handleStep1Next = useCallback(() => {
    // Validation happens automatically in nextStep()
    actions.nextStep();
  }, [actions]);

  // ==================== STEP 2 CALLBACKS ====================
  
  const handleDateTimeSelected = useCallback((date: Date, timeSlot: string) => {
    actions.setSchedule(date, timeSlot);
    // Auto-advance to next step after selecting date and time
    actions.nextStep();
  }, [actions]);

  const goBackToStep1 = useCallback(() => {
    actions.previousStep();
  }, [actions]);

  // ==================== STEP 3 CALLBACKS ====================
  
  const handleLaborSelect = useCallback((
    id: string,
    price: string,
    title: string,
    onfleetTeamId?: string
  ) => {
    actions.setLabor(id, price, title, onfleetTeamId);
  }, [actions]);

  const handleMovingPartnerSelect = useCallback((id: number | null) => {
    // This is handled automatically in setLabor action
    // No additional action needed
  }, []);

  const handleUnavailableLaborChange = useCallback((hasError: boolean) => {
    actions.setUnavailableLaborError(hasError);
  }, [actions]);

  // Memoized date object for ChooseLabor
  const combinedDateTimeForLabor = useMemo(() => {
    return state.scheduledDate || null;
  }, [state.scheduledDate]);

  // ==================== STEP 4 CALLBACKS ====================
  
  const goBackToStep2 = useCallback(() => {
    actions.previousStep();
  }, [actions]);

  const handleSubmitQuote = useCallback(async () => {
    // Validate required fields
    if (!state.firstName || !state.lastName || !state.email || !state.phoneNumber) {
      actions.setSubmitError('Please fill in all required fields');
      return;
    }

    // Combine date and time into ISO string
    const appointmentDateTime = state.scheduledDate && state.scheduledTimeSlot
      ? new Date(`${state.scheduledDate.toISOString().split('T')[0]}T${state.scheduledTimeSlot}`).toISOString()
      : '';

    // Build submission data matching QuoteSubmissionData interface
    // Note: stripeCustomerId will be added by submitQuote hook
    const submissionData: Omit<QuoteSubmissionData, 'stripeCustomerId'> = {
      // Customer Information
      firstName: state.firstName,
      lastName: state.lastName,
      email: state.email,
      phoneNumber: state.phoneNumber,
      
      // Appointment Details
      address: state.address,
      zipCode: state.zipCode,
      appointmentDateTime,
      appointmentType: state.appointmentType,
      
      // Storage & Plan Details
      storageUnitCount: state.storageUnitCount,
      planType: state.planType,
      selectedPlanName: state.selectedPlanName,
      
      // Insurance
      selectedInsurance: state.selectedInsurance,
      
      // Labor/Moving Partner
      selectedLabor: state.selectedLabor,
      movingPartnerId: state.movingPartnerId,
      thirdPartyMovingPartnerId: state.thirdPartyMovingPartnerId,
      
      // Pricing
      parsedLoadingHelpPrice: state.parsedLoadingHelpPrice,
      monthlyStorageRate: state.monthlyStorageRate,
      monthlyInsuranceRate: state.monthlyInsuranceRate,
      calculatedTotal: state.calculatedTotal,
    };

    // Submit quote via hook (adds stripeCustomerId)
    const result = await submitQuote(submissionData as QuoteSubmissionData);
    
    if (result) {
      // Success - store userId and advance to verification
      actions.setUserId(result.userId);
      actions.nextStep();
    } else if (submissionError) {
      // Error - display via context
      actions.setSubmitError(submissionError);
    }
  }, [
    state,
    actions,
    submitQuote,
    submissionError,
  ]);

  // Update context submit error when submission hook error changes
  useEffect(() => {
    if (submissionError) {
      actions.setSubmitError(submissionError);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionError]); // actions.setSubmitError is stable, safe to omit

  // Announce step changes to screen readers
  const stepAnnouncement = useMemo(() => {
    const stepNames = ['Address and Storage Selection', 'Schedule Selection', 'Labor Selection', 'Payment and Confirmation', 'Phone Verification'];
    return `Step ${currentStep} of 5: ${stepNames[currentStep - 1]}`;
  }, [currentStep]);

  // Focus management - focus on main heading when step changes
  useEffect(() => {
    const mainHeading = document.querySelector('h1');
    if (mainHeading && currentStep > 1) {
      mainHeading.focus();
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Page Container */}
      <div className="page-container section-spacing">
        {/* Accessibility: Announce step changes */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        >
          {stepAnnouncement}
        </div>

        {/* Two-Column Layout: Form + Sidebar */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column: Form Steps */}
          <div className="flex-1">
            <div 
              className="bg-white rounded-lg shadow-sm p-6 md:p-8"
              role="form"
              aria-label="Get Quote Form"
              aria-describedby="step-progress"
            >
              {/* Step Rendering */}
              {currentStep === 1 && (
                <>
                  <QuoteBuilder
                    // Address fields
                    address={state.address}
                    addressError={state.addressError}
                    onAddressChange={handleAddressChange}
                    clearAddressError={actions.clearAddressError}
                    
                    // Storage unit fields
                    storageUnitCount={state.storageUnitCount}
                    initialStorageUnitCount={1}
                    onStorageUnitChange={handleStorageUnitChange}
                    
                    // Plan fields
                    selectedPlan={state.selectedPlan}
                    planError={state.planError}
                    onPlanChange={handlePlanChange}
                    clearPlanError={actions.clearPlanError}
                    onPlanTypeChange={handlePlanTypeChange}
                    
                    // Plan details expansion
                    isPlanDetailsVisible={state.isPlanDetailsVisible}
                    togglePlanDetails={actions.togglePlanDetails}
                    contentHeight={contentHeight}
                    contentRef={contentRef}
                    
                    // Insurance fields
                    selectedInsurance={state.selectedInsurance}
                    insuranceError={state.insuranceError}
                    onInsuranceChange={handleInsuranceChange}
                    clearInsuranceError={actions.clearInsuranceError}
                  />
                  
                  {/* Step 1 Navigation Button */}
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleStep1Next}
                      className="btn-primary px-8 py-3"
                      type="button"
                      aria-label="Continue to step 2: Scheduling"
                    >
                      Continue to Scheduling
                    </button>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <Scheduler
                  planType={state.selectedPlanName === 'Do It Yourself Plan' ? 'DIY' : 'FULL_SERVICE'}
                  numberOfUnits={state.storageUnitCount}
                  onDateTimeSelected={handleDateTimeSelected}
                  initialSelectedDate={state.scheduledDate || undefined}
                  goBackToStep1={goBackToStep1}
                  hasError={!!state.scheduleError}
                  errorMessage={state.scheduleError}
                />
              )}

              {currentStep === 3 && (
                <ChooseLabor
                  // Navigation
                  goBackToStep1={goBackToStep1}
                  
                  // Labor selection
                  onLaborSelect={handleLaborSelect}
                  onMovingPartnerSelect={handleMovingPartnerSelect}
                  selectedLabor={state.selectedLabor}
                  
                  // Error handling
                  laborError={state.laborError}
                  clearLaborError={actions.clearLaborError}
                  onUnavailableLaborChange={handleUnavailableLaborChange}
                  
                  // Context data
                  planType={state.planType}
                  cityName={state.cityName}
                  selectedDateObject={combinedDateTimeForLabor}
                  
                  // Plan type change handler
                  onPlanTypeChange={handlePlanTypeChange}
                />
              )}

              {currentStep === 4 && (
                <>
                  <ConfirmAppointment
                    // Navigation
                    goBackToStep1={goBackToStep1}
                    goBackToStep2={goBackToStep2}
                    
                    // Plan information
                    selectedPlanName={state.selectedPlanName}
                    
                    // Email
                    email={state.email}
                    setEmail={actions.setEmail}
                    emailError={state.emailError}
                    setEmailError={(error) => {
                      // Update via dispatch
                      actions.setEmail(state.email); // triggers re-render
                    }}
                    
                    // Phone
                    phoneNumber={state.phoneNumber}
                    setPhoneNumber={actions.setPhoneNumber}
                    phoneError={state.phoneError}
                    setPhoneError={(error) => {
                      // Update via dispatch
                      actions.setPhoneNumber(state.phoneNumber); // triggers re-render
                    }}
                    
                    // First Name
                    firstName={state.firstName}
                    setFirstName={actions.setFirstName}
                    firstNameError={state.firstNameError}
                    setFirstNameError={(error) => {
                      // Update via dispatch
                      actions.setFirstName(state.firstName); // triggers re-render
                    }}
                    
                    // Last Name
                    lastName={state.lastName}
                    setLastName={actions.setLastName}
                    lastNameError={state.lastNameError}
                    setLastNameError={(error) => {
                      // Update via dispatch
                      actions.setLastName(state.lastName); // triggers re-render
                    }}
                    
                    // Loading and errors
                    isLoading={isSubmitting}
                    submitError={state.submitError}
                  />
                  
                  {/* Submit Button */}
                  <div className="mt-8 flex justify-end max-w-lg mx-auto md:mx-0 md:ml-auto">
                    <button
                      onClick={handleSubmitQuote}
                      disabled={isSubmitting}
                      className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                      aria-busy={isSubmitting}
                      aria-disabled={isSubmitting}
                      aria-label={isSubmitting ? 'Submitting quote, please wait' : 'Continue to step 5: Phone Verification'}
                    >
                      {isSubmitting ? 'Submitting...' : 'Continue to Verification'}
                    </button>
                  </div>
                </>
              )}

              {currentStep === 5 && (
                <VerifyPhoneNumber
                  initialPhoneNumber={state.phoneNumber}
                  userId={state.userId}
                />
              )}

              {/* Step Indicator */}
              <nav 
                id="step-progress"
                className="mt-8 pt-6 border-t border-border"
                aria-label="Form progress"
              >
                <div className="flex items-center justify-between text-sm">
                  <p className="text-text-secondary">
                    <span className="sr-only">Form progress:</span>
                    Current Step: <span className="font-semibold text-text-primary" aria-current="step">{currentStep} of 5</span>
                  </p>
                  <p className="text-text-secondary">
                    <span className="sr-only">Selected plan:</span>
                    Plan: <span className="font-semibold text-text-primary">{state.selectedPlanName || 'Not selected'}</span>
                  </p>
                </div>
              </nav>
            </div>
          </div>

          {/* Right Column: MyQuote Sidebar */}
          <aside 
            className="w-full md:w-96 lg:w-[400px]"
            aria-label="Quote summary"
          >
            <div className="sticky top-4">
              <MyQuote
                // Address and location
                address={state.address}
                zipCode={state.zipCode}
                coordinates={state.coordinates}
                
                // Storage and plan
                storageUnitCount={state.storageUnitCount}
                storageUnitText={state.storageUnitText}
                selectedPlanName={state.selectedPlanName}
                loadingHelpPrice={state.loadingHelpPrice}
                loadingHelpDescription={state.loadingHelpDescription}
                
                // Insurance
                selectedInsurance={state.selectedInsurance}
                
                // Scheduling
                scheduledDate={state.scheduledDate}
                scheduledTimeSlot={state.scheduledTimeSlot}
                
                // Pricing
                monthlyStorageRate={state.monthlyStorageRate}
                monthlyInsuranceRate={state.monthlyInsuranceRate}
                setMonthlyStorageRate={actions.setMonthlyStorageRate}
                setMonthlyInsuranceRate={actions.setMonthlyInsuranceRate}
                onCalculateTotal={actions.setCalculatedTotal}
                
                // Navigation and state
                currentStep={state.currentStep}
                handleSubmit={() => {}} // No-op for GetQuote flow (submission handled in ConfirmAppointment)
                
                // Mode flags
                isAccessStorage={false}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/**
 * Main GetQuoteForm component
 * Wraps the form content with GetQuoteProvider and Stripe Elements
 */
export function GetQuoteForm() {
  const [stripePromise] = useState(() => getStripePromise());
  
  return (
    <GetQuoteProvider>
      <Elements stripe={stripePromise}>
        <GetQuoteFormContent />
      </Elements>
    </GetQuoteProvider>
  );
}


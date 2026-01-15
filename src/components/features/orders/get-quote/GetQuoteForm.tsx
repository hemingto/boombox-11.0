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
import { useSearchParams } from 'next/navigation';
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
import { LoadingOverlay } from '@/components/ui/primitives/LoadingOverlay';

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

  // ==================== STEP 2 CALLBACKS ====================
  
  const handleDateTimeSelected = useCallback((date: Date, timeSlot: string) => {
    actions.setSchedule(date, timeSlot);
    // User must click MyQuote button to advance (no auto-advancement)
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

  // Memoized date object for ChooseLabor - combines date and time slot
  const combinedDateTimeForLabor = useMemo(() => {
    if (!state.scheduledDate || !state.scheduledTimeSlot) {
      return null;
    }

    try {
      const dateObj = new Date(state.scheduledDate);
      
      if (isNaN(dateObj.getTime())) {
        return null;
      }

      // Parse time slot (format: "9am-10am" or "9:30am-10:30am")
      const [timeSlotStart] = state.scheduledTimeSlot.split('-');
      const timeRegex = /(\d{1,2})(?::(\d{2}))?(am|pm)/i;
      const timeMatch = timeSlotStart.match(timeRegex);

      if (!timeMatch) {
        return null;
      }

      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const period = timeMatch[3].toLowerCase();

      // Convert to 24-hour format
      if (period === 'pm' && hours < 12) {
        hours += 12;
      } else if (period === 'am' && hours === 12) {
        hours = 0;
      }

      dateObj.setHours(hours, minutes, 0, 0);
      return dateObj;
    } catch {
      return null;
    }
  }, [state.scheduledDate, state.scheduledTimeSlot]);

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

    // Combine date and time into ISO string with proper validation
    // Matches boombox-10.0 implementation (lines 270-287)
    let appointmentDateTime = '';
    if (state.scheduledDate && state.scheduledTimeSlot) {
      try {
        // Create a new Date object from the scheduled date
        const dateObj = new Date(state.scheduledDate);
        
        // Check if the date is valid
        if (isNaN(dateObj.getTime())) {
          throw new Error('Invalid date value');
        }
        
        // Parse time slot (format: "9am-10am" or "9:30am-10:30am")
        // Split by '-' to get the start time from the range
        const [timeSlotStart] = state.scheduledTimeSlot.split('-');
        
        // Regex matches: hours, optional minutes with colon, and am/pm
        const timeRegex = /(\d{1,2})(?:\:(\d{2}))?(am|pm)/i;
        const timeMatch = timeSlotStart.match(timeRegex);
        
        if (!timeMatch) {
          throw new Error('Invalid time slot format');
        }
        
        let hours = parseInt(timeMatch[1], 10);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const period = timeMatch[3].toLowerCase();
        
        // Convert to 24-hour format
        if (period === 'pm' && hours < 12) {
          hours += 12;
        } else if (period === 'am' && hours === 12) {
          hours = 0;
        }
        
        // Validate parsed values
        if (isNaN(hours) || isNaN(minutes)) {
          throw new Error('Invalid time values');
        }
        
        // Set the time on the date object
        dateObj.setHours(hours, minutes, 0, 0);
        
        // Double check the date is still valid after setting time
        if (isNaN(dateObj.getTime())) {
          throw new Error('Invalid date after setting time');
        }
        
        // Convert to ISO string
        appointmentDateTime = dateObj.toISOString();
      } catch (error) {
        console.error('Error formatting appointment date/time:', error);
        console.error('State values:', {
          scheduledDate: state.scheduledDate,
          scheduledTimeSlot: state.scheduledTimeSlot,
        });
        actions.setSubmitError('Invalid date or time selected. Please try again.');
        return;
      }
    }

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

  // ==================== UNIFIED SUBMIT HANDLER ====================
  // MyQuote button triggers this for all step progressions (matching boombox-10.0 behavior)
  
  const handleSubmit = useCallback(async () => {
    if (currentStep === 1) {
      // Validate Step 1 via actions.nextStep() (has built-in validation)
      actions.nextStep();
    } else if (currentStep === 2) {
      // Validate Step 2 and advance
      actions.nextStep();
    } else if (currentStep === 3) {
      // Validate Step 3 (labor) and advance
      actions.nextStep();
    } else if (currentStep === 4) {
      // Special handling: validate, create Stripe customer, submit quote, then advance
      await handleSubmitQuote();
    }
  }, [currentStep, actions, handleSubmitQuote]);

  // Button text mapping (matching boombox-10.0)
  const myQuoteButtonTexts: { [step: number]: string } = useMemo(() => ({
    1: "Schedule Appointment",
    2: "Reserve Appointment", 
    3: "Select Movers",
    4: "Confirm Appointment",
  }), []);

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
    <>
      {/* Loading Overlay - Show during final submission */}
      <LoadingOverlay 
        visible={isSubmitting} 
        message="Processing your appointment..."
        spinnerSize="xl"
      />

      <div className="md:flex gap-x-8 lg:gap-x-16 mt-12 sm:mt-24 lg:px-16 px-4 justify-center mb-10 sm:mb-64 items-start">
        {/* Accessibility: Announce step changes */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        >
          {stepAnnouncement}
        </div>

      {/* Left Column: Form Steps */}
      <div className="w-full basis-1/2">
        <div 
          role="form"
          aria-label="Get Quote Form"
        >
          {/* Step Rendering */}
          {currentStep === 1 && (
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
              setEmailError={actions.setEmailError}
              
              // Phone
              phoneNumber={state.phoneNumber}
              setPhoneNumber={actions.setPhoneNumber}
              phoneError={state.phoneError}
              setPhoneError={actions.setPhoneError}
              
              // First Name
              firstName={state.firstName}
              setFirstName={actions.setFirstName}
              firstNameError={state.firstNameError}
              setFirstNameError={actions.setFirstNameError}
              
              // Last Name
              lastName={state.lastName}
              setLastName={actions.setLastName}
              lastNameError={state.lastNameError}
              setLastNameError={actions.setLastNameError}
              
              // Loading and errors
              isLoading={isSubmitting}
              submitError={state.submitError}
            />
          )}

          {currentStep === 5 && (
            <VerifyPhoneNumber
              initialPhoneNumber={state.phoneNumber}
              userId={state.userId}
            />
          )}
        </div>
      </div>

      {/* Right Column: MyQuote Sidebar */}
      {currentStep !== 5 && (
        <aside 
          className="basis-1/2 md:mr-auto sticky top-5 max-w-md sm:h-[500px]"
          aria-label="Quote summary"
        >
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
            handleSubmit={handleSubmit}
            buttonTexts={myQuoteButtonTexts}
            
            // Mode flags
            isAccessStorage={false}
          />
        </aside>
      )}
      </div>
    </>
  );
}

/**
 * Main GetQuoteForm component
 * Wraps the form content with GetQuoteProvider and Stripe Elements
 * Reads URL parameters to initialize form state
 */
export function GetQuoteForm() {
  const [stripePromise] = useState(() => getStripePromise());
  const searchParams = useSearchParams();
  
  // Read and validate URL parameters
  const storageUnitCountParam = searchParams.get('storageUnitCount');
  const zipCodeParam = searchParams.get('zipCode') || '';
  
  // Parse and validate storage unit count (1-5)
  const parsedStorageUnitCount = useMemo(() => {
    const count = parseInt(storageUnitCountParam || '1', 10);
    return isNaN(count) ? 1 : Math.max(1, Math.min(5, count));
  }, [storageUnitCountParam]);
  
  return (
    <GetQuoteProvider 
      initialStorageUnitCount={parsedStorageUnitCount}
      initialZipCode={zipCodeParam}
    >
      <Elements stripe={stripePromise}>
        <GetQuoteFormContent />
      </Elements>
    </GetQuoteProvider>
  );
}


/**
 * @fileoverview Final appointment confirmation with contact information and payment details
 * @source boombox-10.0/src/app/components/getquote/confirmappointment.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Final step in quote flow (Step 4) that collects customer contact information and payment
 * details via Stripe Elements. Displays informational messaging about billing and cancellation
 * policies. Does NOT handle actual payment processing - that occurs in the parent component.
 * Purely presentational component that renders form inputs and displays information.
 * 
 * API ROUTES UPDATED:
 * N/A - This component does not make API calls directly. Payment processing and customer
 * creation are handled by parent component (GetQuoteForm) using:
 * - /api/payments/create-customer (for Stripe customer creation)
 * - /api/orders/submit-quote (for appointment submission)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded red-500 with status-error tokens
 * - Applied form-group, form-label utility classes from globals.css
 * - Used semantic color tokens throughout (text-primary, bg-white, border-slate-100)
 * - Replaced InformationalPopup with Modal component (per user preference)
 * - Consistent spacing with design system spacing scale
 * - Enhanced focus states using design system patterns
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added comprehensive ARIA labels for all form fields
 * - Proper role="alert" for error messages
 * - Keyboard navigation support for back button
 * - Screen reader announcements for dynamic errors
 * - Proper form structure with semantic HTML
 * 
 * @refactor
 * - Renamed from confirmappointment.tsx to ConfirmAppointment.tsx (PascalCase)
 * - Applied design system colors and utility classes throughout
 * - Enhanced accessibility with comprehensive ARIA support
 * - Replaced InformationalPopup with Modal component
 * - Improved TypeScript interfaces with proper documentation
 * - Simplified event handlers and improved code organization
 */

'use client';

import React, { useState } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import type { StripeElementChangeEvent } from '@stripe/stripe-js';

// Form components
import EmailInput from '@/components/forms/EmailInput';
import { PhoneNumberInput } from '@/components/forms/PhoneNumberInput';
import FirstNameInput from '@/components/forms/FirstNameInput';
import CardNumberInput from '@/components/forms/CardNumberInput';
import CardExpirationDateInput from '@/components/forms/CardExpirationDateInput';
import CardCvcInput from '@/components/forms/CardCvcInput';

// UI primitives
import { Modal } from '@/components/ui/primitives/Modal';

// Icons
import { StripeLogo } from '@/components/icons';

/**
 * Stripe card validation errors
 */
interface LocalStripeErrors {
  cardNumber: string | null;
  cardExpiry: string | null;
  cardCvc: string | null;
}

/**
 * Props for ConfirmAppointment component
 */
export interface ConfirmAppointmentProps {
  /** Navigate back to step 1 */
  goBackToStep1: () => void;
  
  /** Navigate back to step 2 (or 3 depending on plan type) */
  goBackToStep2: () => void;
  
  /** Selected plan name for conditional logic */
  selectedPlanName: string;
  
  /** Email state and handlers */
  email: string;
  setEmail: (email: string) => void;
  emailError: string | null;
  setEmailError: (error: string | null) => void;
  
  /** Phone number state and handlers */
  phoneNumber: string;
  setPhoneNumber: (phoneNumber: string) => void;
  phoneError: string | null;
  setPhoneError: (error: string | null) => void;
  
  /** First name state and handlers */
  firstName: string;
  setFirstName: (firstName: string) => void;
  firstNameError: string | null;
  setFirstNameError: (error: string | null) => void;
  
  /** Last name state and handlers */
  lastName: string;
  setLastName: (lastName: string) => void;
  lastNameError: string | null;
  setLastNameError: (error: string | null) => void;
  
  /** Stripe instances from parent */
  stripe?: any;
  elements?: any;
  
  /** Stripe errors from parent (if any) */
  parentStripeErrors?: any;
  
  /** Loading state during submission */
  isLoading?: boolean;
  
  /** General submission error */
  submitError?: string | null;
}

/**
 * ConfirmAppointment component - Final step in quote flow
 * 
 * Collects customer contact information and payment details.
 * Displays informational messaging about billing and cancellation policies.
 * 
 * @example
 * ```tsx
 * <ConfirmAppointment
 *   goBackToStep1={handleBackToStep1}
 *   goBackToStep2={handleBackToStep2}
 *   selectedPlanName="Full Service Plan"
 *   email={email}
 *   setEmail={setEmail}
 *   emailError={emailError}
 *   setEmailError={setEmailError}
 *   // ... other props
 * />
 * ```
 */
export const ConfirmAppointment: React.FC<ConfirmAppointmentProps> = ({
  goBackToStep1: _goBackToStep1,
  goBackToStep2,
  selectedPlanName: _selectedPlanName,
  email,
  setEmail,
  emailError,
  setEmailError,
  phoneNumber,
  setPhoneNumber,
  phoneError,
  setPhoneError,
  firstName,
  setFirstName,
  firstNameError,
  setFirstNameError,
  lastName,
  setLastName,
  lastNameError,
  setLastNameError,
  stripe: _stripe,
  elements: _elements,
  parentStripeErrors: _parentStripeErrors,
  isLoading: _isLoading,
  submitError,
}) => {
  // Local state for Stripe card validation errors
  const [localStripeErrors, setLocalStripeErrors] = useState<LocalStripeErrors>({
    cardNumber: null,
    cardExpiry: null,
    cardCvc: null,
  });

  // State for billing information modal
  const [isModalOpen, setModalOpen] = useState(false);

  /**
   * Handle card number validation changes
   */
  const handleCardNumberChange = (event: StripeElementChangeEvent) => {
    setLocalStripeErrors((prev) => ({
      ...prev,
      cardNumber: event.error ? event.error.message : null,
    }));
  };

  /**
   * Handle card expiry validation changes
   */
  const handleCardExpiryChange = (event: StripeElementChangeEvent) => {
    setLocalStripeErrors((prev) => ({
      ...prev,
      cardExpiry: event.error ? event.error.message : null,
    }));
  };

  /**
   * Handle card CVC validation changes
   */
  const handleCardCvcChange = (event: StripeElementChangeEvent) => {
    setLocalStripeErrors((prev) => ({
      ...prev,
      cardCvc: event.error ? event.error.message : null,
    }));
  };

  /**
   * Render Stripe card validation errors
   */
  const renderStripeErrors = () => {
    const activeErrors = Object.values(localStripeErrors).filter(
      (error) => error !== null
    );
    
    if (activeErrors.length === 0) return null;

    return (
      <div className="mt-2 space-y-1" role="alert" aria-live="polite">
        {localStripeErrors.cardNumber && (
          <p className="text-status-error text-sm">{localStripeErrors.cardNumber}</p>
        )}
        {localStripeErrors.cardExpiry && (
          <p className="text-status-error text-sm">{localStripeErrors.cardExpiry}</p>
        )}
        {localStripeErrors.cardCvc && (
          <p className="text-status-error text-sm">{localStripeErrors.cardCvc}</p>
        )}
      </div>
    );
  };

  /**
   * Render general submission error
   */
  const renderSubmitError = () => {
    if (!submitError) return null;
    
    return (
      <p className="text-status-error text-sm mt-2" role="alert" aria-live="assertive">
        {submitError}
      </p>
    );
  };

  /**
   * Handle back button click
   */
  const handleBackClick = () => {
    if (typeof goBackToStep2 === 'function') {
      goBackToStep2();
    } else {
      console.error(
        'CRITICAL ERROR: goBackToStep2 prop is not a function inside handleBackClick!',
        goBackToStep2
      );
    }
  };

  /**
   * Handle keyboard navigation for back button
   */
  const handleBackKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleBackClick();
    }
  };

  return (
    <div className="w-full basis-1/2">
      <div className="max-w-lg mx-auto md:mx-0 md:ml-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-12 gap-2 lg:-ml-10">
          <button
            onClick={handleBackClick}
            onKeyDown={handleBackKeyDown}
            className="flex items-center justify-center w-8 h-8 cursor-pointer text-primary hover:text-primary-hover transition-colors"
            aria-label="Go back to previous step"
            type="button"
          >
            <ChevronLeftIcon className="w-full h-full shrink-0" aria-hidden="true" />
          </button>
          <h1 className="text-4xl text-primary">Confirm appointment</h1>
        </div>

        {/* Contact Information Section */}
        <p className="mb-4 text-text-primary">
          Please provide your contact information
        </p>

        <div className="flex-col space-y-4">
          {/* Name inputs */}
          <div className="flex-col sm:flex sm:flex-row gap-2">
            <FirstNameInput
              hasError={!!firstNameError}
              errorMessage={firstNameError || ''}
              onFirstNameChange={(name) => setFirstName(name)}
              onClearError={() => setFirstNameError(null)}
              value={firstName}
              required
              aria-label="First name (required)"
            />
            
            {/* Last Name Input */}
            <div className="basis-1/2">
              <input
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setLastNameError(null);
                }}
                placeholder="Last Name"
                className={`input-field ${
                  lastNameError ? 'input-field--error' : ''
                }`}
                required
                aria-label="Last name (required)"
                aria-invalid={!!lastNameError}
                aria-describedby={lastNameError ? 'lastName-error' : undefined}
                autoComplete="family-name"
              />
              {lastNameError && (
                <p
                  id="lastName-error"
                  className="form-error sm:-mt-2 mb-3"
                  role="alert"
                >
                  {lastNameError}
                </p>
              )}
            </div>
          </div>

          {/* Email input */}
          <EmailInput
            hasError={!!emailError}
            errorMessage={emailError || ''}
            onEmailChange={(newEmail) => setEmail(newEmail)}
            onClearError={() => setEmailError(null)}
            value={email}
            required
            aria-label="Email address (required)"
          />

          {/* Phone number input */}
          <PhoneNumberInput
            hasError={!!phoneError}
            errorMessage={phoneError || ''}
            onChange={(newPhone) => setPhoneNumber(newPhone)}
            onClearError={() => setPhoneError(null)}
            value={phoneNumber}
            required
            aria-label="Phone number (required)"
          />
        </div>

        {/* Phone number information notice */}
        <div className="p-3 sm:mb-4 mb-2 border border-border bg-surface-primary rounded-md max-w-fit mt-4">
          <p className="text-xs text-text-secondary">
            You&apos;ll receive updates about the status of your Boombox via your
            phone number
          </p>
        </div>

        {/* Payment Details Section */}
        <p className="mb-4 mt-10 text-text-primary">
          Please add your payment details
        </p>

        <div className="flex-col gap-2">
          {/* Stripe card inputs */}
          <div className="flex-col gap-2">
            <div className="flex gap-2">
              <div className="basis-2/3">
                <CardNumberInput onChange={handleCardNumberChange} />
              </div>
              <div className="relative w-full basis-1/6">
                <CardExpirationDateInput onChange={handleCardExpiryChange} />
              </div>
              <div className="relative w-full basis-1/6">
                <CardCvcInput onChange={handleCardCvcChange} />
              </div>
            </div>

            {/* Stripe validation errors */}
            {renderStripeErrors()}

            {/* General submission error */}
            {renderSubmitError()}
          </div>

          {/* Billing information notice */}
          <div className="mt-4 p-3 sm:mb-4 mb-2 border border-border bg-surface-primary rounded-md max-w-fit">
            <p className="text-xs text-text-secondary">
              You won&apos;t be charged anything today. We need your payment info
              to hold your appointment time.
              <br />
              <br />
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 text-primary hover:text-primary-hover transition-colors"
              aria-label="Learn more about when you will be charged"
            >
              <span className="text-xs underline cursor-pointer">
                When will I be charged?
              </span>
            </button>
          </div>

          {/* Stripe powered by badge */}
          <div className="flex justify-end items-center h-7">
            <StripeLogo />
          </div>
        </div>
      </div>

      {/* Billing Information Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="When will I be charged?"
      >
        <div className="space-y-4">
          <p className="text-text-primary leading-6">
            Reserving is free! You&apos;ll only be charged for your first month of
            storage and the pickup fee after your appointment is completed.
          </p>
          <p className="text-text-primary leading-6">
            We&apos;ll run a pre-authorization check 7 days before your appointment
            to ensure there are enough funds. If your appointment is in less than 7
            days, we&apos;ll do the check right after booking. This hold will be
            released once the check is done.
          </p>

          <div className="pt-4 border-t border-border">
            <h3 className="font-semibold text-primary mb-2">
              What if I need to reschedule?
            </h3>
            <p className="text-text-primary leading-5">
              Please reschedule or cancel at least 48 hours in advance to avoid a
              $100 fee. If you cancel on the day of your appointment, the fee
              increases to $200. It&apos;s easy to make changes online!
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ConfirmAppointment;


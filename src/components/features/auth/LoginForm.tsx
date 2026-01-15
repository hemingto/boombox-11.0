/**
 * @fileoverview Login form component with multi-step verification flow
 * @source boombox-10.0/src/app/components/login/loginform.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Complete login flow with phone/email verification:
 * - Step 1: Contact information input (phone or email)
 * - Step 2: Account selection (if multiple accounts exist)
 * - Step 3: Verification code entry and authentication
 * - Session conflict resolution with modal warning
 * Supports multiple account types (customer, driver, mover)
 * 
 * API ROUTES UPDATED:
 * - Old: /api/auth/send-code → New: /api/auth/send-code ✅ (no change)
 * - Old: /api/auth/verify-code → New: /api/auth/verify-code ✅ (no change)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic tokens (primary, surface, text colors)
 * - Applied btn-primary and btn-secondary utility classes
 * - Updated loading spinner with design system colors
 * - Consistent spacing and layout patterns
 * - Modal uses design system Modal component
 * 
 * BUSINESS LOGIC EXTRACTION:
 * - Extracted all business logic into useLogin custom hook
 * - Component focuses purely on UI rendering and user interactions
 * - Improved testability and maintainability
 * 
 * @refactor Separated business logic from UI, enhanced with design system compliance,
 * improved accessibility with ARIA labels and keyboard navigation, clean component architecture
 */

'use client';

import React from 'react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import { LoginStep1 } from './LoginStep1';
import { LoginStep2 } from './LoginStep2';
import { VerificationCode } from './VerificationCodeInput';
import { Modal } from '@/components/ui/primitives/Modal/Modal';
import { Button } from '@/components/ui/primitives/Button/Button';
import { useLogin } from '@/hooks/useLogin';

/**
 * LoginForm - Complete authentication flow component
 * 
 * @example
 * ```tsx
 * // Basic usage in a page
 * <LoginForm />
 * ```
 */
export function LoginForm() {
 const login = useLogin();
 
 return (
  <div className="my-20 w-full px-6 lg:px-16 min-h-[500px]">
   <div className="relative mx-auto flex max-w-sm flex-col items-center justify-center">
    {/* Back Button */}
    {(login.isCodeSent || login.showAccountSelection) && (
     <ChevronLeftIcon
      className="absolute left-0 top-7 w-8 -translate-y-1/2 transform cursor-pointer text-text-primary hover:text-primary"
      onClick={login.handleBackClick}
      role="button"
      aria-label="Go back"
      tabIndex={0}
      onKeyDown={(e) => {
       if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        login.handleBackClick();
       }
      }}
     />
    )}
    
    {/* Header */}
    <h1 className="mb-12 text-text-primary">Log in</h1>
    
    {/* Form Steps */}
    <div className="w-full">
     {/* Step 1: Contact Information */}
     {!login.isCodeSent && !login.showAccountSelection && (
      <LoginStep1
       hideEmailInput={login.hideEmailInput}
       hidePhoneInput={login.hidePhoneInput}
       phoneNumber={login.formData.phoneNumber}
       email={login.formData.email}
       phoneError={login.errors.phoneNumberError}
       emailError={login.errors.emailError}
       onPhoneChange={(phone) =>
        login.setFormData({ ...login.formData, phoneNumber: phone })
       }
       onEmailChange={(email) =>
        login.setFormData({ ...login.formData, email })
       }
       onClearPhoneError={login.clearPhoneNumberError}
       onClearEmailError={login.clearEmailError}
      />
     )}
     
     {/* Step 2: Account Selection */}
     {login.showAccountSelection && (
      <LoginStep2
       accounts={login.accounts}
       selectedAccountId={login.selectedAccountId}
       onAccountSelect={login.handleAccountSelect}
       onBack={login.handleBackClick}
      />
     )}
     
     {/* Step 3: Verification Code */}
     {login.isCodeSent && (
      <VerificationCode
       code={login.verificationCode}
       description={`Enter the 4-digit verification code sent to your ${
        login.hidePhoneInput ? 'email' : 'phone number'
       }`}
       setCode={login.setVerificationCode}
       error={login.errors.verificationError}
       clearError={login.clearVerificationError}
      />
     )}
     
    {/* Submit Button */}
    <Button
     variant="primary"
     size="md"
     fullWidth
     loading={login.isLoading}
     onClick={
      login.showAccountSelection
       ? login.handleContinueWithAccount
       : login.handleSendVerificationCode
     }
     disabled={login.isLoading || (login.showAccountSelection && !login.selectedAccountId)}
     className="mt-4"
    >
     {login.isLoading
      ? login.isCodeSent
       ? 'Verifying...'
       : 'Sending Verification Code...'
      : login.isCodeSent
      ? 'Log In'
      : login.showAccountSelection
      ? 'Continue'
      : 'Send Verification Code'}
    </Button>
     
    {/* Helper Text */}
    <div className="items-center md:flex">
     <div className="mt-4 p-3 mb-12 border border-slate-100 bg-white rounded-md w-full">
      {!login.isCodeSent && !login.showAccountSelection ? (
       <p className="text-xs">
        Can&apos;t remember your{' '}
        {login.hidePhoneInput ? 'email' : 'phone number'}? Verify your
        account with your{' '}
        <span
         className="cursor-pointer font-bold underline text-text-primary hover:text-primary"
         onClick={login.toggleInputMethod}
         onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
           e.preventDefault();
           login.toggleInputMethod();
          }
         }}
         role="button"
         tabIndex={0}
        >
         {login.hidePhoneInput
          ? 'phone number instead'
          : 'email instead'}
        </span>
       </p>
      ) : login.showAccountSelection ? (
       <p className="text-xs">
        You have multiple account types connected to your phone number or email.
        Please select your preferred account.
       </p>
      ) : login.isCodeSent ? (
       <p className="text-xs">
        Didn&apos;t receive code?{' '}
        <button
         onClick={login.handleResend}
         className="font-semibold underline text-text-primary hover:text-primary"
         disabled={login.isLoading}
        >
         Resend
        </button>
       </p>
      ) : null}
     </div>
    </div>
    </div>
   </div>
   
   {/* Session Warning Modal */}
   <Modal
    open={login.showSessionWarning}
    onClose={login.handleSessionWarningClose}
    title="Account Session Warning"
    size="md"
   >
    <div className="space-y-4">
     <p className="text-text-primary">
      You are currently logged into another account. To log in to this
      account, you need to log out of your current session first.
     </p>
     <p className="text-sm text-text-secondary">
      Your verification will be saved and you'll be logged in after
      signing out of the current session.
     </p>
     
    {/* Modal Actions */}
    <div className="flex space-x-3 pt-4">
     <Button
      variant="primary"
      onClick={login.handleSessionWarningConfirm}
      disabled={login.isLoading}
      loading={login.isLoading}
      className="flex-1"
     >
      {login.isLoading ? 'Processing...' : 'Log Out & Continue'}
     </Button>
     <Button
      variant="ghost"
      onClick={login.handleSessionWarningClose}
      disabled={login.isLoading}
      className="flex-1"
     >
      Cancel
     </Button>
    </div>
    </div>
   </Modal>
  </div>
 );
}

export default LoginForm;


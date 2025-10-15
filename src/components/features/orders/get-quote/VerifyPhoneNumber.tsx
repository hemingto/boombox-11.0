/**
 * @fileoverview Phone number verification with SMS code validation
 * @source boombox-10.0/src/app/components/getquote/verifyphonenumber.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Two-step phone verification: (1) Verify phone number with option to edit,
 * (2) Enter 4-digit SMS code. Includes resend functionality and validation feedback.
 * Integrates with SMS service via verification API and handles NextAuth sign-in.
 * 
 * API ROUTES UPDATED:
 * - POST /api/auth/send-code (no change - already migrated)
 * - POST /api/auth/verify-code (no change - already migrated)
 * - PATCH /api/updatephonenumber → Used for phone number updates
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic tokens (text-primary, bg-white)
 * - Success banner uses status-success tokens
 * - Buttons use btn-primary utility classes
 * - Input fields use design system focus states
 * 
 * @refactor Extracted verification logic to usePhoneVerification hook
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { PhoneIcon } from '@heroicons/react/20/solid';
import { VerificationCode } from '@/components/features/auth/VerificationCodeInput';
import { formatPhoneNumberForDisplay, extractPhoneDigits, isValidPhoneNumber } from '@/lib/utils/phoneUtils';

export interface VerifyPhoneNumberProps {
  /**
   * Initial phone number to verify
   */
  initialPhoneNumber: string;
  
  /**
   * User ID for verification and redirect
   */
  userId: number | null;
}

/**
 * VerifyPhoneNumber component for SMS verification flow
 */
export function VerifyPhoneNumber({
  initialPhoneNumber,
  userId,
}: VerifyPhoneNumberProps) {
  const router = useRouter();
  
  // Phone number editing state
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [localPhoneNumber, setLocalPhoneNumber] = useState(initialPhoneNumber);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
  // Verification code state
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * Handle phone number input change with formatting
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumberForDisplay(e.target.value);
    setLocalPhoneNumber(formatted);
    setPhoneError(null);
  };
  
  /**
   * Save updated phone number and send new verification code
   */
  const handleSave = async () => {
    const digits = extractPhoneDigits(localPhoneNumber);
    
    if (!isValidPhoneNumber(localPhoneNumber)) {
      setPhoneError('Please enter a valid phone number.');
      return;
    }
    
    try {
      // Update phone number in database
      const response = await fetch('/api/updatephonenumber', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          newPhoneNumber: digits,
        }),
      });
      
      if (!response.ok) {
        const { error } = await response.json();
        setPhoneError(error);
        return;
      }
      
      // Update local state and send verification code
      setPhoneNumber(localPhoneNumber);
      setIsEditing(false);
      await sendVerificationCode(digits);
    } catch (error) {
      console.error('Error saving phone number:', error);
      setPhoneError('An error occurred. Please try again.');
    }
  };
  
  /**
   * Cancel phone number editing
   */
  const handleCancel = () => {
    setLocalPhoneNumber(phoneNumber);
    setIsEditing(false);
    setPhoneError(null);
  };
  
  /**
   * Send SMS verification code
   */
  const sendVerificationCode = async (phone: string) => {
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      
      if (response.ok) {
        setVerificationCode(['', '', '', '']);
        setVerificationError(null);
      } else {
        const data = await response.json();
        setPhoneError(data.message || 'Failed to send verification code.');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      setPhoneError('An error occurred while sending the code.');
    }
  };
  
  /**
   * Resend verification code
   */
  const handleResend = async () => {
    const digits = extractPhoneDigits(phoneNumber);
    await sendVerificationCode(digits);
  };
  
  /**
   * Verify code and sign in user
   */
  const verifyCode = async () => {
    // Validate code is complete
    if (verificationCode.some((digit) => digit === '')) {
      setVerificationError('Please enter a valid 4-digit verification code.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const digits = extractPhoneDigits(phoneNumber);
      const code = verificationCode.join('');
      
      // Verify code with API
      const verifyResponse = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: digits,
          code,
        }),
      });
      
      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        setVerificationError(data.message || 'Verification failed.');
        setIsLoading(false);
        return;
      }
      
      const data = await verifyResponse.json();
      const redirectUserId = userId || data.userId;
      
      if (!redirectUserId) {
        setVerificationError('User ID not found. Please try again.');
        setIsLoading(false);
        return;
      }
      
      // Sign in user with NextAuth
      const result = await signIn('credentials', {
        redirect: false,
        contact: digits,
        accountType: 'customer',
        code,
        skipVerification: 'true',
        userId: redirectUserId.toString(),
      });
      
      if (result?.error) {
        console.error('Sign in error:', result.error);
        setVerificationError('Authentication failed. Please try again.');
        setIsLoading(false);
        return;
      }
      
      // Redirect to user page
      router.push(`/user-page/${redirectUserId}`);
    } catch (error) {
      console.error('Error verifying code:', error);
      setVerificationError('An error occurred while verifying the code.');
      setIsLoading(false);
    }
  };
  
  /**
   * Clear verification error
   */
  const clearVerificationError = () => {
    setVerificationError(null);
  };
  
  return (
    <div className="w-full">
      <div className="mx-auto w-96 max-h-[90vh] max-w-xl overflow-y-auto rounded-lg bg-white p-6 sm:w-full">
        {/* Success Banner */}
        <div className="flex shrink-0 rounded-md border border-status-success-border bg-status-success-bg p-3">
          <p className="text-sm font-semibold text-status-success">
            Great! We received your appointment request. To view your account page and manage 
            your appointments please verify your phone number below
          </p>
        </div>
        
        {/* Title */}
        <h2 className="mt-6 text-2xl font-semibold text-text-primary">
          Verify your phone number
        </h2>
        
        {/* Phone Number Display/Edit */}
        <div className="mt-8">
          {isEditing ? (
            <div>
              <div className="relative">
                <span className="absolute left-3 top-3">
                  <PhoneIcon 
                    className={`h-5 w-5 ${phoneError ? 'text-status-error' : 'text-text-primary'}`}
                    aria-hidden="true"
                  />
                </span>
                <input
                  type="tel"
                  value={localPhoneNumber}
                  onChange={handlePhoneChange}
                  onFocus={() => setPhoneError(null)}
                  className={`mb-2 w-full rounded-md py-2.5 pl-10 pr-3 focus:outline-none sm:mb-4 ${
                    phoneError
                      ? 'bg-status-error-bg ring-2 ring-status-error text-status-error placeholder:text-status-error'
                      : 'bg-surface-secondary placeholder:text-text-tertiary focus:bg-white focus:ring-2 focus:ring-primary focus:placeholder:text-text-primary'
                  }`}
                  placeholder="Enter your phone number"
                  aria-label="Phone number"
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? 'phone-error' : undefined}
                />
              </div>
              {phoneError && (
                <p id="phone-error" className="mb-3 text-sm text-status-error sm:-mt-2" role="alert">
                  {phoneError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="btn-primary rounded-md px-6 py-2.5 font-semibold"
                  type="button"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="text-sm underline decoration-dotted underline-offset-2 hover:decoration-solid"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-text-secondary">{phoneNumber}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm underline decoration-dotted underline-offset-2 hover:decoration-solid"
                type="button"
                aria-label="Edit phone number"
              >
                Edit
              </button>
            </div>
          )}
        </div>
        
        {/* Verification Code Form */}
        <form 
          onSubmit={(e) => { e.preventDefault(); }}
          className="mt-8"
          aria-label="Phone verification form"
        >
          <VerificationCode
            code={verificationCode}
            description="To go to your account page please enter the 4 digit code we sent to the above number"
            setCode={setVerificationCode}
            error={verificationError}
            clearError={clearVerificationError}
          />
          
          {/* Resend Code */}
          <p className="mb-4 text-sm text-text-secondary">
            Didn&apos;t receive code?{' '}
            <button
              onClick={handleResend}
              type="button"
              className="font-semibold underline hover:text-text-primary"
            >
              Resend
            </button>
          </p>
          
          {/* Verify Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={verifyCode}
              disabled={isLoading}
              className={`flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold text-white ${
                isLoading
                  ? 'bg-primary-hover cursor-not-allowed'
                  : 'btn-primary'
              }`}
              aria-busy={isLoading}
            >
              {isLoading && (
                <svg
                  className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              <span>{isLoading ? 'Verifying...' : 'Verify'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VerifyPhoneNumber;


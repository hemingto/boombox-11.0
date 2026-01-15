/**
 * @fileoverview Session Expiration Modal with in-modal re-authentication
 * @source Created for boombox-11.0 session expiration handling
 * 
 * COMPONENT FUNCTIONALITY:
 * - Shows countdown timer when session is expiring soon
 * - Allows user to re-authenticate without leaving the page
 * - Supports phone and email verification flow
 * - Uses Modal and Button primitives from design system
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Modal } from '@/components/ui/primitives/Modal/Modal';
import { Button } from '@/components/ui/primitives/Button/Button';
import { formatTimeRemaining } from '@/lib/utils/sessionUtils';
import { isValidEmail } from '@/lib/utils/validationUtils';
import { isValidPhoneNumber } from '@/lib/utils/phoneUtils';
import PhoneNumberInput from '@/components/forms/PhoneNumberInput';
import EmailInput from '@/components/forms/EmailInput';
import { VerificationCode } from '@/components/features/auth/VerificationCodeInput';

export interface SessionExpirationModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;
  
  /**
   * Number of seconds remaining until session expires
   */
  secondsRemaining: number;
  
  /**
   * Whether the session has already expired
   */
  isExpired: boolean;
  
  /**
   * Callback after successful re-authentication
   */
  onReauthenticated: () => void;
}

type AuthStep = 'input' | 'verification' | 'success';

export function SessionExpirationModal({
  open,
  secondsRemaining,
  isExpired,
  onReauthenticated,
}: SessionExpirationModalProps) {
  // Form state
  const [contact, setContact] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [step, setStep] = useState<AuthStep>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useEmail, setUseEmail] = useState(false);
  
  // Update countdown display every second
  const [displayTime, setDisplayTime] = useState(formatTimeRemaining(secondsRemaining));
  
  useEffect(() => {
    if (open) {
      setDisplayTime(formatTimeRemaining(secondsRemaining));
    }
  }, [secondsRemaining, open]);
  
  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setContact('');
      setVerificationCode(['', '', '', '']);
      setStep('input');
      setError(null);
      setIsLoading(false);
    }
  }, [open]);
  
  /**
   * Validate contact input
   */
  const validateContact = useCallback(() => {
    if (!contact) {
      setError(`Please enter your ${useEmail ? 'email' : 'phone number'}`);
      return false;
    }
    
    if (useEmail) {
      if (!isValidEmail(contact)) {
        setError('Please enter a valid email address');
        return false;
      }
    } else {
      if (!isValidPhoneNumber(contact)) {
        setError('Please enter a valid phone number');
        return false;
      }
    }
    
    setError(null);
    return true;
  }, [contact, useEmail]);
  
  /**
   * Send verification code
   */
  const handleSendCode = useCallback(async () => {
    if (!validateContact()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: contact.trim() }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send verification code');
      }
      
      setStep('verification');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [contact, validateContact]);
  
  /**
   * Auto-submit when all digits entered
   */
  useEffect(() => {
    if (step === 'verification' && verificationCode.every(digit => digit !== '')) {
      handleVerifyCode(verificationCode.join(''));
    }
  }, [verificationCode, step]);
  
  /**
   * Verify code and re-authenticate
   */
  const handleVerifyCode = useCallback(async (code: string) => {
    if (code.length !== 4) {
      setError('Please enter a valid 4-digit code');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Re-authenticate with NextAuth
      const result = await signIn('credentials', {
        contact: contact.trim(),
        code,
        accountType: 'USER', // Default to user, will match any account type
        redirect: false,
      });
      
      if (result?.error) {
        throw new Error('Invalid verification code. Please try again.');
      }
      
      setStep('success');
      
      // Wait a moment to show success, then close
      setTimeout(() => {
        onReauthenticated();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
      setIsLoading(false);
    }
  }, [contact, onReauthenticated]);
  
  /**
   * Toggle between phone and email
   */
  const toggleContactMethod = useCallback(() => {
    setUseEmail(!useEmail);
    setContact('');
    setError(null);
  }, [useEmail]);
  
  /**
   * Go back to input step
   */
  const handleBack = useCallback(() => {
    setStep('input');
    setVerificationCode(['', '', '', '']);
    setError(null);
  }, []);
  
  return (
    <Modal
      open={open}
      onClose={() => {}} // Prevent closing
      closeOnOverlayClick={false}
      showCloseButton={false}
      size="sm"
      className="bg-surface-primary p-6 rounded-lg shadow-xl"
    >
      {step === 'input' && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              {isExpired ? 'Session Expired' : 'Session Expiring Soon'}
            </h2>
            {!isExpired && (
              <p className="text-sm text-text-primary">
                Your session expires in <span className="font-semibold text-primary">{displayTime}</span>
              </p>
            )}
            <p className="text-sm text-text-primary mt-2">
              Please re-authenticate to continue working.
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-status-bg-error rounded-md">
              <p className="text-sm text-status-error">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              {useEmail ? (
                <EmailInput
                  value={contact}
                  onEmailChange={setContact}
                  label="Email Address"
                  placeholder="Enter your email"
                  disabled={isLoading}
                  hasError={!!error}
                  errorMessage={error || ''}
                  onClearError={() => setError(null)}
                  required
                />
              ) : (
                <PhoneNumberInput
                  value={contact}
                  onChange={setContact}
                  label="Phone Number"
                  placeholder="Enter your phone number"
                  disabled={isLoading}
                  hasError={!!error}
                  errorMessage={error || ''}
                  onClearError={() => setError(null)}
                  required
                />
              )}
            </div>
            
            <div className="text-sm text-text-primary">
              Forgot your {useEmail ? 'phone number' : 'email'}? Verify with your{' '}
              <button
                type="button"
                onClick={toggleContactMethod}
                className="text-primary hover:underline"
                disabled={isLoading}
              >
                {useEmail ? 'phone number' : 'email'}
              </button>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={handleSendCode}
                loading={isLoading}
                disabled={isLoading || !contact}
                variant="primary"
                size="md"
              >
                Send Verification Code
              </Button>
            </div>
          </div>
        </>
      )}
      
      {step === 'verification' && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Enter Verification Code
            </h2>
            <p className="text-sm text-text-primary">
              We sent a 4-digit code to {contact}
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-status-bg-error rounded-md">
              <p className="text-sm text-status-error">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <VerificationCode
              code={verificationCode}
              setCode={setVerificationCode}
              description=""
              error={error}
              clearError={() => setError(null)}
              codeLength={4}
            />
            
            <div className="flex gap-3 justify-end">
              <Button
                onClick={handleBack}
                disabled={isLoading}
                variant="secondary"
                size="md"
              >
                Back
              </Button>
              <Button
                onClick={handleSendCode}
                disabled={isLoading}
                variant="secondary"
                size="md"
              >
                Resend Code
              </Button>
            </div>
          </div>
        </>
      )}
      
      {step === 'success' && (
        <div className="text-center py-8">
          <div className="mb-4 w-16 h-16 bg-status-success/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircleIcon className="w-8 h-8 text-status-success" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Session Extended
          </h2>
          <p className="text-sm text-text-primary">
            You can continue working...
          </p>
        </div>
      )}
    </Modal>
  );
}


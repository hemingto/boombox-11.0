/**
 * @fileoverview Phone verification with SMS code handling
 * @source Extracted from boombox-10.0/src/app/components/getquote/verifyphonenumber.tsx
 * 
 * Custom hook for SMS verification flow including:
 * - Code sending with rate limiting
 * - Code verification
 * - Resend functionality with countdown timer
 * - Phone number formatting
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  formatPhoneNumberForDisplay, 
  extractPhoneDigits, 
  isValidPhoneNumber 
} from '@/lib/utils/phoneUtils';

/**
 * Validate verification code format (6 digits)
 * NOTE: This is specific to verification codes and doesn't exist in general validation utils
 */
function validateVerificationCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Custom hook for phone verification flow
 * 
 * @param initialPhone - Optional pre-filled phone number
 * @param skipAccountCheck - Whether to skip account existence check (default: false, use true for profile verification)
 * @returns Phone verification state and actions
 * 
 * @example
 * ```tsx
 * const {
 *   phoneNumber,
 *   displayPhoneNumber,
 *   code,
 *   isCodeSent,
 *   isVerified,
 *   isLoading,
 *   canResend,
 *   resendTimer,
 *   errors,
 *   setPhoneNumber,
 *   setCode,
 *   sendCode,
 *   verifyCode,
 *   resendCode
 * } = usePhoneVerification('4155551234', true);
 * ```
 */
export function usePhoneVerification(initialPhone?: string, skipAccountCheck: boolean = false) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '');
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);
  const [errors, setErrors] = useState({
    phoneError: null as string | null,
    codeError: null as string | null,
  });
  
  /**
   * Format phone number for display whenever it changes
   */
  useEffect(() => {
    setDisplayPhoneNumber(formatPhoneNumberForDisplay(phoneNumber));
  }, [phoneNumber]);
  
  /**
   * Start resend cooldown timer (60 seconds)
   */
  const startResendTimer = useCallback(() => {
    setCanResend(false);
    setResendTimer(60);
    
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);
  
  /**
   * Send verification code via SMS
   */
  const sendCode = useCallback(async () => {
    setErrors({ phoneError: null, codeError: null });
    
    const cleaned = extractPhoneDigits(phoneNumber);
    if (!isValidPhoneNumber(phoneNumber)) {
      setErrors(prev => ({
        ...prev,
        phoneError: 'Please enter a valid 10-digit phone number',
      }));
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: cleaned,
          skipAccountCheck // Pass through the skipAccountCheck flag
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send verification code');
      }
      
      setIsCodeSent(true);
      startResendTimer();
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        phoneError: error instanceof Error ? error.message : 'Failed to send code',
      }));
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, skipAccountCheck, startResendTimer]);
  
  /**
   * Resend verification code
   */
  const resendCode = useCallback(async () => {
    if (!canResend) return;
    
    setCode('');
    setErrors({ phoneError: null, codeError: null });
    await sendCode();
  }, [canResend, sendCode]);
  
  /**
   * Verify SMS code
   * 
   * @param userId - Optional user ID for verification context
   * @returns Verification result or null on failure
   */
  const verifyCode = useCallback(async (userId?: number) => {
    setErrors({ phoneError: null, codeError: null });
    
    if (!validateVerificationCode(code)) {
      setErrors(prev => ({
        ...prev,
        codeError: 'Please enter the 6-digit code',
      }));
      return null;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: extractPhoneDigits(phoneNumber),
          code,
          userId,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Invalid verification code');
      }
      
      const result = await response.json();
      setIsVerified(true);
      return result;
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        codeError: error instanceof Error ? error.message : 'Invalid code',
      }));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, code]);
  
  return {
    phoneNumber,
    displayPhoneNumber,
    code,
    isCodeSent,
    isVerified,
    isLoading,
    canResend,
    resendTimer,
    errors,
    setPhoneNumber,
    setCode,
    sendCode,
    resendCode,
    verifyCode,
  };
}


/**
 * @fileoverview Custom hook for managing quote email sending functionality
 * @source boombox-10.0/src/app/components/reusablecomponents/sendquoteemailpopup.tsx (state management logic)
 * 
 * HOOK FUNCTIONALITY:
 * Manages state and business logic for sending quote emails including loading states,
 * error handling, success feedback, and form validation. Provides a clean interface
 * for components to handle quote email operations.
 * 
 * API ROUTES UPDATED:
 * - Uses QuoteService which handles the new API route mapping
 * 
 * ARCHITECTURE IMPROVEMENTS:
 * - Extracted state management and business logic from component
 * - Centralized error handling and validation logic
 * - Provides reusable interface for quote email functionality
 * - Enhanced type safety with comprehensive TypeScript interfaces
 * 
 * @refactor Separated business logic from UI components following clean architecture principles
 */

import { useState, useCallback } from 'react';
import { QuoteService, type QuoteData } from '@/lib/services/quoteService';
import { isValidEmail } from '@/lib/utils/validationUtils';

export interface UseSendQuoteEmailOptions {
  /**
   * Callback fired when email is sent successfully
   */
  onSuccess?: (email: string) => void;
  
  /**
   * Callback fired when email sending fails
   */
  onError?: (error: string) => void;
  
  /**
   * Auto-clear error after specified milliseconds
   */
  autoClearError?: number;
}

export interface UseSendQuoteEmailReturn {
  /**
   * Current email value
   */
  email: string;
  
  /**
   * Set email value
   */
  setEmail: (email: string) => void;
  
  /**
   * Current error message
   */
  error: string;
  
  /**
   * Whether email is currently being sent
   */
  isLoading: boolean;
  
  /**
   * Whether email was sent successfully
   */
  isSuccess: boolean;
  
  /**
   * Send quote email function
   */
  sendQuoteEmail: (quoteData: QuoteData) => Promise<void>;
  
  /**
   * Clear error message
   */
  clearError: () => void;
  
  /**
   * Reset all state to initial values
   */
  reset: () => void;
  
  /**
   * Validate current email
   */
  validateCurrentEmail: () => boolean;
}

/**
 * Custom hook for managing quote email sending functionality
 * 
 * @param options - Configuration options for the hook
 * @returns Hook interface with state and actions
 * 
 * @example
 * ```typescript
 * const {
 *   email,
 *   setEmail,
 *   error,
 *   isLoading,
 *   isSuccess,
 *   sendQuoteEmail,
 *   reset
 * } = useSendQuoteEmail({
 *   onSuccess: (email) => console.log(`Quote sent to ${email}`),
 *   onError: (error) => console.error('Failed to send quote:', error)
 * });
 * 
 * // In form submit handler
 * const handleSubmit = async (e: React.FormEvent) => {
 *   e.preventDefault();
 *   await sendQuoteEmail(quoteData);
 * };
 * ```
 */
export const useSendQuoteEmail = (
  options: UseSendQuoteEmailOptions = {}
): UseSendQuoteEmailReturn => {
  const { onSuccess, onError, autoClearError } = options;
  
  // State management
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError('');
  }, []);

  /**
   * Set error with optional auto-clear
   */
  const setErrorWithAutoClear = useCallback((errorMessage: string) => {
    setError(errorMessage);
    onError?.(errorMessage);
    
    if (autoClearError && autoClearError > 0) {
      setTimeout(() => {
        setError('');
      }, autoClearError);
    }
  }, [onError, autoClearError]);

  /**
   * Validate current email
   */
  const validateCurrentEmail = useCallback((): boolean => {
    if (!email || !email.trim()) {
      setErrorWithAutoClear('Please enter an email address');
      return false;
    }

    if (!isValidEmail(email)) {
      setErrorWithAutoClear('Please enter a valid email address');
      return false;
    }

    return true;
  }, [email, setErrorWithAutoClear]);

  /**
   * Send quote email
   */
  const sendQuoteEmail = useCallback(async (quoteData: QuoteData) => {
    // Clear previous state
    setError('');
    setIsSuccess(false);

    // Validate email
    if (!validateCurrentEmail()) {
      return;
    }

    // Validate quote data
    const validation = QuoteService.validateQuoteData(quoteData);
    if (!validation.isValid) {
      setErrorWithAutoClear(validation.error || 'Invalid quote data');
      return;
    }

    setIsLoading(true);

    try {
      const result = await QuoteService.sendQuoteEmail(email, quoteData);

      if (result.success) {
        setIsSuccess(true);
        onSuccess?.(email);
        console.log('Quote email sent successfully to:', email);
      } else {
        const errorMessage = result.error?.message || 'Failed to send email. Please try again.';
        setErrorWithAutoClear(errorMessage);
      }
    } catch (error) {
      console.error('Error in useSendQuoteEmail:', error);
      setErrorWithAutoClear('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [email, validateCurrentEmail, setErrorWithAutoClear, onSuccess]);

  /**
   * Reset all state to initial values
   */
  const reset = useCallback(() => {
    setEmail('');
    setError('');
    setIsLoading(false);
    setIsSuccess(false);
  }, []);

  /**
   * Update email and clear error
   */
  const setEmailWithClearError = useCallback((newEmail: string) => {
    setEmail(newEmail);
    if (error) {
      setError('');
    }
  }, [error]);

  return {
    email,
    setEmail: setEmailWithClearError,
    error,
    isLoading,
    isSuccess,
    sendQuoteEmail,
    clearError,
    reset,
    validateCurrentEmail,
  };
};

/**
 * @fileoverview Custom hook for email input validation and state management
 * @source boombox-10.0/src/app/components/reusablecomponents/emailinput.tsx (extracted logic)
 * 
 * HOOK FUNCTIONALITY:
 * Manages email input state, validation, error handling, and focus behavior.
 * Provides a clean interface for email input components with real-time validation,
 * custom validators, and comprehensive error management.
 * 
 * @refactor Extracted from EmailInput component to follow established hook patterns
 * and improve reusability across different email input implementations
 */

import { useState, useEffect, useCallback } from 'react';
import { isValidEmail, ValidationMessages } from '@/lib/utils/validationUtils';

/**
 * Custom validator function interface
 */
export interface EmailValidator {
  (email: string): { isValid: boolean; message?: string };
}

/**
 * Configuration options for useEmailInput hook
 */
export interface UseEmailInputOptions {
  /** Whether the field is required */
  required?: boolean;
  /** Whether to validate email format in real-time */
  validateOnChange?: boolean;
  /** Custom validation function */
  customValidator?: EmailValidator;
  /** Initial error state */
  hasError?: boolean;
  /** Initial error message */
  errorMessage?: string;
  /** Callback fired when error state should be cleared */
  onClearError?: () => void;
}

/**
 * Return type for useEmailInput hook
 */
export interface UseEmailInputReturn {
  // State
  isFocused: boolean;
  hasError: boolean;
  errorMessage: string;
  
  // Event handlers
  handleFocus: () => void;
  handleBlur: (value: string) => void;
  handleChange: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, value: string) => void;
  
  // Utility functions
  validateEmail: (email: string) => boolean;
  clearError: () => void;
  
  // Styling helpers
  getIconColorClass: (value: string) => string;
  getInputClasses: (baseClasses: string) => string;
}

/**
 * Custom hook for managing email input state and validation
 * 
 * @param options Configuration options for the email input
 * @returns Object containing state, handlers, and utility functions
 * 
 * @example
 * ```tsx
 * const emailInput = useEmailInput({
 *   required: true,
 *   validateOnChange: true,
 *   customValidator: (email) => ({
 *     isValid: email.includes('@company.com'),
 *     message: 'Must use company email'
 *   })
 * });
 * 
 * return (
 *   <input
 *     onFocus={emailInput.handleFocus}
 *     onBlur={(e) => emailInput.handleBlur(e.target.value)}
 *     onChange={(e) => emailInput.handleChange(e.target.value)}
 *     className={emailInput.getInputClasses('input-field')}
 *   />
 * );
 * ```
 */
export function useEmailInput(options: UseEmailInputOptions = {}): UseEmailInputReturn {
  const {
    required = false,
    validateOnChange = false,
    customValidator,
    hasError: initialHasError = false,
    errorMessage: initialErrorMessage = '',
    onClearError,
  } = options;

  // Internal state
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(initialHasError);
  const [errorMessage, setErrorMessage] = useState<string>(initialErrorMessage);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Update error state when props change
  useEffect(() => {
    setHasError(initialHasError);
    if (initialHasError && initialErrorMessage) {
      setErrorMessage(initialErrorMessage);
    }
  }, [initialHasError, initialErrorMessage]);

  /**
   * Validate email using built-in or custom validator
   */
  const validateEmail = useCallback((email: string): boolean => {
    const trimmedEmail = email.trim();

    // Check if required field is empty
    if (required && !trimmedEmail) {
      setHasError(true);
      setErrorMessage(ValidationMessages.REQUIRED);
      return false;
    }

    // Skip validation if not required and empty
    if (!required && !trimmedEmail) {
      setHasError(false);
      setErrorMessage('');
      return true;
    }

    // Use custom validator if provided
    if (customValidator) {
      const result = customValidator(trimmedEmail);
      if (!result.isValid) {
        setHasError(true);
        setErrorMessage(result.message || ValidationMessages.INVALID_EMAIL);
        return false;
      }
    } else {
      // Use built-in email validation
      if (!isValidEmail(trimmedEmail)) {
        setHasError(true);
        setErrorMessage(ValidationMessages.INVALID_EMAIL);
        return false;
      }
    }

    // Clear error if validation passes
    setHasError(false);
    setErrorMessage('');
    return true;
  }, [required, customValidator]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setHasError(false);
    setErrorMessage('');
    if (onClearError) onClearError();
  }, [onClearError]);

  /**
   * Handle input focus
   */
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Clear error on focus to allow user to correct
    if (hasError) {
      clearError();
    }
  }, [hasError, clearError]);

  /**
   * Handle input blur with validation
   */
  const handleBlur = useCallback((value: string) => {
    setIsFocused(false);
    
    // Only validate on blur if user has interacted with the field (typed something)
    // This prevents "required" errors from showing when user just clicks in and out
    if (hasInteracted) {
      validateEmail(value);
    }
  }, [validateEmail, hasInteracted]);

  /**
   * Handle input change with optional real-time validation
   */
  const handleChange = useCallback((value: string) => {
    // Mark as interacted once user starts typing
    if (value.trim()) {
      setHasInteracted(true);
    }
    
    // Real-time validation if enabled and value exists
    if (validateOnChange && value.trim()) {
      validateEmail(value);
    } else if (hasError) {
      // Clear error if user is typing and had previous error
      clearError();
    }
  }, [validateOnChange, hasError, validateEmail, clearError]);

  /**
   * Handle Enter key press for form submission
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, value: string) => {
    if (e.key === 'Enter') {
      // Validate before potential form submission
      if (value.trim()) {
        validateEmail(value);
      }
    }
  }, [validateEmail]);

  /**
   * Get icon color class based on current state
   */
  const getIconColorClass = useCallback((value: string): string => {
    if (hasError) return 'text-status-error';
    if (value) return 'text-primary';
    if (isFocused) return 'text-primary';
    return 'text-text-secondary';
  }, [hasError, isFocused]);

  /**
   * Get input classes with error state
   */
  const getInputClasses = useCallback((baseClasses: string): string => {
    const errorClass = hasError ? 'input-field--error' : '';
    return `${baseClasses} ${errorClass}`.trim();
  }, [hasError]);

  return {
    // State
    isFocused,
    hasError,
    errorMessage,
    
    // Event handlers
    handleFocus,
    handleBlur,
    handleChange,
    handleKeyDown,
    
    // Utility functions
    validateEmail,
    clearError,
    
    // Styling helpers
    getIconColorClass,
    getInputClasses,
  };
}

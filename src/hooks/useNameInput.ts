/**
 * @fileoverview Custom hook for name input validation and state management
 * @source boombox-10.0/src/app/components/reusablecomponents/firstnameinput.tsx (extracted logic)
 * 
 * HOOK FUNCTIONALITY:
 * Manages name input state, validation, error handling, and focus behavior.
 * Provides a clean interface for name input components with real-time validation,
 * custom validators, and comprehensive error management.
 * 
 * @refactor Extracted from FirstNameInput component to follow established hook patterns
 * and improve reusability across different name input implementations
 */

import { useState, useEffect, useCallback } from 'react';
import { isValidName, ValidationMessages } from '@/lib/utils/validationUtils';

/**
 * Custom validator function interface
 */
export interface NameValidator {
  (name: string): { isValid: boolean; message?: string };
}

/**
 * Configuration options for useNameInput hook
 */
export interface UseNameInputOptions {
  /** Whether the field is required */
  required?: boolean;
  /** Whether to validate name format in real-time */
  validateOnChange?: boolean;
  /** Custom validation function */
  customValidator?: NameValidator;
  /** External error state control */
  hasError?: boolean;
  /** External error message control */
  errorMessage?: string;
  /** Callback when error should be cleared */
  onClearError?: () => void;
}

/**
 * Return type for useNameInput hook
 */
export interface UseNameInputReturn {
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
  validateName: (name: string) => boolean;
  clearError: () => void;
  
  // Styling helpers
  getInputClasses: (baseClasses: string) => string;
}

/**
 * Custom hook for managing name input state and validation
 * 
 * @param options Configuration options for the name input
 * @returns Object containing state, handlers, and utility functions
 * 
 * @example
 * ```tsx
 * const nameInput = useNameInput({
 *   required: true,
 *   validateOnChange: true,
 *   customValidator: (name) => ({
 *     isValid: name.length >= 2,
 *     message: 'Name must be at least 2 characters'
 *   })
 * });
 * 
 * return (
 *   <input
 *     onFocus={nameInput.handleFocus}
 *     onBlur={(e) => nameInput.handleBlur(e.target.value)}
 *     onChange={(e) => nameInput.handleChange(e.target.value)}
 *     className={nameInput.getInputClasses('input-field')}
 *   />
 * );
 * ```
 */
export function useNameInput(options: UseNameInputOptions = {}): UseNameInputReturn {
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

  // Update error state when props change
  useEffect(() => {
    setHasError(initialHasError);
    if (initialHasError && initialErrorMessage) {
      setErrorMessage(initialErrorMessage);
    }
  }, [initialHasError, initialErrorMessage]);

  /**
   * Validate name using built-in or custom validator
   */
  const validateName = useCallback((name: string): boolean => {
    const trimmedName = name.trim();

    // Check if required field is empty
    if (required && !trimmedName) {
      setHasError(true);
      setErrorMessage(ValidationMessages.REQUIRED);
      return false;
    }

    // Skip validation if not required and empty
    if (!required && !trimmedName) {
      setHasError(false);
      setErrorMessage('');
      return true;
    }

    // Use custom validator if provided
    if (customValidator) {
      const result = customValidator(trimmedName);
      if (!result.isValid) {
        setHasError(true);
        setErrorMessage(result.message || ValidationMessages.INVALID_NAME);
        return false;
      }
    } else {
      // Use built-in name validation
      if (!isValidName(trimmedName)) {
        setHasError(true);
        setErrorMessage(ValidationMessages.INVALID_NAME);
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
    
    // Validate on blur
    validateName(value);
  }, [validateName]);

  /**
   * Handle input change with optional real-time validation
   */
  const handleChange = useCallback((value: string) => {
    // Clear error when user starts typing (if not validating on change)
    if (!validateOnChange && hasError) {
      clearError();
    }

    // Validate in real-time if enabled
    if (validateOnChange) {
      validateName(value);
    }
  }, [validateOnChange, hasError, clearError, validateName]);

  /**
   * Handle keyboard events for accessibility
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, value: string) => {
    // Clear error on Escape key
    if (e.key === 'Escape' && hasError) {
      clearError();
      e.preventDefault();
    }

    // Validate on Enter key
    if (e.key === 'Enter') {
      validateName(value);
    }
  }, [hasError, clearError, validateName]);

  /**
   * Generate input classes based on state
   */
  const getInputClasses = useCallback((baseClasses: string): string => {
    const errorClasses = hasError ? 'input-field--error' : '';
    const focusClasses = isFocused ? 'ring-2 ring-border-focus' : '';
    
    return `${baseClasses} ${errorClasses} ${focusClasses}`.trim();
  }, [hasError, isFocused]);

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
    validateName,
    clearError,
    
    // Styling helpers
    getInputClasses,
  };
}

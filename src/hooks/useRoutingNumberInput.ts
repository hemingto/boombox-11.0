/**
 * @fileoverview Custom hook for routing number input validation and state management
 * @source boombox-10.0/src/app/components/reusablecomponents/routingnumberinput.tsx (extracted logic)
 * 
 * HOOK FUNCTIONALITY:
 * Manages routing number input state, validation, error handling, and focus behavior.
 * Provides numeric-only input filtering, 9-digit validation, and comprehensive error management
 * following banking industry standards for routing number format.
 * 
 * @refactor Extracted from RoutingNumberInput component to follow established hook patterns
 * and improve reusability with the unified Input component system
 */

import { useState, useEffect, useCallback } from 'react';
import { isValidRoutingNumber, ValidationMessages } from '@/lib/utils/validationUtils';

/**
 * Custom validator function interface for routing numbers
 */
export interface RoutingNumberValidator {
  (routingNumber: string): { isValid: boolean; message?: string };
}

/**
 * Configuration options for useRoutingNumberInput hook
 */
export interface UseRoutingNumberInputOptions {
  /** Whether the field is required */
  required?: boolean;
  /** Whether to validate routing number format in real-time */
  validateOnChange?: boolean;
  /** Custom validation function */
  customValidator?: RoutingNumberValidator;
  /** Initial error state */
  hasError?: boolean;
  /** Initial error message */
  errorMessage?: string;
  /** Callback fired when error state should be cleared */
  onClearError?: () => void;
  /** Callback fired when routing number changes */
  onRoutingNumberChange?: (routingNumber: string) => void;
}

/**
 * Return type for useRoutingNumberInput hook
 */
export interface UseRoutingNumberInputReturn {
  // State
  value: string;
  isFocused: boolean;
  hasError: boolean;
  errorMessage: string;
  
  // Event handlers
  handleFocus: () => void;
  handleBlur: () => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  
  // Utility functions
  validateRoutingNumber: (routingNumber?: string) => boolean;
  clearError: () => void;
  setValue: (value: string) => void;
  
  // Input props for easy spreading
  inputProps: {
    type: 'text';
    inputMode: 'numeric';
    pattern: '[0-9]*';
    maxLength: 9;
    placeholder: 'Routing Number';
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus: () => void;
    onBlur: () => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    'aria-label': string;
    'aria-invalid': boolean;
    'aria-describedby'?: string;
  };
}

/**
 * Custom hook for managing routing number input state and validation
 * 
 * @param initialValue Initial routing number value
 * @param options Configuration options for the routing number input
 * @returns Object containing state, handlers, and utility functions
 * 
 * @example
 * ```tsx
 * const routingInput = useRoutingNumberInput('', {
 *   required: true,
 *   validateOnChange: false,
 *   onRoutingNumberChange: (value) => setFormData({...formData, routingNumber: value})
 * });
 * 
 * return (
 *   <Input
 *     {...routingInput.inputProps}
 *     error={routingInput.hasError ? routingInput.errorMessage : undefined}
 *     onClearError={routingInput.clearError}
 *     fullWidth
 *   />
 * );
 * ```
 */
export function useRoutingNumberInput(
  initialValue: string = '',
  options: UseRoutingNumberInputOptions = {}
): UseRoutingNumberInputReturn {
  const {
    required = false,
    validateOnChange = false,
    customValidator,
    hasError: initialHasError = false,
    errorMessage: initialErrorMessage = '',
    onClearError,
    onRoutingNumberChange,
  } = options;

  // Internal state
  const [value, setValue] = useState<string>(initialValue);
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

  // Sync internal value with external value changes
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  /**
   * Validate routing number using built-in or custom validator
   */
  const validateRoutingNumber = useCallback((routingNumber?: string): boolean => {
    const valueToValidate = routingNumber ?? value;
    const trimmedValue = valueToValidate.trim();

    // Check if required field is empty
    if (required && !trimmedValue) {
      setHasError(true);
      setErrorMessage(ValidationMessages.REQUIRED);
      return false;
    }

    // Skip validation if not required and empty
    if (!required && !trimmedValue) {
      setHasError(false);
      setErrorMessage('');
      return true;
    }

    // Use custom validator if provided
    if (customValidator) {
      const result = customValidator(trimmedValue);
      if (!result.isValid) {
        setHasError(true);
        setErrorMessage(result.message || ValidationMessages.INVALID_ROUTING_NUMBER);
        return false;
      }
    } else {
      // Use built-in routing number validation
      if (!isValidRoutingNumber(trimmedValue)) {
        setHasError(true);
        setErrorMessage(ValidationMessages.INVALID_ROUTING_NUMBER);
        return false;
      }
    }

    // Clear error if validation passes
    setHasError(false);
    setErrorMessage('');
    return true;
  }, [value, required, customValidator]);

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
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // Always validate on blur (including required field validation for empty values)
    validateRoutingNumber();
  }, [validateRoutingNumber]);

  /**
   * Handle input change with numeric filtering and optional real-time validation
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow only numeric input (routing numbers are digits only)
    if (/^\d*$/.test(newValue)) {
      setValue(newValue);
      
      // Notify parent component of change
      if (onRoutingNumberChange) {
        onRoutingNumberChange(newValue);
      }
      
      // Real-time validation if enabled and value exists
      if (validateOnChange && newValue.trim()) {
        validateRoutingNumber(newValue);
      } else if (hasError) {
        // Clear error if user is typing and had previous error
        clearError();
      }
    }
  }, [validateOnChange, hasError, validateRoutingNumber, clearError, onRoutingNumberChange]);

  /**
   * Handle Enter key press for form submission
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Validate before potential form submission
      if (value.trim()) {
        validateRoutingNumber();
      }
    }
  }, [value, validateRoutingNumber]);

  /**
   * Set value programmatically (useful for form resets, etc.)
   */
  const setValueProgrammatically = useCallback((newValue: string) => {
    // Ensure only numeric values are set
    if (/^\d*$/.test(newValue)) {
      setValue(newValue);
      if (onRoutingNumberChange) {
        onRoutingNumberChange(newValue);
      }
    }
  }, [onRoutingNumberChange]);

  // Pre-configured input props for easy spreading
  const inputProps = {
    type: 'text' as const,
    inputMode: 'numeric' as const,
    pattern: '[0-9]*',
    maxLength: 9,
    placeholder: 'Routing Number',
    value,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    'aria-label': 'Bank routing number',
    'aria-invalid': hasError,
    'aria-describedby': hasError ? 'routing-number-error' : undefined,
  };

  return {
    // State
    value,
    isFocused,
    hasError,
    errorMessage,
    
    // Event handlers
    handleFocus,
    handleBlur,
    handleChange,
    handleKeyDown,
    
    // Utility functions
    validateRoutingNumber,
    clearError,
    setValue: setValueProgrammatically,
    
    // Input props for easy spreading
    inputProps,
  };
}

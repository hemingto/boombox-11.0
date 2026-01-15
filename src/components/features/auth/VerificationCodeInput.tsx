/**
 * @fileoverview Verification code input component for SMS/email verification
 * @source boombox-10.0/src/app/components/login/verificationcodeinput.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Configurable-digit code input with automatic focus progression and backspace navigation.
 * Used for phone verification and email verification flows.
 * Default: 4 digits (most login flows)
 * Admin Login: 6 digits (enhanced security)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic tokens
 * - Error states use status-error design tokens
 * - Focus states use primary color tokens
 */

'use client';

import React from 'react';

export interface VerificationCodeProps {
  /**
   * Current code as array of digits
   */
  code: string[];
  
  /**
   * Description text shown above inputs
   */
  description: string;
  
  /**
   * Callback to update code
   */
  setCode: (newCode: string[]) => void;
  
  /**
   * Error message to display
   */
  error: string | null;
  
  /**
   * Callback to clear error
   */
  clearError: () => void;
  
  /**
   * Number of digits in the verification code
   * @default 4
   */
  codeLength?: number;
}

/**
 * VerificationCode component for configurable-digit code entry
 */
export function VerificationCode({
  code,
  description,
  setCode,
  error,
  clearError,
  codeLength = 4,
}: VerificationCodeProps) {
  /**
   * Handle input change - only allow single digits
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    
    // Only allow digits and ensure single character
    if (value.length > 1 || !/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus next input
    if (value && index < codeLength - 1) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      nextInput?.focus();
    }
  };
  
  /**
   * Handle backspace navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newCode = [...code];
      
      if (!code[index] && index > 0) {
        // If current is empty, go to previous and clear it
        const previousInput = document.getElementById(`code-input-${index - 1}`);
        previousInput?.focus();
        newCode[index - 1] = '';
      } else {
        // Clear current
        newCode[index] = '';
      }
      
      setCode(newCode);
    }
  };
  
  /**
   * Clear error on focus
   */
  const handleFocus = () => {
    clearError();
  };
  
  return (
    <div className="flex flex-col">
      <p className="mb-4 text-text-primary">{description}</p>
      
      {/* Code Inputs */}
      <div className="flex space-x-2 sm:space-x-4" role="group" aria-label="Verification code">
        {code.map((digit, index) => (
          <input
            key={index}
            id={`code-input-${index}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={handleFocus}
            className={`aspect-square h-full min-h-12 w-full min-w-12 rounded-md text-center text-3xl focus:outline-none ${
              error
                ? 'input-field--error'
                : 'bg-surface-tertiary focus:bg-white focus:ring-2 focus:ring-primary'
            }`}
            aria-label={`Digit ${index + 1}`}
            aria-invalid={!!error}
            aria-describedby={error ? 'code-error' : undefined}
          />
        ))}
      </div>
      
      {/* Error Message */}
      {error && (
        <p id="code-error" className="mt-2 mb-3 form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default VerificationCode;


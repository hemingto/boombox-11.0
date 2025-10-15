/**
 * @fileoverview Email input field component with validation, error states, and accessibility features
 * @source boombox-10.0/src/app/components/reusablecomponents/emailinput.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides an email input field with built-in validation, error state handling, focus management,
 * and integrated envelope icon. Supports real-time validation feedback, placeholder customization,
 * and comprehensive accessibility features including ARIA labels and keyboard navigation.
 * 
 * API ROUTES UPDATED:
 * - None (Pure UI component)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with design system tokens (primary, status-error, text colors)
 * - Applied input-field and input-field--error utility classes from globals.css
 * - Implemented proper semantic color usage throughout component states
 * - Added consistent hover/focus states using design system colors
 * 
 * ARCHITECTURE IMPROVEMENTS:
 * - Extracted business logic into useEmailInput custom hook for reusability
 * - Separated email validation utilities into dedicated emailUtils module
 * - Component now focuses purely on UI rendering and user interactions
 * - Enhanced with email-specific validation presets and utilities
 * 
 * @refactor Migrated from inline custom styling to design system compliance with centralized
 * validation utilities, enhanced accessibility features, improved type safety, and clean architecture
 */

import { EnvelopeIcon } from '@heroicons/react/20/solid';
import { useEmailInput, type EmailValidator } from '@/hooks/useEmailInput';
import { EmailValidators } from '@/lib/utils/emailUtils';

export interface EmailInputProps {
  /** Current email value */
  value: string;
  /** Callback fired when email value changes */
  onEmailChange: (email: string) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether to validate email format in real-time */
  validateOnChange?: boolean;
  /** Custom validation function or preset validator */
  customValidator?: EmailValidator | 'basic' | 'strict' | 'business' | 'permanent';
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Unique identifier for the input */
  id?: string;
  /** CSS class name for additional styling */
  className?: string;
  /** Whether the input has an error state (external control) */
  hasError?: boolean;
  /** Error message to display below the input (external control) */
  errorMessage?: string;
  /** Callback fired when error state should be cleared */
  onClearError?: () => void;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** ARIA described by for accessibility */
  'aria-describedby'?: string;
}

/**
 * EmailInput component with validation, error handling, and accessibility features
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <EmailInput
 *   value={email}
 *   onEmailChange={setEmail}
 *   placeholder="Enter your email address"
 *   required
 *   validateOnChange
 * />
 * 
 * // With business email validation
 * <EmailInput
 *   value={email}
 *   onEmailChange={setEmail}
 *   customValidator="business"
 *   required
 * />
 * 
 * // With custom validator
 * <EmailInput
 *   value={email}
 *   onEmailChange={setEmail}
 *   customValidator={(email) => ({
 *     isValid: email.endsWith('@company.com'),
 *     message: 'Must use company email'
 *   })}
 * />
 * ```
 */
const EmailInput: React.FC<EmailInputProps> = ({
  value,
  onEmailChange,
  placeholder = 'Enter your email address',
  required = false,
  validateOnChange = false,
  customValidator,
  disabled = false,
  id = 'email',
  className = '',
  hasError: externalHasError,
  errorMessage: externalErrorMessage,
  onClearError,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  // Resolve validator from string preset or use directly
  const resolvedValidator = typeof customValidator === 'string' 
    ? EmailValidators[customValidator]
    : customValidator;

  // Use email input hook for business logic
  const emailInput = useEmailInput({
    required,
    validateOnChange,
    customValidator: resolvedValidator,
    hasError: externalHasError,
    errorMessage: externalErrorMessage,
    onClearError,
  });

  /**
   * Handle email input change
   */
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    onEmailChange(newEmail);
    emailInput.handleChange(newEmail);
  };

  /**
   * Handle input blur
   */
  const handleBlur = () => {
    emailInput.handleBlur(value);
  };

  /**
   * Handle Enter key press
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    emailInput.handleKeyDown(e, value);
  };

  // Get styling classes from hook
  const iconColorClass = emailInput.getIconColorClass(value);
  const inputClasses = emailInput.getInputClasses(`input-field pl-10 ${className}`);
  const finalInputClasses = disabled 
    ? `${inputClasses} opacity-50 cursor-not-allowed`
    : inputClasses;

  // Generate error message ID for ARIA
  const errorId = `${id}-error`;
  const showError = emailInput.hasError && emailInput.errorMessage;

  return (
    <div className="w-full">
      {/* Input container with icon */}
      <div className="relative w-full">
        {/* Email icon */}
        <span 
          className="absolute top-3 left-3 pointer-events-none"
          aria-hidden="true"
        >
          <EnvelopeIcon
            className={`w-5 h-5 transition-colors duration-200 ${iconColorClass}`}
          />
        </span>

        {/* Email input */}
        <input
          id={id}
          type="email"
          value={value}
          onChange={handleEmailChange}
          onFocus={emailInput.handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={finalInputClasses}
          disabled={disabled}
          required={required}
          aria-label={ariaLabel || `Email address ${required ? '(required)' : ''}`}
          aria-describedby={`
            ${ariaDescribedBy || ''} 
            ${showError ? errorId : ''}
          `.trim()}
          aria-invalid={emailInput.hasError}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
        />
      </div>

      {/* Error message */}
      {showError && (
        <p 
          id={errorId}
          className="form-error sm:-mt-2 mb-3"
          role="alert"
          aria-live="polite"
        >
          {emailInput.errorMessage}
        </p>
      )}
    </div>
  );
};

export default EmailInput;

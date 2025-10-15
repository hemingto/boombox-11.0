/**
 * @fileoverview Last name input field component with validation, error states, and accessibility features
 * @source boombox-10.0/src/app/components/reusablecomponents/lastnameinput.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a last name input field with built-in validation, error state handling, focus management,
 * and comprehensive accessibility features. Supports real-time validation feedback and proper error clearing.
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
 * - Extracted business logic into useNameInput custom hook for reusability
 * - Separated name validation utilities into dedicated nameUtils module
 * - Component now focuses purely on UI rendering and user interactions
 * - Enhanced with name-specific validation presets and utilities
 * 
 * @refactor Migrated from inline custom styling to design system compliance with centralized
 * validation utilities, enhanced accessibility features, improved type safety, and clean architecture
 */

import { useNameInput } from '@/hooks';

export interface LastNameInputProps {
  /** Current last name value */
  value: string;
  /** Callback fired when last name value changes */
  onLastNameChange: (lastName: string) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether to validate name format in real-time */
  validateOnChange?: boolean;
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
 * LastNameInput component with validation, error handling, and accessibility features
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <LastNameInput
 *   value={lastName}
 *   onLastNameChange={setLastName}
 *   placeholder="Last Name"
 *   required
 *   validateOnChange
 * />
 * 
 * // With external error control
 * <LastNameInput
 *   value={lastName}
 *   onLastNameChange={setLastName}
 *   hasError={externalError}
 *   errorMessage={externalMessage}
 *   onClearError={clearExternalError}
 * />
 * ```
 */
const LastNameInput: React.FC<LastNameInputProps> = ({
  value,
  onLastNameChange,
  placeholder = 'Last Name',
  required = false,
  validateOnChange = false,
  disabled = false,
  id = 'lastName',
  className = '',
  hasError: externalHasError,
  errorMessage: externalErrorMessage,
  onClearError,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  // Use the custom name input hook for business logic
  const nameInput = useNameInput({
    required,
    validateOnChange,
    hasError: externalHasError,
    errorMessage: externalErrorMessage,
    onClearError,
  });

  // Error ID for ARIA accessibility
  const errorId = `${id}-error`;

  /**
   * Handle input change events
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    onLastNameChange(newName);
    nameInput.handleChange(newName);
  };

  /**
   * Handle input blur events
   */
  const handleBlur = () => {
    nameInput.handleBlur(value);
  };

  /**
   * Handle keyboard events for accessibility
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    nameInput.handleKeyDown(e, value);
  };

  // Calculate input classes using design system
  const baseInputClasses = "input-field";
  const errorInputClasses = nameInput.hasError ? "input-field--error" : "";
  const finalInputClasses = `${baseInputClasses} ${errorInputClasses} ${className}`.trim();

  // Determine if we should show error
  const showError = nameInput.hasError && nameInput.errorMessage;

  return (
    <div className="basis-1/2">
      <div className="flex-col">
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleNameChange}
          onFocus={nameInput.handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={finalInputClasses}
          disabled={disabled}
          required={required}
          aria-label={ariaLabel || `Last name ${required ? '(required)' : ''}`}
          aria-describedby={`
            ${ariaDescribedBy || ''} 
            ${showError ? errorId : ''}
          `.trim()}
          aria-invalid={nameInput.hasError}
          autoComplete="family-name"
          autoCapitalize="words"
          autoCorrect="off"
          spellCheck="false"
        />
        
        {/* Error message */}
        {showError && (
          <p 
            id={errorId}
            className="form-error sm:-mt-2 mb-3"
            role="alert"
            aria-live="polite"
          >
            {nameInput.errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default LastNameInput;

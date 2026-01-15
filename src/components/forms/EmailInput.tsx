/**
 * @fileoverview Email input field component with email-specific defaults and accessibility features
 * @source boombox-10.0/src/app/components/reusablecomponents/emailinput.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Thin wrapper around the Input primitive that provides email-specific defaults including
 * envelope icon, proper input type, and email-specific HTML attributes. Validation is handled
 * by parent components for flexibility.
 * 
 * API ROUTES UPDATED:
 * - None (Pure UI component)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses Input primitive from design system
 * - Applies email-specific icon and attributes
 * - Maintains consistent styling with other form inputs
 * 
 * ARCHITECTURE IMPROVEMENTS:
 * - Simplified to be a thin wrapper around Input primitive
 * - Validation handled by parent components for better flexibility
 * - Focuses purely on email-specific UI defaults
 * 
 * @refactor Simplified from complex validation wrapper to lean email-specific input wrapper
 */

import { useMemo } from 'react';
import { EnvelopeIcon } from '@heroicons/react/20/solid';
import { Input } from '@/components/ui/primitives/Input';
import { cn } from '@/lib/utils/cn';

export interface EmailInputProps {
  /** Current email value */
  value: string;
  /** Callback fired when email value changes */
  onEmailChange: (email: string) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
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
  /** Label text for the input */
  label?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** ARIA described by for accessibility */
  'aria-describedby'?: string;
}

/**
 * EmailInput component - thin wrapper around Input primitive with email-specific defaults
 * 
 * @example
 * ```tsx
 * // Basic usage with external validation
 * <EmailInput
 *   value={email}
 *   onEmailChange={setEmail}
 *   hasError={!!emailError}
 *   errorMessage={emailError || ''}
 *   onClearError={() => setEmailError(null)}
 *   required
 * />
 * ```
 */
const EmailInput: React.FC<EmailInputProps> = ({
  value,
  onEmailChange,
  placeholder = 'Enter your email address',
  required = false,
  disabled = false,
  id = 'email',
  className = '',
  hasError = false,
  errorMessage = '',
  onClearError,
  label,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  /**
   * Handle email input change
   */
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEmailChange(e.target.value);
  };

  const hasValue = value.length > 0;

  // Memoize the icon to prevent recreating it on every render
  const icon = useMemo(
    () => <EnvelopeIcon className={cn('w-5 h-5', hasValue && 'text-text-primary')} />,
    [hasValue]
  );

  return (
    <Input
      id={id}
      type="email"
      value={value}
      onChange={handleEmailChange}
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      error={hasError ? errorMessage : undefined}
      icon={icon}
      iconPosition="left"
      fullWidth
      className={className}
      onClearError={onClearError}
      aria-label={ariaLabel || `Email address ${required ? '(required)' : ''}`}
      aria-describedby={ariaDescribedBy}
      autoComplete="email"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck="false"
    />
  );
};

export default EmailInput;

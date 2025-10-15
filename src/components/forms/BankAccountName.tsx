/**
 * @fileoverview Bank Account Holder Name input field component with design system integration
 * @source boombox-10.0/src/app/components/reusablecomponents/bankaccountname.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Specialized input field for capturing bank account holder names with validation,
 * error handling, and focus management. Used in bank account setup flows.
 * 
 * API ROUTES UPDATED:
 * - Component doesn't directly use API routes (handled by parent components)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced custom colors with design system tokens (primary, status-error, surface colors)
 * - Uses .input-field and .input-field--error utility classes from globals.css
 * - Applied semantic color categories for consistent theming
 * - Updated focus states to use border-focus design token
 * 
 * @refactor Leverages the Input primitive component from ui/primitives while maintaining
 * the original specialized functionality for bank account holder name input
 */

import { forwardRef } from 'react';
import { Input, InputProps } from '@/components/ui/primitives/Input';

export interface BankAccountNameProps 
  extends Omit<InputProps, 'placeholder' | 'type' | 'autoComplete'> {
  /**
   * Error state for the input field
   */
  hasError?: boolean;
  
  /**
   * Error message to display when hasError is true
   */
  errorMessage?: string;
  
  /**
   * Callback function when bank account holder name changes
   */
  onBankAccountHolderChange: (accountHolderName: string) => void;
  
  /**
   * Callback to clear error state (typically on focus)
   */
  onClearError?: () => void;
  
  /**
   * Current value of the bank account holder name
   */
  value: string;
}

/**
 * BankAccountName component for capturing bank account holder names
 * 
 * Features:
 * - Specialized placeholder text for bank account context
 * - Automatic error clearing on focus
 * - Design system compliant styling
 * - Full accessibility support with ARIA labels
 * - Keyboard navigation support
 */
const BankAccountName = forwardRef<HTMLInputElement, BankAccountNameProps>(
  (
    {
      hasError = false,
      errorMessage,
      onBankAccountHolderChange,
      onClearError,
      value,
      onChange,
      onFocus,
      id = 'bank-account-holder-name',
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      onBankAccountHolderChange(newName);
      
      // Call any additional onChange handler passed as prop
      onChange?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Clear error state when user focuses on the input
      if (onClearError && hasError) {
        onClearError();
      }
      
      // Call any additional onFocus handler passed as prop
      onFocus?.(e);
    };

    return (
      <Input
        ref={ref}
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder="Bank Account Holder Name"
        autoComplete="name"
        variant={hasError ? 'error' : 'default'}
        error={hasError ? errorMessage : undefined}
        fullWidth
        aria-label="Bank account holder name"
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        {...props}
      />
    );
  }
);

BankAccountName.displayName = 'BankAccountName';

export { BankAccountName };

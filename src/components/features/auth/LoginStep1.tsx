/**
 * @fileoverview Login step 1 - Contact information input (phone or email)
 * @source boombox-10.0/src/app/components/login/loginstep1.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * First step of login flow where user enters either phone number or email.
 * Conditionally shows phone or email input based on user preference.
 * Displays validation errors for contact information.
 * 
 * API ROUTES UPDATED:
 * - N/A (Pure UI component, API calls handled by parent LoginForm)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses migrated PhoneNumberInput and EmailInput components from @/components/forms
 * - All styling handled by child components with design system tokens
 * - Maintains original clean, minimal layout
 * 
 * @refactor Simplified component structure, leverages existing form components,
 * maintains exact original functionality with proper TypeScript interfaces
 */

import React from 'react';
import PhoneNumberInput from '@/components/forms/PhoneNumberInput';
import EmailInput from '@/components/forms/EmailInput';

export interface LoginStep1Props {
  /**
   * Hide phone input (show email instead)
   */
  hidePhoneInput?: boolean;
  
  /**
   * Hide email input (show phone instead)
   */
  hideEmailInput?: boolean;
  
  /**
   * Current phone number value
   */
  phoneNumber: string;
  
  /**
   * Current email value
   */
  email: string;
  
  /**
   * Phone number error message
   */
  phoneError: string | null;
  
  /**
   * Email error message
   */
  emailError: string | null;
  
  /**
   * Callback when phone number changes
   */
  onPhoneChange: (phone: string) => void;
  
  /**
   * Callback when email changes
   */
  onEmailChange: (email: string) => void;
}

/**
 * LoginStep1 - Contact information input step
 * 
 * @example
 * ```tsx
 * <LoginStep1
 *   hidePhoneInput={false}
 *   hideEmailInput={true}
 *   phoneNumber={phone}
 *   phoneError={errors.phone}
 *   onPhoneChange={setPhone}
 * />
 * ```
 */
export function LoginStep1({
  hidePhoneInput = false,
  hideEmailInput = false,
  phoneNumber,
  email,
  phoneError,
  emailError,
  onPhoneChange,
  onEmailChange,
}: LoginStep1Props) {
  return (
    <div className="w-full">
      {!hidePhoneInput && (
        <PhoneNumberInput
          value={phoneNumber}
          onChange={onPhoneChange}
          hasError={!!phoneError}
          errorMessage={phoneError || ''}
          onClearError={() => {}}
          placeholder="Phone number"
          required
          aria-label="Phone number for login"
        />
      )}
      {!hideEmailInput && (
        <EmailInput
          value={email}
          onEmailChange={onEmailChange}
          hasError={!!emailError}
          errorMessage={emailError || ''}
          onClearError={() => {}}
          placeholder="Enter your email address"
          required
          aria-label="Email address for login"
        />
      )}
    </div>
  );
}

export default LoginStep1;


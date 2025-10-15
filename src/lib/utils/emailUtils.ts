/**
 * @fileoverview Email-specific utility functions and validators
 * @source boombox-10.0/src/app/components/reusablecomponents/emailinput.tsx (validation logic)
 * 
 * UTILITY FUNCTIONALITY:
 * Provides specialized email validation functions, common email validators,
 * and email formatting utilities for consistent email handling across the application.
 * 
 * @refactor Extracted email-specific logic from EmailInput component and other
 * components to provide reusable, testable email utilities
 */

import { isValidEmail, isValidEmailStrict } from '@/lib/utils/validationUtils';

/**
 * Common email validation result interface
 */
export interface EmailValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Email validation function type
 */
export type EmailValidatorFunction = (email: string) => EmailValidationResult;

/**
 * Common email domain patterns for business validation
 */
export const BUSINESS_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com', 
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
] as const;

/**
 * Validate business email (not common personal email providers)
 */
export const validateBusinessEmail: EmailValidatorFunction = (email: string) => {
  if (!isValidEmail(email)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address',
    };
  }

  const domain = email.toLowerCase().split('@')[1];
  const isPersonalDomain = BUSINESS_EMAIL_DOMAINS.includes(domain as any);

  if (isPersonalDomain) {
    return {
      isValid: false,
      message: 'Please use a business email address',
    };
  }

  return { isValid: true };
};

/**
 * Validate email with specific domain requirement
 */
export const createDomainValidator = (allowedDomains: string[]): EmailValidatorFunction => {
  return (email: string) => {
    if (!isValidEmail(email)) {
      return {
        isValid: false,
        message: 'Please enter a valid email address',
      };
    }

    const domain = email.toLowerCase().split('@')[1];
    const isAllowedDomain = allowedDomains.some(allowedDomain => 
      domain === allowedDomain.toLowerCase()
    );

    if (!isAllowedDomain) {
      const domainList = allowedDomains.join(', ');
      return {
        isValid: false,
        message: `Email must be from one of these domains: ${domainList}`,
      };
    }

    return { isValid: true };
  };
};

/**
 * Validate email with company domain requirement
 */
export const createCompanyEmailValidator = (companyDomain: string): EmailValidatorFunction => {
  return (email: string) => {
    if (!isValidEmail(email)) {
      return {
        isValid: false,
        message: 'Please enter a valid email address',
      };
    }

    const domain = email.toLowerCase().split('@')[1];
    if (domain !== companyDomain.toLowerCase()) {
      return {
        isValid: false,
        message: `Please use your ${companyDomain} email address`,
      };
    }

    return { isValid: true };
  };
};

/**
 * Validate email with strict pattern and length requirements
 */
export const validateStrictEmail: EmailValidatorFunction = (email: string) => {
  if (!email?.trim()) {
    return {
      isValid: false,
      message: 'Email address is required',
    };
  }

  if (email.length > 254) {
    return {
      isValid: false,
      message: 'Email address is too long',
    };
  }

  if (!isValidEmailStrict(email)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address',
    };
  }

  return { isValid: true };
};

/**
 * Validate email for newsletter signup (more lenient)
 */
export const validateNewsletterEmail: EmailValidatorFunction = (email: string) => {
  if (!email?.trim()) {
    return {
      isValid: false,
      message: 'Email address is required',
    };
  }

  if (!isValidEmail(email)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address',
    };
  }

  return { isValid: true };
};

/**
 * Format email for display (e.g., truncate long emails)
 */
export function formatEmailForDisplay(email: string, maxLength: number = 30): string {
  if (!email || email.length <= maxLength) {
    return email;
  }

  const [localPart, domain] = email.split('@');
  if (localPart.length > maxLength - domain.length - 3) {
    const truncatedLocal = localPart.substring(0, maxLength - domain.length - 6);
    return `${truncatedLocal}...@${domain}`;
  }

  return email;
}

/**
 * Extract domain from email address
 */
export function extractEmailDomain(email: string): string | null {
  if (!isValidEmail(email)) {
    return null;
  }

  return email.split('@')[1]?.toLowerCase() || null;
}

/**
 * Check if email is from a disposable email provider
 */
export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com',
    'temp-mail.org',
    'throwaway.email',
  ];

  const domain = extractEmailDomain(email);
  return domain ? disposableDomains.includes(domain) : false;
}

/**
 * Validate email and check if it's not disposable
 */
export const validatePermanentEmail: EmailValidatorFunction = (email: string) => {
  if (!isValidEmail(email)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address',
    };
  }

  if (isDisposableEmail(email)) {
    return {
      isValid: false,
      message: 'Please use a permanent email address',
    };
  }

  return { isValid: true };
};

/**
 * Combine multiple email validators
 */
export function combineEmailValidators(...validators: EmailValidatorFunction[]): EmailValidatorFunction {
  return (email: string) => {
    for (const validator of validators) {
      const result = validator(email);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  };
}

/**
 * Common email validator presets (direct validators only)
 */
export const EmailValidators = {
  /** Basic email format validation */
  basic: validateNewsletterEmail,
  
  /** Strict email validation with enhanced pattern matching */
  strict: validateStrictEmail,
  
  /** Business email validation (excludes common personal providers) */
  business: validateBusinessEmail,
  
  /** Permanent email validation (excludes disposable email providers) */
  permanent: validatePermanentEmail,
} as const;

/**
 * Email validator factory functions
 */
export const EmailValidatorFactories = {
  /** Company domain validator factory */
  companyDomain: createCompanyEmailValidator,
  
  /** Specific domains validator factory */
  allowedDomains: createDomainValidator,
  
  /** Combined validators factory */
  combined: combineEmailValidators,
} as const;

/**
 * @fileoverview Validation utility functions
 * @source boombox-10.0/src/app/components/driver-signup/driversignupform.tsx (validateForm, emailRegex)
 * @source boombox-10.0/src/app/components/mover-signup/moversignupform.tsx (validateForm, emailRegex, urlRegex)
 * @source boombox-10.0/src/app/components/login/loginform.tsx (validateForm, emailRegex)
 * @source boombox-10.0/src/app/components/getquote/getquoteform.tsx (validateEmail)
 * @source boombox-10.0/src/app/components/mover-account/bankaccounttable.tsx (validation functions)
 * @source boombox-10.0/src/app/components/mover-account/vehicleinfotable.tsx (validation logic)
 * @refactor Consolidated all form validation into centralized, reusable functions
 */

import { isValidPhoneNumber } from './phoneUtils';

/**
 * Email validation regex pattern
 * Standard RFC 5322 compliant pattern for email validation
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Alternative email regex pattern (more restrictive)
 * Used in some components for stricter validation
 */
const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * URL validation regex pattern
 * Validates HTTP/HTTPS URLs with optional protocol
 */
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

/**
 * Year validation regex (4-digit year)
 */
const YEAR_REGEX = /^\d{4}$/;

/**
 * Validate email address using standard pattern
 */
export function isValidEmail(email: string): boolean {
  if (!email?.trim()) return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate email with strict pattern (for enhanced validation)
 */
export function isValidEmailStrict(email: string): boolean {
  if (!email?.trim()) return false;
  return STRICT_EMAIL_REGEX.test(email.trim());
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  if (!url?.trim()) return false;
  return URL_REGEX.test(url.trim());
}

/**
 * Validate 4-digit year
 */
export function isValidYear(year: string): boolean {
  if (!year?.trim()) return false;
  return YEAR_REGEX.test(year.trim());
}

/**
 * Validate required field (not empty)
 */
export function isRequired(value: string): boolean {
  return Boolean(value?.trim());
}

/**
 * Validate bank routing number (9 digits)
 */
export function isValidRoutingNumber(routingNumber: string): boolean {
  if (!routingNumber?.trim()) return false;
  const digits = routingNumber.replace(/\D/g, '');
  return digits.length === 9;
}

/**
 * Validate that two values match (for confirm fields)
 */
export function valuesMatch(value1: string, value2: string): boolean {
  return value1?.trim() === value2?.trim();
}

/**
 * Validate minimum length
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return (value?.trim().length || 0) >= minLength;
}

/**
 * Validate maximum length
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return (value?.trim().length || 0) <= maxLength;
}

/**
 * Validation error messages
 */
export const ValidationMessages = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_URL: 'Please enter a valid website URL',
  INVALID_YEAR: 'Year must be a 4-digit number',
  INVALID_ROUTING_NUMBER: 'Routing number must be 9 digits',
  VALUES_DONT_MATCH: 'Values do not match',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
} as const;

/**
 * Form validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Comprehensive form field validation
 */
export function validateField(
  value: string,
  rules: {
    required?: boolean;
    email?: boolean;
    emailStrict?: boolean;
    phone?: boolean;
    url?: boolean;
    year?: boolean;
    routingNumber?: boolean;
    minLength?: number;
    maxLength?: number;
    custom?: (value: string) => boolean;
    customMessage?: string;
  }
): { isValid: boolean; error?: string } {
  const trimmedValue = value?.trim() || '';

  // Required validation
  if (rules.required && !isRequired(value)) {
    return { isValid: false, error: ValidationMessages.REQUIRED };
  }

  // Skip other validations if value is empty and not required
  if (!trimmedValue && !rules.required) {
    return { isValid: true };
  }

  // Email validation
  if (rules.email && !isValidEmail(value)) {
    return { isValid: false, error: ValidationMessages.INVALID_EMAIL };
  }

  // Strict email validation
  if (rules.emailStrict && !isValidEmailStrict(value)) {
    return { isValid: false, error: ValidationMessages.INVALID_EMAIL };
  }

  // Phone validation
  if (rules.phone && !isValidPhoneNumber(value)) {
    return { isValid: false, error: ValidationMessages.INVALID_PHONE };
  }

  // URL validation
  if (rules.url && !isValidURL(value)) {
    return { isValid: false, error: ValidationMessages.INVALID_URL };
  }

  // Year validation
  if (rules.year && !isValidYear(value)) {
    return { isValid: false, error: ValidationMessages.INVALID_YEAR };
  }

  // Routing number validation
  if (rules.routingNumber && !isValidRoutingNumber(value)) {
    return { isValid: false, error: ValidationMessages.INVALID_ROUTING_NUMBER };
  }

  // Length validations
  if (rules.minLength && !hasMinLength(value, rules.minLength)) {
    return {
      isValid: false,
      error: ValidationMessages.MIN_LENGTH(rules.minLength),
    };
  }

  if (rules.maxLength && !hasMaxLength(value, rules.maxLength)) {
    return {
      isValid: false,
      error: ValidationMessages.MAX_LENGTH(rules.maxLength),
    };
  }

  // Custom validation
  if (rules.custom && !rules.custom(value)) {
    return { isValid: false, error: rules.customMessage || 'Invalid value' };
  }

  return { isValid: true };
}

/**
 * Validate multiple form fields at once
 */
export function validateForm(
  formData: Record<string, string>,
  validationRules: Record<string, Parameters<typeof validateField>[1]>
): ValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [fieldName, rules] of Object.entries(validationRules)) {
    const fieldValue = formData[fieldName] || '';
    const result = validateField(fieldValue, rules);

    if (!result.isValid && result.error) {
      errors[fieldName] = result.error;
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Validate confirm field matches original field
 */
export function validateConfirmField(
  originalValue: string,
  confirmValue: string,
  fieldName: string = 'field'
): { isValid: boolean; error?: string } {
  if (!valuesMatch(originalValue, confirmValue)) {
    return {
      isValid: false,
      error: `${fieldName} confirmation does not match`,
    };
  }
  return { isValid: true };
}

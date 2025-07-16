/**
 * @fileoverview Validation utility functions
 * @source Multiple validation functions from boombox-10.0 components
 * @refactor Consolidated form validation functions
 */

import { isValidPhoneNumber } from './phoneUtils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  if (!email?.trim()) return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate required field
 */
export function isRequired(value: string): boolean {
  return Boolean(value?.trim());
}

/**
 * Validation messages
 */
export const ValidationMessages = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
} as const;

/**
 * Validate single field with rules
 */
export function validateField(
  value: string,
  rules: {
    required?: boolean;
    email?: boolean;
    phone?: boolean;
  }
): { isValid: boolean; error?: string } {
  const trimmedValue = value?.trim() || '';

  if (rules.required && !isRequired(value)) {
    return { isValid: false, error: ValidationMessages.REQUIRED };
  }

  if (!trimmedValue && !rules.required) {
    return { isValid: true };
  }

  if (rules.email && !isValidEmail(value)) {
    return { isValid: false, error: ValidationMessages.INVALID_EMAIL };
  }

  if (rules.phone && !isValidPhoneNumber(value)) {
    return { isValid: false, error: ValidationMessages.INVALID_PHONE };
  }

  return { isValid: true };
}

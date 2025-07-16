/**
 * @fileoverview Phone number utility functions
 * @source boombox-10.0/src/app/lib/utils.ts (formatPhoneNumber)
 * @refactor Consolidated all phone number handling into centralized utilities
 */

/**
 * Normalize phone number to E.164 format (+1XXXXXXXXXX)
 */
export function normalizePhoneNumberToE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.startsWith('1') && digits.length === 11) {
    return `+${digits}`;
  }

  if (phone.startsWith('+')) {
    return phone;
  }

  throw new Error('Invalid phone number format');
}

/**
 * Format phone number for display as (XXX) XXX-XXXX
 */
export function formatPhoneNumberForDisplay(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/[^0-9+]/g, '');
  const normalized = cleaned.startsWith('+1') ? cleaned.slice(2) : cleaned;
  const match = normalized.match(/^(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  return phoneNumber;
}

/**
 * Validate if a phone number is in a valid format
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  const digits = phoneNumber.replace(/\D/g, '');
  return (
    digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))
  );
}

/**
 * @fileoverview Phone number utility functions
 * @source boombox-10.0/src/app/lib/utils.ts (formatPhoneNumber)
 * @source boombox-10.0/src/app/api/accessStorageUnit/route.ts (normalizePhoneNumberToE164)
 * @source boombox-10.0/src/app/api/addAdditionalStorage/route.ts (normalizePhoneNumberToE164)
 * @source boombox-10.0/src/app/api/drivers/route.ts (normalizePhoneNumberToE164)
 * @source boombox-10.0/src/app/api/submitQuote/route.ts (normalizePhoneNumberToE164)
 * @source boombox-10.0/src/app/api/drivers/accept-invitation/route.ts (normalizePhoneNumberToE164)
 * @refactor Consolidated all phone number handling into centralized utilities
 */

/**
 * Normalize phone number to E.164 format (+1XXXXXXXXXX)
 * Used for Twilio SMS messaging and database storage
 */
export function normalizePhoneNumberToE164(phone: string): string {
  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, '');

  // Handle 10-digit US numbers
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Handle 11-digit numbers starting with 1
  if (digits.startsWith('1') && digits.length === 11) {
    return `+${digits}`;
  }

  // Handle numbers that already have + prefix
  if (phone.startsWith('+')) {
    return phone;
  }

  throw new Error('Invalid phone number format');
}

/**
 * Format phone number for display as (XXX) XXX-XXXX
 * Used in UI components for user-friendly display
 */
export function formatPhoneNumberForDisplay(phoneNumber: string): string {
  // Remove all non-digit characters except '+'
  const cleaned = phoneNumber.replace(/[^0-9+]/g, '');

  // If the number starts with +1, remove it for formatting
  const normalized = cleaned.startsWith('+1') ? cleaned.slice(2) : cleaned;

  // Format as (XXX) XXX-XXXX
  const match = normalized.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  // Return original if format doesn't match
  return phoneNumber;
}

/**
 * Validate if a phone number is in a valid format
 * Accepts various formats: (XXX) XXX-XXXX, XXX-XXX-XXXX, XXXXXXXXXX, +1XXXXXXXXXX
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  const digits = phoneNumber.replace(/\D/g, '');

  // Valid if 10 digits or 11 digits starting with 1
  return (
    digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))
  );
}

/**
 * Extract just the digits from a phone number
 */
export function extractPhoneDigits(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

/**
 * Convert any phone format to standardized format for comparison
 */
export function normalizePhoneForComparison(phoneNumber: string): string {
  const digits = extractPhoneDigits(phoneNumber);

  // Always return 10-digit format for comparison
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }

  return digits;
}

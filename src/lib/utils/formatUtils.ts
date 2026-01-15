/**
 * @fileoverview General formatting utility functions
 * @source boombox-10.0/src/app/lib/onfleet/parseaddress.ts (parseAddress)
 * @source boombox-10.0/src/app/admin/delivery-routes/page.tsx (formatDistance)
 * @source boombox-10.0/src/app/lib/utils.ts (generateJobCode, generateVerificationCode)
 * @source boombox-10.0/src/lib/services/route-manager.ts (generateRouteId)
 * @refactor Consolidated all general formatting utilities
 */

import { generateSlug } from 'random-word-slugs';

/**
 * Address parsing interface
 */
export interface ParsedAddress {
  number: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Parse full address string into components
 * Format: "123 Main St, San Francisco, CA 94105"
 */
export function parseAddress(fullAddress: string): ParsedAddress {
  // Clean up formatting issues (remove comma after number before letter)
  const cleanedAddress = fullAddress.replace(/(\d+),\s*([A-Za-z])/, '$1 $2');
  const parts = cleanedAddress.split(',').map(part => part.trim());

  // Parse state and zip code from parts[2] (e.g., "CA 94105")
  const stateZipParts = parts[2]?.split(' ') || [];
  const state = stateZipParts[0] || '';
  const postalCode = stateZipParts.slice(1).join(' ') || '';

  return {
    number: parts[0]?.split(' ')[0] || '',
    street: parts[0]?.split(' ').slice(1).join(' ') || '',
    city: parts[1] || '',
    state,
    postalCode,
    country: 'USA',
  };
}

/**
 * Format distance in miles with proper decimals
 */
export function formatDistance(
  miles: number | string | null | undefined
): string {
  if (!miles) return '-';

  // Convert Decimal to number if needed (Prisma Decimal type)
  const numericMiles =
    typeof miles === 'object' && miles !== null ? Number(miles) : Number(miles);

  // Check if conversion resulted in a valid number
  if (isNaN(numericMiles)) return '-';

  return `${numericMiles.toFixed(1)} mi`;
}

/**
 * Generate random job code using adjective + noun pattern
 * Example: "Brave Lion", "Quick Fox"
 */
export function generateJobCode(): string {
  const randomWords = generateSlug(2, {
    format: 'title',
    partsOfSpeech: ['adjective', 'noun'],
  });
  return randomWords;
}

/**
 * Generate numeric verification code
 */
export function generateVerificationCode(length: number = 6): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
}

/**
 * Generate route ID for delivery routes
 * Format: "YYYY_MM_DD_driverid_timestamp"
 */
export function generateRouteId(deliveryDate: Date, driverId: number): string {
  const dateStr = deliveryDate.toISOString().split('T')[0].replace(/-/g, '_');
  const timeStr = Date.now().toString().slice(-4); // Last 4 digits for uniqueness
  return `${dateStr}_driver${driverId}_${timeStr}`;
}

/**
 * Generate unique tracking token
 */
export function generateTrackingToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  return text.replace(
    /\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Convert string to kebab-case
 */
export function toKebabCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(text: string): string {
  return text
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '');
}

/**
 * Extract initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
}

/**
 * Format name as "First L."
 */
export function formatNameWithInitial(
  firstName: string,
  lastName: string
): string {
  return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
}

/**
 * Clean and format zipcode
 */
export function formatZipCode(zipCode: string): string {
  const cleaned = zipCode.replace(/\D/g, '');

  if (cleaned.length === 5) {
    return cleaned;
  } else if (cleaned.length === 9) {
    return `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
  }

  return zipCode; // Return original if format doesn't match
}

/**
 * Format address for display
 */
export function formatAddressForDisplay(address: ParsedAddress): string {
  const { number, street, city, state } = address;
  return `${number} ${street}, ${city}, ${state}`;
}

/**
 * Format full address from parts
 */
export function formatFullAddress(
  streetNumber: string,
  streetName: string,
  city: string,
  state: string,
  zipCode?: string
): string {
  let formatted = `${streetNumber} ${streetName}, ${city}, ${state}`;
  if (zipCode) {
    formatted += ` ${formatZipCode(zipCode)}`;
  }
  return formatted;
}

/**
 * Pluralize word based on count
 */
export function pluralize(
  word: string,
  count: number,
  suffix: string = 's'
): string {
  return count === 1 ? word : word + suffix;
}

/**
 * Format count with pluralization
 * Example: formatCount(1, 'item') -> "1 item", formatCount(2, 'item') -> "2 items"
 */
export function formatCount(
  count: number,
  singular: string,
  plural?: string
): string {
  const word = count === 1 ? singular : plural || `${singular}s`;
  return `${count} ${word}`;
}

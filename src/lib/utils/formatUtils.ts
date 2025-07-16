/**
 * @fileoverview General formatting utilities
 * @source boombox-10.0/src/app/lib/utils.ts and other formatting functions
 * @refactor Consolidated formatting functions
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
  country: string;
}

/**
 * Parse address string into components
 */
export function parseAddress(fullAddress: string): ParsedAddress {
  const cleanedAddress = fullAddress.replace(/(\d+),\s*([A-Za-z])/, '$1 $2');
  const parts = cleanedAddress.split(',').map(part => part.trim());

  return {
    number: parts[0]?.split(' ')[0] || '',
    street: parts[0]?.split(' ').slice(1).join(' ') || '',
    city: parts[1] || '',
    state: parts[2]?.split(' ')[0] || '',
    country: 'USA',
  };
}

/**
 * Generate random job code
 */
export function generateJobCode(): string {
  const randomWords = generateSlug(2, {
    format: 'title',
    partsOfSpeech: ['adjective', 'noun'],
  });
  return randomWords;
}

/**
 * Generate verification code
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
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

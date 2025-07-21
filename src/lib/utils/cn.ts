/**
 * @fileoverview Utility function for concatenating className strings
 * @source Consolidated from various className concatenation patterns in boombox-10.0
 * @refactor Centralized className utility for consistent class handling
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function for concatenating className strings with proper Tailwind CSS merging
 * Combines clsx for conditional classes and tailwind-merge for proper Tailwind class merging
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

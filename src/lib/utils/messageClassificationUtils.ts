/**
 * @fileoverview Message classification utilities for SMS response parsing
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (lines 46-58, 204-211, 263-264, 370-371)
 * @refactor Extracted inline message classification logic to centralized utilities
 */

// Positive response texts (yes)
export const POSITIVE_RESPONSES = [
  'yes', 'yess', 'y', 'yep', 'yeah', 'yup', 'sure', 'ok', 'okay', 'accept', 'accepted', 'confirm'
];

// Negative response texts (no)
export const NEGATIVE_RESPONSES = [
  'no', 'n', 'nope', 'nah', 'decline', 'declined', 'reject', 'rejected', 'cant', "can't", 'cannot'
];

// Mover change specific responses
export const MOVER_ACCEPT_RESPONSES = ['accept', 'accepted'];
export const MOVER_DIY_RESPONSES = ['diy', 'do it yourself', 'myself'];

/**
 * Message intent classification types
 */
export type MessageIntent = 'mover_accept' | 'mover_diy' | 'positive' | 'negative' | 'ambiguous';

/**
 * Classify the intent of an inbound SMS message
 * @param message - Lowercase message text
 * @returns MessageIntent classification
 */
export function classifyMessageIntent(message: string): MessageIntent {
  // Check mover change specific responses first
  const isMoverAccept = MOVER_ACCEPT_RESPONSES.some(response => message.includes(response));
  const isMoverDIY = MOVER_DIY_RESPONSES.some(response => message.includes(response));
  
  if (isMoverAccept) return 'mover_accept';
  if (isMoverDIY) return 'mover_diy';
  
  // Check general positive/negative responses
  const isPositive = POSITIVE_RESPONSES.some(response => message.includes(response));
  const isNegative = NEGATIVE_RESPONSES.some(response => message.includes(response));
  
  if (isPositive) return 'positive';
  if (isNegative) return 'negative';
  
  return 'ambiguous';
}

/**
 * Check if message is a positive response
 * @param message - Lowercase message text
 * @returns boolean
 */
export function isPositiveResponse(message: string): boolean {
  return POSITIVE_RESPONSES.some(response => message.includes(response));
}

/**
 * Check if message is a negative response
 * @param message - Lowercase message text
 * @returns boolean
 */
export function isNegativeResponse(message: string): boolean {
  return NEGATIVE_RESPONSES.some(response => message.includes(response));
}

/**
 * Check if message is a mover change acceptance
 * @param message - Lowercase message text
 * @returns boolean
 */
export function isMoverAcceptResponse(message: string): boolean {
  return MOVER_ACCEPT_RESPONSES.some(response => message.includes(response));
}

/**
 * Check if message is a mover change DIY request
 * @param message - Lowercase message text
 * @returns boolean
 */
export function isMoverDiyResponse(message: string): boolean {
  return MOVER_DIY_RESPONSES.some(response => message.includes(response));
}
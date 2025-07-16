/**
 * @fileoverview Currency formatting utilities
 * @source boombox-10.0/src/app/lib/utils.ts (formatCurrency)
 * @refactor Consolidated currency formatting functions
 */

/**
 * Format amount as USD currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format Stripe amount (cents) to currency display
 */
export function formatStripeCurrency(amountInCents: number): string {
  return formatCurrency(amountInCents / 100);
}

/**
 * Convert dollars to Stripe cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert Stripe cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

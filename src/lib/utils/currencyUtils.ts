/**
 * @fileoverview Currency formatting and calculation utilities
 * @source boombox-10.0/src/app/lib/utils.ts (formatCurrency)
 * @source boombox-10.0/src/app/components/mover-account/stripepayoutscomponent.tsx (formatCurrency)
 * @source boombox-10.0/src/app/components/mover-account/job-history-popup.tsx (formatCurrency)
 * @refactor Consolidated all currency formatting and enhanced with additional utilities
 */

/**
 * Format amount as USD currency with proper formatting
 * Standard formatting: $1,234.56
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
 * Stripe stores amounts in cents, so divide by 100
 */
export function formatStripeCurrency(amountInCents: number): string {
  return formatCurrency(amountInCents / 100);
}

/**
 * Format currency without decimals for whole dollar amounts
 * $1,234 instead of $1,234.00
 */
export function formatCurrencyCompact(amount: number): string {
  if (amount % 1 === 0) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return formatCurrency(amount);
}

/**
 * Format currency with explicit positive/negative signs
 * +$123.45 or -$123.45
 */
export function formatCurrencyWithSign(amount: number): string {
  const formatted = formatCurrency(Math.abs(amount));
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
}

/**
 * Parse currency string to number
 * "$1,234.56" -> 1234.56
 */
export function parseCurrency(currencyString: string): number {
  const cleaned = currencyString.replace(/[$,]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Convert dollars to Stripe cents
 * $12.34 -> 1234 cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert Stripe cents to dollars
 * 1234 cents -> $12.34
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Calculate percentage of amount
 */
export function calculatePercentage(
  amount: number,
  percentage: number
): number {
  return (amount * percentage) / 100;
}

/**
 * Calculate tip amount from percentage
 */
export function calculateTip(
  baseAmount: number,
  tipPercentage: number
): number {
  return calculatePercentage(baseAmount, tipPercentage);
}

/**
 * Add tax to amount
 */
export function addTax(amount: number, taxRate: number): number {
  return amount + calculatePercentage(amount, taxRate);
}

/**
 * Calculate total with tax and tip
 */
export function calculateTotalWithTaxAndTip(
  subtotal: number,
  taxRate: number = 0,
  tipPercentage: number = 0
): {
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
} {
  const tax = calculatePercentage(subtotal, taxRate);
  const tip = calculatePercentage(subtotal, tipPercentage);
  const total = subtotal + tax + tip;

  return {
    subtotal,
    tax,
    tip,
    total,
  };
}

/**
 * Format amount range
 * formatCurrencyRange(100, 200) -> "$100.00 - $200.00"
 */
export function formatCurrencyRange(
  minAmount: number,
  maxAmount: number
): string {
  return `${formatCurrency(minAmount)} - ${formatCurrency(maxAmount)}`;
}

/**
 * Check if amount is valid for monetary operations
 */
export function isValidAmount(amount: number): boolean {
  return !isNaN(amount) && isFinite(amount) && amount >= 0;
}

/**
 * Round to 2 decimal places (for monetary calculations)
 */
export function roundToMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Currency calculation utilities
 */
export const CurrencyCalculations = {
  /**
   * Calculate Stripe fee (2.9% + $0.30)
   */
  stripeFee: (amount: number): number => {
    const percentageFee = amount * 0.029;
    const fixedFee = 0.3;
    return roundToMoney(percentageFee + fixedFee);
  },

  /**
   * Calculate amount after Stripe fees
   */
  amountAfterStripeFees: (amount: number): number => {
    return roundToMoney(amount - CurrencyCalculations.stripeFee(amount));
  },

  /**
   * Calculate gross amount needed to net a specific amount after fees
   */
  grossFromNet: (netAmount: number): number => {
    // Reverse calculation: net = gross - (gross * 0.029 + 0.30)
    // net = gross * 0.971 - 0.30
    // gross = (net + 0.30) / 0.971
    return roundToMoney((netAmount + 0.3) / 0.971);
  },
} as const;

/**
 * @fileoverview Client-safe Stripe display utilities
 * @description Pure utility functions for Stripe UI elements that don't require Stripe SDK
 * @refactor Extracted from stripeUtils.ts to avoid client-side Stripe SDK imports
 */

/**
 * Get Stripe Connect account status display information
 * @source boombox-10.0/src/app/components/mover-account/stripeaccountstatus.tsx (getStatusDisplay)
 * @param accountData - Stripe account data with status fields
 * @returns Status display configuration with text, badge class, and text color
 */
export function getStripeAccountStatusDisplay(accountData: {
  detailsSubmitted?: boolean;
  payoutsEnabled?: boolean;
  chargesEnabled?: boolean;
} | null): {
  text: string;
  badgeClass: string;
  textColor: string;
} {
  if (!accountData) {
    return {
      text: 'Unknown',
      badgeClass: 'badge-info',
      textColor: 'text-zinc-500',
    };
  }

  if (!accountData.detailsSubmitted) {
    return {
      text: 'Incomplete',
      badgeClass: 'badge-warning',
      textColor: 'text-amber-600',
    };
  }

  if (!accountData.payoutsEnabled) {
    return {
      text: 'Pending',
      badgeClass: 'badge-info',
      textColor: 'text-blue-600',
    };
  }

  if (accountData.payoutsEnabled && accountData.chargesEnabled) {
    return {
      text: 'Active',
      badgeClass: 'badge-success',
      textColor: 'text-emerald-600',
    };
  }

  return {
    text: 'Limited',
    badgeClass: 'badge-warning',
    textColor: 'text-amber-600',
  };
}


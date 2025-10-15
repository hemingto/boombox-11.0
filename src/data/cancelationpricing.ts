/**
 * @fileoverview Cancellation pricing configuration
 * @source boombox-10.0/src/app/data/cancelationpricing.tsx
 * @refactor Updated fee to match boombox-10.0 ($65)
 */

export const cancelationPricing = {
  within24Hours: 65, // $65 cancellation fee for appointments within 24 hours
  fee: 65, // Legacy property for backwards compatibility
};


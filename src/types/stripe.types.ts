/**
 * @fileoverview Stripe integration types
 * @source boombox-10.0 Stripe integration patterns
 * @refactor Stripe payment processing types
 */

// Placeholder for Stripe types - to be implemented in future phases
export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

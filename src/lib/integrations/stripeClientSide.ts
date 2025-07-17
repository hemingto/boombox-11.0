/**
 * @fileoverview Stripe client-side client for frontend payment processing
 * @source boombox-10.0/src/app/lib/stripe-client.ts
 * @refactor Moved to integrations directory with NO LOGIC CHANGES
 */

import { Stripe, loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripePromise = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

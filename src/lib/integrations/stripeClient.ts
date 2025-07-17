/**
 * @fileoverview Stripe server-side client for payment processing
 * @source boombox-10.0/src/app/lib/stripe.ts
 * @refactor Moved to integrations directory with NO LOGIC CHANGES
 */

import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

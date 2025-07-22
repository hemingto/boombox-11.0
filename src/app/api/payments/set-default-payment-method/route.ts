/**
 * @fileoverview Set default payment method for Stripe customer
 * @source boombox-10.0/src/app/api/stripe/set-default-payment-method/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that sets a specific payment method as the default for a customer.
 * Updates Stripe customer invoice settings with new default payment method.
 *
 * USED BY (boombox-10.0 files):
 * - Customer payment method management pages
 * - Set default buttons in account settings
 * - Payment method preference workflows
 *
 * INTEGRATION NOTES:
 * - Uses Stripe API to update customer invoice settings
 * - Critical for payment processing - DO NOT modify Stripe logic
 * - Requires valid stripeCustomerId and paymentMethodId
 *
 * @refactor Moved from /api/stripe/set-default-payment-method/ to /api/payments/set-default-payment-method/
 */

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/integrations/stripeClient';

export async function POST(request: Request) {
  const { stripeCustomerId, paymentMethodId } = await request.json();

  if (!stripeCustomerId || !paymentMethodId) {
    return NextResponse.json(
      { message: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    // Set the payment method as the default for the customer
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return NextResponse.json({ message: 'Default payment method set successfully' });
  } catch (error: any) {
    console.error('Error setting default payment method:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 
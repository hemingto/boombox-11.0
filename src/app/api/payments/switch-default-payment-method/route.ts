/**
 * @fileoverview Switch default payment method for customer by userId
 * @source boombox-10.0/src/app/api/stripe/switch-default-payment-method/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that switches the default payment method for a customer using userId.
 * Looks up customer by userId then updates default payment method.
 *
 * USED BY (boombox-10.0 files):
 * - Customer dashboard payment method switching
 * - Account settings default payment method changes
 * - Payment preference management workflows
 *
 * INTEGRATION NOTES:
 * - Uses getStripeCustomerId to lookup customer by userId
 * - Updates Stripe customer invoice settings with new default
 * - Critical for payment processing - DO NOT modify Stripe logic
 *
 * @refactor Moved from /api/stripe/switch-default-payment-method/ to /api/payments/switch-default-payment-method/
 */

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/integrations/stripeClient';
import { getStripeCustomerId } from '@/lib/utils/stripeUtils';

export async function POST(request: Request) {
  try {
    const { userId, paymentMethodId } = await request.json();

    if (!userId || !paymentMethodId) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the Stripe customer ID for the user
    const stripeCustomerId = await getStripeCustomerId(userId);
    
    if (!stripeCustomerId) {
      return NextResponse.json(
        { message: 'Stripe customer not found' },
        { status: 404 }
      );
    }

    // Set the payment method as the default for the customer
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return NextResponse.json({ 
      message: 'Default payment method set successfully',
      defaultPaymentMethodId: paymentMethodId 
    });
  } catch (error: any) {
    console.error('Error setting default payment method:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 
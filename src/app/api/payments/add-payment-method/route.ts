/**
 * @fileoverview Add payment method to Stripe customer endpoint
 * @source boombox-10.0/src/app/api/stripe/add-payment-method/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that attaches a payment method to a Stripe customer.
 * Sets as default payment method if it's the customer's first card.
 *
 * USED BY (boombox-10.0 files):
 * - Customer payment method management components
 * - Add card forms in customer dashboard
 * - Payment setup flows during booking process
 *
 * INTEGRATION NOTES:
 * - Uses Stripe API to attach payment methods to customers
 * - Automatically sets first payment method as default
 * - Critical for payment processing - DO NOT modify Stripe logic
 * - Requires valid paymentMethodId from Stripe Elements
 *
 * @refactor Moved from /api/stripe/add-payment-method/ to /api/payments/add-payment-method/
 */

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/integrations/stripeClient';
import { getStripeCustomerId } from '@/lib/integrations/stripeUtils';

export async function POST(request: Request) {
  try {
    const { userId, paymentMethodId } = await request.json();

    if (!userId || !paymentMethodId) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const stripeCustomerId = await getStripeCustomerId(userId);
    
    if (!stripeCustomerId) {
      return NextResponse.json(
        { message: 'Failed to get or create Stripe customer' },
        { status: 400 }
      );
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    // If this is the first card, set it as default
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    if (!customer.deleted && !customer.invoice_settings?.default_payment_method) {
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    return NextResponse.json({
      message: 'Payment method added successfully',
      paymentMethodId: paymentMethodId
    });
  } catch (error: any) {
    console.error('Error adding payment method:', error);
    return NextResponse.json(
      { 
        message: 'Failed to add payment method', 
        error: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
/**
 * @fileoverview Stripe customer creation with payment method attachment
 * @source boombox-10.0/src/app/api/stripe/create-stripe-customer/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that creates a new Stripe customer and attaches a payment method.
 * Sets up customer with shipping address and default payment method for invoicing.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/getquote/getquoteform.tsx (line 345: Customer registration during quote submission)
 *
 * INTEGRATION NOTES:
 * - Critical Stripe integration - DO NOT modify payment logic
 * - Creates SetupIntent for off-session payments
 * - Requires paymentMethodId from Stripe Elements on frontend
 *
 * @refactor Moved from /api/stripe/ to /api/payments/ structure
 */

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/integrations/stripeClient';

export async function POST(request: Request) {
  const { email, firstName, lastName, phoneNumber, address, zipCode, paymentMethodId } = await request.json();

  // Validate required fields
  if (!email || !firstName || !lastName || !phoneNumber || !paymentMethodId) {
    return NextResponse.json(
      { message: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    // Create a new customer in Stripe
    const customer = await stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`,
      phone: phoneNumber,
      address: {
        line1: address,
        postal_code: zipCode,
        country: 'US',
      },
      shipping: {
        name: `${firstName} ${lastName}`,
        phone: phoneNumber,
        address: {
          line1: address,
          postal_code: zipCode,
          country: 'US',
        }
      }
    });

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session'
    });

    return NextResponse.json({ 
      stripeCustomerId: customer.id,
      clientSecret: setupIntent.client_secret 
    });
  } catch (error: any) {
    console.error('Error creating Stripe customer:', error);

    return NextResponse.json(
      { message: 'Internal server error', error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 
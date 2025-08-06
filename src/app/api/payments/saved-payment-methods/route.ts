/**
 * @fileoverview Fetch saved payment methods for Stripe customer
 * @source boombox-10.0/src/app/api/stripe/fetch-saved-payment-methods/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves all saved payment methods for a customer.
 * Includes default payment method identification and card formatting.
 *
 * USED BY (boombox-10.0 files):
 * - Customer payment method management pages
 * - Payment selection components during checkout
 * - Account settings payment method lists
 *
 * INTEGRATION NOTES:
 * - Uses Stripe API to fetch customer payment methods
 * - Expands invoice_settings.default_payment_method for identification
 * - Critical for payment processing - DO NOT modify Stripe logic
 * - Returns formatted card data with brand, last4, expiration
 *
 * @refactor Moved from /api/stripe/fetch-saved-payment-methods/ to /api/payments/saved-payment-methods/
 */

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/integrations/stripeClient';
import { getUserById } from '@/lib/utils/stripeUtils';
import Stripe from 'stripe';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid userId' }, 
        { status: 400 }
      );
    }

    // Fetch the user from your database
    const user = await getUserById(userId);
    if (!user || !user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'User or Stripe Customer ID not found' }, 
        { status: 404 }
      );
    }

    // Fetch the Stripe customer with expanded invoice settings
    const customer = await stripe.customers.retrieve(user.stripeCustomerId, {
      expand: ['invoice_settings.default_payment_method'],
    }) as Stripe.Customer;

    // Extract the default payment method ID
    const defaultPaymentMethodId = typeof customer.invoice_settings?.default_payment_method === 'string'
      ? customer.invoice_settings.default_payment_method
      : customer.invoice_settings?.default_payment_method?.id;

    // Fetch all card payment methods for the customer
    const paymentMethods = await stripe.customers.listPaymentMethods(
      user.stripeCustomerId,
      { type: 'card' }
    );

    // Transform the payment methods to include `isDefault` and format for the table
    const formattedPaymentMethods = paymentMethods.data.map((method) => ({
      id: method.id,
      brand: method.card?.brand ?? 'Unknown',
      last4: method.card?.last4 ?? '0000',
      expMonth: method.card?.exp_month ?? 0,
      expYear: method.card?.exp_year ?? 0,
      isDefault: method.id === defaultPaymentMethodId, // Flag for default method
    }));

    return NextResponse.json({
      paymentMethods: formattedPaymentMethods,
      defaultPaymentMethodId,
    });
  } catch (error) {
    console.error('Error retrieving payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment methods' }, 
      { status: 500 }
    );
  }
} 
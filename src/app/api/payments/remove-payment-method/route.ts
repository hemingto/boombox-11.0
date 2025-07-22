/**
 * @fileoverview Remove payment method from Stripe customer
 * @source boombox-10.0/src/app/api/stripe/remove-payment-method/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * DELETE endpoint that removes a payment method from a Stripe customer.
 * Automatically sets new default if removing current default payment method.
 *
 * USED BY (boombox-10.0 files):
 * - Customer payment method management pages
 * - Remove card buttons in account settings
 * - Payment method deletion workflows
 *
 * INTEGRATION NOTES:
 * - Uses Stripe API to detach payment methods from customers
 * - Automatically handles default payment method reassignment
 * - Critical for payment management - DO NOT modify Stripe logic
 * - Returns new default payment method ID if changed
 *
 * @refactor Moved from /api/stripe/remove-payment-method/ to /api/payments/remove-payment-method/
 */

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/integrations/stripeClient';
import { getStripeCustomerId } from '@/lib/integrations/stripeUtils';
import type { Stripe } from 'stripe';

export async function DELETE(request: Request) {
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

    // Get customer's current payment methods before removal
    const customer = await stripe.customers.retrieve(stripeCustomerId) as Stripe.Customer;
    
    // Check if customer is deleted
    if (customer.deleted) {
      return NextResponse.json(
        { message: 'Customer has been deleted' },
        { status: 404 }
      );
    }

    const isRemovingDefault = customer.invoice_settings?.default_payment_method === paymentMethodId;
    let newDefaultId: string | null = null;

    // If we're removing the default payment method, find a replacement
    if (isRemovingDefault) {
      // Get all payment methods
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card'
      });

      // Find the most recent payment method that isn't the one being removed
      const newDefault = paymentMethods.data
        .filter(method => method.id !== paymentMethodId)
        .sort((a, b) => b.created - a.created)[0];

      if (newDefault) {
        // Set the new default payment method
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: newDefault.id
          }
        });
        newDefaultId = newDefault.id;
      } else {
        // If no other payment methods, clear the default
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: ''
          }
        });
      }
    }

    // Detach the payment method
    await stripe.paymentMethods.detach(paymentMethodId);

    // Return the new default payment method ID if one was set
    return NextResponse.json({ 
      message: 'Payment method removed successfully',
      newDefaultPaymentMethodId: newDefaultId
    });
  } catch (error: any) {
    console.error('Error removing payment method:', error);
    return NextResponse.json(
      { 
        message: 'Failed to remove payment method', 
        error: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
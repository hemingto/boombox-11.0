/**
 * @fileoverview Process tip payment for packing supply deliveries
 * @source boombox-10.0/src/app/api/packing-supplies/process-tip/route.ts
 * @source boombox-10.0/src/app/api/packing-supplies/process-tip/utils.ts (processPackingSupplyTipPayment)
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that processes tip payments for packing supply deliveries.
 * Charges customer's saved payment method for delivery tip amount.
 *
 * USED BY (boombox-10.0 files):
 * - Packing supply delivery feedback forms
 * - Post-delivery tip processing workflows
 * - Driver tip collection for packing supply deliveries
 *
 * INTEGRATION NOTES:
 * - Uses Stripe API to process off-session payments
 * - Critical for driver compensation - DO NOT modify payment logic
 * - Handles authentication_required and card_declined errors
 * - Charges customer's first available payment method
 *
 * @refactor Moved from /api/packing-supplies/process-tip/ to /api/payments/packing-supply-tip/ and consolidated utils
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { stripe } from '@/lib/integrations/stripeClient';

async function processPackingSupplyTipPayment(data: { 
  orderId: number; 
  tipAmount: number; 
  stripeCustomerId: string;
}) {
  try {
    const { orderId, tipAmount, stripeCustomerId } = data;

    if (!orderId || !tipAmount || tipAmount <= 0) {
      return {
        success: false,
        error: 'Invalid parameters'
      };
    }

    if (!stripeCustomerId) {
      return {
        success: false,
        error: 'No Stripe customer associated with this order'
      };
    }

    console.log('Processing packing supply tip payment:', { orderId, tipAmount, stripeCustomerId });
    
    try {
      // First, check if the customer has any payment methods
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card'
      });
      
      console.log(`Found ${paymentMethods.data.length} payment methods for customer ${stripeCustomerId}`);
      
      if (paymentMethods.data.length === 0) {
        return {
          success: false,
          error: 'No payment methods found for this customer',
          code: 'no_payment_method'
        };
      }
      
      // Use the first payment method
      const paymentMethodId = paymentMethods.data[0].id;
      console.log(`Using payment method ${paymentMethodId} for customer ${stripeCustomerId}`);

      // Create and confirm the payment intent with the explicit payment method
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(tipAmount * 100), // Convert to cents
        currency: 'usd',
        customer: stripeCustomerId,
        payment_method: paymentMethodId, // Explicitly specify the payment method
        description: `Packing Supply Delivery Tip - Order #${orderId}`,
        confirm: true,
        off_session: true
      });

      console.log('Payment intent created:', paymentIntent.id, 'Status:', paymentIntent.status);

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status
      };
    } catch (stripeError: any) {
      console.error('Stripe payment error:', stripeError);
      
      // Handle specific Stripe errors
      if (stripeError.code === 'authentication_required') {
        // Payment requires authentication
        return {
          success: false,
          error: 'This payment requires authentication from the customer',
          code: stripeError.code,
          paymentIntentId: stripeError.payment_intent?.id
        };
      } else if (stripeError.code === 'card_declined') {
        // Card was declined
        return {
          success: false,
          error: 'The card was declined',
          code: stripeError.code
        };
      }
      
      return {
        success: false,
        error: 'Payment processing failed',
        details: stripeError.message,
        code: stripeError.code
      };
    }
  } catch (error: any) {
    console.error('Server error processing packing supply tip payment:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error.message
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await processPackingSupplyTipPayment(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.details, code: result.code },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in packing supply tip processing:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 
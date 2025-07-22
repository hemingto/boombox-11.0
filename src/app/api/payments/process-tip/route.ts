/**
 * @fileoverview Process tip payment for completed appointments
 * @source boombox-10.0/src/app/api/feedback/process-tip/route.ts
 * @source boombox-10.0/src/app/api/feedback/process-tip/utils.ts (processPayment function)
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that processes tip payments for completed appointments.
 * Charges customer's saved payment method for tip amount.
 *
 * USED BY (boombox-10.0 files):
 * - Customer feedback forms with tip options
 * - Post-appointment tip processing workflows
 * - Driver/mover tip collection system
 *
 * INTEGRATION NOTES:
 * - Uses Stripe API to process off-session payments
 * - Critical for driver/mover compensation - DO NOT modify payment logic
 * - Handles authentication_required and card_declined errors
 * - Charges customer's first available payment method
 *
 * @refactor Moved from /api/feedback/process-tip/ to /api/payments/process-tip/ and consolidated utils
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { stripe } from '@/lib/integrations/stripeClient';

async function processPayment(data: { appointmentId: number; tipAmount: number }) {
  try {
    const { appointmentId, tipAmount } = data;

    if (!appointmentId || !tipAmount || tipAmount <= 0) {
      return {
        success: false,
        error: 'Invalid parameters'
      };
    }

    // 1. Get the appointment to retrieve the Stripe customer ID
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        user: {
          select: {
            stripeCustomerId: true
          }
        }
      }
    });

    // Log the Stripe customer ID
    console.log('Stripe customer ID:', appointment?.user?.stripeCustomerId);

    if (!appointment || !appointment.user?.stripeCustomerId) {
      return {
        success: false,
        error: 'Appointment not found or no Stripe customer associated'
      };
    }

    const customerId = appointment.user.stripeCustomerId;
    
    try {
      // First, check if the customer has any payment methods
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });
      
      console.log(`Found ${paymentMethods.data.length} payment methods for customer ${customerId}`);
      
      if (paymentMethods.data.length === 0) {
        return {
          success: false,
          error: 'No payment methods found for this customer',
          code: 'no_payment_method'
        };
      }
      
      // Use the first payment method
      const paymentMethodId = paymentMethods.data[0].id;
      console.log(`Using payment method ${paymentMethodId} for customer ${customerId}`);

      
      // Create and confirm the payment intent with the explicit payment method
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(tipAmount * 100), // Convert to cents
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId, // Explicitly specify the payment method
        description: `${appointment?.appointmentType || 'Appointment'} Tip`,
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
    console.error('Server error processing tip payment:', error);
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
    const result = await processPayment(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.details, code: result.code },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 
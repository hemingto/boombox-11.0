/**
 * @fileoverview Stripe Connect Test Data API - POST create test payments for development
 * @source boombox-10.0/src/app/api/stripe/connect/test-data/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that creates test payment data for development and testing.
 * Creates payment intents with test cards and transfers to Connect accounts.
 * Used for testing payment flows and verifying integrations.
 *
 * USED BY (expected usage in boombox-11.0):
 * - Development testing workflows
 * - Payment integration testing
 * - Demo data generation
 * - Connect account verification testing
 * 
 * INTEGRATION NOTES:
 * - Creates test payment intents with predefined amounts
 * - Uses Stripe test cards for payment confirmation
 * - Transfers funds to specified Connect accounts
 * - Development/testing environment usage only
 * - Automated payment confirmation flow
 *
 * @refactor Migrated from /api/stripe/connect/ to /api/payments/connect/ structure
 * @refactor Added comprehensive validation using centralized schemas
 * @refactor Enhanced error handling and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { StripeConnectTestDataRequestSchema } from '@/lib/validations/api.validations';
import { stripe } from '@/lib/integrations/stripeClient';
import { prisma } from '@/lib/database/prismaClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { driverId } = body;
    
    // Validate request data
    const validationResult = StripeConnectTestDataRequestSchema.safeParse({
      driverId
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    if (!driverId) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
    }

    const parsedDriverId = typeof driverId === 'string' ? parseInt(driverId, 10) : driverId;
    if (isNaN(parsedDriverId)) {
      return NextResponse.json(
        { error: 'Invalid driver ID format' },
        { status: 400 }
      );
    }

    // Get driver's Connect account ID
    const driver = await prisma.driver.findUnique({
      where: { id: parsedDriverId },
      select: { stripeConnectAccountId: true }
    });

    if (!driver?.stripeConnectAccountId) {
      return NextResponse.json({ error: 'Driver has no Connect account' }, { status: 400 });
    }

    // Create a payment intent and transfer to the connected account
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00
      currency: 'usd',
      payment_method_types: ['card'],
      transfer_data: {
        destination: driver.stripeConnectAccountId,
      },
    });

    // Confirm the payment intent with a test card
    await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: 'pm_card_visa',
    });

    return NextResponse.json({ success: true, message: 'Test payment created' });
  } catch (error: any) {
    console.error('Error creating test data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
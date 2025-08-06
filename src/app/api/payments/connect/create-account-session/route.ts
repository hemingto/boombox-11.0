/**
 * @fileoverview Stripe Connect Account Session API - GET create account sessions for embedded components
 * @source boombox-10.0/src/app/api/stripe/connect/create-account-session/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that creates Stripe Connect account sessions for embedded dashboard components.
 * Specifically creates sessions with payouts component enabled for managing payouts.
 * Currently supports drivers only (original implementation pattern).
 *
 * USED BY (expected usage in boombox-11.0):
 * - Driver embedded payout dashboard
 * - In-app payout management interfaces
 * - Real-time account session components
 * - Embedded Connect dashboard widgets
 * 
 * INTEGRATION NOTES:
 * - Creates account sessions with payouts component
 * - Requires payouts to be enabled on the account
 * - Returns client secret for frontend integration
 * - Currently driver-specific implementation (can be extended for movers)
 *
 * @refactor Migrated from /api/stripe/connect/ to /api/payments/connect/ structure
 * @refactor Updated to use centralized validation and utilities
 * @refactor Enhanced error handling and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { StripeConnectDriverRequestSchema } from '@/lib/validations/api.validations';
import { stripe } from '@/lib/integrations/stripeClient';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const driverId = searchParams.get('driverId');
    
    // Validate request parameters
    const validationResult = StripeConnectDriverRequestSchema.safeParse({
      driverId
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' }, 
        { status: 400 }
      );
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
      select: { 
        stripeConnectAccountId: true,
        stripeConnectPayoutsEnabled: true
      }
    });

    if (!driver || !driver.stripeConnectAccountId) {
      return NextResponse.json(
        { error: 'Driver does not have a Connect account' }, 
        { status: 404 }
      );
    }

    if (!driver.stripeConnectPayoutsEnabled) {
      return NextResponse.json(
        { error: 'Payouts are not enabled for this account' }, 
        { status: 400 }
      );
    }

    // Create an account session with payouts component enabled
    const session = await stripe.accountSessions.create({
      account: driver.stripeConnectAccountId,
      components: {
        payouts: {
          enabled: true,
        }
      }
    });

    return NextResponse.json({
      clientSecret: session.client_secret
    });
  } catch (error: any) {
    console.error('Error creating account session:', error);
    return NextResponse.json(
      { error: 'Failed to create account session', details: error.message }, 
      { status: 500 }
    );
  }
}
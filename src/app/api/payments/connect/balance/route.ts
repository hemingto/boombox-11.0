/**
 * @fileoverview Stripe Connect Balance API - GET account balance information
 * @source boombox-10.0/src/app/api/stripe/connect/balance/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves comprehensive balance information from Stripe Connect account.
 * Calculates available, pending, and in-transit balances for complete financial overview.
 * Supports both driver and mover user types.
 *
 * USED BY (expected usage in boombox-11.0):
 * - Payment dashboard balance displays
 * - Financial summary widgets
 * - Payout calculation interfaces
 * - Earnings tracking components
 * 
 * INTEGRATION NOTES:
 * - Real-time balance retrieval from Stripe
 * - In-transit payout calculation for accurate totals
 * - Currency handling (amounts in cents from Stripe)
 * - Balance aggregation across multiple currency types
 *
 * @refactor Migrated from /api/stripe/connect/ to /api/payments/connect/ structure
 * @refactor Extracted balance calculation to stripeUtils.ts for reusability
 * @refactor Added comprehensive validation using centralized schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { StripeConnectUserRequestSchema } from '@/lib/validations/api.validations';
import { getStripeConnectUser, calculateStripeBalance } from '@/lib/utils/stripeUtils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType');
    
    // Validate request parameters
    const validationResult = StripeConnectUserRequestSchema.safeParse({
      userId,
      userType
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    if (!userId || !userType) {
      return NextResponse.json(
        { error: 'User ID and type are required' }, 
        { status: 400 }
      );
    }

    if (userType !== 'driver' && userType !== 'mover') {
      return NextResponse.json(
        { error: 'Invalid user type' }, 
        { status: 400 }
      );
    }

    const parsedUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(parsedUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Get user's Connect account info using centralized utility
    const user = await getStripeConnectUser(parsedUserId, userType);

    if (!user || !user.stripeConnectAccountId) {
      return NextResponse.json(
        { error: `${userType} does not have a Connect account` }, 
        { status: 404 }
      );
    }

    // Calculate comprehensive balance using centralized utility
    const balanceInfo = await calculateStripeBalance(user.stripeConnectAccountId);

    return NextResponse.json({
      available: balanceInfo.available,
      pending: balanceInfo.pending,
      inTransit: balanceInfo.inTransit,
      total: balanceInfo.total
    });
  } catch (error: any) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance', details: error.message }, 
      { status: 500 }
    );
  }
}
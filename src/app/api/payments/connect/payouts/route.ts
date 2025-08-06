/**
 * @fileoverview Stripe Connect Payouts API - GET payout history and status
 * @source boombox-10.0/src/app/api/stripe/connect/payouts/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves payout history from Stripe Connect account.
 * Formats payout data with status, amounts, dates, and destination information.
 * Provides comprehensive payout tracking for financial management.
 *
 * USED BY (expected usage in boombox-11.0):
 * - Driver payout tracking dashboard
 * - Mover earnings payout history
 * - Financial reconciliation interfaces
 * - Payout status monitoring
 * 
 * INTEGRATION NOTES:
 * - Direct Stripe payouts API integration
 * - Currency conversion from cents to dollars
 * - Date formatting for user-friendly display
 * - Payout destination tracking
 * - Status-based filtering and display
 *
 * @refactor Migrated from /api/stripe/connect/ to /api/payments/connect/ structure
 * @refactor Added comprehensive validation using centralized schemas
 * @refactor Enhanced error handling and data formatting
 */

import { NextRequest, NextResponse } from 'next/server';
import { StripeConnectUserRequestSchema } from '@/lib/validations/api.validations';
import { getStripeConnectUser } from '@/lib/utils/stripeUtils';
import { stripe } from '@/lib/integrations/stripeClient';

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

    // Get payouts from Stripe
    const payouts = await stripe.payouts.list(
      { limit: 100 },
      { stripeAccount: user.stripeConnectAccountId }
    );

    // Format payouts data
    const formattedPayouts = payouts.data.map(payout => ({
      id: payout.id,
      amount: payout.amount / 100, // Convert from cents to dollars
      status: payout.status,
      date: new Date(payout.created * 1000).toLocaleDateString(),
      destination: payout.destination || 'Unknown'
    }));

    return NextResponse.json({
      payouts: formattedPayouts
    });
  } catch (error: any) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts', details: error.message }, 
      { status: 500 }
    );
  }
}
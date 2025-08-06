/**
 * @fileoverview Stripe Connect Status API - GET Connect account status from database
 * @source boombox-10.0/src/app/api/stripe/connect/stripe-status/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves Stripe Connect account status from local database.
 * Returns cached status information without calling Stripe API for performance.
 * Provides quick status checks for UI components and dashboards.
 *
 * USED BY (expected usage in boombox-11.0):
 * - Dashboard status indicators
 * - Quick account verification checks
 * - UI conditional rendering logic
 * - Status-dependent feature access
 * 
 * INTEGRATION NOTES:
 * - Database-only queries for performance
 * - No external Stripe API calls
 * - Cached status information retrieval
 * - Boolean status flags for easy UI integration
 * - Account existence detection
 *
 * @refactor Migrated from /api/stripe/connect/ to /api/payments/connect/ structure
 * @refactor Added comprehensive validation using centralized schemas
 * @refactor Enhanced error handling and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { StripeConnectUserRequestSchema } from '@/lib/validations/api.validations';
import { getStripeConnectUser } from '@/lib/utils/stripeUtils';

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

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (!userType || (userType !== 'driver' && userType !== 'mover')) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

    const parsedUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(parsedUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    // Get user's Stripe Connect account status using centralized utility
    const user = await getStripeConnectUser(parsedUserId, userType);
    
    if (!user) {
      return NextResponse.json({ error: `${userType} not found` }, { status: 404 });
    }
    
    return NextResponse.json({
      hasStripeAccount: !!user.stripeConnectAccountId,
      stripeConnectAccountId: user.stripeConnectAccountId,
      onboardingComplete: user.stripeConnectOnboardingComplete,
      payoutsEnabled: user.stripeConnectPayoutsEnabled,
      detailsSubmitted: user.stripeConnectDetailsSubmitted
    });
  } catch (error) {
    console.error('Error fetching Stripe account status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Stripe account status' },
      { status: 500 }
    );
  }
}
/**
 * @fileoverview Stripe Connect Account Status API - GET account status with live updates
 * @source boombox-10.0/src/app/api/stripe/connect/account-status/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves and updates Connect account status from Stripe.
 * Fetches live status from Stripe API and updates local database records.
 * Supports both driver and mover user types with conditional database queries.
 *
 * USED BY (expected usage in boombox-11.0):
 * - Payment onboarding status checks
 * - Dashboard status indicators
 * - Admin account verification workflows
 * - Compliance and requirements tracking
 * 
 * INTEGRATION NOTES:
 * - Real-time Stripe API status synchronization
 * - Database updates to maintain local status cache
 * - Account requirements and verification status
 * - Supports users without Connect accounts (returns hasAccount: false)
 *
 * @refactor Migrated from /api/stripe/connect/ to /api/payments/connect/ structure
 * @refactor Extracted status update logic to stripeUtils.ts for reusability
 * @refactor Added comprehensive validation using centralized schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { StripeConnectUserRequestSchema } from '@/lib/validations/api.validations';
import { getStripeConnectUser, updateStripeConnectStatus } from '@/lib/utils/stripeUtils';
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
      return NextResponse.json({
        hasAccount: false,
        message: `${userType} does not have a Connect account`
      });
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);

    // Update user record with latest status using centralized utility
    await updateStripeConnectStatus(parsedUserId, userType, account);

    return NextResponse.json({
      hasAccount: true,
      accountId: user.stripeConnectAccountId,
      detailsSubmitted: account.details_submitted,
      payoutsEnabled: account.payouts_enabled,
      chargesEnabled: account.charges_enabled,
      requirements: account.requirements,
      // Include any other relevant account details
    });
  } catch (error: any) {
    console.error('Error checking account status:', error);
    return NextResponse.json(
      { error: 'Failed to check account status', details: error.message }, 
      { status: 500 }
    );
  }
}
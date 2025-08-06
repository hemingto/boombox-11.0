/**
 * @fileoverview Stripe Connect Account Link API - POST create onboarding links
 * @source boombox-10.0/src/app/api/stripe/connect/create-account-link/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that creates Stripe Connect account onboarding links.
 * Generates URLs for users to complete their account setup and verification.
 * Configures return and refresh URLs based on user type and environment.
 *
 * USED BY (expected usage in boombox-11.0):
 * - Driver onboarding flows
 * - Mover account setup processes
 * - Account verification workflows
 * - Re-onboarding for incomplete accounts
 * 
 * INTEGRATION NOTES:
 * - Critical Stripe Connect onboarding integration
 * - Dynamic URL generation based on user type (driver vs mover)
 * - Environment-aware URL configuration
 * - Account link expiration and refresh handling
 * - Eventually due collection for comprehensive onboarding
 *
 * @refactor Migrated from /api/stripe/connect/ to /api/payments/connect/ structure
 * @refactor Added comprehensive validation using centralized schemas
 * @refactor Enhanced error handling and user type validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { StripeConnectUserRequestSchema } from '@/lib/validations/api.validations';
import { getStripeConnectUser } from '@/lib/utils/stripeUtils';
import { stripe } from '@/lib/integrations/stripeClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userType } = body;
    
    // Validate request data
    const validationResult = StripeConnectUserRequestSchema.safeParse({
      userId,
      userType
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
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

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeConnectAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/${userType === 'driver' ? 'driver' : 'mover'}-account-page/${parsedUserId}/payment?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/${userType === 'driver' ? 'driver' : 'mover'}-account-page/${parsedUserId}/payment?success=true`,
      type: 'account_onboarding',
      collect: 'eventually_due',
    });

    return NextResponse.json({
      url: accountLink.url
    });
  } catch (error: any) {
    console.error('Error creating account link:', error);
    return NextResponse.json(
      { error: 'Failed to create account link', details: error.message }, 
      { status: 500 }
    );
  }
}
/**
 * @fileoverview Stripe Connect Dashboard Link API - POST create dashboard access links
 * @source boombox-10.0/src/app/api/stripe/connect/create-dashboard-link/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that creates Stripe Connect dashboard login links.
 * Generates secure access URLs to the full Stripe Connect dashboard.
 * Requires completed onboarding before allowing dashboard access.
 *
 * USED BY (expected usage in boombox-11.0):
 * - Driver dashboard access
 * - Mover payment management
 * - Full Stripe dashboard integration
 * - Advanced payment management features
 * 
 * INTEGRATION NOTES:
 * - Creates login links to full Stripe Connect dashboard
 * - Requires onboarding completion for access
 * - Temporary URLs with limited lifespan
 * - Full Stripe dashboard feature access
 * - Account verification status checking
 *
 * @refactor Migrated from /api/stripe/connect/ to /api/payments/connect/ structure
 * @refactor Added comprehensive validation using centralized schemas
 * @refactor Enhanced onboarding completion verification
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

    // Check if onboarding is complete
    if (!user.stripeConnectOnboardingComplete) {
      return NextResponse.json(
        { error: `${userType} must complete onboarding before accessing the dashboard` }, 
        { status: 400 }
      );
    }

    // Create a login link for the dashboard
    const loginLink = await stripe.accounts.createLoginLink(
      user.stripeConnectAccountId
    );

    return NextResponse.json({
      url: loginLink.url
    });
  } catch (error: any) {
    console.error('Error creating dashboard link:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard link', details: error.message }, 
      { status: 500 }
    );
  }
}
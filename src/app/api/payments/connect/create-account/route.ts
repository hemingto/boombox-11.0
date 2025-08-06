/**
 * @fileoverview Stripe Connect Create Account API - POST create new Connect accounts
 * @source boombox-10.0/src/app/api/stripe/connect/create-account/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that creates new Stripe Connect accounts for drivers or movers.
 * Handles business type configuration (individual for drivers, company for movers).
 * Sets up account capabilities, business profiles, and metadata.
 * Updates database records with new account IDs and initial status.
 *
 * USED BY (expected usage in boombox-11.0):
 * - Driver onboarding workflow
 * - Mover registration process
 * - Admin manual account creation
 * - Account recovery/recreation flows
 * 
 * INTEGRATION NOTES:
 * - Critical Stripe Connect account creation
 * - Different business types and MCC codes for drivers vs movers
 * - Database transaction updates with account status initialization
 * - Handles existing account detection and returns existing ID
 * - Environment-aware URL configuration for business profile
 *
 * @refactor Migrated from /api/stripe/connect/ to /api/payments/connect/ structure
 * @refactor Extracted account creation logic to stripeUtils.ts for reusability
 * @refactor Added comprehensive validation using centralized schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { StripeConnectUserRequestSchema } from '@/lib/validations/api.validations';
import { getDetailedStripeConnectUser, createStripeConnectAccount, DriverUser, MovingPartnerUser } from '@/lib/utils/stripeUtils';

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

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' }, 
        { status: 400 }
      );
    }

    if (!userType || !['driver', 'mover'].includes(userType)) {
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

    // Get detailed user info using centralized utility
    const user = await getDetailedStripeConnectUser(parsedUserId, userType);

    if (!user) {
      return NextResponse.json(
        { error: `${userType} not found` }, 
        { status: 404 }
      );
    }

    // If user already has a Connect account, return it
    if (user.stripeConnectAccountId) {
      return NextResponse.json({
        success: true,
        accountId: user.stripeConnectAccountId,
        message: `${userType} already has a Connect account`
      });
    }

    // Create Stripe Connect account using centralized utility
    const accountId = await createStripeConnectAccount(parsedUserId, userType, user);

    return NextResponse.json({
      success: true,
      accountId: accountId
    });
  } catch (error: any) {
    console.error('Error creating Connect account:', error);
    return NextResponse.json(
      { error: 'Failed to create Connect account', details: error.message }, 
      { status: 500 }
    );
  }
}
/**
 * @fileoverview Stripe Connect Account Details API - GET comprehensive account information
 * @source boombox-10.0/src/app/api/stripe/connect/account-details/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves comprehensive Stripe Connect account details including:
 * - Account balance (available, pending, in-transit)
 * - Account status (details submitted, payouts enabled, charges enabled)
 * - Account metadata (connected date, account name)
 * - Supports both driver and mover user types
 *
 * USED BY (expected usage in boombox-11.0):
 * - Driver payment dashboard
 * - Mover payment dashboard
 * - Admin payment monitoring
 * - Financial reporting interfaces
 * 
 * INTEGRATION NOTES:
 * - Critical Stripe Connect integration for account status
 * - Combines multiple Stripe API calls (accounts, balance, payouts)
 * - Currency conversion from cents to dollars
 * - Date formatting for user-friendly display
 * - Dynamic account name generation based on user type
 *
 * @refactor Migrated from /api/stripe/connect/ to /api/payments/connect/ structure
 * @refactor Extracted account operations to stripeUtils.ts for reusability
 * @refactor Added comprehensive validation using centralized schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { StripeConnectUserRequestSchema } from '@/lib/validations/api.validations';
import { calculateStripeBalance } from '@/lib/utils/stripeUtils';
import { stripe } from '@/lib/integrations/stripeClient';
import { prisma } from '@/lib/database/prismaClient';

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

    // Get user and account name based on type
    let user: { stripeConnectAccountId: string | null } | null;
    let accountName: string;

    if (userType === 'driver') {
      const driver = await prisma.driver.findUnique({
        where: { id: parsedUserId },
        select: {
          firstName: true,
          lastName: true,
          stripeConnectAccountId: true
        }
      });
      user = driver;
      accountName = driver ? `${driver.firstName} ${driver.lastName}` : '';
    } else {
      const movingPartner = await prisma.movingPartner.findUnique({
        where: { id: parsedUserId },
        select: {
          name: true,
          stripeConnectAccountId: true
        }
      });
      user = movingPartner;
      accountName = movingPartner?.name || '';
    }

    if (!user || !user.stripeConnectAccountId) {
      return NextResponse.json(
        { error: 'No Stripe Connect account found' },
        { status: 404 }
      );
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);

    // Calculate comprehensive balance using centralized utility
    const balanceInfo = await calculateStripeBalance(user.stripeConnectAccountId);

    // Format the connected date
    const connectedDate = account.created 
      ? new Date(account.created * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'Unknown';
    
    return NextResponse.json({
      accountName,
      balance: balanceInfo.total,
      availableBalance: balanceInfo.available,
      pendingBalance: balanceInfo.pending,
      connectedDate: connectedDate,
      detailsSubmitted: account.details_submitted,
      payoutsEnabled: account.payouts_enabled,
      chargesEnabled: account.charges_enabled
    });
    
  } catch (error: any) {
    console.error("Error fetching Stripe account details:", error);
    return NextResponse.json(
      { error: "Failed to fetch Stripe account details", details: error.message }, 
      { status: 500 }
    );
  }
}
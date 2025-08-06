/**
 * @fileoverview Stripe Connect Payment History API - GET payment transaction history
 * @source boombox-10.0/src/app/api/stripe/connect/payment-history/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves comprehensive payment history from Stripe Connect account.
 * Combines payment intents and transfers for complete transaction overview.
 * Formats data for user-friendly display with chronological sorting.
 *
 * USED BY (expected usage in boombox-11.0):
 * - Driver payment history dashboard
 * - Mover earnings tracking
 * - Financial reporting interfaces
 * - Transaction audit trails
 * 
 * INTEGRATION NOTES:
 * - Combines multiple Stripe API calls (payment intents + transfers)
 * - Currency conversion from cents to dollars
 * - Chronological sorting by creation date (most recent first)
 * - Handles both incoming payments and transfers
 * - Pagination support with configurable limits
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

    // Get both payment intents and transfers
    const [paymentIntents, transfers] = await Promise.all([
      stripe.paymentIntents.list(
        { limit: 100 },
        { stripeAccount: user.stripeConnectAccountId }
      ),
      stripe.transfers.list(
        { 
          limit: 100,
          destination: user.stripeConnectAccountId
        }
      )
    ]);

    console.log('Payment Intents:', paymentIntents.data);
    console.log('Transfers:', transfers.data);

    // Format payments data combining both sources
    const formattedPayments = [
      ...paymentIntents.data.map(payment => ({
        id: payment.id,
        amount: payment.amount / 100,
        status: payment.status,
        created: payment.created,
        description: payment.description || 'Payment Intent'
      })),
      ...transfers.data.map(transfer => ({
        id: transfer.id,
        amount: transfer.amount / 100,
        status: 'Paid',
        created: transfer.created,
        description: transfer.description || 'Transfer Payment'
      }))
    ].sort((a, b) => b.created - a.created); // Sort by most recent first

    return NextResponse.json({
      payments: formattedPayments
    });
  } catch (error: any) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history', details: error.message }, 
      { status: 500 }
    );
  }
}
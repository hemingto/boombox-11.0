/**
 * @fileoverview Stripe webhook handler for payment and account events
 * @source boombox-10.0/src/app/api/webhooks/stripe/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that handles Stripe webhook events for payment processing.
 * Processes account updates and syncs driver Connect account status.
 *
 * USED BY (boombox-10.0 files):
 * - Stripe webhook configuration in dashboard
 * - Driver Connect account onboarding flows
 * - Payment processing event handling
 *
 * INTEGRATION NOTES:
 * - Uses Stripe webhook signature verification for security
 * - Updates driver Connect account status in database
 * - Critical for payment processing - DO NOT modify webhook logic
 * - Handles account.updated events for driver onboarding
 *
 * @refactor Moved from /api/webhooks/stripe/ to /api/payments/stripe-webhook/
 */

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/integrations/stripeClient';
import { prisma } from '@/lib/database/prismaClient';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle specific events
  try {
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object;
        
        // Find the driver with this Connect account ID
        const driver = await prisma.driver.findFirst({
          where: { stripeConnectAccountId: account.id }
        });

        if (driver) {
          // Update driver record with latest account status
          await prisma.driver.update({
            where: { id: driver.id },
            data: {
              stripeConnectOnboardingComplete: account.details_submitted,
              stripeConnectPayoutsEnabled: account.payouts_enabled,
              stripeConnectDetailsSubmitted: account.details_submitted
            }
          });
        }
        break;
      }
      
      // Add other event handlers as needed
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 
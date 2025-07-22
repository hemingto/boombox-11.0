/**
 * @fileoverview Stripe customer cleanup endpoint
 * @source boombox-10.0/src/app/api/stripe/cleanup-customer/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * DELETE endpoint that removes a Stripe customer and all associated data.
 * Used for account cleanup and GDPR compliance.
 *
 * USED BY (boombox-10.0 files):
 * - Account deletion workflows
 * - Admin customer management tools
 * - GDPR data removal processes
 *
 * INTEGRATION NOTES:
 * - Uses Stripe API to permanently delete customer records
 * - Critical for data privacy compliance - DO NOT modify logic
 * - Irreversible operation - use with caution
 * - Removes all payment methods, subscriptions, and invoices
 *
 * @refactor Moved from /api/stripe/cleanup-customer/ to /api/payments/cleanup-customer/
 */

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/integrations/stripeClient';

export async function DELETE(request: Request) {
  try {
    const { stripeCustomerId } = await request.json();
    
    await stripe.customers.del(stripeCustomerId);
    
    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error cleaning up customer:', error);
    return NextResponse.json(
      { message: 'Failed to clean up customer' },
      { status: 500 }
    );
  }
} 
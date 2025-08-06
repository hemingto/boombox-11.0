/**
 * @fileoverview Customer Profile API - GET customer profile with Stripe payment methods
 * @source boombox-10.0/src/app/api/users/[id]/profile/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves customer profile information including Stripe payment methods.
 * Fetches user data from database and integrates with Stripe to get saved payment methods/cards.
 * Returns user profile with payment method details including default payment method status.
 *
 * USED BY (expected usage in boombox-11.0):
 * - Customer profile management interface
 * - Payment method management screens
 * - Customer account settings
 * 
 * INTEGRATION NOTES:
 * - Critical Stripe integration for payment methods retrieval
 * - Handles cases where user has no Stripe customer ID gracefully
 * - Includes default payment method detection from Stripe customer settings
 * - Continues operation even if Stripe API fails (returns empty savedCards array)
 *
 * @refactor Migrated from /api/users/[id]/profile/ to /api/customers/[id]/update-profile/ structure
 * @refactor Extracted profile query logic to customerUtils.ts for reusability
 * @refactor Added comprehensive validation using centralized schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { CustomerProfileRequestSchema } from '@/lib/validations/api.validations';
import { getUserProfileWithPaymentMethods } from '@/lib/utils/customerUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate the customer ID
    const rawParams = await params;
    const validationResult = CustomerProfileRequestSchema.safeParse({
      id: rawParams.id
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid customer ID', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const customerId = typeof validationResult.data.id === 'string' 
      ? parseInt(validationResult.data.id, 10) 
      : validationResult.data.id;

    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID format' }, { status: 400 });
    }

    // Get customer profile with payment methods using centralized utility
    const customerProfile = await getUserProfileWithPaymentMethods(customerId);

    return NextResponse.json(customerProfile);
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
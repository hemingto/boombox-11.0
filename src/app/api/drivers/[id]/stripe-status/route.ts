/**
 * @fileoverview Driver/Mover Stripe Status API Route - Fetch Stripe Connect account status
 * @source boombox-10.0/src/app/api/drivers/[driverId]/stripe-status/route.ts
 * @refactor Migrated to centralized architecture with validation and utilities
 * @usage GET /api/drivers/[id]/stripe-status?userType=driver|mover - Fetch Stripe account status
 * 
 * @functionality
 * - Fetches Stripe Connect account status for driver or mover
 * - Validates user type parameter (driver or mover)
 * - Returns account status including onboarding completion and payout enablement
 * - Supports both driver and mover entities through userType parameter
 * 
 * @dependencies
 * - @/lib/utils/driverUtils.getUserStripeStatus
 * - @/lib/validations/api.validations.DriverStripeStatusRequestSchema
 * 
 * @migration_notes
 * - Extracted Stripe status fetching logic to driverUtils
 * - Added comprehensive request validation with Zod schemas
 * - Preserved exact business logic for both driver and mover support
 * - Maintained response format compatibility with Stripe Connect fields
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  DriverStripeStatusRequestSchema,
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { getUserStripeStatus } from '@/lib/utils/driverUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters and query
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType');
    
    if (!userType || (userType !== 'driver' && userType !== 'mover')) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

    const requestData = { driverId: id, userType };
    const validation = validateApiRequest(DriverStripeStatusRequestSchema, requestData);

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid request data', details: errors },
        { status: 400 }
      );
    }

    const { driverId, userType: validatedUserType } = validation.data;

    // Get Stripe status using centralized utility
    const stripeStatus = await getUserStripeStatus(Number(driverId), validatedUserType);

    return NextResponse.json(stripeStatus);
  } catch (error) {
    console.error('Error fetching Stripe account status:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      const userType = new URL(request.url).searchParams.get('userType') || 'user';
      return NextResponse.json({ error: `${userType} not found` }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch Stripe account status' },
      { status: 500 }
    );
  }
} 
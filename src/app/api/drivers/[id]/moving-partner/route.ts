/**
 * @fileoverview Driver Moving Partner API Route - Get driver's moving partner ID
 * @source boombox-10.0/src/app/api/drivers/[driverId]/moving-partner/route.ts
 * @refactor Migrated to centralized architecture with validation and utilities
 * @usage GET /api/drivers/[id]/moving-partner - Fetch driver's moving partner ID
 * 
 * @functionality
 * - Fetches the moving partner ID for an active driver association
 * - Returns null if driver is not linked to any moving partner
 * - Validates driver ID format
 * 
 * @dependencies
 * - @/lib/utils/driverUtils.getDriverMovingPartner
 * - @/lib/validations/api.validations.DriverMovingPartnerRequestSchema
 * 
 * @migration_notes
 * - Extracted moving partner ID fetching logic to driverUtils
 * - Added request validation with Zod schemas
 * - Preserved exact business logic and response structure
 * - Maintained compatibility with moving partner ID responses
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  DriverMovingPartnerRequestSchema,
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { getDriverMovingPartner } from '@/lib/utils/driverUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters
    const { id } = await params;
    const validation = validateApiRequest(DriverMovingPartnerRequestSchema, { driverId: id });

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid driver ID', details: errors },
        { status: 400 }
      );
    }

    const { driverId } = validation.data;

    // Get driver moving partner ID using centralized utility
    const movingPartner = await getDriverMovingPartner(Number(driverId));

    return NextResponse.json(movingPartner);
  } catch (error) {
    console.error('Error checking moving partner association:', error);
    return NextResponse.json(
      { error: 'Failed to check moving partner association' },
      { status: 500 }
    );
  }
} 
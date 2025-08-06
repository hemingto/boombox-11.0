/**
 * @fileoverview Driver Moving Partner Status API Route - Check if driver is linked to moving partner
 * @source boombox-10.0/src/app/api/drivers/[driverId]/moving-partner-status/route.ts
 * @refactor Migrated to centralized architecture with validation and utilities
 * @usage GET /api/drivers/[id]/moving-partner-status - Check driver moving partner association
 * 
 * @functionality
 * - Checks if driver is linked to any active moving partner
 * - Returns boolean status and moving partner details if linked
 * - Validates driver ID format
 * 
 * @dependencies
 * - @/lib/utils/driverUtils.getDriverMovingPartnerStatus
 * - @/lib/validations/api.validations.DriverMovingPartnerStatusRequestSchema
 * 
 * @migration_notes
 * - Extracted moving partner status checking logic to driverUtils
 * - Added request validation with Zod schemas
 * - Preserved exact business logic and response structure
 * - Maintained compatibility with moving partner associations
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  DriverMovingPartnerStatusRequestSchema,
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { getDriverMovingPartnerStatus } from '@/lib/utils/driverUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters
    const { id } = await params;
    const validation = validateApiRequest(DriverMovingPartnerStatusRequestSchema, { driverId: id });

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid driver ID', details: errors },
        { status: 400 }
      );
    }

    const { driverId } = validation.data;

    // Check driver moving partner status using centralized utility
    const status = await getDriverMovingPartnerStatus(Number(driverId));

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking moving partner status:', error);
    return NextResponse.json(
      { error: 'Failed to check moving partner status' },
      { status: 500 }
    );
  }
} 
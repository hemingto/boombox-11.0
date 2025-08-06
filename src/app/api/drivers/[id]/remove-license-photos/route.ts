/**
 * @fileoverview Driver Remove License Photos API Route - Remove driver license photos
 * @source boombox-10.0/src/app/api/drivers/[driverId]/remove-license-photos/route.ts
 * @refactor Migrated to centralized architecture with validation and utilities
 * @usage DELETE /api/drivers/[id]/remove-license-photos - Remove driver license photo (front or back)
 * 
 * @functionality
 * - Removes either front or back driver license photo
 * - Validates driver ID and photo type parameters
 * - Updates database to set specified photo field to null
 * - Returns success status
 * 
 * @dependencies
 * - @/lib/utils/driverUtils.removeDriverLicensePhoto
 * - @/lib/validations/api.validations.DriverRemoveLicensePhotosRequestSchema
 * 
 * @migration_notes
 * - Extracted license photo removal logic to driverUtils
 * - Added comprehensive request validation with Zod schemas
 * - Preserved exact business logic for photo type validation and removal
 * - Maintained response format compatibility
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  DriverRemoveLicensePhotosRequestSchema,
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { removeDriverLicensePhoto } from '@/lib/utils/driverUtils';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters and body
    const { id } = await params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    const requestData = { ...body, driverId: id };
    const validation = validateApiRequest(DriverRemoveLicensePhotosRequestSchema, requestData);

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid request data', details: errors },
        { status: 400 }
      );
    }

    const { driverId, photoType } = validation.data;

    // Remove driver license photo using centralized utility
    const result = await removeDriverLicensePhoto(Number(driverId), photoType);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting driver license photo:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
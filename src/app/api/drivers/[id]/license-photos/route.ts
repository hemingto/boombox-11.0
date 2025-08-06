/**
 * @fileoverview Driver License Photos API Route - Fetch driver license photo URLs
 * @source boombox-10.0/src/app/api/drivers/[driverId]/license-photos/route.ts
 * @refactor Migrated to centralized architecture with validation and utilities
 * @usage GET /api/drivers/[id]/license-photos - Fetch driver license photos
 * 
 * @functionality
 * - Fetches driver license front and back photo URLs
 * - Validates driver existence
 * - Returns photo URLs or null if not uploaded
 * 
 * @dependencies
 * - @/lib/utils/driverUtils.getDriverLicensePhotos
 * - @/lib/validations/api.validations.DriverLicensePhotosRequestSchema
 * 
 * @migration_notes
 * - Extracted license photo fetching logic to driverUtils
 * - Added request validation with Zod schemas
 * - Preserved exact business logic and error handling
 * - Maintained response format compatibility
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  DriverLicensePhotosRequestSchema,
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { getDriverLicensePhotos } from '@/lib/utils/driverUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    const validation = validateApiRequest(DriverLicensePhotosRequestSchema, { driverId: id });

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid driver ID', details: errors },
        { status: 400 }
      );
    }

    const { driverId } = validation.data;

    // Fetch driver license photos using centralized utility
    const photos = await getDriverLicensePhotos(Number(driverId));

    return NextResponse.json(photos);
  } catch (error) {
    console.error('Unexpected error in license photos route:', error);
    
    if (error instanceof Error && error.message === 'Driver not found') {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
/**
 * @fileoverview Driver Profile Picture API Route - Fetch driver's profile picture URL
 * @source boombox-10.0/src/app/api/drivers/[driverId]/profile-picture/route.ts
 * @refactor Migrated to centralized architecture with validation and utilities
 * @usage GET /api/drivers/[id]/profile-picture - Fetch driver's profile picture URL
 * 
 * @functionality
 * - Fetches driver's profile picture URL
 * - Validates driver existence and profile picture availability
 * - Returns 404 if driver not found or no profile picture exists
 * 
 * @dependencies
 * - @/lib/utils/driverUtils.getDriverProfilePicture
 * - @/lib/validations/api.validations.DriverProfilePictureRequestSchema
 * 
 * @migration_notes
 * - Extracted profile picture fetching logic to driverUtils
 * - Added request validation with Zod schemas
 * - Preserved exact business logic and error handling including 404 for missing pictures
 * - Maintained response format compatibility
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  DriverProfilePictureRequestSchema,
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { getDriverProfilePicture } from '@/lib/utils/driverUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters
    const { id } = await params;
    const validation = validateApiRequest(DriverProfilePictureRequestSchema, { driverId: id });

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid driver ID', details: errors },
        { status: 400 }
      );
    }

    const { driverId } = validation.data;

    // Get driver profile picture using centralized utility
    const profilePicture = await getDriverProfilePicture(Number(driverId));

    return NextResponse.json(profilePicture);
  } catch (error: any) {
    console.error('Error fetching profile picture:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Driver not found') {
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 404 }
        );
      }
      
      if (error.message === 'No profile picture found') {
        return NextResponse.json(
          { error: 'No profile picture found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch profile picture', details: error.message },
      { status: 500 }
    );
  }
} 
/**
 * @fileoverview Driver Upload Profile Picture API Route - Upload driver profile pictures to Cloudinary
 * @source boombox-10.0/src/app/api/drivers/[driverId]/upload-profile-picture/route.ts
 * @refactor Migrated to centralized architecture with validation and utilities
 * @usage POST /api/drivers/[id]/upload-profile-picture - Upload driver profile picture
 * 
 * @functionality
 * - Uploads driver profile pictures to Cloudinary
 * - Validates driver existence and file parameters
 * - Creates driver-specific file naming with unique IDs
 * - Replaces existing profile pictures and cleans up old ones from Cloudinary
 * - Updates driver record with new profile picture URL
 * 
 * @dependencies
 * - @/lib/utils/driverUtils.uploadDriverProfilePicture
 * - @/lib/validations/api.validations.DriverUploadProfilePictureRequestSchema
 * - Cloudinary integration for file upload and deletion
 * 
 * @migration_notes
 * - Extracted profile picture upload logic to driverUtils
 * - Added comprehensive request validation with Zod schemas
 * - Preserved exact business logic including driver-specific naming and old photo cleanup
 * - Maintained response format compatibility with success, URL, and message
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  DriverUploadProfilePictureRequestSchema,
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { uploadDriverProfilePicture } from '@/lib/utils/driverUtils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters
    const { id } = await params;
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const requestData = { driverId: id, file };
    const validation = validateApiRequest(DriverUploadProfilePictureRequestSchema, requestData);

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid request data', details: errors },
        { status: 400 }
      );
    }

    const { driverId } = validation.data;

    // Upload driver profile picture using centralized utility
    const result = await uploadDriverProfilePicture(Number(driverId), file);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error uploading profile picture:', error);
    
    if (error instanceof Error && error.message === 'Driver not found') {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to upload profile picture', details: error.message },
      { status: 500 }
    );
  }
} 
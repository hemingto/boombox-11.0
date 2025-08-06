/**
 * @fileoverview Driver Upload License API Route - Upload driver's license photos to Cloudinary
 * @source boombox-10.0/src/app/api/drivers/[driverId]/upload-drivers-license/route.ts
 * @refactor Migrated to centralized architecture with validation and utilities
 * @usage POST /api/drivers/[id]/upload-drivers-license - Upload driver's license photo (front or back)
 * 
 * @functionality
 * - Uploads driver's license photos (front or back) to Cloudinary
 * - Validates driver existence and file/photoDescription parameters
 * - Manages Cloudinary folder organization based on photo type
 * - Replaces existing photos and cleans up old ones from Cloudinary
 * - Updates driver record with new photo URL
 * 
 * @dependencies
 * - @/lib/utils/driverUtils.uploadDriverLicensePhoto
 * - @/lib/validations/api.validations.DriverUploadDriversLicenseRequestSchema
 * - Cloudinary integration for file upload and deletion
 * 
 * @migration_notes
 * - Extracted complex file upload and Cloudinary management logic to driverUtils
 * - Added comprehensive request validation with Zod schemas
 * - Preserved exact business logic including old photo cleanup
 * - Maintained response format compatibility with success, URL, and message
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  DriverUploadDriversLicenseRequestSchema,
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { uploadDriverLicensePhoto } from '@/lib/utils/driverUtils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters
    const { id } = await params;
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const photoDescription = formData.get('photoDescription') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!photoDescription || (photoDescription !== 'front' && photoDescription !== 'back')) {
      return NextResponse.json(
        { error: 'Invalid or missing photoDescription parameter. Must be "front" or "back"' },
        { status: 400 }
      );
    }

    const requestData = { driverId: id, file, photoDescription };
    const validation = validateApiRequest(DriverUploadDriversLicenseRequestSchema, requestData);

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid request data', details: errors },
        { status: 400 }
      );
    }

    const { driverId, photoDescription: validatedPhotoDescription } = validation.data;

    // Upload driver license photo using centralized utility
    const result = await uploadDriverLicensePhoto(
      Number(driverId), 
      file, 
      validatedPhotoDescription
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error uploading driver\'s license photo:', error);
    
    if (error instanceof Error && error.message === 'Driver not found') {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to upload driver\'s license photo', details: error.message },
      { status: 500 }
    );
  }
} 
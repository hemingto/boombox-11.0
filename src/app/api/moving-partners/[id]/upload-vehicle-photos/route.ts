/**
 * @fileoverview Moving Partner Vehicle Photos Upload API
 * @source boombox-10.0/src/app/api/movers/[moverId]/upload-vehicle-photos/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint for uploading vehicle photos for moving partners.
 * Supports multiple vehicle photo types: front, back, and insurance photos.
 * Handles file validation, Cloudinary upload with dynamic folder assignment.
 *
 * USED BY (expected usage in boombox-11.0):
 * - Moving partner vehicle registration interface
 * - Vehicle documentation workflows  
 * - Admin vehicle verification processes
 * 
 * INTEGRATION NOTES:
 * - Critical Cloudinary integration for image storage
 * - Supports fieldName parameter to specify photo type (frontVehiclePhoto, backVehiclePhoto, autoInsurancePhoto)
 * - Uses dynamic folder assignment based on photo type
 * - Returns file URL for immediate use in frontend interfaces
 * - Note: This route only uploads, does not update database records (unlike other upload routes)
 *
 * @refactor Migrated from /api/movers/[moverId]/ to /api/moving-partners/[id]/ structure  
 * @refactor Extracted file upload logic to movingPartnerUtils.ts for consistency
 * @refactor Added comprehensive validation using centralized schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { MovingPartnerUploadVehiclePhotosRequestSchema } from '@/lib/validations/api.validations';
import { uploadFileToCloudinary } from '@/lib/utils/movingPartnerUtils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate the moving partner ID
    const rawParams = await params;
    const movingPartnerId = typeof rawParams.id === 'string' 
      ? parseInt(rawParams.id, 10) 
      : parseInt(String(rawParams.id), 10);
    
    if (isNaN(movingPartnerId)) {
      return NextResponse.json(
        { error: 'Invalid moving partner ID' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fieldName = formData.get('fieldName') as string;
    
    // Validate request data
    const validationResult = MovingPartnerUploadVehiclePhotosRequestSchema.safeParse({
      id: movingPartnerId,
      file: file,
      fieldName: fieldName
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!fieldName) {
      return NextResponse.json(
        { error: 'Field name is required' },
        { status: 400 }
      );
    }

    // Validate field name to prevent injection
    const validFields = ['frontVehiclePhoto', 'backVehiclePhoto', 'autoInsurancePhoto'];
    if (!validFields.includes(fieldName)) {
      return NextResponse.json(
        { error: 'Invalid field name' },
        { status: 400 }
      );
    }

    // Determine the folder based on the field name
    const folder = fieldName === 'autoInsurancePhoto' 
      ? 'auto-insurance-photos' 
      : 'vehicle-photos';

    // Upload vehicle photo to Cloudinary
    const uploadResult = await uploadFileToCloudinary({
      file: file,
      folder: folder,
      fileNamePrefix: fieldName,
      entityId: movingPartnerId,
      allowedTypes: ['image/'] // Only allow image files for vehicle photos
    });
    
    return NextResponse.json({ 
      url: uploadResult.fileUrl,
      message: 'File uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
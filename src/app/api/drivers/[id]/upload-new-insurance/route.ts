/**
 * @fileoverview Driver Upload Insurance API Route - Upload vehicle insurance documents to Cloudinary
 * @source boombox-10.0/src/app/api/drivers/[driverId]/upload-new-insurance/route.ts
 * @refactor Migrated to centralized architecture with validation and utilities
 * @usage POST /api/drivers/[id]/upload-new-insurance - Upload vehicle insurance document
 * 
 * @functionality
 * - Uploads vehicle insurance documents to Cloudinary
 * - Validates driver ID and file parameters
 * - Finds associated vehicle and updates insurance photo
 * - Replaces existing insurance photos and cleans up old ones from Cloudinary
 * - Returns success status with re-approval message
 * 
 * @dependencies
 * - @/lib/utils/driverUtils.uploadVehicleInsurancePhoto
 * - @/lib/validations/api.validations.DriverUploadNewInsuranceRequestSchema
 * - Cloudinary integration for file upload and deletion
 * 
 * @migration_notes
 * - Extracted complex vehicle insurance upload logic to driverUtils
 * - Added comprehensive request validation with Zod schemas
 * - Preserved exact business logic including vehicle lookup and old photo cleanup
 * - Maintained response format compatibility with success, URL, and re-approval message
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  DriverUploadNewInsuranceRequestSchema,
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { uploadVehicleInsurancePhoto } from '@/lib/utils/driverUtils';

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
    const validation = validateApiRequest(DriverUploadNewInsuranceRequestSchema, requestData);

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid request data', details: errors },
        { status: 400 }
      );
    }

    const { driverId } = validation.data;

    // Upload vehicle insurance photo using centralized utility
    const result = await uploadVehicleInsurancePhoto(Number(driverId), file);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error uploading insurance document:', error);
    
    if (error instanceof Error && error.message === 'No vehicle found for this driver') {
      return NextResponse.json(
        { error: 'No vehicle found for this driver' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to upload insurance document' },
      { status: 500 }
    );
  }
} 
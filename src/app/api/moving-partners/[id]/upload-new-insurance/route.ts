/**
 * @fileoverview Moving Partner Insurance Document Upload API
 * @source boombox-10.0/src/app/api/movers/[moverId]/upload-new-insurance/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint for uploading new auto insurance documents for a moving partner's vehicle.
 * Handles file validation, Cloudinary upload, old file cleanup, and database updates.
 * Sets vehicle approval status to false when new insurance is uploaded.
 *
 * USED BY (expected usage in boombox-11.0):
 * - Moving partner vehicle management interface
 * - Insurance document renewal workflows
 * - Admin vehicle approval processes
 * 
 * INTEGRATION NOTES:
 * - Critical Cloudinary integration for file storage
 * - Sets vehicle isApproved to false when new insurance uploaded (requires admin review)
 * - Accepts both image files and PDF documents
 * - Automatically deletes old insurance documents to prevent storage bloat
 *
 * @refactor Migrated from /api/movers/[moverId]/ to /api/moving-partners/[id]/ structure
 * @refactor Extracted file upload logic to movingPartnerUtils.ts for consistency
 * @refactor Added comprehensive validation using centralized schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { MovingPartnerUploadInsuranceRequestSchema } from '@/lib/validations/api.validations';
import { uploadFileToCloudinary, deleteOldCloudinaryFile } from '@/lib/utils/movingPartnerUtils';

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
    
    // Validate request data
    const validationResult = MovingPartnerUploadInsuranceRequestSchema.safeParse({
      id: movingPartnerId,
      file: file
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

    // Validate file type - allow both images and PDFs
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only image and PDF files are allowed' },
        { status: 400 }
      );
    }

    // Find the vehicle associated with the moving partner
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        movingPartnerId: movingPartnerId,
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'No vehicle found for this moving partner' },
        { status: 404 }
      );
    }

    // Upload new insurance document to Cloudinary
    const uploadResult = await uploadFileToCloudinary({
      file: file,
      folder: 'auto-insurance-photos',
      fileNamePrefix: 'autoInsurancePhoto',
      entityId: movingPartnerId,
      allowedTypes: ['image/', 'application/pdf']
    });
    
    // Delete the old insurance photo from Cloudinary if it exists
    if (vehicle.autoInsurancePhoto) {
      await deleteOldCloudinaryFile(vehicle.autoInsurancePhoto, 'auto-insurance-photos');
    }

    // Update the vehicle record with the new insurance photo URL
    // Also set isApproved to false since the insurance document needs to be reviewed
    const updatedVehicle = await prisma.vehicle.update({
      where: {
        id: vehicle.id,
      },
      data: {
        autoInsurancePhoto: uploadResult.fileUrl,
        isApproved: false, // Set to false when new insurance is uploaded
      },
    });

    return NextResponse.json({ 
      success: true,
      url: uploadResult.fileUrl,
      message: 'Insurance document uploaded successfully. Your vehicle will need to be re-approved.' 
    });
  } catch (error) {
    console.error('Error uploading insurance document:', error);
    return NextResponse.json(
      { error: 'Failed to upload insurance document' },
      { status: 500 }
    );
  }
}
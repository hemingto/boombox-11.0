/**
 * @fileoverview Moving Partner Company Picture Upload API
 * @source boombox-10.0/src/app/api/movers/[moverId]/upload-profile-picture/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint for uploading company profile pictures/logos for moving partners.
 * Handles file validation, Cloudinary upload, old file cleanup, and database updates.
 * Updates the moving partner's imageSrc field with the new image URL.
 *
 * USED BY (expected usage in boombox-11.0):
 * - Moving partner profile management interface  
 * - Company branding/logo upload workflows
 * - Moving partner registration process
 * 
 * INTEGRATION NOTES:
 * - Critical Cloudinary integration for image storage
 * - Automatically deletes old company pictures to prevent storage bloat
 * - Updates movingPartner.imageSrc field directly
 * - Used for displaying company logos in customer-facing interfaces
 *
 * @refactor Migrated from /api/movers/[moverId]/ to /api/moving-partners/[id]/ structure
 * @refactor Extracted file upload logic to movingPartnerUtils.ts for consistency
 * @refactor Added comprehensive validation using centralized schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { MovingPartnerUploadProfilePictureRequestSchema } from '@/lib/validations/api.validations';
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

    // Check if moving partner exists
    const mover = await prisma.movingPartner.findUnique({
      where: {
        id: movingPartnerId,
      },
    });

    if (!mover) {
      return NextResponse.json(
        { error: 'Moving partner not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // Validate request data
    const validationResult = MovingPartnerUploadProfilePictureRequestSchema.safeParse({
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

    // Upload company picture to Cloudinary
    const uploadResult = await uploadFileToCloudinary({
      file: file,
      folder: 'mover-company-pictures',
      fileNamePrefix: 'company',
      entityId: movingPartnerId,
      allowedTypes: ['image/'] // Only allow image files for profile pictures
    });
    
    // Delete the old company picture from Cloudinary if it exists
    if (mover.imageSrc) {
      await deleteOldCloudinaryFile(mover.imageSrc, 'mover-company-pictures');
    }

    // Update the moving partner record with the new company picture URL
    const updatedMover = await prisma.movingPartner.update({
      where: {
        id: movingPartnerId,
      },
      data: {
        imageSrc: uploadResult.fileUrl,
      },
    });

    return NextResponse.json({ 
      success: true,
      url: uploadResult.fileUrl,
      message: 'Company picture uploaded successfully' 
    });
  } catch (error: any) {
    console.error('Error uploading company picture:', error);
    return NextResponse.json(
      { error: 'Failed to upload company picture', details: error.message },
      { status: 500 }
    );
  }
}
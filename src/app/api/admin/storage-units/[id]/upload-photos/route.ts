/**
 * @fileoverview Admin Storage Unit Photo Upload API Route
 * @source boombox-10.0/src/app/api/storage-unit/[id]/upload-photos/route.ts
 * 
 * FUNCTIONALITY:
 * - POST: Upload multiple photos for a storage unit usage
 * - Cloudinary integration for image processing and storage
 * - Automatic image optimization and transformation
 * - Update storage unit usage with uploaded image URLs
 * 
 * FEATURES:
 * - Storage unit usage validation
 * - Multi-file upload support
 * - Cloudinary image processing with transformations
 * - Unique filename generation with timestamps
 * - Error handling for individual file failures
 * - Database update with uploaded URLs
 * 
 * ROUTE: POST /api/admin/storage-units/[id]/upload-photos
 * 
 * REQUEST FORMAT:
 * - Content-Type: multipart/form-data
 * - Field: photos (multiple files)
 * - URL Parameter: id (storage unit usage ID)
 * 
 * RESPONSE FORMAT:
 * - success: boolean
 * - uploadedUrls: string[] of Cloudinary URLs
 * - message: success message with count
 * 
 * MIGRATION NOTES:
 * - Extracted photo processing logic into centralized storageUtils.ts
 * - Added proper TypeScript interfaces and validation schemas
 * - Preserved exact Cloudinary integration and transformations
 * - Improved error handling and response formatting
 * - Enhanced filename generation with unit number context
 * 
 * @refactor Migrated from boombox-10.0 following API Route Migration Pattern
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyStorageUnitUsage,
  generateStorageUnitPhotoFilename,
  addPhotosToStorageUnitUsage,
  type PhotoUploadResult 
} from '@/lib/utils/storageUtils';
import { 
  StorageUnitPhotoUploadRequestSchema,
  StorageUnitPhotoUploadResponseSchema 
} from '@/lib/validations/api.validations';
import cloudinary from '@/lib/integrations/cloudinaryClient';

/**
 * POST /api/admin/storage-units/[id]/upload-photos
 * 
 * Uploads multiple photos for a storage unit usage to Cloudinary
 * and updates the database with the uploaded image URLs.
 * 
 * URL Parameters:
 * - id: Storage unit usage ID
 * 
 * Request:
 * - Content-Type: multipart/form-data
 * - Field: photos (multiple image files)
 * 
 * Response:
 * - success: boolean indicating operation success
 * - uploadedUrls: array of Cloudinary URLs for uploaded images
 * - message: descriptive success message
 * 
 * @param request - Next.js request object with multipart form data
 * @param params - Route parameters containing storage unit usage ID
 * @returns {Promise<NextResponse>} Upload results with image URLs
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const storageUnitUsageId = parseInt(resolvedParams.id);
    
    // Validate storage unit usage ID
    if (!storageUnitUsageId || isNaN(storageUnitUsageId)) {
      return NextResponse.json(
        { error: 'Invalid storage unit usage ID' }, 
        { status: 400 }
      );
    }

    // Validate request parameters
    const validatedParams = StorageUnitPhotoUploadRequestSchema.parse({
      id: storageUnitUsageId
    });

    // Get the form data
    const formData = await request.formData();
    const files = formData.getAll('photos') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No photo files provided' }, 
        { status: 400 }
      );
    }

    // Limit number of files
    if (files.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 photos allowed per upload' },
        { status: 400 }
      );
    }

    // Verify the storage unit usage exists using centralized utility
    const storageUnitUsage = await verifyStorageUnitUsage(validatedParams.id);

    const uploadedUrls: string[] = [];
    const uploadErrors: string[] = [];

    // Upload each file to Cloudinary
    for (const file of files) {
      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          uploadErrors.push(`${file.name}: Not a valid image file`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          uploadErrors.push(`${file.name}: File size exceeds 10MB limit`);
          continue;
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename using centralized utility
        const filename = generateStorageUnitPhotoFilename(
          storageUnitUsage.storageUnit.storageUnitNumber,
          file.name
        );

        // Upload to Cloudinary with transformations
        const uploadResult = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'storage-unit-photos',
              public_id: filename,
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto' },
                { format: 'auto' }
              ],
              // Add tags for better organization
              tags: [
                'storage-unit',
                `unit-${storageUnitUsage.storageUnit.storageUnitNumber}`,
                `usage-${storageUnitUsage.id}`
              ]
            },
            (error: any, result: any) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          uploadStream.end(buffer);
        });

        uploadedUrls.push(uploadResult.secure_url);
        console.log(`Successfully uploaded: ${file.name} -> ${uploadResult.secure_url}`);
      } catch (uploadError) {
        console.error('Error uploading file:', file.name, uploadError);
        uploadErrors.push(`${file.name}: Upload failed - ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
      }
    }

    // Check if any uploads succeeded
    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to upload any photos',
          details: uploadErrors
        }, 
        { status: 500 }
      );
    }

    // Update the storage unit usage with new uploaded images using centralized utility
    await addPhotosToStorageUnitUsage(validatedParams.id, uploadedUrls);

    // Prepare response
    const response = {
      success: true,
      uploadedUrls,
      message: `Successfully uploaded ${uploadedUrls.length} of ${files.length} photos`
    };

    // Add upload errors to response if any occurred
    if (uploadErrors.length > 0) {
      (response as any).warnings = uploadErrors;
    }

    // Validate response structure
    const validatedResponse = StorageUnitPhotoUploadResponseSchema.parse(response);

    return NextResponse.json(validatedResponse);

  } catch (error) {
    console.error('Error uploading storage unit photos:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Storage unit usage not found') {
        return NextResponse.json(
          { error: 'Storage unit usage not found' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('ZodError')) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to upload photos' },
      { status: 500 }
    );
  }
}
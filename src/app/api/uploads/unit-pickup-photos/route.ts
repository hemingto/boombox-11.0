/**
 * @fileoverview API endpoint to upload unit pickup photos for storage appointments
 * @source boombox-10.0/src/app/api/upload/unit-pickup-photos/route.ts
 * @refactor PHASE 4 - Upload Routes Domain
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that handles photo uploads for storage unit pickup documentation.
 * Uses query parameters for context and uploads to organized Cloudinary folder structure.
 * 
 * USED BY (boombox-10.0 files):
 * - Storage unit pickup workflow
 * - Trailer assignment documentation
 * - Admin appointment management
 * - Photo evidence collection interfaces
 * 
 * INTEGRATION NOTES:
 * - Requires 'entityType' and 'appointmentId' as query parameters
 * - Requires multipart/form-data with 'file'
 * - Uploads to boombox/{entityType} folder structure
 * - Generates unique public_id with timestamp
 * - Uses base64 conversion for Cloudinary upload
 * - Returns both 'url' and 'urls' array for backward compatibility
 * - Exported maxDuration and dynamic for Vercel deployment
 * 
 * @refactor Uses centralized Cloudinary client from @/lib/integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { cloudinary } from '@/lib/integrations';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Function to convert buffer to base64
function bufferToBase64(buffer: Buffer, fileType: string): string {
  return `data:${fileType};base64,${buffer.toString('base64')}`;
}

export async function POST(request: NextRequest) {
  try {
    // Get entityType, appointmentId from query parameters
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType');
    const appointmentId = searchParams.get('appointmentId');
    
    if (!entityType) {
      return NextResponse.json(
        { error: 'Entity type is required' },
        { status: 400 }
      );
    }
    
    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }
    
    // Parse form data from the request
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    // Get file buffer and type
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.type;
    
    // Convert buffer to base64 for Cloudinary upload
    const base64File = bufferToBase64(fileBuffer, fileType);
    
    // Determine folder based on entity type
    const folder = `boombox/${entityType}`;
    
    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        base64File,
        {
          folder,
          resource_type: 'auto',
          public_id: `${entityType}_${appointmentId}_${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });
    
    // For 'trailer' entity type, we no longer save the URL here
    // The assign-requested-unit endpoint now handles saving photos to RequestedAccessStorageUnit
    
    // Return success response with the uploaded URL
    return NextResponse.json({
      success: true,
      url: result.secure_url,
      urls: [result.secure_url],
    });
    
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
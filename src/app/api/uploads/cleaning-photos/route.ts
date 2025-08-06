/**
 * @fileoverview API endpoint to upload cleaning photos for storage units
 * @source boombox-10.0/src/app/api/upload/cleaning-photos/route.ts
 * @refactor PHASE 4 - Upload Routes Domain
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that handles file uploads for storage unit cleaning photos.
 * Uploads files to Cloudinary with structured folder organization and unique naming.
 * 
 * USED BY (boombox-10.0 files):
 * - Storage unit cleaning documentation
 * - Admin cleaning verification workflows
 * - Photo management interfaces
 * - Cleaning completion tracking
 * 
 * INTEGRATION NOTES:
 * - Requires multipart/form-data with 'file' and 'storageUnitNumber'  
 * - Uploads to Cloudinary in organized folder structure
 * - Generates unique filenames with UUID
 * - Uses streaming upload for memory efficiency
 * - Returns secure URL for uploaded file
 * 
 * @refactor Uses centralized Cloudinary client from @/lib/integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { cloudinary } from '@/lib/integrations';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const storageUnitNumber = formData.get('storageUnitNumber') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!storageUnitNumber) {
      return NextResponse.json(
        { error: 'Storage unit number is required' },
        { status: 400 }
      );
    }

    // Convert the file to a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const fileName = `cleaning_${storageUnitNumber}_${uuidv4()}`;
    const folder = `cleaning-photos/${storageUnitNumber}-Cleaning-Photos`;
    
    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: fileName,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Convert buffer to stream and pipe to uploadStream
      const bufferStream = new Readable();
      bufferStream.push(buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });

    const uploadResult = await uploadPromise as any;
    const fileUrl = uploadResult.secure_url;
    
    return NextResponse.json({ 
      url: fileUrl,
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
/**
 * @fileoverview API endpoint to upload damage photos for documentation
 * @source boombox-10.0/src/app/api/upload/damage-photos/route.ts
 * @refactor PHASE 4 - Upload Routes Domain
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that handles file uploads for damage documentation photos.
 * Uploads files to Cloudinary with descriptive naming and logging for audit trails.
 * 
 * USED BY (boombox-10.0 files):
 * - Damage documentation workflows
 * - Insurance claim processes
 * - Photo evidence collection
 * - Damage assessment interfaces
 * 
 * INTEGRATION NOTES:
 * - Requires multipart/form-data with 'file' and 'photoDescription'
 * - Uploads to 'damage-photos' folder in Cloudinary
 * - Includes file metadata logging for audit purposes
 * - Generates unique filenames with damage description
 * - Returns URL in array format for consistency with multi-upload patterns
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
    const photoDescription = formData.get('photoDescription') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!photoDescription) {
      return NextResponse.json(
        { error: 'Photo description is required' },
        { status: 400 }
      );
    }

    // Log file details
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      photoDescription
    });

    // Convert the file to a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const fileName = `damage_${photoDescription}_${uuidv4()}`;
    const folder = 'damage-photos';
    
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
      urls: [fileUrl],
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
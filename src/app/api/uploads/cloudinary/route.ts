/**
 * @fileoverview Generic API endpoint for Cloudinary file uploads
 * @source boombox-10.0/src/app/api/upload/cloudinary/route.ts
 * @refactor PHASE 4 - Upload Routes Domain
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that handles generic file uploads to Cloudinary with configurable folders.
 * Provides flexible upload capability for various file types and organizational structures.
 * 
 * USED BY (boombox-10.0 files):
 * - Generic file upload components
 * - Dynamic folder-based uploads
 * - Multi-purpose upload interfaces
 * - Custom upload workflows
 * 
 * INTEGRATION NOTES:
 * - Requires multipart/form-data with 'file', 'folder', and 'fieldName'
 * - Flexible folder organization based on request parameters
 * - Generates unique filenames with field-based prefixes
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
    const folder = formData.get('folder') as string;
    const fieldName = formData.get('fieldName') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder is required' },
        { status: 400 }
      );
    }

    if (!fieldName) {
      return NextResponse.json(
        { error: 'Field name is required' },
        { status: 400 }
      );
    }

    // Convert the file to a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const fileName = `${fieldName}_${uuidv4()}`;
    
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
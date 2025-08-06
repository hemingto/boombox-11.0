/**
 * @fileoverview API endpoint to upload driver-related photos (vehicle and insurance)
 * @source boombox-10.0/src/app/api/upload/photos/route.ts
 * @refactor PHASE 4 - Upload Routes Domain
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that handles driver photo uploads for vehicle documentation and insurance.
 * Validates field types, organizes files by driver ID, and uploads to structured Cloudinary folders.
 * 
 * USED BY (boombox-10.0 files):
 * - Driver vehicle registration forms
 * - Insurance document upload interfaces
 * - Driver onboarding workflow
 * - Vehicle photo management components
 * 
 * INTEGRATION NOTES:
 * - Requires multipart/form-data with 'file', 'driverId', and 'fieldName'
 * - Validates fieldName against allowed values: frontVehiclePhoto, backVehiclePhoto, autoInsurancePhoto
 * - Organizes uploads by driver ID in structured folder hierarchy
 * - Auto-insurance photos go to drivers/{driverId}/auto-insurance-photos
 * - Vehicle photos go to drivers/{driverId}/vehicle-photos
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
    const driverId = formData.get('driverId') as string;
    const fieldName = formData.get('fieldName') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
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

    // Determine the folder based on the field name and include driverId
    const folder = fieldName === 'autoInsurancePhoto' 
      ? `drivers/${driverId}/auto-insurance-photos` 
      : `drivers/${driverId}/vehicle-photos`;

    // Convert the file to a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const uniqueFileName = `${fieldName}_${uuidv4()}`;
    
    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: uniqueFileName,
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
    
    // Simply return the URL and a success message
    // The Vehicle record creation/update will be handled by AddVehicleForm's final submission
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
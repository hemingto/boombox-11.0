/**
 * @fileoverview Admin Storage Units Batch Upload API Route
 * @source boombox-10.0/src/app/api/admin/storage-units/batch-upload/route.ts
 * 
 * FUNCTIONALITY:
 * - POST: Process CSV file upload to create multiple storage units
 * - Validate CSV format and data structure
 * - Handle duplicate storage unit numbers gracefully
 * - Provide detailed success/error reporting
 * - Create admin log entry for batch operations
 * 
 * FEATURES:
 * - Admin authentication and authorization
 * - CSV parsing with validation
 * - Batch processing with individual error handling
 * - Comprehensive result reporting
 * - Admin audit logging
 * 
 * ROUTE: POST /api/admin/storage-units/batch-upload
 * 
 * REQUEST FORMAT:
 * - Content-Type: multipart/form-data
 * - Field: file (CSV file)
 * - CSV Columns: storageUnitNumber, barcode (optional), status
 * 
 * RESPONSE FORMAT:
 * - success: boolean
 * - results: { successful: number, failed: number, details: { success: string[], errors: string[] } }
 * 
 * MIGRATION NOTES:
 * - Extracted all CSV processing logic into centralized storageUtils.ts
 * - Added proper TypeScript interfaces and validation schemas
 * - Preserved exact business logic and error handling from source
 * - Improved response structure and error reporting
 * - Enhanced admin logging for audit trail
 * 
 * @refactor Migrated from boombox-10.0 following API Route Migration Pattern
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { parse } from 'csv-parse/sync';
import { 
  processBatchUpload,
  createStorageUnitAdminLog,
  type StorageUnitCSVRecord 
} from '@/lib/utils/storageUtils';
import { 
  StorageUnitCSVRecordSchema,
  BatchUploadResponseSchema 
} from '@/lib/validations/api.validations';
import { prisma } from '@/lib/database/prismaClient';

/**
 * POST /api/admin/storage-units/batch-upload
 * 
 * Processes CSV file upload to create multiple storage units in batch.
 * Validates each record and provides detailed success/error reporting.
 * 
 * Request:
 * - Content-Type: multipart/form-data
 * - Field: file (CSV file with columns: storageUnitNumber, barcode, status)
 * 
 * Response:
 * - success: boolean indicating overall operation success
 * - results: detailed breakdown of successful/failed operations
 * 
 * @param request - Next.js request object with multipart form data
 * @returns {Promise<NextResponse>} Batch upload results with success/error details
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { id: true, email: true, role: true }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Get the CSV file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      );
    }

    // Read and parse the CSV file
    const text = await file.text();
    let records: any[];
    
    try {
      records = parse(text, {
        columns: true,
        skip_empty_lines: true,
      });
    } catch (parseError) {
      console.error('CSV parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid CSV format. Please check the file structure.' },
        { status: 400 }
      );
    }

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: 'No valid records found in the CSV file' },
        { status: 400 }
      );
    }

    if (records.length > 1000) {
      return NextResponse.json(
        { error: 'Maximum 1000 records allowed per batch upload' },
        { status: 400 }
      );
    }

    // Validate and process each record
    const validatedRecords: StorageUnitCSVRecord[] = [];
    const validationErrors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        const validatedRecord = StorageUnitCSVRecordSchema.parse(record);
        validatedRecords.push(validatedRecord);
      } catch (validationError) {
        console.error('Record validation error:', record, validationError);
        validationErrors.push(`Row ${i + 1}: Invalid data format - ${validationError instanceof Error ? validationError.message : 'Unknown error'}`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'CSV validation failed',
          details: validationErrors.slice(0, 10) // Limit to first 10 errors
        },
        { status: 400 }
      );
    }

    // Process the batch upload using centralized utility
    const results = await processBatchUpload(validatedRecords);

    // Create admin log entry
    await createStorageUnitAdminLog(
      admin.id,
      `BATCH_UPLOAD_STORAGE_UNITS: Uploaded ${results.success.length} storage units, ${results.errors.length} errors`,
      'batch_upload'
    );

    // Prepare response
    const response = {
      success: true,
      results: {
        successful: results.success.length,
        failed: results.errors.length,
        details: results
      }
    };

    // Validate response structure
    const validatedResponse = BatchUploadResponseSchema.parse(response);

    return NextResponse.json(validatedResponse);

  } catch (error) {
    console.error('Error processing batch upload:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('ZodError')) {
        return NextResponse.json(
          { error: 'Data validation failed', details: error.message },
          { status: 400 }
        );
      }
      
      if (error.message.includes('duplicate')) {
        return NextResponse.json(
          { error: 'Duplicate storage unit numbers detected in file' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process batch upload' },
      { status: 500 }
    );
  }
}
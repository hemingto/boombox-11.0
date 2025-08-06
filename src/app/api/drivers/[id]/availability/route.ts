/**
 * @fileoverview Driver Availability API Route - Manage driver availability schedules
 * @source boombox-10.0/src/app/api/drivers/[driverId]/availability/route.ts
 * @refactor Migrated to centralized architecture with validation and utilities
 * @usage GET /api/drivers/[id]/availability - Fetch driver availability
 * @usage POST /api/drivers/[id]/availability - Create or update driver availability
 * 
 * @functionality
 * - GET: Fetches driver availability sorted by day of week
 * - POST: Creates or updates availability for specific days, handles blocked days
 * - Validates driver existence and input data
 * - Supports both creating new records and updating existing ones
 * 
 * @dependencies
 * - @/lib/utils/driverUtils.getDriverAvailability
 * - @/lib/utils/driverUtils.createOrUpdateDriverAvailability
 * - @/lib/validations/api.validations.DriverAvailabilityGetRequestSchema
 * - @/lib/validations/api.validations.DriverAvailabilityPostRequestSchema
 * 
 * @migration_notes
 * - Extracted availability management logic to driverUtils
 * - Added comprehensive request validation with Zod schemas
 * - Preserved exact business logic including day ordering and defaults
 * - Maintained driver existence checks and error handling patterns
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  DriverAvailabilityGetRequestSchema,
  DriverAvailabilityPostRequestSchema,
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { 
  getDriverAvailability, 
  createOrUpdateDriverAvailability 
} from '@/lib/utils/driverUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters
    const { id } = await params;
    const validation = validateApiRequest(DriverAvailabilityGetRequestSchema, { driverId: id });

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid driver ID', details: errors },
        { status: 400 }
      );
    }

    const { driverId } = validation.data;

    // Fetch driver availability using centralized utility
    const availability = await getDriverAvailability(Number(driverId));

    return NextResponse.json({ success: true, availability });
  } catch (error) {
    console.error('Error fetching driver availability:', error);
    
    if (error instanceof Error && error.message === 'Driver not found') {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters and body
    const { id } = await params;
    const body = await request.json();
    
    const requestData = { ...body, driverId: id };
    const validation = validateApiRequest(DriverAvailabilityPostRequestSchema, requestData);

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid request data', details: errors },
        { status: 400 }
      );
    }

    const { driverId, ...availabilityData } = validation.data;

    // Create or update driver availability using centralized utility
    const availability = await createOrUpdateDriverAvailability(
      Number(driverId), 
      availabilityData
    );

    return NextResponse.json({
      success: true,
      availability
    });
  } catch (error) {
    console.error('Error saving driver availability:', error);
    
    if (error instanceof Error && error.message === 'Driver not found') {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to save availability' },
      { status: 500 }
    );
  }
} 
/**
 * @fileoverview Driver Remove Vehicle API Route - Remove driver's vehicle and associated photos
 * @source boombox-10.0/src/app/api/drivers/[driverId]/remove-vehicle/route.ts
 * @refactor Migrated to centralized architecture with validation and utilities
 * @usage DELETE /api/drivers/[id]/remove-vehicle - Remove driver's vehicle
 * 
 * @functionality
 * - Finds vehicle associated with driver
 * - Deletes vehicle photos from Cloudinary (front, back, insurance)
 * - Removes vehicle record from database
 * - Returns success status with confirmation message
 * 
 * @dependencies
 * - @/lib/utils/driverUtils.removeDriverVehicle
 * - @/lib/validations/api.validations.DriverRemoveVehicleRequestSchema
 * - Cloudinary integration for photo deletion
 * 
 * @migration_notes
 * - Extracted complex vehicle removal logic to driverUtils
 * - Added request validation with Zod schemas
 * - Preserved exact business logic including Cloudinary photo cleanup
 * - Maintained error handling for missing vehicles and photo deletion failures
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  DriverRemoveVehicleRequestSchema,
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { removeDriverVehicle } from '@/lib/utils/driverUtils';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters
    const { id } = await params;
    const validation = validateApiRequest(DriverRemoveVehicleRequestSchema, { driverId: id });

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid driver ID', details: errors },
        { status: 400 }
      );
    }

    const { driverId } = validation.data;

    // Remove driver vehicle using centralized utility
    const result = await removeDriverVehicle(Number(driverId));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error removing vehicle:', error);
    
    if (error instanceof Error && error.message === 'No vehicle found for this driver') {
      return NextResponse.json(
        { error: 'No vehicle found for this driver' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to remove vehicle' },
      { status: 500 }
    );
  }
} 
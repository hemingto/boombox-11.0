/**
 * @fileoverview Driver Vehicle API Route - Complete vehicle management for drivers (FINAL ROUTE!)
 * @source boombox-10.0/src/app/api/drivers/[driverId]/vehicle/route.ts
 * @refactor Migrated to centralized architecture with validation and utilities
 * @usage GET /api/drivers/[id]/vehicle - Fetch driver's vehicle information
 * @usage PATCH /api/drivers/[id]/vehicle - Update driver's vehicle information
 * @usage POST /api/drivers/[id]/vehicle - Create new vehicle for driver
 * 
 * @functionality
 * - GET: Fetches vehicle associated with driver
 * - PATCH: Updates existing vehicle information with validation
 * - POST: Creates new vehicle with duplicate prevention
 * - Validates driver IDs and vehicle data across all methods
 * - Provides comprehensive error handling for all operations
 * 
 * @dependencies
 * - @/lib/utils/driverUtils.getDriverVehicle
 * - @/lib/utils/driverUtils.updateDriverVehicle
 * - @/lib/utils/driverUtils.createDriverVehicle
 * - @/lib/validations/api.validations Vehicle schemas
 * 
 * @migration_notes
 * - Extracted all vehicle management logic to driverUtils
 * - Added comprehensive request validation with Zod schemas for all methods
 * - Preserved exact business logic including duplicate prevention and error handling
 * - Maintained response format compatibility across all HTTP methods
 * - This completes the migration of all 16 driver routes! 🎉
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  DriverVehicleGetRequestSchema,
  DriverVehiclePatchRequestSchema,
  DriverVehiclePostRequestSchema,
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { 
  getDriverVehicle,
  updateDriverVehicle,
  createDriverVehicle 
} from '@/lib/utils/driverUtils';

// GET /api/drivers/[id]/vehicle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters
    const { id } = await params;
    const validation = validateApiRequest(DriverVehicleGetRequestSchema, { driverId: id });

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid driver ID', details: errors },
        { status: 400 }
      );
    }

    const { driverId } = validation.data;

    // Get driver vehicle using centralized utility
    const vehicle = await getDriverVehicle(Number(driverId));

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle information:', error);
    
    if (error instanceof Error && error.message === 'No vehicle found for this driver') {
      return NextResponse.json(
        { error: 'No vehicle found for this driver' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch vehicle information' },
      { status: 500 }
    );
  }
}

// PATCH /api/drivers/[id]/vehicle
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters and body
    const { id } = await params;
    const body = await request.json();
    
    const requestData = { ...body, driverId: id };
    const validation = validateApiRequest(DriverVehiclePatchRequestSchema, requestData);

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid request data', details: errors },
        { status: 400 }
      );
    }

    const { driverId, ...updateData } = validation.data;

    // Update driver vehicle using centralized utility
    const updatedVehicle = await updateDriverVehicle(Number(driverId), updateData);

    return NextResponse.json(updatedVehicle);
  } catch (error) {
    console.error('Error updating vehicle information:', error);
    
    if (error instanceof Error && error.message === 'No vehicle found for this driver') {
      return NextResponse.json(
        { error: 'No vehicle found for this driver' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update vehicle information' },
      { status: 500 }
    );
  }
}

// POST /api/drivers/[id]/vehicle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters and body
    const { id } = await params;
    const body = await request.json();
    
    const requestData = { ...body, driverId: id };
    const validation = validateApiRequest(DriverVehiclePostRequestSchema, requestData);

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid request data', details: errors },
        { status: 400 }
      );
    }

    const { driverId, ...vehicleData } = validation.data;

    // Create driver vehicle using centralized utility
    const newVehicle = await createDriverVehicle(Number(driverId), vehicleData);

    return NextResponse.json(newVehicle, { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    
    if (error instanceof Error && error.message === 'Vehicle already exists for this driver') {
      return NextResponse.json(
        { error: 'Vehicle already exists for this driver' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add vehicle' },
      { status: 500 }
    );
  }
} 
/**
 * @fileoverview Get driver information for a specific unit number within an appointment
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/getDriverByUnit/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves driver information for a specific unit number within an appointment.
 * Returns driver details including firstName, lastName, phoneNumber, driverLicenseFrontPhoto, and profilePicture.
 * Supports unitNumber query parameter (defaults to 1 if not provided).
 *
 * USED BY (boombox-10.0 files):
 * - src/app/admin/tasks/[taskId]/assign-requested-unit/page.tsx (line 125: Fetch driver for unit during admin task management)
 * - src/app/admin/tasks/[taskId]/assign-storage-unit/page.tsx (line 98: Fetch driver for unit during storage unit assignment)
 *
 * INTEGRATION NOTES:
 * - Uses getDriverForUnitNumber utility function from appointmentUtils.ts
 * - Queries OnfleetTask table to find driver assigned to specific unit number
 * - Returns null driver if no driver is assigned to the requested unit
 * - Preserves exact response format from original route for backward compatibility
 *
 * @refactor Moved from /api/appointments/[appointmentId]/ to /api/orders/appointments/[id]/ structure
 * @refactor Added centralized validation schemas and utility functions
 */

import { NextResponse, NextRequest } from 'next/server';
import { getDriverForUnitNumber } from '@/lib/utils/appointmentUtils';
import { GetDriverByUnitRequestSchema, GetDriverByUnitResponseSchema } from '@/lib/validations/api.validations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const appointmentIdFromParams = (await params).id;
    if (!appointmentIdFromParams) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const appointmentId = parseInt(appointmentIdFromParams, 10);
    
    if (isNaN(appointmentId)) {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      );
    }

    // Get unit number from URL search parameters
    const url = new URL(request.url);
    const unitNumberParam = url.searchParams.get('unitNumber') || '1';
    const unitNumber = parseInt(unitNumberParam, 10);
    
    if (isNaN(unitNumber) || unitNumber < 1) {
      return NextResponse.json(
        { error: 'Invalid unit number format' },
        { status: 400 }
      );
    }

    // Validate request parameters using Zod schema
    const validationResult = GetDriverByUnitRequestSchema.safeParse({
      appointmentId: appointmentIdFromParams,
      unitNumber: unitNumberParam,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Get driver for the requested unit number
    const driver = await getDriverForUnitNumber(appointmentId, unitNumber);
    
    // Format response to match original route exactly
    const response = {
      driver: driver ? {
        firstName: driver.firstName,
        lastName: driver.lastName,
        phoneNumber: driver.phoneNumber,
        driverLicenseFrontPhoto: driver.driverLicenseFrontPhoto,
        profilePicture: driver.profilePicture
      } : null
    };

    // Validate response format
    const responseValidation = GetDriverByUnitResponseSchema.safeParse(response);
    if (!responseValidation.success) {
      console.error('Response validation failed:', responseValidation.error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching driver details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
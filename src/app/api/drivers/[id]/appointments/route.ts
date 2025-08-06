/**
 * @fileoverview Driver Appointments API Route - Fetch appointments for a specific driver
 * @source boombox-10.0/src/app/api/drivers/[driverId]/appointments/route.ts
 * @refactor Migrated to centralized architecture with validation and utilities
 * @usage GET /api/drivers/[id]/appointments - Fetch all appointments for a driver
 * 
 * @functionality
 * - Fetches appointments through time slot bookings
 * - Fetches appointments through OnfleetTask assignments
 * - Combines and deduplicates appointments by ID
 * - Returns formatted appointment data with user, driver, and storage unit information
 * 
 * @dependencies
 * - @/lib/utils/appointmentUtils.getDriverAppointments
 * - @/lib/validations/api.validations.DriverAppointmentsRequestSchema
 * 
 * @migration_notes
 * - Extracted appointment fetching logic to appointmentUtils
 * - Added request validation with Zod schemas
 * - Preserved exact business logic and response format
 * - Maintained backward compatibility with driver property
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  DriverAppointmentsRequestSchema,
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { getDriverAppointments } from '@/lib/utils/appointmentUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters
    const { id } = await params;
    const validation = validateApiRequest(DriverAppointmentsRequestSchema, { driverId: id });

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid driver ID', details: errors },
        { status: 400 }
      );
    }

    const { driverId } = validation.data;

    // Fetch driver appointments using centralized utility
    const appointments = await getDriverAppointments(Number(driverId));

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching driver appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
} 
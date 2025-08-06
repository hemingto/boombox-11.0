/**
 * @fileoverview Customer Upcoming Appointments API - GET upcoming appointments for movers/drivers
 * @source boombox-10.0/src/app/api/appointments/upcoming/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves upcoming appointments for movers or drivers.
 * Supports query parameters userType (mover|driver) and userId to filter appointments.
 * Returns formatted appointment data with user info, driver info, storage units, and additional information.
 *
 * USED BY (expected usage in boombox-11.0):
 * - Mover dashboard upcoming appointments view
 * - Driver mobile app upcoming jobs list
 * - Admin dashboard appointment monitoring
 * 
 * INTEGRATION NOTES:
 * - Complex Prisma query with multiple relations (users, drivers, storage units, additional info)
 * - Filters by date (future only) and excludes canceled appointments
 * - Returns appointments in chronological order (earliest first)
 * - Handles both mover and driver user types with different query logic
 *
 * @refactor Migrated from /api/appointments/upcoming/ to /api/customers/upcoming-appointments/ structure
 * @refactor Extracted appointment query logic to customerUtils.ts for reusability
 * @refactor Added comprehensive validation using centralized schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { CustomerUpcomingAppointmentsRequestSchema } from '@/lib/validations/api.validations';
import { getUpcomingAppointments } from '@/lib/utils/customerUtils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userType = searchParams.get('userType');
    const userId = searchParams.get('userId');

    console.log('API Request:', { userType, userId });

    // Validate request parameters
    const validationResult = CustomerUpcomingAppointmentsRequestSchema.safeParse({
      userType,
      userId
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    if (!userType || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (userType !== 'mover' && userType !== 'driver') {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      );
    }

    // Parse userId to number
    const parsedUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(parsedUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Get upcoming appointments using centralized utility
    const formattedAppointments = await getUpcomingAppointments(userType, parsedUserId);

    console.log('Found appointments:', formattedAppointments.length);

    return NextResponse.json(formattedAppointments);
  } catch (error) {
    console.error('Detailed error in upcoming appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming appointments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
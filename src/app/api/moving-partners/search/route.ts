/**
 * @fileoverview Moving Partners Search API Route - Find available moving partners by date/time
 * @source boombox-10.0/src/app/api/moving-partners/route.ts
 * @refactor Migrated to domain-based API structure with centralized utilities
 * 
 * ROUTE: GET /api/moving-partners/search?date=YYYY-MM-DDTHH:mm:ss.sssZ&time=HH:mm&excludeAppointmentId=123
 * PURPOSE: Find moving partners available for specific date and time slot
 * 
 * BUSINESS LOGIC:
 * - Parses date/time parameters and validates format
 * - Calculates day of week and time slot boundaries (1-hour windows)
 * - Filters partners by ACTIVE status and general availability
 * - Performs capacity checking against existing bookings
 * - Supports excluding specific appointment for reschedule scenarios
 * 
 * INTEGRATIONS:
 * - Prisma Database: MovingPartner, MovingPartnerAvailability, TimeSlotBooking models
 * 
 * VALIDATION:
 * - Uses SearchMovingPartnersRequestSchema for query parameter validation
 * - Date format validation (ISO string expected)
 * - Time format validation (HH:mm format expected)
 * 
 * PERFORMANCE:
 * - Two-stage filtering: database pre-filter + in-memory capacity check
 * - Parallel booking count queries for capacity verification
 * 
 * ERROR HANDLING:
 * - 400: Missing or invalid date/time parameters
 * - 500: Database or server errors
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  SearchMovingPartnersRequestSchema,
  type SearchMovingPartnersResponse 
} from '@/lib/validations/api.validations';
import { findAvailableMovingPartners } from '@/lib/utils/movingPartnerUtils';

export async function GET(request: NextRequest): Promise<NextResponse<SearchMovingPartnersResponse | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url);
    const dateString = searchParams.get('date');
    const timeString = searchParams.get('time');
    const excludeAppointmentIdStr = searchParams.get('excludeAppointmentId');

    console.log('[API/moving-partners/search] Received params:', { dateString, timeString, excludeAppointmentId: excludeAppointmentIdStr });

    // Validate query parameters using centralized schema
    const queryData = {
      date: dateString || '',
      time: timeString || '',
      excludeAppointmentId: excludeAppointmentIdStr || undefined
    };

    const validationResult = SearchMovingPartnersRequestSchema.safeParse(queryData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues.map(issue => issue.message).join(', ') },
        { status: 400 }
      );
    }

    const { date, time, excludeAppointmentId } = validationResult.data;

    // Convert excludeAppointmentId to number if provided
    const excludeAppointmentIdNum = excludeAppointmentId 
      ? parseInt(String(excludeAppointmentId), 10) 
      : undefined;

    // Find available moving partners using centralized utility
    const availablePartnersWithCapacity = await findAvailableMovingPartners(
      date,
      time,
      excludeAppointmentIdNum
    );

    return NextResponse.json(availablePartnersWithCapacity);

  } catch (error) {
    console.error("[API/moving-partners/search] Error fetching moving partners:", error);
    
    // Handle specific validation errors
    if (error instanceof Error && error.message === 'Invalid date format') {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch moving partners" },
      { status: 500 }
    );
  }
}
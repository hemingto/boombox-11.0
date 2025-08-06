/**
 * @fileoverview Driver blocked dates management API endpoint
 * @source boombox-10.0/src/app/api/driver/[userId]/blocked-dates/route.ts
 * @target api/drivers/[id]/blocked-dates/route.ts
 * @refactor Migrated from userId-based to id-based routing with centralized utilities
 * 
 * API Routes:
 * - GET: Fetch all blocked dates for a driver
 * - POST: Create a new blocked date for a driver
 * 
 * Business Logic:
 * - Hardcoded userType: "driver" for all operations
 * - Returns blocked dates ordered by date (ascending)
 * - Uses centralized validation and utilities
 * 
 * Dependencies:
 * - @/lib/utils/driverUtils: getDriverBlockedDates, createDriverBlockedDate
 * - @/lib/validations/api.validations: validation schemas
 * - @/lib/database/prismaClient: database access
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getDriverBlockedDates, 
  createDriverBlockedDate 
} from '@/lib/utils/driverUtils';
import { 
  CreateDriverBlockedDateRequestSchema,
  validateApiRequest 
} from '@/lib/validations/api.validations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const driverIdNum = parseInt(id, 10);
    
    if (isNaN(driverIdNum)) {
      return NextResponse.json(
        { error: 'Invalid driver ID format' },
        { status: 400 }
      );
    }
    
    const blockedDates = await getDriverBlockedDates(driverIdNum);

    return NextResponse.json(blockedDates);
  } catch (error) {
    console.error('Error fetching blocked dates for driver:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked dates' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const driverIdNum = parseInt(id, 10);
    
    if (isNaN(driverIdNum)) {
      return NextResponse.json(
        { error: 'Invalid driver ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validation = validateApiRequest(CreateDriverBlockedDateRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { blockedDate } = validation.data;
    const newBlockedDate = await createDriverBlockedDate(driverIdNum, blockedDate);

    return NextResponse.json(newBlockedDate);
  } catch (error) {
    console.error('Error creating blocked date for driver:', error);
    return NextResponse.json(
      { error: 'Failed to create blocked date' },
      { status: 500 }
    );
  }
} 
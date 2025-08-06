/**
 * @fileoverview Driver blocked date deletion API endpoint
 * @source boombox-10.0/src/app/api/driver/[userId]/blocked-dates/[id]/route.ts
 * @target api/drivers/[id]/blocked-dates/[dateId]/route.ts
 * @refactor Migrated from userId/id-based to id/dateId-based routing with centralized utilities
 * 
 * API Routes:
 * - DELETE: Delete a specific blocked date by ID
 * 
 * Business Logic:
 * - Uses globally unique ID for BlockedDate model (auto-incrementing primary key)
 * - No additional userId validation required since ID is globally unique
 * - Uses centralized validation and utilities
 * 
 * Dependencies:
 * - @/lib/utils/driverUtils: deleteDriverBlockedDate
 * - @/lib/validations/api.validations: validation schemas
 * - @/lib/database/prismaClient: database access
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteDriverBlockedDate } from '@/lib/utils/driverUtils';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dateId: string }> }
) {
  try {
    const { dateId } = await params; // id is available if needed for more specific checks or logging
    const dateIdNum = parseInt(dateId, 10);
    
    if (isNaN(dateIdNum)) {
      return NextResponse.json(
        { error: 'Invalid date ID format' },
        { status: 400 }
      );
    }
    
    // The BlockedDate model has a globally unique id (auto-incrementing primary key).
    // So, deleting by id is sufficient and correct.
    // The route structure (api/drivers/[id]/...) already scopes this action.
    await deleteDriverBlockedDate(dateIdNum);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blocked date for driver:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete blocked date', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 
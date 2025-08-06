/**
 * @fileoverview API endpoint to delete a specific blocked date for a moving partner
 * @source boombox-10.0/src/app/api/mover/[userId]/blocked-dates/[id]/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * DELETE endpoint that removes a specific blocked date from a moving partner's availability.
 * Uses globally unique blocked date ID for deletion.
 * 
 * USED BY (boombox-10.0 files):
 * - Moving partner availability management interface
 * - Calendar management components
 * - Availability scheduling systems
 * - Partner dashboard blocked date management
 * 
 * INTEGRATION NOTES:
 * - Requires dateId path parameter (blocked date ID)
 * - Uses globally unique blocked date ID for deletion
 * - userId path parameter available but not used (scoping handled by route structure)
 * - Simple database delete operation with error handling
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dateId: string }> }
) {
  try {
    const { dateId } = await params; // id is available if needed for more specific checks or logging

    // The BlockedDate model has a globally unique id (auto-incrementing primary key).
    // So, deleting by id is sufficient and correct.
    // The route structure (api/moving-partners/[id]/...) already scopes this action.
    await prisma.blockedDate.delete({
      where: {
        id: parseInt(dateId, 10),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blocked date for moving partner:', error);
    return NextResponse.json(
      { error: 'Failed to delete blocked date', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
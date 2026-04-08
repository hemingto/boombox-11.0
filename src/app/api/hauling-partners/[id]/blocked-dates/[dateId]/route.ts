/**
 * @fileoverview API endpoint to delete a specific blocked date for a hauling partner
 *
 * ROUTE FUNCTIONALITY:
 * DELETE endpoint that removes a specific blocked date from a hauling partner's availability.
 * Uses globally unique blocked date ID for deletion.
 *
 * INTEGRATION NOTES:
 * - Requires dateId path parameter (blocked date ID)
 * - Uses globally unique blocked date ID for deletion
 * - userId path parameter available but not used (scoping handled by route structure)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dateId: string }> }
) {
  try {
    const { dateId } = await params;

    await prisma.blockedDate.delete({
      where: {
        id: parseInt(dateId, 10),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blocked date for hauling partner:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete blocked date',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

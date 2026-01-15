/**
 * @fileoverview API endpoint to mark active message as shown for moving partners
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * PATCH endpoint that marks the active account message as shown for a moving partner.
 * This prevents the "Your account is now active!" message from displaying again
 * after the user has seen it once during the current ACTIVE status period.
 * 
 * USED BY:
 * - Moving partner account setup checklist component
 * - Account activation workflow
 * 
 * INTEGRATION NOTES:
 * - Requires moving partner ID path parameter validation
 * - Sets activeMessageShown flag to true
 * - Returns updated moving partner record
 * - Flag is reset to false when status changes away from ACTIVE
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const moverIdNum = parseInt(id);

    if (isNaN(moverIdNum)) {
      return NextResponse.json(
        { error: 'Invalid mover ID' },
        { status: 400 }
      );
    }

    const updatedMover = await prisma.movingPartner.update({
      where: {
        id: moverIdNum,
      },
      data: {
        activeMessageShown: true,
      },
    });

    return NextResponse.json(updatedMover);
  } catch (error) {
    console.error('Error marking active message as shown:', error);
    return NextResponse.json(
      { error: 'Failed to mark active message as shown' },
      { status: 500 }
    );
  }
}

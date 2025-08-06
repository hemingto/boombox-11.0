/**
 * @fileoverview API endpoint to mark moving partner application as complete
 * @source boombox-10.0/src/app/api/movers/[moverId]/application-complete/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * PATCH endpoint that updates the application completion status for a moving partner.
 * Used to mark onboarding applications as completed and ready for approval.
 * 
 * USED BY (boombox-10.0 files):
 * - Moving partner onboarding workflow
 * - Admin application review interface
 * - Partner application status tracking
 * - Application completion verification
 * 
 * INTEGRATION NOTES:
 * - Requires moverId path parameter validation
 * - Sets applicationComplete flag to true
 * - Simple database update operation
 * - Returns updated moving partner record
 * - Part of onboarding completion workflow
 * 
 * @refactor No logic changes - direct port with updated imports
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
        applicationComplete: true,
      },
    });

    return NextResponse.json(updatedMover);
  } catch (error) {
    console.error('Error updating application complete status:', error);
    return NextResponse.json(
      { error: 'Failed to update application complete status' },
      { status: 500 }
    );
  }
} 
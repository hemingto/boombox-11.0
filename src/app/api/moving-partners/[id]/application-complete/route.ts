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
 * - Automatically updates status from INACTIVE to PENDING when application completes
 *   (if mover is not yet approved)
 * - Returns updated moving partner record
 * - Part of onboarding completion workflow
 * 
 * @refactor Added automatic status transition from INACTIVE to PENDING
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { MovingPartnerStatus } from '@prisma/client';

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

    // Fetch current mover to check if we should update status
    const currentMover = await prisma.movingPartner.findUnique({
      where: { id: moverIdNum },
      select: {
        id: true,
        isApproved: true,
        status: true,
        applicationComplete: true,
      },
    });

    if (!currentMover) {
      return NextResponse.json(
        { error: 'Moving partner not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      applicationComplete: true,
    };

    // If mover is not yet approved and status is INACTIVE, update to PENDING
    // This indicates the application is complete and ready for review
    if (!currentMover.isApproved && currentMover.status === MovingPartnerStatus.INACTIVE) {
      updateData.status = MovingPartnerStatus.PENDING;
    }

    const updatedMover = await prisma.movingPartner.update({
      where: {
        id: moverIdNum,
      },
      data: updateData,
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
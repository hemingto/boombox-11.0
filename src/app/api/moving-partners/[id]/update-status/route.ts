/**
 * @fileoverview API endpoint to update moving partner status to ACTIVE
 * @source boombox-10.0/src/app/api/movers/[moverId]/update-status/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * PATCH endpoint that updates a moving partner's status to ACTIVE if they meet activation criteria.
 * Validates partner readiness: approved status, Onfleet team ID, and at least one approved driver.
 * 
 * USED BY (boombox-10.0 files):
 * - Moving partner activation workflow
 * - Partner dashboard status management
 * - Admin partner approval processes
 * - Partner onboarding completion
 * 
 * INTEGRATION NOTES:
 * - Requires moverId path parameter validation
 * - Checks three activation criteria: isApproved, onfleetTeamId, approvedDrivers count
 * - Only updates status to ACTIVE if all criteria are met
 * - Returns updated partner record or existing record if criteria not met
 * - Uses MovingPartnerStatus enum for type safety
 * 
 * @refactor No logic changes - direct port with updated imports
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

    // Get the moving partner with their approved drivers
    const mover = await prisma.movingPartner.findUnique({
      where: { id: moverIdNum },
      include: {
        approvedDrivers: {
          where: {
            isActive: true
          }
        }
      }
    });

    if (!mover) {
      return NextResponse.json(
        { error: 'Moving partner not found' },
        { status: 404 }
      );
    }

    // Only update status to ACTIVE if:
    // 1. The mover is approved
    // 2. Has an Onfleet team ID
    // 3. Has at least one approved driver
    if (mover.isApproved && mover.onfleetTeamId && mover.approvedDrivers.length > 0) {
      const updatedMover = await prisma.movingPartner.update({
        where: { id: moverIdNum },
        data: {
          status: MovingPartnerStatus.ACTIVE
        }
      });

      return NextResponse.json(updatedMover);
    }

    return NextResponse.json(mover);
  } catch (error) {
    console.error('Error updating mover status:', error);
    return NextResponse.json(
      { error: 'Failed to update mover status' },
      { status: 500 }
    );
  }
} 
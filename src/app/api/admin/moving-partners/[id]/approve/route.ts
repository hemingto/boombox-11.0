/**
 * @fileoverview API endpoint to approve moving partners and create Onfleet teams
 * @source boombox-10.0/src/app/api/admin/movers/[id]/approve/route.ts
 * @refactor PHASE 4 - Admin Domain Routes
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that approves moving partners and creates associated Onfleet teams.
 * Sets partner status based on available drivers and handles Onfleet API integration.
 * Sends approval notifications (in-app, SMS, email) upon success.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin moving partner approval workflow
 * - Partner onboarding completion
 * - Onfleet team management
 * - Partner status management
 * 
 * INTEGRATION NOTES:
 * - Creates Onfleet team with partner name
 * - Updates partner with isApproved=true and onfleetTeamId
 * - Always sets status to INACTIVE (drivers can only be added after approval)
 * - Status transitions to ACTIVE when first driver is approved via /api/drivers/approve
 * - Handles Onfleet API errors including duplicate team names
 * - Uses MovingPartnerStatus enum for type safety
 * - Sends multi-channel approval notifications
 * 
 * @refactor Uses centralized Onfleet client from @/lib/integrations
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { getOnfleetClient } from '@/lib/integrations/onfleetClient';
import { MovingPartnerStatus } from '@prisma/client';
import { ApprovalNotificationService } from '@/lib/services/ApprovalNotificationService';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure params is properly handled
    const { id } = await context.params;
    const moverId = parseInt(id);

    const mover = await prisma.movingPartner.findUnique({
      where: { id: moverId }
    });

    if (!mover) {
      return NextResponse.json(
        { error: 'Moving partner not found' },
        { status: 404 }
      );
    }

    try {
      console.log('Creating Onfleet team for mover:', mover.name);
      // Get centralized Onfleet client and create team
      const onfleet = await getOnfleetClient();
      const team = await (onfleet as any).teams.create({
        name: mover.name,
        workers: [], // No workers initially
        managers: [], // No managers initially
        hub: null, // No hub initially
        enableSelfAssignment: false
      });
      console.log('Onfleet team created successfully:', team);

      // Update mover with Onfleet team ID and status
      // Always set to INACTIVE - drivers can only be added after approval
      // Status will transition to ACTIVE when first driver is approved
      const updatedMover = await prisma.movingPartner.update({
        where: { id: moverId },
        data: {
          isApproved: true,
          onfleetTeamId: team.id,
          status: MovingPartnerStatus.INACTIVE
        },
      });
      console.log('Mover updated with Onfleet team ID:', updatedMover.onfleetTeamId);

      // Send pending drivers notification (non-blocking, in-app only)
      ApprovalNotificationService.notifyMoverPendingDrivers({
        id: updatedMover.id,
        name: updatedMover.name,
        email: updatedMover.email,
        phoneNumber: updatedMover.phoneNumber
      }).catch((error) => {
        // Log but don't fail the approval if notification fails
        console.error('Error sending mover pending drivers notification:', error);
      });

      return NextResponse.json(updatedMover);
    } catch (onfleetError: any) {
      console.error('Onfleet API error:', onfleetError);
      // Check if the error is due to a duplicate team name
      if (onfleetError.message?.includes('duplicate')) {
        return NextResponse.json(
          { error: 'A team with this name already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create Onfleet team' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error approving mover:', error);
    return NextResponse.json(
      { error: 'Failed to approve mover' },
      { status: 500 }
    );
  }
} 
/**
 * @fileoverview Admin API endpoint to approve vehicle registration
 * @source boombox-10.0/src/app/api/admin/vehicles/[id]/approve/route.ts
 * @refactor PHASE 4 - Admin Domain
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that approves a vehicle registration by setting isApproved to true.
 * Used by admin interface to approve driver/mover vehicle submissions.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin vehicle approval dashboard
 * - Vehicle verification workflows
 * - Driver onboarding processes
 * - Mover partner management systems
 * 
 * INTEGRATION NOTES:
 * - Updates vehicle approval status in database
 * - Requires numeric vehicle ID validation
 * - Returns updated vehicle record after approval
 * - Admin authentication assumed via middleware
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const vehicleId = parseInt((await params).id);
    
    if (isNaN(vehicleId)) {
      return NextResponse.json(
        { error: 'Invalid vehicle ID' },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { isApproved: true },
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error approving vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to approve vehicle' },
      { status: 500 }
    );
  }
} 
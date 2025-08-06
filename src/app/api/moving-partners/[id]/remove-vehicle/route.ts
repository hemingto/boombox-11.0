/**
 * @fileoverview API endpoint to remove a vehicle from a moving partner
 * @source boombox-10.0/src/app/api/movers/[moverId]/remove-vehicle/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * DELETE endpoint that removes a vehicle associated with a moving partner.
 * Finds the vehicle by moving partner ID and deletes it from the database.
 * 
 * USED BY (boombox-10.0 files):
 * - Moving partner vehicle management interface
 * - Partner dashboard vehicle removal
 * - Vehicle registration management systems
 * - Partner onboarding/offboarding workflows
 * 
 * INTEGRATION NOTES:
 * - Requires moverId path parameter validation
 * - Finds vehicle by movingPartnerId relationship
 * - Returns 404 if no vehicle found for the partner
 * - Returns 204 (No Content) on successful deletion
 * - Simple database find and delete operations
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const moverId = parseInt((await params).id);
    
    if (isNaN(moverId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid mover ID' }),
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        movingPartnerId: moverId,
      },
    });

    if (!vehicle) {
      return new NextResponse(null, { status: 404 });
    }

    await prisma.vehicle.delete({
      where: {
        id: vehicle.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error removing moving partner vehicle:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to remove vehicle' }),
      { status: 500 }
    );
  }
} 
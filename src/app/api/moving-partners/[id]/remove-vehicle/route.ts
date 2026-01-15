/**
 * @fileoverview API endpoint to remove a vehicle from a moving partner
 * @source boombox-10.0/src/app/api/movers/[moverId]/remove-vehicle/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * DELETE endpoint that removes a vehicle associated with a moving partner.
 * Supports removing a specific vehicle by ID (for multi-vehicle fleet management)
 * or the first vehicle found (legacy behavior).
 * 
 * USED BY (boombox-10.0 files):
 * - Moving partner vehicle management interface
 * - Partner dashboard vehicle removal
 * - Vehicle registration management systems
 * - Partner onboarding/offboarding workflows
 * 
 * INTEGRATION NOTES:
 * - Requires moverId path parameter validation
 * - Optional vehicleId query parameter to remove specific vehicle
 * - Finds vehicle by movingPartnerId relationship
 * - Returns 404 if no vehicle found for the partner
 * - Returns 204 (No Content) on successful deletion
 * 
 * @refactor Added vehicleId query parameter support for multi-vehicle fleet management
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

    // Check for optional vehicleId query parameter (for multi-vehicle support)
    const { searchParams } = new URL(request.url);
    const vehicleIdParam = searchParams.get('vehicleId');
    
    let vehicle;
    
    if (vehicleIdParam) {
      // Remove specific vehicle by ID
      const vehicleId = parseInt(vehicleIdParam);
      
      if (isNaN(vehicleId)) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid vehicle ID' }),
          { status: 400 }
        );
      }
      
      vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          movingPartnerId: moverId,
        },
      });
    } else {
      // Legacy behavior: remove first vehicle found
      vehicle = await prisma.vehicle.findFirst({
        where: {
          movingPartnerId: moverId,
        },
      });
    }

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
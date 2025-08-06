/**
 * @fileoverview API endpoint to manage vehicles for moving partners
 * @source boombox-10.0/src/app/api/movers/[moverId]/vehicle/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET/POST endpoint for moving partner vehicle management.
 * GET: Retrieves existing vehicle for the moving partner
 * POST: Creates new vehicle registration for the moving partner
 * 
 * USED BY (boombox-10.0 files):
 * - Moving partner vehicle registration interface
 * - Partner dashboard vehicle management
 * - Vehicle onboarding workflow
 * - Fleet management components
 * 
 * INTEGRATION NOTES:
 * - GET: Returns vehicle where movingPartnerId matches and driverId is null
 * - POST: Creates vehicle with movingPartnerId and null driverId
 * - Prevents duplicate vehicle creation for same moving partner
 * - Vehicle data spread from request body with partner ID override
 * - Returns 404 for GET if no vehicle found, 201 for successful POST
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

// GET handler to fetch mover vehicle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        movingPartnerId: parseInt((await params).id),
        driverId: null,
      },
    });

    if (!vehicle) {
      return new NextResponse(null, { status: 404 });
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error fetching moving partner vehicle:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch vehicle' }),
      { status: 500 }
    );
  }
}

// POST handler to create a new vehicle for a mover
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const moverId = parseInt((await params).id);
    
    if (isNaN(moverId)) {
      return NextResponse.json(
        { error: 'Invalid mover ID' },
        { status: 400 }
      );
    }

    const data = await request.json();
    
    // Check if a vehicle already exists for this mover
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        movingPartnerId: moverId,
        driverId: null,
      },
    });

    if (existingVehicle) {
      return NextResponse.json(
        { error: 'Vehicle already exists for this mover' },
        { status: 400 }
      );
    }

    // Create a new vehicle for the mover
    const newVehicle = await prisma.vehicle.create({
      data: {
        ...data,
        movingPartnerId: moverId,
        driverId: null, // Explicitly set to null for mover vehicles
      },
    });

    return NextResponse.json(newVehicle, { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to add vehicle' },
      { status: 500 }
    );
  }
} 
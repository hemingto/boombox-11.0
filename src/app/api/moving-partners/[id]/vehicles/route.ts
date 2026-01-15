/**
 * @fileoverview API endpoint to fetch all vehicles for moving partners
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint for fetching all vehicles associated with a moving partner.
 * Supports multi-vehicle fleet management for movers (unlike drivers who are
 * limited to a single vehicle).
 * 
 * INTEGRATION NOTES:
 * - GET: Returns array of all vehicles where movingPartnerId matches
 * - Returns empty array if no vehicles found (not 404)
 * - Ordered by creation date (id) for consistent ordering
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

// GET handler to fetch all vehicles for a moving partner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const moverId = parseInt((await params).id);
    
    if (isNaN(moverId)) {
      return NextResponse.json(
        { error: 'Invalid moving partner ID' },
        { status: 400 }
      );
    }

    const vehicles = await prisma.vehicle.findMany({
      where: {
        movingPartnerId: moverId,
        driverId: null,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching moving partner vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}


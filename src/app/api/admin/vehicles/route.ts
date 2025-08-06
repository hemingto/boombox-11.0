/**
 * @fileoverview Admin API endpoint to fetch all vehicle registrations
 * @source boombox-10.0/src/app/api/admin/vehicles/route.ts
 * @refactor PHASE 4 - Admin Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns all vehicles with their associated driver or moving partner details.
 * Used by admin interface for vehicle management and approval workflows.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin vehicle management dashboard
 * - Vehicle approval interface
 * - Driver/mover vehicle verification
 * - Fleet management systems
 * 
 * INTEGRATION NOTES:
 * - Fetches vehicles with related driver and moving partner information
 * - Includes contact details for vehicle owners
 * - Returns complete vehicle records for admin review
 * - Admin authentication assumed via middleware
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        movingPartner: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
} 
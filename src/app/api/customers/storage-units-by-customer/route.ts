/**
 * @fileoverview API endpoint to fetch storage units for a specific customer
 * @source boombox-10.0/src/app/api/storageUnitsByUser/route.ts
 * @refactor PHASE 4 - Customers Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns all active storage units for a specific customer.
 * Filters for currently occupied units with completed start appointments.
 * 
 * USED BY (boombox-10.0 files):
 * - Customer dashboard showing current storage units
 * - Storage unit management interface
 * - Customer account pages
 * - Storage unit access workflows
 * 
 * INTEGRATION NOTES:
 * - Requires userId query parameter
 * - Filters for active units (usageEndDate: null)
 * - Only includes units from completed start appointments
 * - Returns storage unit details with appointment information
 * 
 * @refactor Removed manual Prisma disconnect (handled by connection pooling)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(req: NextRequest) {
  try {
    const userId = parseInt(req.nextUrl.searchParams.get('userId') || '', 10);

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const storageUnits = await prisma.storageUnitUsage.findMany({
      where: { 
        userId, 
        usageEndDate: null, // Filter for currently occupied units
        startAppointment: {
          status: 'Completed',
        },
      },
      include: {
        storageUnit: true, // Include related storage unit data
        startAppointment: {
          select: {
            id: true,
            address: true,
            status: true
          }
        }
      },
    });

    return NextResponse.json(storageUnits);
  } catch (error) {
    console.error('Error fetching storage units:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
/**
 * @fileoverview API endpoint to get and update moving partner driver assignment mode
 * 
 * ROUTE FUNCTIONALITY:
 * - GET: Fetch current driver assignment mode setting
 * - PATCH: Update driver assignment mode (MANUAL or AUTO)
 * 
 * USED BY:
 * - UpcomingJobs.tsx toggle component for moving partners
 * - Driver assignment logic in onfleet/driver-assign/route.ts
 * 
 * INTEGRATION NOTES:
 * - MANUAL mode: Moving partner manually assigns drivers to each job
 * - AUTO mode: Boombox automatically assigns next available driver
 * - Default is MANUAL for all moving partners
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { DriverAssignmentMode } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

// Request validation schema
const UpdateDriverAssignmentModeSchema = z.object({
  mode: z.enum(['MANUAL', 'AUTO']),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const movingPartnerId = parseInt(id);

    if (isNaN(movingPartnerId)) {
      return NextResponse.json(
        { error: 'Invalid moving partner ID' },
        { status: 400 }
      );
    }

    const movingPartner = await prisma.movingPartner.findUnique({
      where: { id: movingPartnerId },
      select: {
        id: true,
        driverAssignmentMode: true,
      },
    });

    if (!movingPartner) {
      return NextResponse.json(
        { error: 'Moving partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mode: movingPartner.driverAssignmentMode,
    });
  } catch (error) {
    console.error('Error fetching driver assignment mode:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver assignment mode' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const movingPartnerId = parseInt(id);

    if (isNaN(movingPartnerId)) {
      return NextResponse.json(
        { error: 'Invalid moving partner ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = UpdateDriverAssignmentModeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { mode } = validationResult.data;

    // Verify moving partner exists
    const existingPartner = await prisma.movingPartner.findUnique({
      where: { id: movingPartnerId },
    });

    if (!existingPartner) {
      return NextResponse.json(
        { error: 'Moving partner not found' },
        { status: 404 }
      );
    }

    // Update the driver assignment mode
    const updatedPartner = await prisma.movingPartner.update({
      where: { id: movingPartnerId },
      data: {
        driverAssignmentMode: mode as DriverAssignmentMode,
      },
      select: {
        id: true,
        driverAssignmentMode: true,
      },
    });

    return NextResponse.json({
      success: true,
      mode: updatedPartner.driverAssignmentMode,
    });
  } catch (error) {
    console.error('Error updating driver assignment mode:', error);
    return NextResponse.json(
      { error: 'Failed to update driver assignment mode' },
      { status: 500 }
    );
  }
}

/**
 * @fileoverview API endpoint to get and update hauling partner driver assignment mode
 *
 * ROUTE FUNCTIONALITY:
 * - GET: Fetch current driver assignment mode setting
 * - PATCH: Update driver assignment mode (MANUAL or AUTO)
 *
 * USED BY:
 * - DriverAssignmentModeToggle component on hauler jobs page
 *
 * INTEGRATION NOTES:
 * - MANUAL mode: Hauling partner manually assigns drivers to each job
 * - AUTO mode: Boombox automatically assigns next available driver
 * - Default is AUTO for all hauling partners (per schema)
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { DriverAssignmentMode } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

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
    const haulingPartnerId = parseInt(id);

    if (isNaN(haulingPartnerId)) {
      return NextResponse.json(
        { error: 'Invalid hauling partner ID' },
        { status: 400 }
      );
    }

    const haulingPartner = await prisma.haulingPartner.findUnique({
      where: { id: haulingPartnerId },
      select: {
        id: true,
        driverAssignmentMode: true,
      },
    });

    if (!haulingPartner) {
      return NextResponse.json(
        { error: 'Hauling partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mode: haulingPartner.driverAssignmentMode,
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
    const haulingPartnerId = parseInt(id);

    if (isNaN(haulingPartnerId)) {
      return NextResponse.json(
        { error: 'Invalid hauling partner ID' },
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

    const existingPartner = await prisma.haulingPartner.findUnique({
      where: { id: haulingPartnerId },
    });

    if (!existingPartner) {
      return NextResponse.json(
        { error: 'Hauling partner not found' },
        { status: 404 }
      );
    }

    const updatedPartner = await prisma.haulingPartner.update({
      where: { id: haulingPartnerId },
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

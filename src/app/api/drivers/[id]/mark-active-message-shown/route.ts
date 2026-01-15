/**
 * @fileoverview API endpoint to mark active message as shown for drivers
 * @refactor PHASE 4 - Drivers Domain
 * 
 * ROUTE FUNCTIONALITY:
 * PATCH endpoint that marks the active account message as shown for a driver.
 * This prevents the "You're all set!" message from displaying again
 * after the user has seen it once during the current application period.
 * 
 * USED BY:
 * - Driver account setup checklist component
 * - Account activation workflow
 * 
 * INTEGRATION NOTES:
 * - Requires driver ID path parameter validation
 * - Sets activeMessageShown flag to true
 * - Returns updated driver record
 * - Flag is reset to false when status changes
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const driverIdNum = parseInt(id);

    if (isNaN(driverIdNum)) {
      return NextResponse.json(
        { error: 'Invalid driver ID' },
        { status: 400 }
      );
    }

    const updatedDriver = await prisma.driver.update({
      where: {
        id: driverIdNum,
      },
      data: {
        activeMessageShown: true,
      },
    });

    return NextResponse.json(updatedDriver);
  } catch (error) {
    console.error('Error marking active message as shown:', error);
    return NextResponse.json(
      { error: 'Failed to mark active message as shown' },
      { status: 500 }
    );
  }
}

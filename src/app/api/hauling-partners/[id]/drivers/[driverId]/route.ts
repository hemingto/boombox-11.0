/**
 * @fileoverview API endpoint to remove a driver from a hauling partner
 * Modeled after moving-partners/[id]/drivers/[driverId]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { HaulingPartnerStatus } from '@prisma/client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; driverId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const awaitedParams = await params;
    const haulerId = parseInt(awaitedParams.id);
    const driverId = parseInt(awaitedParams.driverId);

    if (isNaN(haulerId) || isNaN(driverId)) {
      return NextResponse.json(
        { error: 'Invalid hauler ID or driver ID' },
        { status: 400 }
      );
    }

    await prisma.haulingPartnerDriver.delete({
      where: {
        haulingPartnerId_driverId: {
          haulingPartnerId: haulerId,
          driverId: driverId,
        },
      },
    });

    await prisma.driver.delete({
      where: { id: driverId },
    });

    const remainingActiveApprovedDrivers =
      await prisma.haulingPartnerDriver.count({
        where: {
          haulingPartnerId: haulerId,
          isActive: true,
          driver: {
            isApproved: true,
          },
        },
      });

    if (remainingActiveApprovedDrivers === 0) {
      await prisma.haulingPartner.update({
        where: { id: haulerId },
        data: { status: HaulingPartnerStatus.INACTIVE },
      });
      console.log(
        `Hauling partner ${haulerId} status updated to INACTIVE - no remaining active approved drivers`
      );
    }

    return NextResponse.json({ message: 'Driver removed successfully' });
  } catch (error) {
    console.error('Error removing driver:', error);
    return NextResponse.json(
      { error: 'Failed to remove driver' },
      { status: 500 }
    );
  }
}

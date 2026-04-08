import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { HaulingPartnerStatus } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const haulerIdNum = parseInt(id);

    if (isNaN(haulerIdNum)) {
      return NextResponse.json(
        { error: 'Invalid hauling partner ID' },
        { status: 400 }
      );
    }

    const hauler = await prisma.haulingPartner.findUnique({
      where: { id: haulerIdNum },
      include: {
        drivers: {
          where: { isActive: true },
          include: {
            driver: { select: { id: true, isApproved: true } },
          },
        },
      },
    });

    if (!hauler) {
      return NextResponse.json(
        { error: 'Hauling partner not found' },
        { status: 404 }
      );
    }

    const hasApprovedDriver = hauler.drivers.some(
      assoc => assoc.driver.isApproved
    );

    if (hauler.isApproved && hauler.onfleetTeamId && hasApprovedDriver) {
      const shouldResetMessage =
        hauler.status !== HaulingPartnerStatus.ACTIVE &&
        hauler.activeMessageShown;

      const updatedHauler = await prisma.haulingPartner.update({
        where: { id: haulerIdNum },
        data: {
          status: HaulingPartnerStatus.ACTIVE,
          ...(shouldResetMessage && { activeMessageShown: false }),
        },
      });

      return NextResponse.json(updatedHauler);
    }

    if (hauler.status === HaulingPartnerStatus.ACTIVE) {
      const updatedHauler = await prisma.haulingPartner.update({
        where: { id: haulerIdNum },
        data: {
          status: HaulingPartnerStatus.INACTIVE,
          activeMessageShown: false,
        },
      });

      return NextResponse.json(updatedHauler);
    }

    return NextResponse.json(hauler);
  } catch (error) {
    console.error('Error updating hauler status:', error);
    return NextResponse.json(
      { error: 'Failed to update hauler status' },
      { status: 500 }
    );
  }
}

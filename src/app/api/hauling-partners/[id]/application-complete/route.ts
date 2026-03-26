import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { HaulingPartnerStatus } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      return NextResponse.json(
        { error: 'Invalid hauling partner ID' },
        { status: 400 }
      );
    }

    const current = await prisma.haulingPartner.findUnique({
      where: { id: idNum },
      select: {
        id: true,
        isApproved: true,
        status: true,
        applicationComplete: true,
      },
    });

    if (!current) {
      return NextResponse.json(
        { error: 'Hauling partner not found' },
        { status: 404 }
      );
    }

    const updateData: any = { applicationComplete: true };
    if (
      !current.isApproved &&
      current.status === HaulingPartnerStatus.INACTIVE
    ) {
      updateData.status = HaulingPartnerStatus.PENDING;
    }

    const updated = await prisma.haulingPartner.update({
      where: { id: idNum },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating application complete status:', error);
    return NextResponse.json(
      { error: 'Failed to update application complete status' },
      { status: 500 }
    );
  }
}

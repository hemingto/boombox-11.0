import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(
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

    const driverAssociations = await prisma.haulingPartnerDriver.findMany({
      where: { haulingPartnerId: idNum },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            isApproved: true,
            status: true,
            profilePicture: true,
            createdAt: true,
          },
        },
      },
    });

    const drivers = driverAssociations.map(a => ({
      ...a.driver,
      isActive: a.isActive,
      associationId: a.id,
    }));

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error('Error fetching hauling partner drivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}

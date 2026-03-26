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
      where: { haulingPartnerId: idNum, isActive: true },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isApproved: true,
            status: true,
          },
        },
      },
    });

    const approvedDrivers = driverAssociations
      .filter(a => a.driver.isApproved)
      .map(a => a.driver);

    return NextResponse.json({ drivers: approvedDrivers });
  } catch (error) {
    console.error('Error fetching approved drivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approved drivers' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
    });
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const haulers = await prisma.haulingPartner.findMany({
      include: {
        vehicles: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            licensePlate: true,
            vehicleCategory: true,
            vehicleType: true,
            unitCapacity: true,
          },
        },
        drivers: {
          include: {
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                isApproved: true,
              },
            },
          },
        },
        haulJobs: {
          select: {
            id: true,
            jobCode: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ haulers });
  } catch (error) {
    console.error('Error fetching hauling partners:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

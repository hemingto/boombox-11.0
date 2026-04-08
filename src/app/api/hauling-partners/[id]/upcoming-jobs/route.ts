import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

/**
 * GET upcoming haul jobs for a hauling partner.
 * Returns jobs with status not COMPLETED or CANCELLED,
 * formatted to match the UpcomingAppointment shape used by shared components.
 */
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

    const jobs = await prisma.haulJob.findMany({
      where: {
        haulingPartnerId: idNum,
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
      include: {
        originWarehouse: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            latitude: true,
            longitude: true,
          },
        },
        destinationWarehouse: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            latitude: true,
            longitude: true,
          },
        },
        units: {
          include: {
            storageUnit: { select: { storageUnitNumber: true } },
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    const formatted = jobs.map(job => ({
      id: job.id,
      address: job.originWarehouse.address,
      date: job.scheduledDate ?? job.createdAt,
      time: job.scheduledDate ?? job.createdAt,
      numberOfUnits: job.units.length,
      planType: formatHaulJobType(job.type),
      appointmentType: 'Haul Job',
      status: job.status,
      description: `${job.originWarehouse.name} → ${job.destinationWarehouse.name}`,
      coordinates:
        job.originWarehouse.latitude && job.originWarehouse.longitude
          ? {
              lat: job.originWarehouse.latitude,
              lng: job.originWarehouse.longitude,
            }
          : undefined,
      haulJobMeta: {
        jobCode: job.jobCode,
        originWarehouse: job.originWarehouse,
        destinationWarehouse: job.destinationWarehouse,
        notes: job.notes,
        units: job.units.map(u => u.storageUnit.storageUnitNumber),
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching upcoming haul jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming jobs' },
      { status: 500 }
    );
  }
}

function formatHaulJobType(type: string): string {
  switch (type) {
    case 'SSF_TO_STOCKTON':
      return 'SSF → Stockton';
    case 'STOCKTON_TO_SSF':
      return 'Stockton → SSF';
    case 'STOCKTON_DIRECT_DELIVERY':
      return 'Stockton Direct Delivery';
    default:
      return type;
  }
}

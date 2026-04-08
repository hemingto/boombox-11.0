import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

/**
 * GET completed haul jobs for a hauling partner.
 * Returns jobs with status COMPLETED or CANCELLED,
 * formatted to match the HistoryJob shape used by shared components.
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
        status: { in: ['COMPLETED', 'CANCELLED'] },
      },
      include: {
        originWarehouse: {
          select: { id: true, name: true, address: true, city: true },
        },
        destinationWarehouse: {
          select: { id: true, name: true, address: true, city: true },
        },
        units: {
          include: {
            storageUnit: { select: { storageUnitNumber: true } },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    const formatted = jobs.map(job => ({
      id: job.id,
      appointmentType: 'Haul Job',
      address: `${job.originWarehouse.name} → ${job.destinationWarehouse.name}`,
      date: (
        job.completedAt ??
        job.scheduledDate ??
        job.createdAt
      ).toISOString(),
      time: (
        job.completedAt ??
        job.scheduledDate ??
        job.createdAt
      ).toISOString(),
      numberOfUnits: job.units.length,
      planType: formatHaulJobType(job.type),
      insuranceCoverage: undefined,
      requestedStorageUnits: job.units.map(u => ({
        unitType: 'Storage Unit',
        quantity: 1,
        storageUnitNumber: u.storageUnit.storageUnitNumber,
      })),
      haulJobMeta: {
        jobCode: job.jobCode,
        status: job.status,
        originWarehouse: job.originWarehouse,
        destinationWarehouse: job.destinationWarehouse,
        notes: job.notes,
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching hauling partner jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
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

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import {
  haulJobService,
  type CreateHaulJobInput,
} from '@/lib/services/HaulJobService';
import { HaulJobStatus, HaulJobType } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status') as HaulJobStatus | null;
    const type = url.searchParams.get('type') as HaulJobType | null;

    const jobs = await haulJobService.listHaulJobs({
      ...(status && { status }),
      ...(type && { type }),
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching haul jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch haul jobs' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      type,
      originWarehouseId,
      destinationWarehouseId,
      storageUnitIds,
      haulingPartnerId,
      scheduledDate,
      scheduledTime,
      notes,
    } = body;

    if (
      !type ||
      !originWarehouseId ||
      !destinationWarehouseId ||
      !storageUnitIds?.length
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const input: CreateHaulJobInput = {
      type,
      originWarehouseId,
      destinationWarehouseId,
      storageUnitIds,
      haulingPartnerId: haulingPartnerId || undefined,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      scheduledTime: scheduledTime || undefined,
      notes: notes || undefined,
    };

    const job = await haulJobService.createHaulJob(input);
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating haul job:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create haul job',
      },
      { status: 500 }
    );
  }
}

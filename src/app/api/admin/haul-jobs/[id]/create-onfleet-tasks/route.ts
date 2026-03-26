import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { haulJobOnfleetService } from '@/lib/services/onfleet/HaulJobOnfleetService';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const jobId = parseInt(id, 10);
    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const result = await haulJobOnfleetService.createHaulJobTasks(jobId);
    return NextResponse.json({ success: true, tasks: result });
  } catch (error) {
    console.error('Error creating Onfleet tasks for haul job:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create Onfleet tasks',
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { haulJobService } from '@/lib/services/HaulJobService';

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

    const body = await req.json();
    const { haulingPartnerId } = body;

    if (!haulingPartnerId) {
      return NextResponse.json(
        { error: 'haulingPartnerId is required' },
        { status: 400 }
      );
    }

    const job = await haulJobService.assignHaulingPartner(
      jobId,
      haulingPartnerId
    );
    return NextResponse.json(job);
  } catch (error) {
    console.error('Error assigning hauling partner:', error);
    return NextResponse.json(
      { error: 'Failed to assign hauling partner' },
      { status: 500 }
    );
  }
}

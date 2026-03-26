import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
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
    const { unitDamageReports } = body;

    if (!unitDamageReports || !Array.isArray(unitDamageReports)) {
      return NextResponse.json(
        { error: 'unitDamageReports array is required' },
        { status: 400 }
      );
    }

    const job = await haulJobService.confirmArrival(jobId, unitDamageReports);
    return NextResponse.json(job);
  } catch (error) {
    console.error('Error confirming arrival:', error);
    return NextResponse.json(
      { error: 'Failed to confirm arrival' },
      { status: 500 }
    );
  }
}

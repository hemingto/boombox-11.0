import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { stocktonEligibilityService } from '@/lib/services/StocktonEligibilityService';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const units =
      await stocktonEligibilityService.getEligibleUnitsForStocktonTransfer();
    const count = units.length;

    return NextResponse.json({ units, count });
  } catch (error) {
    console.error('Error fetching eligible units:', error);
    return NextResponse.json(
      { error: 'Failed to fetch eligible units' },
      { status: 500 }
    );
  }
}

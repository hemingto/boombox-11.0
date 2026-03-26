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

    const invitations = await prisma.haulingPartnerDriverInvitation.findMany({
      where: { haulingPartnerId: idNum },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error fetching driver invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver invitations' },
      { status: 500 }
    );
  }
}

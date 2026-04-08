import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const haulerIdNum = parseInt(id);

    if (isNaN(haulerIdNum)) {
      return NextResponse.json(
        { error: 'Invalid hauling partner ID' },
        { status: 400 }
      );
    }

    const updatedHauler = await prisma.haulingPartner.update({
      where: { id: haulerIdNum },
      data: { activeMessageShown: true },
    });

    return NextResponse.json(updatedHauler);
  } catch (error) {
    console.error('Error marking active message as shown:', error);
    return NextResponse.json(
      { error: 'Failed to mark active message as shown' },
      { status: 500 }
    );
  }
}

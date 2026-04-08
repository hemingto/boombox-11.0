import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const haulerId = parseInt((await params).id);

    if (isNaN(haulerId)) {
      return NextResponse.json(
        { error: 'Invalid hauling partner ID' },
        { status: 400 }
      );
    }

    const haulingPartner = await prisma.haulingPartner.findUnique({
      where: { id: haulerId },
      select: { imageSrc: true },
    });

    if (!haulingPartner) {
      return NextResponse.json(
        { error: 'Hauling partner not found' },
        { status: 404 }
      );
    }

    if (!haulingPartner.imageSrc) {
      return NextResponse.json(
        { error: 'No profile picture found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profilePictureUrl: haulingPartner.imageSrc,
    });
  } catch (error: any) {
    console.error('Error fetching profile picture:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile picture', details: error.message },
      { status: 500 }
    );
  }
}

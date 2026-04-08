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

    const hauler = await prisma.haulingPartner.findUnique({
      where: { id: idNum },
      select: { pricePerBoombox: true },
    });

    if (!hauler) {
      return NextResponse.json(
        { error: 'Hauling partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(hauler);
  } catch (error) {
    console.error('Error fetching route pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route pricing' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const { pricePerBoombox } = await request.json();

    const updated = await prisma.haulingPartner.update({
      where: { id: idNum },
      data: {
        ...(pricePerBoombox !== undefined && {
          pricePerBoombox: parseFloat(pricePerBoombox),
        }),
      },
    });

    return NextResponse.json({
      pricePerBoombox: updated.pricePerBoombox,
    });
  } catch (error) {
    console.error('Error updating route pricing:', error);
    return NextResponse.json(
      { error: 'Failed to update route pricing' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { normalizePhoneNumberToE164 } from '@/lib/utils';

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

    const haulingPartner = await prisma.haulingPartner.findUnique({
      where: { id: idNum },
      include: {
        vehicles: {
          select: { id: true, isApproved: true, vehicleCategory: true },
        },
        drivers: {
          where: { isActive: true },
          include: {
            driver: { select: { id: true, isApproved: true, status: true } },
          },
        },
      },
    });

    if (!haulingPartner) {
      return NextResponse.json(
        { error: 'Hauling partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(haulingPartner);
  } catch (error) {
    console.error('Error fetching hauling partner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hauling partner information' },
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

    const existing = await prisma.haulingPartner.findUnique({
      where: { id: idNum },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Hauling partner not found' },
        { status: 404 }
      );
    }

    const updateData = await request.json();
    const processedData: Record<string, any> = {};

    if (updateData.name !== undefined) processedData.name = updateData.name;
    if (updateData.description !== undefined)
      processedData.description = updateData.description;
    if (updateData.email !== undefined) processedData.email = updateData.email;
    if (updateData.website !== undefined)
      processedData.website = updateData.website;

    if (updateData.phoneNumber !== undefined) {
      try {
        processedData.phoneNumber = normalizePhoneNumberToE164(
          updateData.phoneNumber
        );
      } catch {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.haulingPartner.update({
      where: { id: idNum },
      data: processedData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      return NextResponse.json(
        { message: `This ${field} is already in use.` },
        { status: 409 }
      );
    }
    console.error('Error updating hauling partner:', error);
    return NextResponse.json(
      { error: 'Failed to update hauling partner information' },
      { status: 500 }
    );
  }
}

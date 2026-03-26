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
    });
    if (!hauler) {
      return NextResponse.json(
        { error: 'Hauling partner not found' },
        { status: 404 }
      );
    }

    const availability = await prisma.haulingPartnerAvailability.findMany({
      where: { haulingPartnerId: idNum },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        isBlocked: true,
        maxCapacity: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const dayOrder: Record<string, number> = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    };

    const sorted = [...availability].sort(
      (a, b) => (dayOrder[a.dayOfWeek] || 0) - (dayOrder[b.dayOfWeek] || 0)
    );

    return NextResponse.json({ success: true, availability: sorted });
  } catch (error) {
    console.error('Error fetching hauling partner availability:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const haulingPartnerId = parseInt(id);
    if (isNaN(haulingPartnerId)) {
      return NextResponse.json(
        { error: 'Invalid hauling partner ID' },
        { status: 400 }
      );
    }

    const {
      id: recordId,
      dayOfWeek,
      startTime,
      endTime,
      isBlocked,
      maxCapacity,
    } = await request.json();

    const hauler = await prisma.haulingPartner.findUnique({
      where: { id: haulingPartnerId },
    });
    if (!hauler) {
      return NextResponse.json(
        { error: 'Hauling partner not found' },
        { status: 404 }
      );
    }

    let availability;

    if (recordId) {
      availability = await prisma.haulingPartnerAvailability.update({
        where: { id: recordId },
        data: {
          startTime,
          endTime,
          isBlocked: isBlocked || false,
          maxCapacity: maxCapacity || 1,
          updatedAt: new Date(),
        },
      });
    } else {
      const existing = await prisma.haulingPartnerAvailability.findFirst({
        where: { haulingPartnerId, dayOfWeek },
      });

      if (existing) {
        availability = await prisma.haulingPartnerAvailability.update({
          where: { id: existing.id },
          data: {
            startTime,
            endTime,
            isBlocked: isBlocked || false,
            maxCapacity: maxCapacity || 1,
            updatedAt: new Date(),
          },
        });
      } else {
        availability = await prisma.haulingPartnerAvailability.create({
          data: {
            haulingPartnerId,
            dayOfWeek,
            startTime,
            endTime,
            isBlocked: isBlocked || false,
            maxCapacity: maxCapacity || 1,
          },
        });
      }
    }

    return NextResponse.json({ success: true, availability });
  } catch (error) {
    console.error('Error saving hauling partner availability:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save availability' },
      { status: 500 }
    );
  }
}

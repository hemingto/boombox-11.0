import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const haulerId = parseInt(id, 10);

    if (isNaN(haulerId)) {
      return NextResponse.json(
        { error: 'Invalid hauling partner ID' },
        { status: 400 }
      );
    }

    const hauler = await prisma.haulingPartner.findUnique({
      where: { id: haulerId },
      select: { insuranceDocumentUrls: true },
    });

    if (!hauler) {
      return NextResponse.json(
        { error: 'Hauling partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      insuranceDocumentUrls: hauler.insuranceDocumentUrls,
    });
  } catch (error: any) {
    console.error('Error fetching insurance documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insurance documents', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const haulerId = parseInt(id, 10);

    if (isNaN(haulerId)) {
      return NextResponse.json(
        { error: 'Invalid hauling partner ID' },
        { status: 400 }
      );
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const hauler = await prisma.haulingPartner.findUnique({
      where: { id: haulerId },
      select: { insuranceDocumentUrls: true },
    });

    if (!hauler) {
      return NextResponse.json(
        { error: 'Hauling partner not found' },
        { status: 404 }
      );
    }

    const updatedUrls = hauler.insuranceDocumentUrls.filter(
      existingUrl => existingUrl !== url
    );

    await prisma.haulingPartner.update({
      where: { id: haulerId },
      data: { insuranceDocumentUrls: updatedUrls },
    });

    return NextResponse.json({
      success: true,
      insuranceDocumentUrls: updatedUrls,
    });
  } catch (error: any) {
    console.error('Error deleting insurance document:', error);
    return NextResponse.json(
      { error: 'Failed to delete insurance document', details: error.message },
      { status: 500 }
    );
  }
}

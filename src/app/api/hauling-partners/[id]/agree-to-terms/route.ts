import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function POST(
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

    const updated = await prisma.haulingPartner.update({
      where: { id: idNum },
      data: { agreedToTerms: true, agreedToTermsAt: new Date() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating terms agreement:', error);
    return NextResponse.json(
      { error: 'Failed to update terms agreement' },
      { status: 500 }
    );
  }
}

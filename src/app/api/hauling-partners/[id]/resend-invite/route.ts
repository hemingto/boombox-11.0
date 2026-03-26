import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { randomBytes } from 'crypto';

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

    const { invitationId } = await request.json();
    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    const invitation = await prisma.haulingPartnerDriverInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.haulingPartnerId !== idNum) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    const newToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 15);

    const updated = await prisma.haulingPartnerDriverInvitation.update({
      where: { id: invitationId },
      data: { token: newToken, expiresAt, status: 'pending' },
    });

    return NextResponse.json({
      message: 'Invitation resent successfully',
      invitation: updated,
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json(
      { error: 'Failed to resend invitation' },
      { status: 500 }
    );
  }
}

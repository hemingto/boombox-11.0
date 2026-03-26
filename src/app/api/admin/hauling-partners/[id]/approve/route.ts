import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { prisma } from '@/lib/database/prismaClient';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
    });
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

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

    if (hauler.isApproved) {
      return NextResponse.json(
        { error: 'Hauling partner is already approved' },
        { status: 400 }
      );
    }

    let onfleetTeamId = hauler.onfleetTeamId;

    if (!onfleetTeamId) {
      try {
        const onfleet = (await import('@/lib/integrations/onfleetClient'))
          .default;
        const team = await onfleet.teams.create({
          name: hauler.name,
          workers: [],
          managers: [],
          hub: null as any,
          enableSelfAssignment: false,
        });
        onfleetTeamId = team.id;
      } catch (onfleetError: any) {
        if (onfleetError?.message?.includes('already been taken')) {
          console.warn(
            'Onfleet team name already exists, proceeding without team creation'
          );
        } else {
          console.error('Error creating Onfleet team:', onfleetError);
          return NextResponse.json(
            { error: 'Failed to create Onfleet team' },
            { status: 500 }
          );
        }
      }
    }

    const updated = await prisma.haulingPartner.update({
      where: { id: idNum },
      data: {
        isApproved: true,
        ...(onfleetTeamId && { onfleetTeamId }),
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: `APPROVE_HAULING_PARTNER: Approved hauling partner ${hauler.name}`,
        targetType: 'HAULING_PARTNER',
        targetId: idNum.toString(),
      },
    });

    return NextResponse.json({ success: true, hauler: updated });
  } catch (error) {
    console.error('Error approving hauling partner:', error);
    return NextResponse.json(
      { error: 'Failed to approve hauling partner' },
      { status: 500 }
    );
  }
}

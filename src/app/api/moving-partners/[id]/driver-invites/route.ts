/**
 * @fileoverview API endpoint to fetch pending driver invites for a moving partner
 * @source boombox-10.0/src/app/api/movers/[moverId]/driver-invites/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns all pending driver invitations for a specific moving partner.
 * Used to display current outstanding invites in the moving partner dashboard.
 * 
 * USED BY (boombox-10.0 files):
 * - Moving partner dashboard interface
 * - Driver invitation management pages
 * - Invite status tracking components
 * - Partner onboarding workflows
 * 
 * INTEGRATION NOTES:
 * - Requires moverId path parameter (converted to numeric ID)
 * - Filters for 'pending' status invites only
 * - Returns invite details without sensitive data
 * - Ordered by creation date (newest first)
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const moverIdNum = parseInt(id);

        if (isNaN(moverIdNum)) {
            return NextResponse.json(
                { error: 'Invalid mover ID' },
                { status: 400 }
            );
        }

        const invites = await prisma.driverInvitation.findMany({
            where: {
                movingPartnerId: moverIdNum,
                status: 'pending', // Only fetch pending invites
            },
            select: {
                token: true,
                email: true,
                status: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(invites);
    } catch (error) {
        console.error('Error fetching driver invites:', error);
        return NextResponse.json(
            { error: 'Failed to fetch driver invites' },
            { status: 500 }
        );
    }
} 
/**
 * @fileoverview API endpoint to resend driver invitations for moving partners
 * @source boombox-10.0/src/app/api/movers/[moverId]/resend-invite/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that resends existing driver invitations with extended expiration.
 * Finds invitation by token, extends expiration by 7 days, and resends email.
 * 
 * USED BY (boombox-10.0 files):
 * - Moving partner driver invitation management
 * - Expired invitation recovery workflow
 * - Partner dashboard invitation tools
 * - Driver recruitment retry mechanisms
 * 
 * INTEGRATION NOTES:
 * - Requires { token } in request body
 * - Finds invitation by token and movingPartnerId
 * - Extends expiration by 7 days from current date
 * - Resets invitation status to 'pending'
 * - Resends invitation email via SendGrid integration
 * - Includes moving partner details for email personalization
 * 
 * @refactor Uses centralized messaging service from @/lib/messaging
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { sendDriverInvitationEmail } from "@/lib/messaging";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const moverIdNum = parseInt(id);
        const { token } = await request.json();

        if (isNaN(moverIdNum)) {
            return NextResponse.json(
                { error: 'Invalid mover ID' },
                { status: 400 }
            );
        }

        // Find the invitation
        const invitation = await prisma.driverInvitation.findFirst({
            where: {
                token,
                movingPartnerId: moverIdNum,
            },
            include: {
                movingPartner: true,
            },
        });

        if (!invitation) {
            return NextResponse.json(
                { error: 'Invitation not found' },
                { status: 404 }
            );
        }

        // Update the invitation to extend its expiration
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 7); // Extend by 7 days

        await prisma.driverInvitation.update({
            where: {
                token,
            },
            data: {
                expiresAt: newExpiresAt,
                status: 'pending',
            },
        });

        // Send the email using SendGrid
        await sendDriverInvitationEmail(
            invitation.email,
            invitation.token,
            invitation.movingPartner.name
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error resending invitation:', error);
        return NextResponse.json(
            { error: 'Failed to resend invitation' },
            { status: 500 }
        );
    }
} 
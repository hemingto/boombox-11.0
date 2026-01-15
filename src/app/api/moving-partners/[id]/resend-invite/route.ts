/**
 * @fileoverview API endpoint to resend driver invitations for moving partners
 * @source boombox-10.0/src/app/api/movers/[moverId]/resend-invite/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that resends existing driver invitations.
 * Now delegates to Server Action for consistency and automatic cache revalidation.
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
 * - Resends invitation email via SendGrid integration
 * - Includes moving partner details for email personalization
 * 
 * @refactor Uses Server Action from @/lib/services/driverInvitationService
 */

import { NextResponse, NextRequest } from 'next/server';
import { resendDriverInvite } from '@/lib/services/driverInvitationService';

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

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        // Delegate to Server Action
        await resendDriverInvite(moverIdNum, token);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error resending invitation:', error);
        return NextResponse.json(
            { error: 'Failed to resend invitation' },
            { status: 500 }
        );
    }
} 
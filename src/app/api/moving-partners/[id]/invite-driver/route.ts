/**
 * @fileoverview API endpoint to invite drivers to join a moving partner
 * @source boombox-10.0/src/app/api/movers/[moverId]/invite-driver/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that creates driver invitations for moving partners.
 * Now delegates to Server Action for consistency and automatic cache revalidation.
 * 
 * USED BY (boombox-10.0 files):
 * - Moving partner driver recruitment interface
 * - Partner dashboard driver management
 * - Driver onboarding workflow initiation
 * - Team building and expansion features
 * 
 * INTEGRATION NOTES:
 * - Requires authentication session validation
 * - Finds moving partner by email from session
 * - Requires { email, expiresInDays? } in request body
 * - Delegates to inviteDriver Server Action
 * - Default expiration: 15 days
 * 
 * @refactor Uses Server Action from @/lib/services/driverInvitationService
 */

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextAuthConfig";
import { prisma } from '@/lib/database/prismaClient';
import { inviteDriver } from '@/lib/services/driverInvitationService';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the moving partner associated with the logged-in user
    const movingPartner = await prisma.movingPartner.findFirst({
      where: {
        email: session.user.email,
      },
    });

    if (!movingPartner) {
      return NextResponse.json(
        { error: "Moving partner not found" },
        { status: 404 }
      );
    }

    const { email, expiresInDays = 15 } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Delegate to Server Action for consistency and automatic cache revalidation
    const invitation = await inviteDriver(movingPartner.id, email, expiresInDays);

    return NextResponse.json({
      message: "Invitation sent successfully",
      invitation,
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
} 
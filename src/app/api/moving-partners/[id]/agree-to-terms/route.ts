/**
 * @fileoverview API endpoint for moving partner terms agreement
 * @source boombox-10.0/src/app/api/movers/[moverId]/agree-to-terms/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that records a moving partner's agreement to terms and conditions.
 * Updates both agreement status and timestamp for audit compliance.
 * 
 * USED BY (boombox-10.0 files):
 * - Moving partner onboarding workflow
 * - Terms and conditions acceptance interface
 * - Partner registration completion
 * - Legal compliance tracking
 * 
 * INTEGRATION NOTES:
 * - Requires moverId path parameter validation
 * - Sets agreedToTerms flag to true
 * - Records agreedToTermsAt timestamp for audit trail
 * - Returns updated moving partner record
 * - Part of partner onboarding compliance workflow
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function POST(
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

    const updatedMover = await prisma.movingPartner.update({
      where: {
        id: moverIdNum,
      },
      data: {
        agreedToTerms: true,
        agreedToTermsAt: new Date(),
      },
    });

    return NextResponse.json(updatedMover);
  } catch (error) {
    console.error('Error updating terms agreement:', error);
    return NextResponse.json(
      { error: 'Failed to update terms agreement' },
      { status: 500 }
    );
  }
} 
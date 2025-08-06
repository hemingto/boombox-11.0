/**
 * @fileoverview API endpoint to fetch moving partner profile picture
 * @source boombox-10.0/src/app/api/movers/[moverId]/profile-picture/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns the profile picture URL for a specific moving partner.
 * Validates partner existence and returns profile image source or appropriate errors.
 * 
 * USED BY (boombox-10.0 files):
 * - Moving partner profile display components
 * - Partner dashboard interfaces
 * - Profile management systems
 * - Public partner directory displays
 * 
 * INTEGRATION NOTES:
 * - Requires moverId path parameter validation
 * - Fetches only imageSrc field for efficiency
 * - Returns 404 if partner not found or no profile picture
 * - Returns profile picture URL in consistent format
 * - Simple database query with error handling
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const moverId = parseInt((await params).id);
    
    if (isNaN(moverId)) {
      return NextResponse.json(
        { error: 'Invalid mover ID' },
        { status: 400 }
      );
    }

    // Find the moving partner
    const movingPartner = await prisma.movingPartner.findUnique({
      where: {
        id: moverId,
      },
      select: {
        imageSrc: true
      }
    });

    if (!movingPartner) {
      return NextResponse.json(
        { error: 'Moving partner not found' },
        { status: 404 }
      );
    }

    if (!movingPartner.imageSrc) {
      return NextResponse.json(
        { error: 'No profile picture found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      profilePictureUrl: movingPartner.imageSrc
    });
  } catch (error: any) {
    console.error('Error fetching profile picture:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile picture', details: error.message },
      { status: 500 }
    );
  }
} 
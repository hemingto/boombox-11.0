/**
 * @fileoverview API endpoint to fetch third-party moving partner directory
 * @source boombox-10.0/src/app/api/third-party-moving-partners/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns all third-party moving partners for directory display.
 * Used by customer-facing interface to show external moving partner options.
 * 
 * USED BY (boombox-10.0 files):
 * - ThirdPartyLaborCard components
 * - Moving partner directory pages
 * - Partner recommendation systems
 * - Customer comparison workflows
 * 
 * INTEGRATION NOTES:
 * - Fetches partners with ratings, reviews, and contact links
 * - Includes Google My Business and website links for external referrals
 * - Returns partner images and descriptions for display
 * - No authentication required (public directory endpoint)
 * 
 * @refactor Removed manual Prisma disconnect (handled by connection pooling)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET() {
  try {
    // Fetch fields needed for ThirdPartyLaborCard
    const partners = await prisma.thirdPartyMovingPartner.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        imageSrc: true,
        rating: true,
        reviews: true,
        gmblink: true, // Optional field
        weblink: true, // Optional field
      },
    });

    return NextResponse.json(partners);
  } catch (error) {
    console.error('Error fetching third-party moving partners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
} 
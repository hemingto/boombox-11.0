/**
 * @fileoverview API endpoint to fetch approved drivers for a moving partner
 * @source boombox-10.0/src/app/api/movers/[moverId]/approved-drivers/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns all approved drivers associated with a specific moving partner.
 * Validates partner existence and returns driver details with approval status.
 * 
 * USED BY (boombox-10.0 files):
 * - Moving partner driver management interface
 * - Partner dashboard driver listings
 * - Approved driver verification systems
 * - Driver assignment workflows
 * 
 * INTEGRATION NOTES:
 * - Requires moverId path parameter validation
 * - Validates moving partner existence before query
 * - Filters for approved drivers only (isApproved: true)
 * - Includes complete driver information in response
 * - Returns structured success/error responses
 * 
 * @refactor Fixed parameter extraction to use proper Next.js params
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const moverId = parseInt((await params).id);

        if (!moverId || isNaN(moverId)) {
            return NextResponse.json(
                { success: false, error: 'Mover ID is required' },
                { status: 400 }
            );
        }

        // Check if the mover exists
        const mover = await prisma.movingPartner.findUnique({
            where: { id: moverId }
        });

        if (!mover) {
            return NextResponse.json(
                { success: false, error: 'Mover not found' },
                { status: 404 }
            );
        }

        // Find approved drivers linked to the mover
        const approvedDrivers = await prisma.movingPartnerDriver.findMany({
            where: {
                movingPartnerId: moverId,
                driver: {
                    isApproved: true
                }
            },
            include: {
                driver: true
            }
        });

        return NextResponse.json(
            { success: true, approvedDrivers },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error fetching approved drivers:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch approved drivers' },
            { status: 500 }
        );
    }
} 
/**
 * @fileoverview API endpoint to remove a driver from a moving partner
 * @source boombox-10.0/src/app/api/movers/[moverId]/drivers/[driverId]/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * DELETE endpoint that removes a driver association from a moving partner and deletes the driver.
 * Requires authentication and performs cascading deletion of driver relationship and driver record.
 * 
 * USED BY (boombox-10.0 files):
 * - Moving partner driver management interface
 * - Partner dashboard driver removal
 * - Driver relationship management systems
 * - Admin driver oversight tools
 * 
 * INTEGRATION NOTES:
 * - Requires authentication session validation
 * - Requires moverId and driverId path parameters
 * - First deletes movingPartnerDriver association record
 * - Then deletes the driver record completely
 * - Uses composite key for association deletion
 * 
 * @refactor Uses centralized auth configuration from @/lib/auth/nextAuthConfig
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextAuthConfig";
import { MovingPartnerStatus } from '@prisma/client';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; driverId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const awaitedParams = await params;
        const moverId = parseInt(awaitedParams.id);
        const driverId = parseInt(awaitedParams.driverId);
        
        if (isNaN(moverId) || isNaN(driverId)) {
            return NextResponse.json({ error: 'Invalid mover ID or driver ID' }, { status: 400 });
        }

        // First delete the moving partner driver association
        await prisma.movingPartnerDriver.delete({
            where: {
                movingPartnerId_driverId: {
                    movingPartnerId: moverId,
                    driverId: driverId
                }
            }
        });

        // Then delete the driver record
        await prisma.driver.delete({
            where: {
                id: driverId
            }
        });

        // Check if there are any remaining active, approved drivers
        // If not, update the moving partner status to INACTIVE
        const remainingActiveApprovedDrivers = await prisma.movingPartnerDriver.count({
            where: {
                movingPartnerId: moverId,
                isActive: true,
                driver: {
                    isApproved: true
                }
            }
        });

        if (remainingActiveApprovedDrivers === 0) {
            await prisma.movingPartner.update({
                where: { id: moverId },
                data: { status: MovingPartnerStatus.INACTIVE }
            });
            console.log(`Moving partner ${moverId} status updated to INACTIVE - no remaining active approved drivers`);
        }

        return NextResponse.json({ message: 'Driver removed successfully' });
    } catch (error) {
        console.error('Error removing driver:', error);
        return NextResponse.json(
            { error: 'Failed to remove driver' },
            { status: 500 }
        );
    }
} 
/**
 * @fileoverview Moving partner drivers management API endpoint  
 * @source boombox-10.0/src/app/api/movers/[moverId]/drivers/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 *
 * ROUTE FUNCTIONALITY:
 * GET/PATCH endpoint for moving partner drivers management.
 * GET: Retrieves all drivers associated with a moving partner with their details and status
 * PATCH: Updates driver status (activate/deactivate) for a specific driver under the moving partner
 *
 * USED BY (boombox-10.0 files):
 * - Moving partner driver management interface
 * - Partner dashboard driver list and status management
 * - Driver relationship management systems
 * - Admin driver oversight and management tools
 *
 * INTEGRATION NOTES:
 * - Requires authentication session validation for both GET and PATCH
 * - GET: Returns transformed driver data with isActive status from movingPartnerDriver relation
 * - PATCH: Updates movingPartnerDriver.isActive status using composite key lookup
 * - Uses composite key movingPartnerId_driverId for driver relationship management
 * - Transforms raw prisma data to match expected frontend format
 * - Includes driver approval status and creation timestamp
 *
 * @refactor Added centralized validation schemas and preserved authentication logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextAuthConfig";
import { 
  MovingPartnerDriversListResponseSchema,
  UpdateMovingPartnerDriverStatusRequestSchema,
  UpdateMovingPartnerDriverStatusResponseSchema
} from '@/lib/validations/api.validations';

// GET handler to fetch all drivers for a moving partner
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const partnerIdNum = parseInt(id);
        
        if (isNaN(partnerIdNum)) {
            return NextResponse.json({ error: 'Invalid moving partner ID' }, { status: 400 });
        }

        // Fetch the moving partner and their drivers
        const movingPartnerDrivers = await prisma.movingPartnerDriver.findMany({
            where: { 
                movingPartnerId: partnerIdNum 
            },
            include: {
                driver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true,
                        createdAt: true,
                        isApproved: true
                    }
                }
            }
        });

        // Transform the data to match the expected format
        const drivers = movingPartnerDrivers.map(mpd => ({
            id: mpd.driver.id,
            firstName: mpd.driver.firstName,
            lastName: mpd.driver.lastName,
            email: mpd.driver.email,
            phoneNumber: mpd.driver.phoneNumber,
            isActive: mpd.isActive,
            createdAt: mpd.driver.createdAt.toISOString(),
            isApproved: mpd.driver.isApproved
        }));

        // Validate response against schema
        const validatedResponse = MovingPartnerDriversListResponseSchema.parse(drivers);

        return NextResponse.json(validatedResponse);
    } catch (error) {
        console.error('Error fetching drivers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch drivers' },
            { status: 500 }
        );
    }
}

// PATCH handler to update driver status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const partnerIdNum = parseInt(id);
        const requestData = await request.json();
        
        if (isNaN(partnerIdNum)) {
            return NextResponse.json({ error: 'Invalid moving partner ID' }, { status: 400 });
        }

        // Validate request data against schema
        const validationResult = UpdateMovingPartnerDriverStatusRequestSchema.safeParse(requestData);
        
        if (!validationResult.success) {
            return NextResponse.json(
                { 
                    error: 'Invalid request data',
                    details: validationResult.error.issues 
                },
                { status: 400 }
            );
        }

        const { driverId, isActive } = validationResult.data;

        // Update the driver status
        const updatedDriver = await prisma.movingPartnerDriver.update({
            where: {
                movingPartnerId_driverId: {
                    movingPartnerId: partnerIdNum,
                    driverId: driverId
                }
            },
            data: {
                isActive
            },
            include: {
                driver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true,
                        createdAt: true
                    }
                }
            }
        });

        const responseData = {
            id: updatedDriver.driver.id,
            firstName: updatedDriver.driver.firstName,
            lastName: updatedDriver.driver.lastName,
            email: updatedDriver.driver.email,
            phoneNumber: updatedDriver.driver.phoneNumber,
            isActive: updatedDriver.isActive,
            createdAt: updatedDriver.driver.createdAt.toISOString()
        };

        // Validate response against schema
        const validatedResponse = UpdateMovingPartnerDriverStatusResponseSchema.parse(responseData);

        return NextResponse.json(validatedResponse);
    } catch (error) {
        console.error('Error updating driver status:', error);
        return NextResponse.json(
            { error: 'Failed to update driver status' },
            { status: 500 }
        );
    }
}
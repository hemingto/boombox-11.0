/**
 * @fileoverview Driver profile management API route - fetch and update individual driver information
 * @source boombox-10.0/src/app/api/drivers/[driverId]/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that fetches driver information including vehicles and moving partner associations.
 * PATCH endpoint that updates driver information with complex Onfleet team membership synchronization
 * based on driver services (Storage Unit Delivery, Packing Supply Delivery).
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/admin/drivers/DriverDetails.tsx (profile display and editing)
 * - src/app/components/driver/DriverProfile.tsx (driver self-service profile management)
 * - src/app/admin/drivers/page.tsx (admin driver management interface)
 * - src/app/driver-account-page/[driverId]/page.tsx (driver account management)
 *
 * INTEGRATION NOTES:
 * - Critical Onfleet integration - automatically manages team membership based on services
 * - Phone number changes trigger verification reset (verifiedPhoneNumber = false)
 * - Onfleet team synchronization: Storage Unit Delivery → BOOMBOX_DELIVERY_NETWORK_TEAM_ID
 * - Onfleet team synchronization: Packing Supply Delivery → BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS
 * - Database constraint: phone number uniqueness enforced with proper error handling
 * - Graceful degradation: continues with database update if Onfleet sync fails
 *
 * @refactor Moved from /api/drivers/[driverId]/ to /api/drivers/[id]/profile/ structure.
 * Extracted complex Onfleet team management logic to driverUtils.ts for reuse.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { processDriverProfileUpdate } from '@/lib/utils/driverUtils';
import {
  DriverProfileUpdateRequestSchema,
  DriverProfileResponseSchema,
  type DriverProfileUpdateRequest
} from '@/lib/validations/api.validations';

/**
 * GET /api/drivers/[id]/profile
 * Fetch driver information including vehicles and moving partner associations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const driverIdNum = parseInt(id);
    
    if (isNaN(driverIdNum)) {
      return NextResponse.json({ error: 'Invalid driver ID' }, { status: 400 });
    }
    
    // Fetch driver from database with related data
    const driver = await prisma.driver.findUnique({
      where: { id: driverIdNum },
      include: {
        vehicles: true,
        movingPartnerAssociations: {
          where: {
            isActive: true
          },
          include: {
            movingPartner: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Validate response data against schema
    const validatedDriver = DriverProfileResponseSchema.parse(driver);
    
    return NextResponse.json(validatedDriver);
  } catch (error) {
    console.error('Error fetching driver information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver information' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/drivers/[id]/profile  
 * Update driver information with Onfleet team synchronization
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const driverIdNum = parseInt(id);
    
    if (isNaN(driverIdNum)) {
      return NextResponse.json({ error: 'Invalid driver ID' }, { status: 400 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = DriverProfileUpdateRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }
    
    const updateData: DriverProfileUpdateRequest = validationResult.data;
    
    // Process driver profile update with Onfleet team synchronization
    const updatedDriver = await processDriverProfileUpdate(driverIdNum, updateData);
    
    return NextResponse.json(updatedDriver);
  } catch (error: any) {
    // Handle specific database constraint errors
    if (error.code === 'P2002' && error.meta?.target?.includes('phoneNumber')) {
      return NextResponse.json(
        { 
          error: 'Phone number already in use',
          message: 'This phone number is already in use. Please use a different number.' 
        }, 
        { status: 409 }
      );
    } else if (error.message === 'Driver not found') {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    } else {
      console.error('Error updating driver information:', error);
      return NextResponse.json(
        { error: 'Failed to update driver information' },
        { status: 500 }
      );
    }
  }
} 
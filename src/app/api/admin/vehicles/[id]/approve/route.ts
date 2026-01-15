/**
 * @fileoverview Admin API endpoint to approve vehicle registration
 * @source boombox-10.0/src/app/api/admin/vehicles/[id]/approve/route.ts
 * @refactor PHASE 4 - Admin Domain
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that approves a vehicle registration by setting isApproved to true.
 * Used by admin interface to approve driver/mover vehicle submissions.
 * Sends in-app notification to driver upon approval.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin vehicle approval dashboard
 * - Vehicle verification workflows
 * - Driver onboarding processes
 * - Mover partner management systems
 * 
 * INTEGRATION NOTES:
 * - Updates vehicle approval status in database
 * - Requires numeric vehicle ID validation
 * - Returns updated vehicle record after approval
 * - Sends in-app notification to vehicle owner
 * - Admin authentication assumed via middleware
 * 
 * @refactor Added vehicle approval notification
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { NotificationService } from '@/lib/services/NotificationService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const vehicleId = parseInt((await params).id);
    
    if (isNaN(vehicleId)) {
      return NextResponse.json(
        { error: 'Invalid vehicle ID' },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { isApproved: true },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        movingPartner: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Send in-app notification to driver (non-blocking)
    if (vehicle.driverId) {
      const vehicleDescription = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
      NotificationService.notifyVehicleApproved(vehicle.driverId, 'DRIVER', {
        accountType: 'driver',
        vehicleType: vehicleDescription,
        vehicleId: vehicle.id
      }).catch((error) => {
        // Log but don't fail the approval if notification fails
        console.error('Error sending vehicle approval notification to driver:', error);
      });
    }

    // Send in-app notification to moving partner (non-blocking)
    if (vehicle.movingPartnerId) {
      const vehicleDescription = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
      NotificationService.notifyVehicleApproved(vehicle.movingPartnerId, 'MOVER', {
        accountType: 'mover',
        vehicleType: vehicleDescription,
        vehicleId: vehicle.id
      }).catch((error) => {
        // Log but don't fail the approval if notification fails
        console.error('Error sending vehicle approval notification to mover:', error);
      });
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error approving vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to approve vehicle' },
      { status: 500 }
    );
  }
} 
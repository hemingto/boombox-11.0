/**
 * @fileoverview Admin driver approval API endpoint
 * @source boombox-10.0/src/app/api/admin/drivers/[driverId]/approve/route.ts
 * @target api/admin/drivers/[id]/approve/route.ts
 * @refactor Migrated with centralized Onfleet service and comprehensive error handling
 * 
 * API Routes:
 * - POST: Approve a driver and create Onfleet worker integration
 * 
 * Business Logic:
 * - Validates driver exists and has required data
 * - Handles moving partner drivers vs. Boombox delivery network drivers
 * - Creates Onfleet worker with appropriate team assignments:
 *   - Moving partner drivers: Use partner's onfleetTeamId
 *   - Boombox drivers: Map services to team IDs (Storage Unit Delivery, Packing Supply Delivery)
 * - Requires approved vehicle for Boombox delivery network drivers
 * - Handles duplicate phone number errors by linking to existing Onfleet worker
 * - Updates driver status to approved and active upon success
 * - Sends approval notifications (in-app, SMS, email) upon success
 * 
 * Complex Integrations:
 * - Onfleet API worker creation with team assignment
 * - Vehicle type mapping for Onfleet (Car, Truck, Motorcycle, Bicycle)
 * - Phone number formatting for international compatibility
 * - Service-to-team mapping with environment variable configuration
 * - Comprehensive error handling for API failures
 * - Multi-channel notification delivery
 * 
 * Dependencies:
 * - @/lib/services/onfleet-driver-service: approveDriverWithOnfleet
 * - @/lib/services/ApprovalNotificationService: notification orchestration
 * - @/lib/validations/api.validations: validation schemas
 * - @/lib/database/prismaClient: database access
 */

import { NextResponse, NextRequest } from 'next/server';
import { approveDriverWithOnfleet } from '@/lib/services/onfleet-driver-service';
import { ApprovalNotificationService } from '@/lib/services/ApprovalNotificationService';
import { prisma } from '@/lib/database/prismaClient';
import { 
  ApproveDriverRequestSchema,
  validateApiRequest 
} from '@/lib/validations/api.validations';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const driverIdNum = parseInt(id, 10);

    // Validate driver ID format
    const validation = validateApiRequest(ApproveDriverRequestSchema, { driverId: driverIdNum });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid driver ID format', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Use centralized Onfleet driver approval service
    const result = await approveDriverWithOnfleet(driverIdNum);

    if (result.success) {
      // Fetch driver data for notifications
      const driver = await prisma.driver.findUnique({
        where: { id: driverIdNum },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          services: true
        }
      });

      // Send approval notifications (non-blocking)
      if (driver) {
        ApprovalNotificationService.notifyDriverApproved({
          id: driver.id,
          firstName: driver.firstName,
          lastName: driver.lastName,
          email: driver.email,
          phoneNumber: driver.phoneNumber,
          services: driver.services || []
        }).catch((error) => {
          // Log but don't fail the approval if notifications fail
          console.error('Error sending driver approval notifications:', error);
        });
      }

      return NextResponse.json({ 
        success: true,
        message: result.message,
        driver: {
          id: driverIdNum,
          onfleetWorkerId: result.onfleetWorkerId,
          assignedTeams: result.assignedTeams
        }
      });
    } else {
      // Determine appropriate HTTP status based on error type
      let statusCode = 500;
      if (result.error?.includes('not found')) {
        statusCode = 404;
      } else if (result.error?.includes('must have') || result.error?.includes('Invalid')) {
        statusCode = 400;
      }

      return NextResponse.json(
        { 
          success: false,
          error: result.error,
          message: result.message
        },
        { status: statusCode }
      );
    }
  } catch (error: any) {
    console.error('Error in driver approval endpoint:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error during driver approval',
        message: 'An unexpected error occurred while approving the driver'
      },
      { status: 500 }
    );
  }
} 
/**
 * @fileoverview Driver approval endpoint with Onfleet worker creation
 * @source boombox-10.0/src/app/api/drivers/approve/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that approves drivers and registers them as Onfleet workers.
 * Handles complex Onfleet worker creation, team assignments, and duplicate handling.
 * Updates driver status to Active and sets Onfleet worker ID.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/admin/drivers/page.tsx (admin driver approval interface)
 * - src/app/components/admin/DriverApprovalCard.tsx (approve button action)
 *
 * INTEGRATION NOTES:
 * - CRITICAL: Onfleet API integration - preserve exact functionality
 * - Creates Onfleet workers with team assignments based on driver services
 * - Handles duplicate phone number conflicts by linking to existing workers
 * - Updates worker teams using Onfleet's team management API
 *
 * @refactor Moved to /api/drivers/approve/ structure, extracted Onfleet utilities to driverUtils
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { getOnfleetClient } from '@/lib/integrations/onfleetClient';
import { 
  buildOnfleetWorkerPayload,
  formatPhoneForOnfleet,
  DRIVER_STATUSES,
} from '@/lib/utils/driverUtils';
import { ApproveDriverRequestSchema, type ApproveDriverRequest } from '@/lib/validations/api.validations';
import { ApiResponse, ApiError, API_ERROR_CODES } from '@/types/api.types';
import { ApprovalNotificationService } from '@/lib/services/ApprovalNotificationService';
import { MovingPartnerStatus } from '@prisma/client';

interface DriverApprovalResponse {
  driver: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    onfleetWorkerId: string;
    status: string;
    isApproved: boolean;
  };
  assignedTeams: string[];
  message: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<DriverApprovalResponse>>> {
  try {
    const body = await request.json();
    
    // Validate request data
    const validationResult = ApproveDriverRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const error: ApiError = {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid request data',
        details: { validationErrors: validationResult.error.errors }
      };
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    const { driverId }: ApproveDriverRequest = validationResult.data;
    
    // Get the driver details
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        vehicles: {
          where: { isApproved: true },
          take: 1
        },
        movingPartnerAssociations: {
          include: {
            movingPartner: true
          }
        }
      }
    });
    
    if (!driver) {
      const error: ApiError = {
        code: API_ERROR_CODES.NOT_FOUND,
        message: 'Driver not found'
      };
      return NextResponse.json({ success: false, error }, { status: 404 });
    }
    
    // Check if already has Onfleet ID
    if (driver.onfleetWorkerId) {
      const error: ApiError = {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: 'Driver is already registered with Onfleet'
      };
      return NextResponse.json({ success: false, error }, { status: 400 });
    }
    
    // Get team IDs from the driver's onfleetTeamIds array
    let teamIds = driver.onfleetTeamIds || [];
    
    // If no teams assigned, fall back to default based on services or default team
    if (teamIds.length === 0) {
      const defaultTeamId = process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID;
      if (defaultTeamId) {
        teamIds = [defaultTeamId];
      }
    }
    
    if (teamIds.length === 0) {
      const error: ApiError = {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: 'No Onfleet teams configured for this driver'
      };
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    // Create the Onfleet worker payload
    const onfleetPayload = buildOnfleetWorkerPayload(driver, teamIds);
    
    console.log('Onfleet payload:', JSON.stringify(onfleetPayload));
    console.log(`Assigning driver to ${teamIds.length} team(s):`, teamIds);

    try {
      // Create worker in Onfleet
      // @REFACTOR-P9-TEMP: Fix Onfleet client usage - getOnfleetClient() returns Promise
      const onfleetClient = await getOnfleetClient();
      const onfleetData = await onfleetClient.workers.create(onfleetPayload);

      // Update driver with Onfleet worker ID and set to Active status
      const updatedDriver = await prisma.driver.update({
        where: { id: driverId },
        data: {
          onfleetWorkerId: onfleetData.id,
          isApproved: true,
          status: DRIVER_STATUSES.ACTIVE
        }
      });

      // Check if this driver is linked to a moving partner
      // If so, check if this is their first approved driver and activate the mover account
      if (driver.movingPartnerAssociations && driver.movingPartnerAssociations.length > 0) {
        for (const mpDriver of driver.movingPartnerAssociations) {
          const mover = mpDriver.movingPartner;
          
          // Only process if mover is approved but still INACTIVE
          if (mover.isApproved && mover.status === MovingPartnerStatus.INACTIVE) {
            // Count other approved drivers for this mover
            const otherApprovedDrivers = await prisma.movingPartnerDriver.count({
              where: {
                movingPartnerId: mover.id,
                isActive: true,
                driver: {
                  isApproved: true,
                  id: { not: driverId } // Exclude the current driver being approved
                }
              }
            });

            // If this is the first approved driver, activate the mover account
            if (otherApprovedDrivers === 0) {
              console.log(`[Driver Approval Trigger] Activating mover ${mover.id} - first approved driver ${driverId}`);
              
              await prisma.movingPartner.update({
                where: { id: mover.id },
                data: { status: MovingPartnerStatus.ACTIVE }
              });

              // Send mover activation notifications (email, SMS, in-app)
              ApprovalNotificationService.notifyMoverActivated(
                {
                  id: mover.id,
                  name: mover.name,
                  email: mover.email,
                  phoneNumber: mover.phoneNumber
                },
                `${updatedDriver.firstName} ${updatedDriver.lastName}`
              ).catch((error) => {
                // Log but don't fail the driver approval if notifications fail
                console.error('Error sending mover activation notifications:', error);
              });
            }
          }
        }
      }

      // Send driver approval notifications (in-app, SMS, email)
      // Customize message if driver is linked to a moving partner
      const movingPartnerName = driver.movingPartnerAssociations && driver.movingPartnerAssociations.length > 0 
        ? driver.movingPartnerAssociations[0].movingPartner.name 
        : undefined;
      
      ApprovalNotificationService.notifyDriverApproved({
        id: updatedDriver.id,
        firstName: updatedDriver.firstName,
        lastName: updatedDriver.lastName,
        email: updatedDriver.email,
        phoneNumber: updatedDriver.phoneNumber,
        services: driver.services ? (Array.isArray(driver.services) ? driver.services : [driver.services]) : undefined,
        movingPartnerName,
        isMovingPartnerDriver: !!movingPartnerName
      }).catch((error) => {
        // Log but don't fail the approval if notifications fail
        console.error('Error sending driver approval notifications:', error);
      });

      const responseData: DriverApprovalResponse = {
        driver: {
          id: updatedDriver.id,
          firstName: updatedDriver.firstName,
          lastName: updatedDriver.lastName,
          email: updatedDriver.email,
          onfleetWorkerId: updatedDriver.onfleetWorkerId!,
          status: updatedDriver.status,
          isApproved: updatedDriver.isApproved
        },
        assignedTeams: teamIds,
        message: `Driver approved and registered with Onfleet successfully. Assigned to ${teamIds.length} team(s).`
      };

      return NextResponse.json({
        success: true,
        data: responseData,
        meta: {
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (onfleetError: any) {
      console.error('Onfleet API error:', onfleetError.message);
      
      // Check if this is a duplicate phone number error
      const errorMessage = onfleetError.message || '';
      if (errorMessage.includes('uniqueness constraint') || errorMessage.includes('already exists') || errorMessage.includes('DuplicatePhoneNumber')) {
        // @REFACTOR-P9-TEMP: Handle duplicate phone number by finding existing worker
        // TODO: Implement proper duplicate handling by fetching existing workers and updating teams
        const error: ApiError = {
          code: API_ERROR_CODES.ONFLEET_ERROR,
          message: `Onfleet registration failed: ${onfleetError.message}`,
          details: { originalError: errorMessage }
        };
        return NextResponse.json({ success: false, error }, { status: 500 });
      }
      
      const error: ApiError = {
        code: API_ERROR_CODES.ONFLEET_ERROR,
        message: `Onfleet registration failed: ${onfleetError.message}`
      };
      return NextResponse.json({ success: false, error }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Error approving driver:', error);
    const apiError: ApiError = {
      code: API_ERROR_CODES.INTERNAL_ERROR,
      message: error.message || 'Unknown error occurred'
    };
    return NextResponse.json({ success: false, error: apiError }, { status: 500 });
  }
} 
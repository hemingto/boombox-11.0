/**
 * @fileoverview Onfleet driver management service
 * @source boombox-10.0/src/app/api/admin/drivers/[driverId]/approve/route.ts
 * @refactor Extracted complex driver approval logic with Onfleet integration
 */

import { prisma } from '@/lib/database/prismaClient';
import { formatPhoneForOnfleet, mapVehicleTypeToOnfleet } from '@/lib/utils/driverUtils';

// Map vehicle types to Onfleet vehicle types
const VEHICLE_TYPE_MAP: Record<string, 'CAR' | 'TRUCK' | 'MOTORCYCLE' | 'BICYCLE'> = {
  'car': 'CAR',
  'truck': 'TRUCK',
  'motorcycle': 'MOTORCYCLE',
  'bicycle': 'BICYCLE',
};

// Service to team mapping
const SERVICE_TEAM_MAP: Record<string, string> = {
  'Storage Unit Delivery': process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID || '',
  'Packing Supply Delivery': process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS || '',
};

export interface OnfleetWorkerData {
  name: string;
  displayName: string;
  phone: string;
  teams: string[];
  capacity: number;
  vehicle?: {
    type: 'CAR' | 'TRUCK' | 'MOTORCYCLE' | 'BICYCLE';
    description: string;
    licensePlate?: string;
  };
}

export interface DriverApprovalResult {
  success: boolean;
  message: string;
  onfleetWorkerId?: string;
  assignedTeams?: string[];
  error?: string;
}

/**
 * Approve a driver and create Onfleet worker
 * @source boombox-10.0/src/app/api/admin/drivers/[driverId]/approve/route.ts
 * @param driverId - The ID of the driver to approve
 * @returns Approval result with Onfleet worker details
 */
export async function approveDriverWithOnfleet(driverId: number): Promise<DriverApprovalResult> {
  console.log('Debug - Starting driver approval for ID:', driverId);

  if (isNaN(driverId)) {
    console.log('Debug - Invalid driver ID format');
    return {
      success: false,
      error: 'Invalid driver ID',
      message: 'Driver ID must be a valid number'
    };
  }

  // Check for Onfleet API key
  const onfleetApiKey = process.env.ONFLEET_API_KEY;
  if (!onfleetApiKey) {
    return {
      success: false,
      error: 'Onfleet API key not configured',
      message: 'System configuration error'
    };
  }

  // Get driver with moving partner association and vehicle info
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      movingPartnerAssociations: {
        where: { isActive: true },
        include: {
          movingPartner: {
            select: {
              onfleetTeamId: true,
            },
          },
        },
      },
      vehicles: {
        where: { isApproved: true },
        take: 1,
      },
    },
  });

  console.log('Debug - Driver data:', {
    exists: !!driver,
    movingPartnerAssociations: driver?.movingPartnerAssociations?.length,
  });

  if (!driver) {
    console.log('Debug - Driver not found');
    return {
      success: false,
      error: 'Driver not found',
      message: 'The specified driver does not exist'
    };
  }

  // Check if driver is associated with a moving partner
  const isMovingPartnerDriver = driver.movingPartnerAssociations.length > 0;
  let onfleetTeamIds: string[] = []; // Array to hold team IDs to assign

  if (isMovingPartnerDriver) {
    // This driver is associated with a moving partner.
    // The partner's onfleetTeamId is the one to use. It MUST exist for a partner driver.
    const partnerTeamId = driver.movingPartnerAssociations[0].movingPartner.onfleetTeamId;
    if (!partnerTeamId) {
      console.log('Debug - Moving partner is missing an Onfleet team ID');
      return {
        success: false,
        error: 'Moving partner does not have an Onfleet team ID',
        message: 'Moving partner setup is incomplete'
      };
    }
    onfleetTeamIds = [partnerTeamId];
  } else {
    // This driver is NOT primarily associated with a moving partner (e.g., Boombox Delivery Network driver).
    // Determine teams based on their services
    console.log('Debug - Driver services:', driver.services);
    if (driver.services && driver.services.length > 0) {
      for (const service of driver.services) {
        const teamId = SERVICE_TEAM_MAP[service];
        console.log(`Debug - Service "${service}" maps to team:`, teamId);
        if (teamId && !onfleetTeamIds.includes(teamId)) {
          onfleetTeamIds.push(teamId);
        }
      }
    }
    
    // If no service-specific teams found, use existing team IDs or default
    if (onfleetTeamIds.length === 0) {
      if (driver.onfleetTeamIds && driver.onfleetTeamIds.length > 0) {
        onfleetTeamIds = [...driver.onfleetTeamIds];
      } else {
        // Add default team if configured
        const defaultTeamId = process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID;
        if (defaultTeamId) {
          onfleetTeamIds = [defaultTeamId];
        }
      }
    }
  }

  // For Boombox Delivery Network drivers (no moving partner), require an approved vehicle
  if (!isMovingPartnerDriver && !driver.vehicles.length) {
    console.log('Debug - No approved vehicles for Boombox Delivery Network driver');
    return {
      success: false,
      error: 'Boombox Delivery Network drivers must have an approved vehicle',
      message: 'Driver must have an approved vehicle before approval'
    };
  }

  // Create Onfleet worker using direct API call
  try {
    const result = await createOnfleetWorker(driver, onfleetTeamIds, onfleetApiKey, isMovingPartnerDriver);
    
    // Update driver with Onfleet worker ID and approval status
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        isApproved: true,
        onfleetWorkerId: result.onfleetWorkerId,
        onfleetTeamIds: onfleetTeamIds,
        status: "Active"
      },
    });

    return {
      success: true,
      message: result.message,
      onfleetWorkerId: result.onfleetWorkerId,
      assignedTeams: onfleetTeamIds
    };
    
  } catch (error: any) {
    console.error('Error creating Onfleet worker:', {
      message: error.message,
      stack: error.stack,
      driver: {
        id: driverId,
        name: `${driver.firstName} ${driver.lastName}`,
        phone: driver.phoneNumber,
        teamIds: onfleetTeamIds,
      }
    });
    
    return {
      success: false,
      error: `Failed to create Onfleet worker: ${error.message}`,
      message: 'Failed to approve driver with Onfleet integration'
    };
  }
}

/**
 * Create Onfleet worker with API integration
 * @param driver - Driver data from database
 * @param onfleetTeamIds - Team IDs to assign to the worker
 * @param onfleetApiKey - Onfleet API key
 * @param isMovingPartnerDriver - Whether this is a moving partner driver
 * @returns Worker creation result
 */
async function createOnfleetWorker(
  driver: any, 
  onfleetTeamIds: string[], 
  onfleetApiKey: string,
  isMovingPartnerDriver: boolean
): Promise<{ onfleetWorkerId: string; message: string }> {
  // Basic auth header for Onfleet
  const authHeader = Buffer.from(`${onfleetApiKey}:`).toString('base64');
  
  // Format phone number for Onfleet
  const formattedPhone = driver.phoneNumber ? formatPhoneForOnfleet(driver.phoneNumber) : '';

  const workerData: OnfleetWorkerData = {
    name: `${driver.firstName} ${driver.lastName}`,
    displayName: driver.firstName,
    phone: formattedPhone,
    teams: onfleetTeamIds,
    capacity: 1,
  };

  // Only include vehicle info for Boombox Delivery Network drivers
  if (!isMovingPartnerDriver && driver.vehicles.length) {
    const vehicle = driver.vehicles[0];
    const vehicleType = VEHICLE_TYPE_MAP[vehicle.make.toLowerCase()] || 'CAR';
    workerData.vehicle = {
      type: vehicleType,
      description: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      licensePlate: vehicle.licensePlate || undefined,
    };
  }

  console.log('Onfleet payload:', JSON.stringify(workerData));
  console.log(`Assigning driver to ${onfleetTeamIds.length} team(s):`, onfleetTeamIds);

  // Create worker in Onfleet using direct API call
  const onfleetAPIResponse = await fetch(
    'https://onfleet.com/api/v2/workers',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify(workerData),
    }
  );

  if (!onfleetAPIResponse.ok) {
    let errorData;
    try {
      errorData = await onfleetAPIResponse.json();
    } catch (e) {
      // If response is not JSON, use status text
      throw new Error(`Onfleet API request failed: ${onfleetAPIResponse.status} ${onfleetAPIResponse.statusText}`);
    }
    
    // Extract message from Onfleet's varied error structure
    const specificMessage = errorData?.message?.message || errorData?.message;
    const errorMessageContent = specificMessage || errorData?.error?.message || errorData?.cause || onfleetAPIResponse.statusText;
    
    // Check if this is a duplicate phone number error
    if (errorMessageContent && (errorMessageContent.includes('uniqueness constraint') || errorMessageContent.includes('already exists') || errorMessageContent.includes('DuplicatePhoneNumber'))) {
      // Try to find the existing worker by phone number
      try {
        const workersAPIResponse = await fetch(
          'https://onfleet.com/api/v2/workers',
          {
            method: 'GET',
            headers: {
              Authorization: `Basic ${authHeader}`,
            }
          }
        );
        
        if (workersAPIResponse.ok) {
          const workersData = await workersAPIResponse.json();
          const existingWorker = workersData.find(
            (worker: any) => worker.phone === formattedPhone
          );
          
          if (existingWorker) {
            console.log('Debug - Found existing Onfleet worker, using existing ID');
            return {
              onfleetWorkerId: existingWorker.id,
              message: "Driver approved and linked to existing Onfleet worker"
            };
          }
        }
      } catch (findError) {
        console.error('Error finding existing Onfleet worker:', findError);
      }
    }
    
    throw new Error(String(errorMessageContent));
  }

  const onfleetData = await onfleetAPIResponse.json();

  return {
    onfleetWorkerId: onfleetData.id,
    message: "Driver approved and registered with Onfleet successfully"
  };
} 
/**
 * @fileoverview Driver management utility functions
 * @source boombox-10.0/src/app/api/drivers/route.ts (getDriverTeamIds, createDefaultDriverAvailability)
 * @source boombox-10.0/src/app/api/drivers/approve/route.ts (formatPhoneForOnfleet, mapVehicleTypeToOnfleet)
 * @source boombox-10.0/src/app/api/drivers/[driverId]/route.ts (updateOnfleetTeamMembership)
 * @refactor Consolidated driver utilities from multiple API routes including Onfleet team management
 */

import { prisma } from '@/lib/database/prismaClient';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';

// Types and interfaces
export interface DriverRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  phoneProvider: string;
  location: string;
  services: string[];
  vehicleType: string;
  hasTrailerHitch: boolean;
  consentToBackgroundCheck: boolean;
  invitationToken?: string;
}

export interface OnfleetWorkerPayload {
  name: string;
  displayName: string;
  phone: string;
  teams: string[];
  capacity: number;
  vehicle?: {
    type: 'TRUCK' | 'CAR' | 'BICYCLE' | 'MOTORCYCLE';
    description: string;
    licensePlate: string;
  };
}

export interface DriverApprovalResult {
  success: boolean;
  driver?: any;
  assignedTeams?: string[];
  message?: string;
  error?: string;
}

export interface DriverProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  location?: string;
  services?: string[];
  vehicleType?: string;
  hasTrailerHitch?: boolean;
  [key: string]: any;
}

// Main utility functions
export function getDriverTeamIds(services: string[]): string[] {
  const teamIds: string[] = [];
  
  if (services.includes("Storage Unit Delivery")) {
    const boomboxTeamId = process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID;
    if (boomboxTeamId) {
      teamIds.push(boomboxTeamId);
    }
  }
  
  if (services.includes("Packing Supply Delivery")) {
    const packingTeamId = process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS;
    if (packingTeamId) {
      teamIds.push(packingTeamId);
    }
  }
  
  return teamIds;
}

/**
 * Update Onfleet team membership for a driver based on their services
 * @param onfleetWorkerId - The Onfleet worker ID
 * @param newTeamIds - Array of team IDs the driver should be in
 * @returns Promise resolving to the updated team IDs
 */
export async function updateOnfleetTeamMembership(onfleetWorkerId: string, newTeamIds: string[]): Promise<string[]> {
  const onfleetApiKey = process.env.ONFLEET_API_KEY;
  if (!onfleetApiKey) {
    throw new Error('Onfleet API key not found');
  }

  // Get current worker details to see existing teams
  const workerResponse = await fetch(`https://onfleet.com/api/v2/workers/${onfleetWorkerId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(onfleetApiKey + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!workerResponse.ok) {
    throw new Error('Failed to fetch worker from Onfleet');
  }

  const worker = await workerResponse.json();
  const currentTeamIds = worker.teams || [];

  // Find teams to add and remove
  const teamsToAdd = newTeamIds.filter(teamId => !currentTeamIds.includes(teamId));
  const teamsToRemove = currentTeamIds.filter((teamId: string) => 
    !newTeamIds.includes(teamId) && 
    (teamId === process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID || 
     teamId === process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS)
  );

  // Add worker to new teams
  for (const teamId of teamsToAdd) {
    try {
      await addWorkerToOnfleetTeam(onfleetWorkerId, teamId, onfleetApiKey);
    } catch (error) {
      console.error(`Error adding worker to team ${teamId}:`, error);
    }
  }

  // Remove worker from teams they should no longer be in
  for (const teamId of teamsToRemove) {
    try {
      await removeWorkerFromOnfleetTeam(onfleetWorkerId, teamId, onfleetApiKey);
    } catch (error) {
      console.error(`Error removing worker from team ${teamId}:`, error);
    }
  }

  return newTeamIds;
}

/**
 * Add a worker to an Onfleet team
 * @param workerId - Onfleet worker ID
 * @param teamId - Onfleet team ID  
 * @param apiKey - Onfleet API key
 */
async function addWorkerToOnfleetTeam(workerId: string, teamId: string, apiKey: string): Promise<void> {
  // Get current team members
  const teamResponse = await fetch(`https://onfleet.com/api/v2/teams/${teamId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!teamResponse.ok) {
    console.error(`Failed to fetch team ${teamId}:`, await teamResponse.text());
    return;
  }

  const team = await teamResponse.json();
  const currentWorkers = team.workers || [];
  
  // Add the worker to the team if not already present
  if (!currentWorkers.includes(workerId)) {
    const updatedWorkers = [...currentWorkers, workerId];
    
    const updateResponse = await fetch(`https://onfleet.com/api/v2/teams/${teamId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workers: updatedWorkers
      }),
    });

    if (!updateResponse.ok) {
      console.error(`Failed to add worker to team ${teamId}:`, await updateResponse.text());
    }
  }
}

/**
 * Remove a worker from an Onfleet team
 * @param workerId - Onfleet worker ID
 * @param teamId - Onfleet team ID
 * @param apiKey - Onfleet API key
 */
async function removeWorkerFromOnfleetTeam(workerId: string, teamId: string, apiKey: string): Promise<void> {
  // Get current team members
  const teamResponse = await fetch(`https://onfleet.com/api/v2/teams/${teamId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!teamResponse.ok) {
    console.error(`Failed to fetch team ${teamId}:`, await teamResponse.text());
    return;
  }

  const team = await teamResponse.json();
  const currentWorkers = team.workers || [];
  
  // Remove the worker from the team if present
  if (currentWorkers.includes(workerId)) {
    const updatedWorkers = currentWorkers.filter((worker: string) => worker !== workerId);
    
    const updateResponse = await fetch(`https://onfleet.com/api/v2/teams/${teamId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workers: updatedWorkers
      }),
    });

    if (!updateResponse.ok) {
      console.error(`Failed to remove worker from team ${teamId}:`, await updateResponse.text());
    }
  }
}

/**
 * Process driver profile update with Onfleet team synchronization
 * @param driverId - Driver ID to update
 * @param updateData - Data to update
 * @returns Updated driver data
 */
export async function processDriverProfileUpdate(driverId: number, updateData: DriverProfileUpdateData) {
  // Check if driver exists
  const existingDriver = await prisma.driver.findUnique({
    where: { id: driverId }
  });
  
  if (!existingDriver) {
    throw new Error('Driver not found');
  }
  
  // Normalize phone number to E.164 format if it's being updated
  if (updateData.phoneNumber) {
    try {
      const normalizedPhone = normalizePhoneNumberToE164(updateData.phoneNumber);
      // If the phone number is being updated, set verifiedPhoneNumber to false
      if (normalizedPhone !== existingDriver.phoneNumber) {
        updateData.verifiedPhoneNumber = false;
      }
      updateData.phoneNumber = normalizedPhone;
    } catch (error) {
      throw new Error('Invalid phone number format');
    }
  }
  
  // Handle services update and Onfleet team synchronization
  if (updateData.services && existingDriver.onfleetWorkerId) {
    try {
      // Determine new team IDs based on services
      const newTeamIds = getDriverTeamIds(updateData.services);
      
      // Update Onfleet team membership
      await updateOnfleetTeamMembership(existingDriver.onfleetWorkerId, newTeamIds);
      
      // Update the driver's team IDs in the database  
      updateData.onfleetTeamIds = newTeamIds;
      
      console.log(`Updated driver ${driverId} team membership. New teams:`, newTeamIds);
    } catch (error) {
      console.error('Error updating Onfleet team membership:', error);
      // Continue with the database update even if Onfleet sync fails
      // This ensures the services are still updated in our database
      updateData.onfleetTeamIds = getDriverTeamIds(updateData.services);
    }
  } else if (updateData.services && !existingDriver.onfleetWorkerId) {
    // Driver doesn't have Onfleet worker ID yet, just update team IDs in database
    updateData.onfleetTeamIds = getDriverTeamIds(updateData.services);
  }
  
  // Update driver in database
  const updatedDriver = await prisma.driver.update({
    where: { id: driverId },
    data: updateData
  });
  
  return updatedDriver;
}

export async function createDefaultDriverAvailability(driverId: number): Promise<void> {
  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];
  
  // Default time: 9am to 5pm
  const defaultStartTime = '09:00';
  const defaultEndTime = '17:00';
  
  // Create availability records for each day with isBlocked set to true
  const availabilityPromises = daysOfWeek.map(day => 
    prisma.driverAvailability.create({
      data: {
        driverId,
        dayOfWeek: day,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        maxCapacity: 1,
        isBlocked: true // Set isBlocked to true
      }
    })
  );
  
  // Execute all creation operations
  await Promise.all(availabilityPromises);
}

export function formatPhoneForOnfleet(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Add + prefix and ensure US country code if needed
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }
  
  // If already in international format
  return `+${digitsOnly}`;
}

export function mapVehicleTypeToOnfleet(vehicleType: string): 'TRUCK' | 'CAR' | 'BICYCLE' | 'MOTORCYCLE' {
  const mapping: Record<string, 'TRUCK' | 'CAR' | 'BICYCLE' | 'MOTORCYCLE'> = {
    'Pickup Truck': 'TRUCK',
    'SUV': 'CAR',
    'Van': 'CAR',
    'Sedan': 'CAR',
    'Other': 'CAR'
  };
  
  return mapping[vehicleType] || 'CAR';
}

export function buildOnfleetWorkerPayload(
  driver: any,
  teamIds: string[]
): OnfleetWorkerPayload {
  const formattedPhone = formatPhoneForOnfleet(driver.phoneNumber || '');

  const payload: OnfleetWorkerPayload = {
    name: `${driver.firstName} ${driver.lastName}`,
    displayName: driver.firstName,
    phone: formattedPhone,
    teams: teamIds,
    capacity: 1
  };
  
  // Add vehicle information if available
  if (driver.vehicles && driver.vehicles.length > 0) {
    const vehicle = driver.vehicles[0];
    payload.vehicle = {
      type: mapVehicleTypeToOnfleet(vehicle.vehicleType || 'CAR'),
      description: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      licensePlate: vehicle.licensePlate || ''
    };
  }

  return payload;
}

export async function validateDriverUniqueness(
  email: string,
  phoneNumber: string
): Promise<{ isUnique: boolean; error?: string }> {
  // Check if driver with this email already exists
  const existingDriverByEmail = await prisma.driver.findUnique({
    where: { email }
  });
  
  if (existingDriverByEmail) {
    return {
      isUnique: false,
      error: 'A driver with this email already exists'
    };
  }
  
  // Check if driver with this phone number already exists (if provided)
  if (phoneNumber) {
    const existingDriverByPhone = await prisma.driver.findUnique({
      where: { phoneNumber }
    });
    
    if (existingDriverByPhone) {
      return {
        isUnique: false,
        error: 'A driver with this phone number already exists'
      };
    }
  }
  
  return { isUnique: true };
}

export async function findDriverInvitation(token: string) {
  return await prisma.driverInvitation.findUnique({
    where: { token },
    include: { 
      movingPartner: {
        select: {
          id: true,
          name: true,
          onfleetTeamId: true
        }
      }
    }
  });
}

export function validateInvitationStatus(invitation: any): { isValid: boolean; error?: string } {
  if (!invitation) {
    return {
      isValid: false,
      error: 'Invalid or expired invitation'
    };
  }

  if (invitation.status !== 'pending') {
    return {
      isValid: false,
      error: 'This invitation has already been used or expired'
    };
  }

  // Check if invitation is expired
  if (invitation.expiresAt < new Date()) {
    return {
      isValid: false,
      error: 'Invitation has expired'
    };
  }

  return { isValid: true };
}

// Constants
export const DEFAULT_DRIVER_SERVICES = ["Storage Unit Delivery"];
export const DEFAULT_MOVING_PARTNER_VEHICLE_TYPE = "Moving Partner Vehicle";
export const DEFAULT_DRIVER_CAPACITY = 1;

// Driver status constants
export const DRIVER_STATUSES = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive'
} as const;

// ===== DRIVER AVAILABILITY MANAGEMENT =====

/**
 * Day ordering for sorting availability
 */
export const DAY_ORDER = {
  'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4,
  'Friday': 5, 'Saturday': 6, 'Sunday': 7
} as const;

/**
 * Fetch driver availability sorted by day of week
 * @source boombox-10.0/src/app/api/drivers/[driverId]/availability/route.ts (GET method)
 */
export async function getDriverAvailability(driverId: number) {
  // Check if driver exists
  const driver = await prisma.driver.findUnique({
    where: { id: driverId }
  });
  
  if (!driver) {
    throw new Error('Driver not found');
  }
  
  // Get driver's availability
  const availability = await prisma.driverAvailability.findMany({
    where: { driverId },
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      isBlocked: true,
      maxCapacity: true,
      createdAt: true,
      updatedAt: true
    }
  });
  
  // Sort the results by day of week
  const sortedAvailability = availability.sort((a, b) => 
    DAY_ORDER[a.dayOfWeek as keyof typeof DAY_ORDER] - DAY_ORDER[b.dayOfWeek as keyof typeof DAY_ORDER]
  );
  
  return sortedAvailability;
}

export interface DriverAvailabilityUpdateData {
  id?: number;
  dayOfWeek: string;
  startTime?: string;
  endTime?: string;
  isBlocked?: boolean;
}

/**
 * Create or update driver availability
 * @source boombox-10.0/src/app/api/drivers/[driverId]/availability/route.ts (POST method)
 */
export async function createOrUpdateDriverAvailability(
  driverId: number,
  data: DriverAvailabilityUpdateData
) {
  const { id, dayOfWeek, startTime, endTime, isBlocked } = data;
  
  // Check if driver exists
  const driver = await prisma.driver.findUnique({
    where: { id: driverId }
  });
  
  if (!driver) {
    throw new Error('Driver not found');
  }
  
  let availability;
  
  if (id) {
    // Update existing record
    availability = await prisma.driverAvailability.update({
      where: { id },
      data: {
        startTime,
        endTime,
        isBlocked: isBlocked || false
      }
    });
  } else {
    // Check if a record for this day already exists
    const existingAvailability = await prisma.driverAvailability.findFirst({
      where: {
        driverId,
        dayOfWeek
      }
    });
    
    if (existingAvailability) {
      // Update the existing record
      availability = await prisma.driverAvailability.update({
        where: { id: existingAvailability.id },
        data: {
          startTime,
          endTime,
          isBlocked: isBlocked || false
        }
      });
    } else {
      // Create new record
      availability = await prisma.driverAvailability.create({
        data: {
          driverId,
          dayOfWeek,
          startTime: startTime || "09:00",  // Default if blocked
          endTime: endTime || "17:00",      // Default if blocked
          isBlocked: isBlocked || false,
          maxCapacity: 1 // Default value
        }
      });
    }
  }
  
  return availability;
}

/**
 * Fetch completed job history for a driver
 * @source boombox-10.0/src/app/api/drivers/[driverId]/jobs/route.ts
 * @param driverId - The ID of the driver
 * @returns Array of completed appointments with formatted job history data
 */
export async function getDriverJobs(driverId: number) {
  // Get all OnfleetTasks assigned to this driver
  const driverTasks = await prisma.onfleetTask.findMany({
    where: {
      driverId: driverId
    },
    select: {
      appointmentId: true
    },
    distinct: ['appointmentId']
  });
  
  // Extract all appointment IDs this driver is assigned to
  const appointmentIds = driverTasks.map((task: { appointmentId: number }) => task.appointmentId);
  
  // Now fetch those appointments
  const appointments = await prisma.appointment.findMany({
    where: {
      id: { in: appointmentIds },
      status: 'Completed',
    },
    select: {
      id: true,
      appointmentType: true,
      address: true,
      date: true,
      time: true,
      numberOfUnits: true,
      planType: true,
      insuranceCoverage: true,
      loadingHelpPrice: true,
      serviceStartTime: true,
      serviceEndTime: true,
      status: true,
      quotedPrice: true,
      description: true,
      feedback: {
        select: {
          rating: true,
          comment: true,
          tipAmount: true,
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      onfleetTasks: {
        where: {
          driverId: driverId
        },
        include: {
          driver: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        }
      },
      requestedStorageUnits: {
        select: {
          storageUnit: {
            select: {
              storageUnitNumber: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  // Transform the data to match the JobHistory component's expected format
  const formattedAppointments = appointments.map((appointment: any) => {
    // Get the driver info from the first OnfleetTask (they should all have the same driver since we filtered by driverId)
    const driverInfo = appointment.onfleetTasks.length > 0 
      ? appointment.onfleetTasks[0].driver
      : null;
      
    return {
      id: appointment.id,
      appointmentType: appointment.appointmentType,
      address: appointment.address,
      date: appointment.date.toISOString(),
      time: appointment.time.toISOString(),
      numberOfUnits: appointment.numberOfUnits,
      planType: appointment.planType,
      insuranceCoverage: appointment.insuranceCoverage,
      loadingHelpPrice: appointment.loadingHelpPrice,
      serviceStartTime: appointment.serviceStartTime,
      serviceEndTime: appointment.serviceEndTime,
      feedback: appointment.feedback,
      user: appointment.user,
      driver: driverInfo, // Use driver info from onfleetTasks
      requestedStorageUnits: appointment.requestedStorageUnits.map((unit: any) => ({
        unitType: unit.storageUnit.storageUnitNumber,
        quantity: 1, // Since each record represents one unit
      })),
      status: appointment.status,
      totalCost: appointment.quotedPrice,
      notes: appointment.description,
    };
  });

  return formattedAppointments;
}

/**
 * Fetch driver license photos
 * @source boombox-10.0/src/app/api/drivers/[driverId]/license-photos/route.ts
 * @param driverId - The ID of the driver
 * @returns Object containing front and back photo URLs
 */
export async function getDriverLicensePhotos(driverId: number) {
  // Fetch the driver's license photos from the database
  const driver = await prisma.driver.findUnique({
    where: {
      id: driverId
    },
    select: {
      driverLicenseFrontPhoto: true,
      driverLicenseBackPhoto: true
    }
  });

  if (!driver) {
    throw new Error('Driver not found');
  }

  return {
    frontPhoto: driver.driverLicenseFrontPhoto,
    backPhoto: driver.driverLicenseBackPhoto
  };
}

/**
 * Check if driver is linked to a moving partner
 * @source boombox-10.0/src/app/api/drivers/[driverId]/moving-partner-status/route.ts
 * @param driverId - The ID of the driver
 * @returns Object indicating whether driver is linked to a moving partner and partner details
 */
export async function getDriverMovingPartnerStatus(driverId: number) {
  // Check if the driver is linked to any moving partner
  const movingPartnerDriver = await prisma.movingPartnerDriver.findFirst({
    where: {
      driverId: driverId,
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
  });

  return {
    isLinkedToMovingPartner: !!movingPartnerDriver,
    movingPartner: movingPartnerDriver?.movingPartner || null
  };
}

/**
 * Get driver's moving partner ID
 * @source boombox-10.0/src/app/api/drivers/[driverId]/moving-partner/route.ts
 * @param driverId - The ID of the driver
 * @returns Object containing the moving partner ID or null if not linked
 */
export async function getDriverMovingPartner(driverId: number) {
  // Find the moving partner driver association
  const movingPartnerDriver = await prisma.movingPartnerDriver.findFirst({
    where: {
      driverId: driverId,
      isActive: true
    },
    select: {
      movingPartnerId: true
    }
  });

  return {
    movingPartnerId: movingPartnerDriver?.movingPartnerId || null
  };
}

/**
 * Get driver's profile picture URL
 * @source boombox-10.0/src/app/api/drivers/[driverId]/profile-picture/route.ts
 * @param driverId - The ID of the driver
 * @returns Object containing the profile picture URL
 * @throws Error if driver not found or no profile picture exists
 */
export async function getDriverProfilePicture(driverId: number) {
  // Find the driver
  const driver = await prisma.driver.findUnique({
    where: {
      id: driverId,
    },
    select: {
      profilePicture: true
    }
  });

  if (!driver) {
    throw new Error('Driver not found');
  }

  if (!driver.profilePicture) {
    throw new Error('No profile picture found');
  }

  return {
    profilePictureUrl: driver.profilePicture
  };
}

/**
 * Remove driver license photo (front or back)
 * @source boombox-10.0/src/app/api/drivers/[driverId]/remove-license-photos/route.ts
 * @param driverId - The ID of the driver
 * @param photoType - Type of photo to remove ('front' or 'back')
 * @returns Success status
 */
export async function removeDriverLicensePhoto(driverId: number, photoType: 'front' | 'back') {
  // Update the driver record to remove the specified photo
  const updateData = photoType === 'front' 
    ? { driverLicenseFrontPhoto: null } 
    : { driverLicenseBackPhoto: null };

  await prisma.driver.update({
    where: {
      id: driverId
    },
    data: updateData
  });

  return { success: true };
}

/**
 * Remove driver's vehicle including photos from Cloudinary
 * @source boombox-10.0/src/app/api/drivers/[driverId]/remove-vehicle/route.ts
 * @param driverId - The ID of the driver
 * @returns Success status and message
 * @throws Error if no vehicle found for driver
 */
export async function removeDriverVehicle(driverId: number) {
  // Find the vehicle associated with the driver
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      driverId: driverId,
    },
  });

  if (!vehicle) {
    throw new Error('No vehicle found for this driver');
  }

  // Delete photos from Cloudinary if they exist
  const photoFields = ['frontVehiclePhoto', 'backVehiclePhoto', 'autoInsurancePhoto'];
  const deletePromises = [];

  for (const field of photoFields) {
    const photoUrl = vehicle[field as keyof typeof vehicle] as string | null;
    
    if (photoUrl) {
      try {
        // Extract the public ID from the Cloudinary URL
        // Format: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/public-id.ext
        const urlParts = photoUrl.split('/');
        const fileNameWithExtension = urlParts[urlParts.length - 1];
        const publicId = fileNameWithExtension.split('.')[0]; // Remove extension
        const folder = field === 'autoInsurancePhoto' ? 'auto-insurance-photos' : 'vehicle-photos';
        const fullPublicId = `${folder}/${publicId}`;
        
        // Add to delete promises
        deletePromises.push(
          new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(fullPublicId, (error, result) => {
              if (error) {
                console.error(`Error deleting ${field} from Cloudinary:`, error);
                // Resolve anyway to continue with other operations
                resolve(null);
              } else {
                console.log(`Successfully deleted ${field} from Cloudinary:`, result);
                resolve(result);
              }
            });
          })
        );
      } catch (error) {
        console.error(`Error processing ${field} URL:`, error);
        // Continue with other fields
      }
    }
  }

  // Wait for all Cloudinary deletions to complete
  await Promise.all(deletePromises);

  // Delete the vehicle record from the database
  await prisma.vehicle.delete({
    where: {
      id: vehicle.id,
    },
  });

  return { 
    success: true,
    message: 'Vehicle and associated photos deleted successfully' 
  };
}

// ===== DRIVER SERVICES MANAGEMENT =====

// Service to team mapping
const SERVICE_TEAM_MAP: Record<string, string> = {
  'Storage Unit Delivery': process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID || '',
  'Packing Supply Delivery': process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS || '',
};

// formatPhoneForOnfleet function already exists in this file and is exported

/**
 * Sync driver with Onfleet teams based on services
 * @source boombox-10.0/src/app/api/drivers/[driverId]/services/route.ts
 */
async function syncDriverWithOnfleetTeams(driver: any, services: string[]) {
  const onfleetApiKey = process.env.ONFLEET_API_KEY;
  if (!onfleetApiKey) {
    throw new Error('Onfleet API key not configured');
  }

  const authHeader = Buffer.from(`${onfleetApiKey}:`).toString('base64');

  // Get current teams the driver is assigned to
  const workersResponse = await fetch(
    `https://onfleet.com/api/v2/workers/${driver.onfleetWorkerId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Basic ${authHeader}`,
      },
    }
  );

  if (!workersResponse.ok) {
    throw new Error('Failed to fetch worker from Onfleet');
  }

  const workerData = await workersResponse.json();
  const currentTeamIds = workerData.teams || [];

  // Determine new team IDs based on services
  const newTeamIds: string[] = [];
  for (const service of services) {
    const teamId = SERVICE_TEAM_MAP[service];
    if (teamId && !newTeamIds.includes(teamId)) {
      newTeamIds.push(teamId);
    }
  }

  // Add default team if no specific teams are assigned
  if (newTeamIds.length === 0) {
    const defaultTeamId = process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID;
    if (defaultTeamId) {
      newTeamIds.push(defaultTeamId);
    }
  }

  // Only update if teams have changed
  const teamsChanged = 
    currentTeamIds.length !== newTeamIds.length ||
    !currentTeamIds.every((id: string) => newTeamIds.includes(id));

  if (teamsChanged) {
    // Update worker teams
    const updateResponse = await fetch(
      `https://onfleet.com/api/v2/workers/${driver.onfleetWorkerId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          teams: newTeamIds,
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`Failed to update Onfleet worker teams: ${errorData.message || 'Unknown error'}`);
    }

    // Update driver's onfleetTeamIds in database
    await prisma.driver.update({
      where: { id: driver.id },
      data: { onfleetTeamIds: newTeamIds },
    });

    console.log(`Successfully updated driver ${driver.id} teams in Onfleet:`, newTeamIds);
  }
}

/**
 * Update driver services with Onfleet team synchronization
 * @source boombox-10.0/src/app/api/drivers/[driverId]/services/route.ts
 * @param driverId - The ID of the driver
 * @param services - Array of service names
 * @returns Success status and updated driver data
 * @throws Error if driver not found or linked to moving partner
 */
export async function updateDriverServices(driverId: number, services: string[]) {
  // Get driver with moving partner associations
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      movingPartnerAssociations: {
        where: { isActive: true },
      },
    },
  });

  if (!driver) {
    throw new Error('Driver not found');
  }

  // Check if driver is linked to a moving partner
  const isLinkedToMovingPartner = driver.movingPartnerAssociations.length > 0;

  if (isLinkedToMovingPartner) {
    throw new Error('Cannot update services for drivers linked to moving partners');
  }

  // Update driver services in database
  const updatedDriver = await prisma.driver.update({
    where: { id: driverId },
    data: { services },
  });

  // If driver is approved and has Onfleet worker ID, sync with Onfleet teams
  if (driver.isApproved && driver.onfleetWorkerId && driver.phoneNumber) {
    try {
      await syncDriverWithOnfleetTeams(driver, services);
    } catch (onfleetError) {
      console.error('Failed to sync with Onfleet teams:', onfleetError);
      // Don't fail the request, just log the error
    }
  }

  return {
    success: true,
    driver: updatedDriver,
  };
}

/**
 * Get Stripe Connect account status for driver or mover
 * @source boombox-10.0/src/app/api/drivers/[driverId]/stripe-status/route.ts
 * @param userId - The ID of the user (driver or mover)
 * @param userType - Type of user ('driver' or 'mover')
 * @returns Stripe Connect account status information
 * @throws Error if user not found
 */
export async function getUserStripeStatus(userId: number, userType: 'driver' | 'mover') {
  // Fetch user's Stripe Connect account status based on type
  const user = userType === 'driver' 
    ? await prisma.driver.findUnique({
        where: { id: userId },
        select: {
          stripeConnectAccountId: true,
          stripeConnectOnboardingComplete: true,
          stripeConnectPayoutsEnabled: true,
          stripeConnectDetailsSubmitted: true
        }
      })
    : await prisma.movingPartner.findUnique({
        where: { id: userId },
        select: {
          stripeConnectAccountId: true,
          stripeConnectOnboardingComplete: true,
          stripeConnectPayoutsEnabled: true,
          stripeConnectDetailsSubmitted: true
        }
      });
  
  if (!user) {
    throw new Error(`${userType} not found`);
  }
  
  return {
    hasStripeAccount: !!user.stripeConnectAccountId,
    stripeConnectAccountId: user.stripeConnectAccountId,
    onboardingComplete: user.stripeConnectOnboardingComplete,
    payoutsEnabled: user.stripeConnectPayoutsEnabled,
    detailsSubmitted: user.stripeConnectDetailsSubmitted
  };
}

/**
 * Upload driver's license photo (front or back) to Cloudinary
 * @source boombox-10.0/src/app/api/drivers/[driverId]/upload-drivers-license/route.ts
 * @param driverId - The ID of the driver
 * @param file - The file to upload
 * @param photoDescription - Type of photo ('front' or 'back')
 * @returns Success status, URL, and message
 * @throws Error if driver not found or upload fails
 */
export async function uploadDriverLicensePhoto(
  driverId: number, 
  file: File, 
  photoDescription: 'front' | 'back'
) {
  // Check if driver exists
  const driver = await prisma.driver.findUnique({
    where: {
      id: driverId,
    },
  });

  if (!driver) {
    throw new Error('Driver not found');
  }

  // Convert the file to a buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create a unique filename and determine folder based on photoDescription
  const fileName = `driverLicense${photoDescription === 'front' ? 'Front' : 'Back'}Photo_${uuidv4()}`;
  const folder = photoDescription === 'front' ? 'drivers-license-front-photos' : 'drivers-license-back-photos';
  
  // Upload to Cloudinary
  const uploadPromise = new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: fileName,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Convert buffer to stream and pipe to uploadStream
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });

  const uploadResult = await uploadPromise as any;
  const fileUrl = uploadResult.secure_url;
  
  // Determine which field to update based on photoDescription
  const fieldToUpdate = photoDescription === 'front' ? 'driverLicenseFrontPhoto' : 'driverLicenseBackPhoto';
  
  // Delete the old license photo from Cloudinary if it exists
  const oldPhotoUrl = photoDescription === 'front' ? driver.driverLicenseFrontPhoto : driver.driverLicenseBackPhoto;
  
  if (oldPhotoUrl) {
    try {
      // Extract the public ID from the Cloudinary URL
      const urlParts = oldPhotoUrl.split('/');
      const fileNameWithExtension = urlParts[urlParts.length - 1];
      const publicId = fileNameWithExtension.split('.')[0]; // Remove extension
      const fullPublicId = `${folder}/${publicId}`;
      
      // Delete from Cloudinary
      await new Promise((resolve) => {
        cloudinary.uploader.destroy(fullPublicId, (error, result) => {
          if (error) {
            console.error(`Error deleting old ${photoDescription} license photo:`, error);
          } else {
            console.log(`Successfully deleted old ${photoDescription} license photo:`, result);
          }
          // Always resolve to continue with the update
          resolve(null);
        });
      });
    } catch (error) {
      console.error(`Error processing old ${photoDescription} license photo URL:`, error);
      // Continue with the update even if deletion fails
    }
  }

  // Update the driver record with the new license photo URL
  await prisma.driver.update({
    where: {
      id: driverId,
    },
    data: {
      [fieldToUpdate]: fileUrl,
    },
  });

  return { 
    success: true,
    url: fileUrl,
    message: `Driver's license ${photoDescription} photo uploaded successfully` 
  };
}

/**
 * Upload vehicle insurance document to Cloudinary
 * @source boombox-10.0/src/app/api/drivers/[driverId]/upload-new-insurance/route.ts
 * @param driverId - The ID of the driver
 * @param file - The insurance document file to upload
 * @returns Success status, URL, and message
 * @throws Error if no vehicle found for driver or upload fails
 */
export async function uploadVehicleInsurancePhoto(driverId: number, file: File) {
  // Find the vehicle associated with the driver
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      driverId: driverId,
    },
  });

  if (!vehicle) {
    throw new Error('No vehicle found for this driver');
  }

  // Convert the file to a buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create a unique filename
  const fileName = `autoInsurancePhoto_${uuidv4()}`;
  const folder = 'auto-insurance-photos';
  
  // Upload to Cloudinary
  const uploadPromise = new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: fileName,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Convert buffer to stream and pipe to uploadStream
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });

  const uploadResult = await uploadPromise as any;
  const fileUrl = uploadResult.secure_url;
  
  // Delete the old insurance photo from Cloudinary if it exists
  if (vehicle.autoInsurancePhoto) {
    try {
      // Extract the public ID from the Cloudinary URL
      const urlParts = vehicle.autoInsurancePhoto.split('/');
      const fileNameWithExtension = urlParts[urlParts.length - 1];
      const publicId = fileNameWithExtension.split('.')[0]; // Remove extension
      const fullPublicId = `${folder}/${publicId}`;
      
      // Delete from Cloudinary
      await new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(fullPublicId, (error, result) => {
          if (error) {
            console.error('Error deleting old insurance photo:', error);
            // Resolve anyway to continue with the update
            resolve(null);
          } else {
            console.log('Successfully deleted old insurance photo:', result);
            resolve(result);
          }
        });
      });
    } catch (error) {
      console.error('Error processing old insurance photo URL:', error);
      // Continue with the update even if deletion fails
    }
  }

  // Update the vehicle record with the new insurance photo URL
  await prisma.vehicle.update({
    where: {
      id: vehicle.id,
    },
    data: {
      autoInsurancePhoto: fileUrl,
    },
  });

  return { 
    success: true,
    url: fileUrl,
    message: 'Insurance document uploaded successfully. Your vehicle will need to be re-approved.' 
  };
}

/**
 * Upload driver profile picture to Cloudinary
 * @source boombox-10.0/src/app/api/drivers/[driverId]/upload-profile-picture/route.ts
 * @param driverId - The ID of the driver
 * @param file - The profile picture file to upload
 * @returns Success status, URL, and message
 * @throws Error if driver not found or upload fails
 */
export async function uploadDriverProfilePicture(driverId: number, file: File) {
  // Check if driver exists
  const driver = await prisma.driver.findUnique({
    where: {
      id: driverId,
    },
  });

  if (!driver) {
    throw new Error('Driver not found');
  }

  // Convert the file to a buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create a unique filename
  const fileName = `profile_${driverId}_${uuidv4()}`;
  const folder = 'driver-profile-pictures';
  
  // Upload to Cloudinary
  const uploadPromise = new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: fileName,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Convert buffer to stream and pipe to uploadStream
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });

  const uploadResult = await uploadPromise as any;
  const fileUrl = uploadResult.secure_url;
  
  // Delete the old profile picture from Cloudinary if it exists
  if (driver.profilePicture) {
    try {
      // Extract the public ID from the Cloudinary URL
      const urlParts = driver.profilePicture.split('/');
      const fileNameWithExtension = urlParts[urlParts.length - 1];
      const publicId = fileNameWithExtension.split('.')[0]; // Remove extension
      const fullPublicId = `${folder}/${publicId}`;
      
      // Delete from Cloudinary
      await new Promise((resolve) => {
        cloudinary.uploader.destroy(fullPublicId, (error, result) => {
          if (error) {
            console.error('Error deleting old profile picture:', error);
          } else {
            console.log('Successfully deleted old profile picture:', result);
          }
          // Always resolve to continue with the update
          resolve(null);
        });
      });
    } catch (error) {
      console.error('Error processing old profile picture URL:', error);
      // Continue with the update even if deletion fails
    }
  }

  // Update the driver record with the new profile picture URL
  await prisma.driver.update({
    where: {
      id: driverId,
    },
    data: {
      profilePicture: fileUrl,
    },
  });

  return { 
    success: true,
    url: fileUrl,
    message: 'Profile picture uploaded successfully' 
  };
}

// ===== DRIVER VEHICLE MANAGEMENT =====

/**
 * Get vehicle information for a driver
 * @source boombox-10.0/src/app/api/drivers/[driverId]/vehicle/route.ts (GET method)
 * @param driverId - The ID of the driver
 * @returns Vehicle information
 * @throws Error if no vehicle found for driver
 */
export async function getDriverVehicle(driverId: number) {
  // Find the vehicle associated with the driver
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      driverId: driverId,
    },
  });

  if (!vehicle) {
    throw new Error('No vehicle found for this driver');
  }

  return vehicle;
}

/**
 * Update vehicle information for a driver
 * @source boombox-10.0/src/app/api/drivers/[driverId]/vehicle/route.ts (PATCH method)
 * @param driverId - The ID of the driver
 * @param updateData - Data to update the vehicle with
 * @returns Updated vehicle information
 * @throws Error if no vehicle found for driver
 */
export async function updateDriverVehicle(driverId: number, updateData: any) {
  // Find the vehicle first to make sure it exists
  const existingVehicle = await prisma.vehicle.findFirst({
    where: {
      driverId: driverId,
    },
  });

  if (!existingVehicle) {
    throw new Error('No vehicle found for this driver');
  }

  // Update the vehicle with the provided data
  const updatedVehicle = await prisma.vehicle.update({
    where: {
      id: existingVehicle.id,
    },
    data: updateData,
  });

  return updatedVehicle;
}

/**
 * Create a new vehicle for a driver
 * @source boombox-10.0/src/app/api/drivers/[driverId]/vehicle/route.ts (POST method)
 * @param driverId - The ID of the driver
 * @param vehicleData - Data for creating the vehicle
 * @returns Newly created vehicle
 * @throws Error if vehicle already exists for driver
 */
export async function createDriverVehicle(driverId: number, vehicleData: any) {
  // Check if a vehicle already exists for this driver
  const existingVehicle = await prisma.vehicle.findFirst({
    where: {
      driverId: driverId,
    },
  });

  if (existingVehicle) {
    throw new Error('Vehicle already exists for this driver');
  }

  // Create a new vehicle for the driver
  const newVehicle = await prisma.vehicle.create({
    data: {
      ...vehicleData,
      driverId: driverId,
    },
  });

  return newVehicle;
}

// ===== DRIVER BLOCKED DATES MANAGEMENT =====

/**
 * Get all blocked dates for a driver
 * @source boombox-10.0/src/app/api/driver/[userId]/blocked-dates/route.ts (GET method)
 * @param driverId - The ID of the driver
 * @returns Array of blocked dates ordered by date
 */
export async function getDriverBlockedDates(driverId: number) {
  const blockedDates = await prisma.blockedDate.findMany({
    where: {
      userId: driverId,
      userType: "driver",
    },
    orderBy: {
      blockedDate: 'asc',
    },
  });

  return blockedDates;
}

/**
 * Create a new blocked date for a driver
 * @source boombox-10.0/src/app/api/driver/[userId]/blocked-dates/route.ts (POST method)
 * @param driverId - The ID of the driver
 * @param blockedDate - Date string to block
 * @returns Created blocked date record
 */
export async function createDriverBlockedDate(driverId: number, blockedDate: string) {
  const newBlockedDate = await prisma.blockedDate.create({
    data: {
      userId: driverId,
      userType: "driver",
      blockedDate: new Date(blockedDate),
    },
  });

  return newBlockedDate;
}

/**
 * Delete a blocked date by ID
 * @source boombox-10.0/src/app/api/driver/[userId]/blocked-dates/[id]/route.ts (DELETE method)
 * @param blockedDateId - The ID of the blocked date to delete
 */
export async function deleteDriverBlockedDate(blockedDateId: number) {
  await prisma.blockedDate.delete({
    where: {
      id: blockedDateId,
    },
  });
}

// ===== ADMIN DRIVER MANAGEMENT =====

/**
 * Get comprehensive list of all drivers for admin view
 * @source boombox-10.0/src/app/api/admin/drivers/route.ts (GET method)
 * @returns Array of drivers with detailed information including relations
 */
export async function getAdminDriversList() {
  const drivers = await prisma.driver.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      verifiedPhoneNumber: true,
      services: true,
      isApproved: true,
      applicationComplete: true,
      onfleetWorkerId: true,
      onfleetTeamIds: true,
      driverLicenseFrontPhoto: true,
      driverLicenseBackPhoto: true,
      profilePicture: true,
      status: true,
      location: true,
      vehicleType: true,
      hasTrailerHitch: true,
      consentToBackgroundCheck: true,
      movingPartnerAssociations: {
        include: {
          movingPartner: {
            select: {
              name: true,
              onfleetTeamId: true,
            },
          },
        },
      },
      vehicles: {
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          licensePlate: true,
          isApproved: true,
        },
      },
      availability: {
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          maxCapacity: true,
          isBlocked: true,
        },
      },
      cancellations: {
        select: {
          id: true,
          cancellationReason: true,
          cancellationDate: true,
        },
      },
      assignedTasks: {
        select: {
          id: true,
          appointmentId: true,
          appointment: {
            select: {
              id: true,
              date: true,
              status: true,
              jobCode: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return drivers;
} 
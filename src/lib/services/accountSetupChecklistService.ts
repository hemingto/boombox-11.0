/**
 * @fileoverview Account setup checklist service for service providers
 * @source boombox-10.0/src/app/components/mover-account/accountsetupchecklist.tsx
 * @refactor Extracted checklist business logic and API calls from component
 */

'use server';

import { prisma } from '@/lib/database/prismaClient';

export interface MoverChecklistStatus {
  companyDescription: boolean;
  companyPicture: boolean;
  phoneVerified: boolean;
  hourlyRate: boolean;
  approvedDrivers: boolean;
  approvedVehicles: boolean;
  calendarSet: boolean;
  bankAccountLinked: boolean;
  termsOfServiceReviewed: boolean;
}

export interface DriverChecklistStatus {
  profilePicture: boolean;
  driversLicense: boolean;
  phoneVerified: boolean;
  termsOfServiceReviewed: boolean;
  approvedVehicle?: boolean;
  workSchedule?: boolean;
  bankAccountLinked?: boolean;
}

export type ChecklistStatus = MoverChecklistStatus | DriverChecklistStatus;

export interface ChecklistData {
  checklistStatus: ChecklistStatus;
  isApproved: boolean;
  status?: 'PENDING' | 'APPROVED' | 'ACTIVE';
  hasMovingPartner?: boolean;
  applicationComplete?: boolean;
}

/**
 * Type guard to check if checklist is for a mover
 */
export function isMoverChecklist(
  checklist: ChecklistStatus
): checklist is MoverChecklistStatus {
  return 'companyDescription' in checklist;
}

/**
 * Type guard to check if checklist is for a driver
 */
export function isDriverChecklist(
  checklist: ChecklistStatus
): checklist is DriverChecklistStatus {
  return 'profilePicture' in checklist;
}

/**
 * Fetches and calculates checklist status for a driver
 */
export async function getDriverChecklistStatus(
  driverId: string
): Promise<ChecklistData> {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: parseInt(driverId) },
      include: {
        movingPartner: {
          select: {
            id: true,
            name: true,
          },
        },
        vehicle: true,
        availability: true,
      },
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    // Check if driver has approved vehicle
    const hasApprovedVehicle = driver.vehicle
      ? driver.vehicle.approvalStatus === 'APPROVED'
      : false;

    // Check if work schedule is set
    const hasWorkSchedule =
      driver.availability && driver.availability.length > 0
        ? driver.availability.some(
            (record) =>
              new Date(record.createdAt).getTime() !==
              new Date(record.updatedAt).getTime()
          )
        : false;

    const checklistStatus: DriverChecklistStatus = {
      profilePicture: !!driver.profilePicture,
      driversLicense:
        !!driver.driverLicenseFrontPhoto && !!driver.driverLicenseBackPhoto,
      phoneVerified: !!driver.verifiedPhoneNumber,
      termsOfServiceReviewed: !!driver.agreedToTerms,
      approvedVehicle: hasApprovedVehicle,
      workSchedule: hasWorkSchedule,
      bankAccountLinked: !!driver.stripeAccountId,
    };

    return {
      checklistStatus,
      isApproved: !!driver.isApproved,
      hasMovingPartner: !!driver.movingPartner,
      applicationComplete: !!driver.applicationComplete,
    };
  } catch (error) {
    console.error('Error fetching driver checklist status:', error);
    throw new Error('Failed to fetch driver checklist status');
  }
}

/**
 * Fetches and calculates checklist status for a moving partner
 */
export async function getMoverChecklistStatus(
  moverId: string
): Promise<ChecklistData> {
  try {
    const mover = await prisma.movingPartner.findUnique({
      where: { id: parseInt(moverId) },
      include: {
        approvedDrivers: {
          where: {
            isApproved: true,
          },
        },
        vehicles: {
          where: {
            approvalStatus: 'APPROVED',
          },
        },
        availability: true,
      },
    });

    if (!mover) {
      throw new Error('Moving partner not found');
    }

    // Check if calendar is set (availability has been modified)
    const calendarSet =
      mover.availability && mover.availability.length > 0
        ? mover.availability.some(
            (record) =>
              new Date(record.createdAt).getTime() !==
              new Date(record.updatedAt).getTime()
          )
        : false;

    const checklistStatus: MoverChecklistStatus = {
      companyDescription: !!mover.description,
      companyPicture: !!mover.imageSrc,
      phoneVerified: !!mover.verifiedPhoneNumber,
      hourlyRate: !!mover.hourlyRate,
      approvedDrivers: mover.approvedDrivers.length > 0,
      approvedVehicles: mover.vehicles.length > 0,
      calendarSet,
      bankAccountLinked: !!mover.stripeAccountId,
      termsOfServiceReviewed: !!mover.agreedToTerms,
    };

    // Determine mover status
    let status: 'PENDING' | 'APPROVED' | 'ACTIVE' = 'PENDING';
    if (mover.status === 'ACTIVE') {
      status = 'ACTIVE';
    } else if (mover.isApproved && mover.onfleetTeamId) {
      status = 'APPROVED';
    } else if (
      mover.status === 'INACTIVE' &&
      mover.approvedDrivers.length === 0
    ) {
      status = 'PENDING';
    }

    return {
      checklistStatus,
      isApproved: !!mover.isApproved,
      status,
      applicationComplete: !!mover.applicationComplete,
    };
  } catch (error) {
    console.error('Error fetching mover checklist status:', error);
    throw new Error('Failed to fetch mover checklist status');
  }
}

/**
 * Checks if checklist is complete (all required items checked)
 */
export function isChecklistComplete(
  checklist: ChecklistStatus,
  userType: 'driver' | 'mover',
  isApproved: boolean = false
): boolean {
  if (userType === 'mover' && isMoverChecklist(checklist)) {
    // For movers, check all items except approvedDrivers if not approved
    return Object.entries(checklist).every(([key, value]) => {
      if (key === 'approvedDrivers' && !isApproved) {
        return true; // Skip this check if mover not approved
      }
      return value === true;
    });
  } else if (userType === 'driver' && isDriverChecklist(checklist)) {
    // For drivers, all core items must be true
    return (
      checklist.profilePicture &&
      checklist.driversLicense &&
      checklist.phoneVerified &&
      checklist.termsOfServiceReviewed
    );
  }
  return false;
}


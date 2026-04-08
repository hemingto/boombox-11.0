/**
 * @fileoverview Account setup checklist service for service providers
 * @source boombox-10.0/src/app/components/mover-account/accountsetupchecklist.tsx
 * @refactor Extracted checklist business logic and API calls from component
 */

'use server';

import { prisma } from '@/lib/database/prismaClient';
import { MovingPartnerStatus, HaulingPartnerStatus } from '@prisma/client';
import type {
  MoverChecklistStatus,
  DriverChecklistStatus,
  HaulerChecklistStatus,
  ChecklistStatus,
  ChecklistData,
} from './accountSetupChecklistUtils';

// Re-export types for convenience
export type {
  MoverChecklistStatus,
  DriverChecklistStatus,
  HaulerChecklistStatus,
  ChecklistStatus,
  ChecklistData,
};

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
        movingPartnerAssociations: {
          include: {
            movingPartner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        haulingPartnerAssociations: {
          include: {
            haulingPartner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        vehicles: true,
        availability: true,
      },
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    const hasMovingPartner = driver.movingPartnerAssociations.some(
      assoc => assoc.isActive
    );

    const hasHaulingPartner = driver.haulingPartnerAssociations.some(
      assoc => assoc.isActive
    );

    // Check if driver has approved vehicle
    const hasApprovedVehicle =
      driver.vehicles && driver.vehicles.length > 0
        ? driver.vehicles.some(v => v.isApproved)
        : false;

    // Check if work schedule is set (check if driver has availability records that have been modified)
    const hasWorkSchedule =
      driver.availability && driver.availability.length > 0
        ? driver.availability.some(
            record =>
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
      bankAccountLinked: !!driver.stripeConnectAccountId,
    };

    return {
      checklistStatus,
      isApproved: !!driver.isApproved,
      hasMovingPartner,
      hasHaulingPartner,
      applicationComplete: !!driver.applicationComplete,
      activeMessageShown: !!driver.activeMessageShown,
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
            isActive: true,
          },
          include: {
            driver: {
              select: {
                id: true,
                isApproved: true,
              },
            },
          },
        },
        vehicles: true,
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
            record =>
              record.createdAt &&
              record.updatedAt &&
              new Date(record.createdAt).getTime() !==
                new Date(record.updatedAt).getTime()
          )
        : false;

    // Count approved drivers
    const approvedDriverCount = mover.approvedDrivers.filter(
      assoc => assoc.driver.isApproved
    ).length;

    // Count approved vehicles
    const approvedVehicleCount = mover.vehicles.filter(
      vehicle => vehicle.isApproved
    ).length;

    const checklistStatus: MoverChecklistStatus = {
      companyDescription: !!mover.description,
      companyPicture: !!mover.imageSrc,
      phoneVerified: !!mover.verifiedPhoneNumber,
      hourlyRate: !!mover.hourlyRate,
      approvedDrivers: approvedDriverCount > 0,
      approvedVehicles: approvedVehicleCount > 0,
      calendarSet,
      bankAccountLinked: !!mover.stripeConnectAccountId,
      termsOfServiceReviewed: !!mover.agreedToTerms,
    };

    // Return mover status from database
    // Note: Status transitions are now handled by API routes:
    // - INACTIVE → PENDING: When application completes (application-complete route)
    // - PENDING → APPROVED: When admin approves (admin approve route)
    // - APPROVED → ACTIVE: When approved drivers are added (update-status route)
    const status: 'PENDING' | 'APPROVED' | 'ACTIVE' =
      mover.status === MovingPartnerStatus.ACTIVE
        ? 'ACTIVE'
        : mover.status === MovingPartnerStatus.PENDING
          ? 'PENDING'
          : mover.isApproved && mover.onfleetTeamId
            ? 'APPROVED'
            : 'PENDING';

    return {
      checklistStatus,
      isApproved: !!mover.isApproved,
      status,
      applicationComplete: !!mover.applicationComplete,
      activeMessageShown: !!mover.activeMessageShown,
    };
  } catch (error) {
    console.error('Error fetching mover checklist status:', error);
    throw new Error('Failed to fetch mover checklist status');
  }
}

/**
 * Fetches and calculates checklist status for a hauling partner
 */
export async function getHaulerChecklistStatus(
  haulerId: string
): Promise<ChecklistData> {
  try {
    const hauler = await prisma.haulingPartner.findUnique({
      where: { id: parseInt(haulerId) },
      include: {
        drivers: {
          where: { isActive: true },
          include: {
            driver: {
              select: {
                id: true,
                isApproved: true,
              },
            },
          },
        },
        vehicles: true,
        availability: true,
      },
    });

    if (!hauler) {
      throw new Error('Hauling partner not found');
    }

    const calendarSet =
      hauler.availability && hauler.availability.length > 0
        ? hauler.availability.some(
            record =>
              record.createdAt &&
              record.updatedAt &&
              new Date(record.createdAt).getTime() !==
                new Date(record.updatedAt).getTime()
          )
        : false;

    const approvedDriverCount = hauler.drivers.filter(
      assoc => assoc.driver.isApproved
    ).length;

    const approvedVehicleCount = hauler.vehicles.filter(
      vehicle => vehicle.isApproved
    ).length;

    const checklistStatus: HaulerChecklistStatus = {
      companyPicture: !!hauler.imageSrc,
      phoneVerified: !!hauler.verifiedPhoneNumber,
      usdotNumber: !!hauler.usdotNumber,
      californiaMcpNumber: !!hauler.californiaMcpNumber,
      insuranceAdded: hauler.insuranceDocumentUrls.length > 0,
      routePricing: !!hauler.pricePerBoombox,
      approvedDrivers: approvedDriverCount > 0,
      approvedVehicles: approvedVehicleCount > 0,
      calendarSet,
      bankAccountLinked: !!hauler.stripeConnectAccountId,
      termsOfServiceReviewed: !!hauler.agreedToTerms,
    };

    const status: 'PENDING' | 'APPROVED' | 'ACTIVE' =
      hauler.status === HaulingPartnerStatus.ACTIVE
        ? 'ACTIVE'
        : hauler.status === HaulingPartnerStatus.PENDING
          ? 'PENDING'
          : hauler.isApproved && hauler.onfleetTeamId
            ? 'APPROVED'
            : 'PENDING';

    return {
      checklistStatus,
      isApproved: !!hauler.isApproved,
      status,
      applicationComplete: !!hauler.applicationComplete,
      activeMessageShown: !!hauler.activeMessageShown,
    };
  } catch (error) {
    console.error('Error fetching hauler checklist status:', error);
    throw new Error('Failed to fetch hauler checklist status');
  }
}

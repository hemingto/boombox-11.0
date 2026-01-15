/**
 * @fileoverview Service for managing contact information for service providers
 * @source boombox-10.0/src/app/components/mover-account/contacttable.tsx (API calls and data logic)
 * @refactor Extracted contact info data fetching and update logic into dedicated service
 */

'use server';

import { prisma } from '@/lib/database/prismaClient';
import type { ContactInfo, MovingPartnerStatus } from './contactInfoUtils';

// Re-export types for convenience
export type { ContactInfo, MovingPartnerStatus };

/**
 * Get contact information for a service provider
 */
export async function getContactInfo(
  userId: string,
  userType: 'driver' | 'mover'
): Promise<ContactInfo> {
  if (userType === 'driver') {
    const driver = await prisma.driver.findUnique({
      where: { id: parseInt(userId, 10) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        verifiedPhoneNumber: true,
        services: true,
      },
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    return {
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phoneNumber: driver.phoneNumber,
      verifiedPhoneNumber: driver.verifiedPhoneNumber,
      userId: driver.id.toString(),
      userType: 'driver',
      services: driver.services,
    };
  } else {
    // Mover
    const mover = await prisma.movingPartner.findUnique({
      where: { id: parseInt(userId, 10) },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        verifiedPhoneNumber: true,
        description: true,
        hourlyRate: true,
        website: true,
      },
    });

    if (!mover) {
      throw new Error('Moving partner not found');
    }

    return {
      name: mover.name,
      email: mover.email || '',
      phoneNumber: mover.phoneNumber,
      verifiedPhoneNumber: mover.verifiedPhoneNumber,
      userId: mover.id.toString(),
      userType: 'mover',
      description: mover.description || undefined,
      hourlyRate: mover.hourlyRate || undefined,
      website: mover.website || undefined,
    };
  }
}

/**
 * Get moving partner status for a driver
 */
export async function getMovingPartnerStatus(
  driverId: string
): Promise<MovingPartnerStatus> {
  const driver = await prisma.driver.findUnique({
    where: { id: parseInt(driverId, 10) },
    select: {
      id: true,
      movingPartnerAssociations: {
        where: { isActive: true },
        take: 1,
        select: {
          movingPartner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!driver) {
    throw new Error('Driver not found');
  }

  const activeAssociation = driver.movingPartnerAssociations[0];

  return {
    isLinkedToMovingPartner: !!activeAssociation,
    movingPartner: activeAssociation
      ? {
          id: activeAssociation.movingPartner.id,
          name: activeAssociation.movingPartner.name,
        }
      : null,
  };
}

/**
 * Update contact information field
 */
export async function updateContactInfoField(
  userId: string,
  userType: 'driver' | 'mover',
  field: string,
  value: string | number | string[]
): Promise<ContactInfo> {
  if (userType === 'driver') {
    const updatedDriver = await prisma.driver.update({
      where: { id: parseInt(userId, 10) },
      data: { [field]: value },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        verifiedPhoneNumber: true,
        services: true,
      },
    });

    return {
      firstName: updatedDriver.firstName,
      lastName: updatedDriver.lastName,
      email: updatedDriver.email,
      phoneNumber: updatedDriver.phoneNumber,
      verifiedPhoneNumber: updatedDriver.verifiedPhoneNumber,
      userId: updatedDriver.id.toString(),
      userType: 'driver',
      services: updatedDriver.services,
    };
  } else {
    const updatedMover = await prisma.movingPartner.update({
      where: { id: parseInt(userId, 10) },
      data: { [field]: value },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        verifiedPhoneNumber: true,
        description: true,
        hourlyRate: true,
        website: true,
      },
    });

    return {
      name: updatedMover.name,
      email: updatedMover.email || '',
      phoneNumber: updatedMover.phoneNumber,
      verifiedPhoneNumber: updatedMover.verifiedPhoneNumber,
      userId: updatedMover.id.toString(),
      userType: 'mover',
      description: updatedMover.description || undefined,
      hourlyRate: updatedMover.hourlyRate || undefined,
      website: updatedMover.website || undefined,
    };
  }
}

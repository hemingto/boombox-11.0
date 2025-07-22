/**
 * @fileoverview Storage unit utility functions
 * @source boombox-10.0/src/app/api/storage-units/available-count/route.ts (availability calculation logic)
 * @refactor Extracted storage unit calculations into reusable utilities
 */

import { prisma } from '@/lib/database/prismaClient';

/**
 * Calculate available storage unit count
 * Accounts for empty units minus reserved units for upcoming appointments
 */
export async function calculateAvailableStorageUnits(): Promise<number> {
  try {
    // Get count of empty storage units
    const emptyUnitsCount = await prisma.storageUnit.count({
      where: { status: 'Empty' },
    });

    const now = new Date();
    
    // Get appointments scheduled for today or in the future
    // that are of type 'Initial Pickup' or 'Additional Storage' and have a defined numberOfUnits
    const upcomingReservations = await prisma.appointment.aggregate({
      _sum: {
        numberOfUnits: true,
      },
      where: {
        status: 'Scheduled',
        OR: [
          { appointmentType: 'Initial Pickup' }, 
          { appointmentType: 'Additional Storage' }
        ],
        date: {
          gte: now, // From today onwards
        },
        numberOfUnits: {
          gt: 0, // Only count if numberOfUnits is positive and not null
        },
      },
    });

    const reservedUnitsCount = upcomingReservations._sum.numberOfUnits || 0;
    
    // Available units = (empty units) - (units reserved for future pickups)
    // Ensure the count is not negative
    const availableCount = Math.max(0, emptyUnitsCount - reservedUnitsCount);

    return availableCount;
  } catch (error) {
    console.error('Error calculating available storage units:', error);
    throw new Error('Failed to calculate available storage units');
  }
}

/**
 * Get storage unit availability response
 */
export interface StorageUnitAvailabilityResponse {
  availableCount: number;
}

export async function getStorageUnitAvailability(): Promise<StorageUnitAvailabilityResponse> {
  const availableCount = await calculateAvailableStorageUnits();
  return { availableCount };
} 
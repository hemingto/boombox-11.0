/**
 * @fileoverview Storage unit utility functions
 * @source boombox-10.0/src/app/api/storage-units/available-count/route.ts (availability calculation logic)
 * @source boombox-10.0/src/app/api/admin/storage-units/route.ts (main storage unit operations)
 * @source boombox-10.0/src/app/api/admin/storage-units/batch-upload/route.ts (CSV batch upload)
 * @source boombox-10.0/src/app/api/storage-unit/[id]/upload-photos/route.ts (photo upload)
 * @refactor Extracted storage unit calculations and operations into reusable utilities
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

// ===== STORAGE UNIT ADMIN OPERATIONS =====

/**
 * Storage unit with related data interface
 * @source boombox-10.0/src/app/api/admin/storage-units/route.ts (GET response structure)
 */
export interface StorageUnitWithRelations {
  id: number;
  storageUnitNumber: string;
  barcode?: string | null;
  status: string;
  storageUnitUsages: Array<{
    id: number;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  accessRequests: Array<{
    id: number;
    appointment: {
      id: number;
      user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
      };
    };
  }>;
}

/**
 * Storage unit query parameters
 * @source boombox-10.0/src/app/api/admin/storage-units/route.ts (query params)
 */
export interface StorageUnitQueryParams {
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get storage units with related data
 * @source boombox-10.0/src/app/api/admin/storage-units/route.ts (lines 33-68)
 */
export async function getStorageUnitsWithRelations(params: StorageUnitQueryParams): Promise<StorageUnitWithRelations[]> {
  const { status, sortBy = 'storageUnitNumber', sortOrder = 'asc' } = params;

  // Build where clause
  const where = status ? { status } : {};

  // Fetch storage units with related data
  const storageUnits = await prisma.storageUnit.findMany({
    where,
    include: {
      storageUnitUsages: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      },
      accessRequests: {
        include: {
          appointment: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      [sortBy]: sortOrder
    }
  });

  return storageUnits as StorageUnitWithRelations[];
}

/**
 * Storage unit update request interface
 * @source boombox-10.0/src/app/api/admin/storage-units/route.ts (PATCH body)
 */
export interface StorageUnitUpdateRequest {
  id: number;
  status?: string;
  usageId?: number;
  warehouseLocation?: string;
  warehouseName?: string;
}

/**
 * Update warehouse information for storage unit usage
 * @source boombox-10.0/src/app/api/admin/storage-units/route.ts (lines 108-140)
 */
export async function updateWarehouseInfo(
  usageId: number, 
  warehouseLocation?: string, 
  warehouseName?: string
) {
  const currentUsage = await prisma.storageUnitUsage.findUnique({
    where: { id: usageId },
    include: { storageUnit: true }
  });

  if (!currentUsage) {
    throw new Error('Storage unit usage not found');
  }

  const updatedUsage = await prisma.storageUnitUsage.update({
    where: { id: usageId },
    data: {
      ...(warehouseLocation !== undefined && { warehouseLocation }),
      ...(warehouseName !== undefined && { warehouseName })
    }
  });

  return { updatedUsage, currentUsage };
}

/**
 * Update storage unit status
 * @source boombox-10.0/src/app/api/admin/storage-units/route.ts (lines 143-161)
 */
export async function updateStorageUnitStatus(id: number, status: string) {
  const updatedUnit = await prisma.storageUnit.update({
    where: { id },
    data: { status }
  });

  return updatedUnit;
}

/**
 * Create admin log entry for storage unit operations
 * @source boombox-10.0/src/app/api/admin/storage-units/route.ts (admin logging)
 */
export async function createStorageUnitAdminLog(
  adminId: number,
  action: string,
  targetId: string
) {
  return await prisma.adminLog.create({
    data: {
      adminId,
      action,
      targetType: 'STORAGE_UNIT',
      targetId
    }
  });
}

// ===== BATCH UPLOAD OPERATIONS =====

/**
 * CSV storage unit record interface
 * @source boombox-10.0/src/app/api/admin/storage-units/batch-upload/route.ts (validation schema)
 */
export interface StorageUnitCSVRecord {
  storageUnitNumber: string;
  barcode?: string;
  status: 'Empty' | 'Occupied' | 'Pending Cleaning';
}

/**
 * Batch upload results interface
 * @source boombox-10.0/src/app/api/admin/storage-units/batch-upload/route.ts (response structure)
 */
export interface BatchUploadResults {
  success: string[];
  errors: string[];
}

/**
 * Process a single storage unit record from CSV
 * @source boombox-10.0/src/app/api/admin/storage-units/batch-upload/route.ts (lines 72-105)
 */
export async function processStorageUnitRecord(record: StorageUnitCSVRecord): Promise<string> {
  // Check if storage unit number already exists
  const existingUnit = await prisma.storageUnit.findUnique({
    where: { storageUnitNumber: record.storageUnitNumber }
  });

  if (existingUnit) {
    throw new Error(`Unit ${record.storageUnitNumber} already exists`);
  }

  // Create the storage unit
  await prisma.storageUnit.create({
    data: {
      storageUnitNumber: record.storageUnitNumber,
      barcode: record.barcode || null,
      status: record.status,
    },
  });

  return record.storageUnitNumber;
}

/**
 * Process batch upload of storage units
 * @source boombox-10.0/src/app/api/admin/storage-units/batch-upload/route.ts (lines 66-105)
 */
export async function processBatchUpload(records: StorageUnitCSVRecord[]): Promise<BatchUploadResults> {
  const results: BatchUploadResults = {
    success: [],
    errors: [],
  };

  for (const record of records) {
    try {
      console.log('Processing record:', record);
      const unitNumber = await processStorageUnitRecord(record);
      results.success.push(unitNumber);
    } catch (error) {
      console.error('Error processing record:', record, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`Error processing unit ${record.storageUnitNumber || 'unknown'}: ${errorMessage}`);
    }
  }

  return results;
}

// ===== PHOTO UPLOAD OPERATIONS =====

/**
 * Photo upload result interface
 * @source boombox-10.0/src/app/api/storage-unit/[id]/upload-photos/route.ts (response structure)
 */
export interface PhotoUploadResult {
  uploadedUrls: string[];
  successCount: number;
}

/**
 * Verify storage unit usage exists
 * @source boombox-10.0/src/app/api/storage-unit/[id]/upload-photos/route.ts (lines 25-33)
 */
export async function verifyStorageUnitUsage(usageId: number) {
  const storageUnitUsage = await prisma.storageUnitUsage.findUnique({
    where: { id: usageId },
    include: { storageUnit: true }
  });

  if (!storageUnitUsage) {
    throw new Error('Storage unit usage not found');
  }

  return storageUnitUsage;
}

/**
 * Generate unique filename for storage unit photo
 * @source boombox-10.0/src/app/api/storage-unit/[id]/upload-photos/route.ts (lines 43-45)
 */
export function generateStorageUnitPhotoFilename(storageUnitNumber: string, originalFilename: string): string {
  const timestamp = Date.now();
  return `storage-unit-${storageUnitNumber}-${timestamp}-${originalFilename}`;
}

/**
 * Update storage unit usage with new photo URLs
 * @source boombox-10.0/src/app/api/storage-unit/[id]/upload-photos/route.ts (lines 82-90)
 */
export async function addPhotosToStorageUnitUsage(usageId: number, photoUrls: string[]) {
  return await prisma.storageUnitUsage.update({
    where: { id: usageId },
    data: {
      uploadedImages: {
        push: photoUrls
      }
    }
  });
} 
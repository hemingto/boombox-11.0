/**
 * @fileoverview Service for handling storage unit cleaning tasks and status updates
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (cleaning task display logic)
 * @source boombox-10.0/src/app/api/admin/storage-units/mark-clean/route.ts (cleaning processing logic)
 * 
 * SERVICE FUNCTIONALITY:
 * - Get pending cleaning task details for display
 * - Process storage unit cleaning with photo uploads and status updates
 * - Handle database transactions for cleaning record creation
 * - Manage storage unit status transitions from 'Pending Cleaning' to 'Empty'
 * - Create cleaning audit trails and admin logging
 * 
 * USED BY:
 * - Admin task management interface for storage unit cleaning workflow
 * - Maintenance and cleaning tracking systems
 * - Storage unit status management workflows
 * 
 * @refactor Extracted from monolithic admin tasks route for better organization
 */

import { prisma } from '@/lib/database/prismaClient';
import { 
  markStorageUnitAsClean,
  validateStorageUnitForCleaning
} from '@/lib/utils/adminTaskUtils';

// Pending cleaning task interface
export interface PendingCleaningTask {
  id: string;
  title: 'Pending Cleaning';
  description: string;
  action: 'Mark as Clean';
  color: 'cyan';
  details: string;
  storageUnitNumber: string;
}

// Cleaning request interface
export interface CleaningRequest {
  photos: string[];
}

// Cleaning result interface
export interface CleaningResult {
  success: boolean;
  message: string;
  data?: {
    updatedUnit: any;
    cleaningRecord: any;
    adminLog: any;
  };
  error?: string;
}

export class PendingCleaningService {
  /**
   * Get pending cleaning task details for display
   * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 213-228)
   */
  async getCleaningTask(storageUnitId: number): Promise<PendingCleaningTask | null> {
    try {
      const storageUnit = await prisma.storageUnit.findUnique({
        where: { id: storageUnitId },
        select: {
          id: true,
          storageUnitNumber: true,
          status: true
        }
      });

      if (!storageUnit) {
        return null;
      }

      // Only return task if unit is in Pending Cleaning status
      if (storageUnit.status !== 'Pending Cleaning') {
        return null;
      }

      // Generate task ID in the expected format
      const taskId = `cleaning-${storageUnitId}`;

      return {
        id: taskId,
        title: 'Pending Cleaning',
        description: 'Clean storage unit, touch up paint, and take photo of inside',
        action: 'Mark as Clean',
        color: 'cyan',
        details: `<strong>Boombox Number:</strong> ${storageUnit.storageUnitNumber}`,
        storageUnitNumber: storageUnit.storageUnitNumber
      };
    } catch (error) {
      console.error('Error getting cleaning task:', error);
      return null;
    }
  }

  /**
   * Process storage unit cleaning with photos and status updates
   * @source boombox-10.0/src/app/api/admin/storage-units/mark-clean/route.ts
   */
  async markUnitAsClean(
    storageUnitId: number,
    adminId: number,
    request: CleaningRequest
  ): Promise<CleaningResult> {
    try {
      const { photos } = request;

      // Validate storage unit exists and is in correct status
      const validation = await validateStorageUnitForCleaning(storageUnitId);
      if (!validation.valid) {
        return {
          success: false,
          message: '',
          error: validation.error || 'Validation failed'
        };
      }

      // Execute cleaning with database transaction
      const result = await markStorageUnitAsClean(storageUnitId, adminId, photos);

      return {
        success: true,
        message: 'Storage unit marked as clean successfully',
        data: result
      };

    } catch (error) {
      console.error('Error marking storage unit as clean:', error);
      return {
        success: false,
        message: '',
        error: 'Failed to mark storage unit as clean'
      };
    }
  }

  /**
   * Check if storage unit needs cleaning
   * Used by the task listing service to determine if tasks should be created
   */
  async isCleaningNeeded(storageUnitId: number): Promise<boolean> {
    try {
      const storageUnit = await prisma.storageUnit.findUnique({
        where: { id: storageUnitId },
        select: { status: true }
      });

      return storageUnit?.status === 'Pending Cleaning';
    } catch (error) {
      console.error('Error checking cleaning need:', error);
      return false;
    }
  }

  /**
   * Get all storage units that need cleaning
   * Helper method for task generation
   * @source boombox-10.0/src/app/api/admin/tasks/route.ts (lines 105-114)
   */
  async getAllPendingCleaningUnits() {
    try {
      return await prisma.storageUnit.findMany({
        where: {
          status: 'Pending Cleaning'
        },
        select: {
          id: true,
          storageUnitNumber: true,
          lastUpdated: true
        },
        orderBy: {
          lastUpdated: 'asc' // Oldest first for priority
        }
      });
    } catch (error) {
      console.error('Error getting pending cleaning units:', error);
      return [];
    }
  }

  /**
   * Get cleaning history for a storage unit
   * Helper method for detailed tracking
   */
  async getCleaningHistory(storageUnitId: number) {
    try {
      return await prisma.storageUnitCleaning.findMany({
        where: { storageUnitId },
        include: {
          admin: {
            select: {
              email: true,
              name: true
            }
          }
        },
        orderBy: {
          cleanedAt: 'desc'
        }
      });
    } catch (error) {
      console.error('Error getting cleaning history:', error);
      return [];
    }
  }
}
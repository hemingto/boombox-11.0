/**
 * @fileoverview Service for handling warehouse location updates for storage unit usages
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (update-location task display logic)
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/update-location/route.ts (location update processing logic)
 * 
 * SERVICE FUNCTIONALITY:
 * - Get location update task details for display
 * - Process warehouse location updates for storage unit usages
 * - Handle validation of usage records and location requirements
 * - Manage warehouse inventory tracking and location management
 * - Create location update audit trails and admin logging
 * 
 * USED BY:
 * - Admin task management interface for warehouse location update workflow
 * - Storage unit inventory management and tracking systems
 * - Warehouse operations and location assignment
 * - Inventory auditing and location verification
 * 
 * @refactor Extracted from monolithic admin tasks route for better organization
 */

import { prisma } from '@/lib/database/prismaClient';
import { 
  validateStorageUnitUsageForLocationUpdate,
  updateStorageUnitWarehouseLocation
} from '@/lib/utils/adminTaskUtils';

// Update location task interface
export interface UpdateLocationTask {
  id: string;
  title: 'Update Location';
  description: string;
  action: 'Update';
  color: 'emerald';
  details: string;
  storageUnitNumber: string;
  customerName: string;
  usageId: number;
}

// Location update request interface
export interface LocationUpdateRequest {
  warehouseLocation: string;
}

// Update result interface
export interface LocationUpdateResult {
  success: boolean;
  message: string;
  updatedUsage?: any;
  error?: string;
}

export class UpdateLocationService {
  /**
   * Get location update task details for display
   * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 608-640)
   */
  async getLocationUpdateTask(usageId: number): Promise<UpdateLocationTask | null> {
    try {
      const usage = await prisma.storageUnitUsage.findUnique({
        where: { id: usageId },
        select: {
          id: true,
          warehouseLocation: true,
          storageUnit: {
            select: {
              id: true,
              storageUnitNumber: true
            }
          },
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!usage) {
        return null;
      }

      // Only return task if location needs update
      if (usage.warehouseLocation !== "Pending Update") {
        return null;
      }

      const customerName = `${usage.user?.firstName || ''} ${usage.user?.lastName || ''}`.trim();

      // Generate task ID in the expected format
      const taskId = `update-location-${usageId}`;

      return {
        id: taskId,
        title: 'Update Location',
        description: 'Update warehouse location for storage unit',
        action: 'Update',
        color: 'emerald',
        details: `<strong>Unit Number:</strong> ${usage.storageUnit.storageUnitNumber}`,
        storageUnitNumber: usage.storageUnit.storageUnitNumber,
        customerName: customerName,
        usageId: usage.id
      };
    } catch (error) {
      console.error('Error getting location update task:', error);
      return null;
    }
  }

  /**
   * Process warehouse location update for storage unit usage
   * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/update-location/route.ts
   */
  async updateWarehouseLocation(
    usageId: number,
    adminId: number,
    request: LocationUpdateRequest
  ): Promise<LocationUpdateResult> {
    try {
      const { warehouseLocation } = request;

      if (!warehouseLocation || warehouseLocation.trim() === '') {
        return {
          success: false,
          message: '',
          error: 'Warehouse location is required'
        };
      }

      // Validate usage for location update
      const validation = await validateStorageUnitUsageForLocationUpdate(usageId);
      if (!validation.valid) {
        return {
          success: false,
          message: '',
          error: validation.error || 'Validation failed'
        };
      }

      // Execute warehouse location update with database transaction
      const result = await updateStorageUnitWarehouseLocation(
        usageId,
        warehouseLocation.trim(),
        adminId
      );

      return {
        success: true,
        message: 'Warehouse location updated successfully',
        updatedUsage: result.updatedUsage
      };

    } catch (error) {
      console.error('Error updating warehouse location:', error);
      return {
        success: false,
        message: '',
        error: error instanceof Error ? error.message : 'Failed to update warehouse location'
      };
    }
  }

  /**
   * Check if storage unit usage needs location update
   * Used by the task listing service to determine if tasks should be created
   */
  async needsLocationUpdate(usageId: number): Promise<boolean> {
    try {
      const usage = await prisma.storageUnitUsage.findUnique({
        where: { id: usageId },
        select: { warehouseLocation: true }
      });

      return usage?.warehouseLocation === "Pending Update";
    } catch (error) {
      console.error('Error checking location update need:', error);
      return false;
    }
  }

  /**
   * Get all storage unit usages that need location updates
   * Helper method for task generation
   * @source boombox-10.0/src/app/api/admin/tasks/route.ts (lines 261-279)
   */
  async getAllUsagesNeedingLocationUpdate() {
    try {
      return await prisma.storageUnitUsage.findMany({
        where: {
          warehouseLocation: "Pending Update"
        },
        select: {
          id: true,
          userId: true,
          storageUnit: {
            select: {
              storageUnitNumber: true
            }
          },
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc' // Oldest first for priority
        }
      });
    } catch (error) {
      console.error('Error getting usages needing location update:', error);
      return [];
    }
  }

  /**
   * Get location update history for a storage unit usage
   * Helper method for detailed tracking
   */
  async getLocationUpdateHistory(usageId: number) {
    try {
      const usage = await prisma.storageUnitUsage.findUnique({
        where: { id: usageId },
        select: {
          storageUnit: {
            select: { id: true }
          }
        }
      });

      if (!usage) return [];

      return await prisma.adminLog.findMany({
        where: { 
          targetType: 'STORAGE_UNIT',
          targetId: usage.storageUnit.id.toString(),
          action: {
            startsWith: 'UPDATE_WAREHOUSE_LOCATION'
          }
        },
        include: {
          admin: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      console.error('Error getting location update history:', error);
      return [];
    }
  }

  /**
   * Get warehouse location summary statistics
   * Helper method for warehouse operations dashboard
   */
  async getLocationUpdateSummary() {
    try {
      const [pendingUpdates, totalUsages, warehouseStats] = await Promise.all([
        // Count pending location updates
        prisma.storageUnitUsage.count({
          where: { warehouseLocation: "Pending Update" }
        }),
        
        // Count total active usages
        prisma.storageUnitUsage.count(),
        
        // Get warehouse location distribution
        prisma.storageUnitUsage.groupBy({
          by: ['warehouseLocation'],
          _count: {
            id: true
          },
          where: {
            warehouseLocation: {
              not: null
            }
          }
        })
      ]);

      return {
        pendingUpdates,
        totalUsages,
        warehouseDistribution: warehouseStats.map(stat => ({
          location: stat.warehouseLocation,
          count: stat._count.id
        })),
        percentagePending: totalUsages > 0 ? (pendingUpdates / totalUsages) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting location update summary:', error);
      return {
        pendingUpdates: 0,
        totalUsages: 0,
        warehouseDistribution: [],
        percentagePending: 0
      };
    }
  }

  /**
   * Get recent location updates for audit purposes
   * Helper method for admin oversight
   */
  async getRecentLocationUpdates(limit: number = 50) {
    try {
      return await prisma.adminLog.findMany({
        where: {
          action: {
            startsWith: 'UPDATE_WAREHOUSE_LOCATION'
          }
        },
        include: {
          admin: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });
    } catch (error) {
      console.error('Error getting recent location updates:', error);
      return [];
    }
  }

  /**
   * Validate warehouse location format and constraints
   * Helper method for location validation
   */
  validateWarehouseLocationFormat(location: string): { valid: boolean, error?: string } {
    if (!location || location.trim() === '') {
      return { valid: false, error: 'Warehouse location cannot be empty' };
    }

    const trimmedLocation = location.trim();
    
    if (trimmedLocation.length < 2) {
      return { valid: false, error: 'Warehouse location must be at least 2 characters' };
    }

    if (trimmedLocation.length > 100) {
      return { valid: false, error: 'Warehouse location cannot exceed 100 characters' };
    }

    // Prevent setting back to "Pending Update"
    if (trimmedLocation === "Pending Update") {
      return { valid: false, error: 'Cannot set location to "Pending Update"' };
    }

    return { valid: true };
  }

  /**
   * Get storage units by warehouse location
   * Helper method for location-based inventory queries
   */
  async getStorageUnitsByLocation(warehouseLocation: string) {
    try {
      return await prisma.storageUnitUsage.findMany({
        where: { warehouseLocation },
        include: {
          storageUnit: {
            select: {
              storageUnitNumber: true,
              status: true
            }
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: [
          { storageUnit: { storageUnitNumber: 'asc' } }
        ]
      });
    } catch (error) {
      console.error('Error getting storage units by location:', error);
      return [];
    }
  }
}
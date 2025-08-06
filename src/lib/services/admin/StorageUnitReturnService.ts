/**
 * @fileoverview Service for handling storage unit return processing and inspection
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (storage-return task display logic)
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/storage-unit-return/route.ts (return processing logic)
 * 
 * SERVICE FUNCTIONALITY:
 * - Get storage unit return task details for display
 * - Process storage unit returns with damage inspection
 * - Handle different appointment types (Initial Pickup, Storage Access, End Storage)
 * - Manage storage unit status transitions and usage records
 * - Create damage reports and admin audit logs
 * 
 * USED BY:
 * - Admin task management interface
 * - Storage unit return processing workflows
 * - Damage inspection and reporting systems
 * 
 * @refactor Extracted from monolithic admin tasks route for better organization
 */

import { prisma } from '@/lib/database/prismaClient';
import { 
  formatTaskDate,
  createStorageUnitDamageReports,
  updateStorageUnitForReturn,
  updateStorageUnitUsageForAccess,
  createStorageReturnLog
} from '@/lib/utils/adminTaskUtils';

// Storage unit return task interface
export interface StorageUnitReturnTask {
  id: string;
  title: 'Storage Unit Return';
  description: string;
  action: 'Process Return';
  color: 'purple';
  details: string;
  movingPartner: {
    name: string;
    email: string;
    phoneNumber: string;
    imageSrc: string | null;
  } | null;
  jobCode: string;
  customerName: string;
  appointmentDate: string;
  appointmentAddress: string;
  storageUnitNumber: string;
  appointmentId: string;
  storageUnitId?: string;
  appointment: {
    date: string;
    appointmentType: string;
    user: {
      firstName: string;
      lastName: string;
    } | null;
  };
}

// Storage unit return request interface
export interface StorageUnitReturnRequest {
  hasDamage: boolean;
  damageDescription?: string | null;
  frontPhotos: string[];
  backPhotos: string[];
  isStillStoringItems?: boolean;
  isAllItemsRemoved?: boolean;
  isUnitEmpty?: boolean;
}

// Return processing result interface
export interface StorageUnitReturnResult {
  success: boolean;
  message: string;
  appointment?: any;
  error?: string;
}

export class StorageUnitReturnService {
  /**
   * Get storage unit return task details for display
   * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 346-494)
   */
  async getStorageUnitReturnTask(appointmentId: number, storageUnitId?: number): Promise<StorageUnitReturnTask | null> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          jobCode: true,
          address: true,
          date: true,
          appointmentType: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          movingPartner: {
            select: {
              name: true,
              email: true,
              phoneNumber: true,
              imageSrc: true
            }
          },
          requestedStorageUnits: {
            include: {
              storageUnit: {
                select: {
                  id: true,
                  storageUnitNumber: true
                }
              }
            }
          },
          storageStartUsages: {
            include: {
              storageUnit: {
                select: {
                  id: true,
                  storageUnitNumber: true
                }
              }
            }
          }
        }
      });

      if (!appointment) {
        return null;
      }

      const formattedDate = formatTaskDate(appointment.date);
      const customerName = `${appointment.user?.firstName || ''} ${appointment.user?.lastName || ''}`.trim();
      
      // Find storage unit info - complex logic from original
      let storageUnitInfo: { id: number; storageUnitNumber: string } | null = null;
      
      if (storageUnitId) {
        // Try to find specific storage unit
        const requestedUnit = await prisma.requestedAccessStorageUnit.findFirst({
          where: { appointmentId, storageUnitId },
          include: { storageUnit: true }
        });
        
        if (requestedUnit?.storageUnit) {
          storageUnitInfo = {
            id: requestedUnit.storageUnit.id,
            storageUnitNumber: requestedUnit.storageUnit.storageUnitNumber
          };
        } else {
          // Try storage usage records
          const usageRecord = await prisma.storageUnitUsage.findFirst({
            where: { startAppointmentId: appointmentId, storageUnitId },
            include: { storageUnit: true }
          });
          
          if (usageRecord?.storageUnit) {
            storageUnitInfo = {
              id: usageRecord.storageUnit.id,
              storageUnitNumber: usageRecord.storageUnit.storageUnitNumber
            };
          } else {
            // Direct lookup
            const storageUnit = await prisma.storageUnit.findUnique({
              where: { id: storageUnitId }
            });
            if (storageUnit) {
              storageUnitInfo = {
                id: storageUnit.id,
                storageUnitNumber: storageUnit.storageUnitNumber
              };
            }
          }
        }
      } else {
        // Get first available unit
        if (appointment.storageStartUsages.length > 0) {
          const firstUsage = appointment.storageStartUsages[0];
          if (firstUsage.storageUnit) {
            storageUnitInfo = {
              id: firstUsage.storageUnit.id,
              storageUnitNumber: firstUsage.storageUnit.storageUnitNumber
            };
          }
        } else if (appointment.requestedStorageUnits.length > 0) {
          const firstRequest = appointment.requestedStorageUnits[0];
          if (firstRequest.storageUnit) {
            storageUnitInfo = {
              id: firstRequest.storageUnit.id,
              storageUnitNumber: firstRequest.storageUnit.storageUnitNumber
            };
          }
        }
      }

      // Generate task ID in the expected format
      const taskId = storageUnitId ? `storage-return-${appointmentId}-${storageUnitId}` : `storage-return-${appointmentId}`;

      return {
        id: taskId,
        title: 'Storage Unit Return',
        description: 'Check back in unit. Inspect for unit damage. Verify empty or not.',
        action: 'Process Return',
        color: 'purple',
        details: `<strong>Job Code:</strong> ${appointment.jobCode ?? ''}<br><strong>Job Type:</strong> ${appointment.appointmentType ?? ''}${storageUnitInfo ? `<br><strong>Unit Number:</strong> ${storageUnitInfo.storageUnitNumber}` : ''}`,
        movingPartner: appointment.movingPartner ? {
          name: appointment.movingPartner.name,
          email: appointment.movingPartner.email ?? '',
          phoneNumber: appointment.movingPartner.phoneNumber ?? '',
          imageSrc: appointment.movingPartner.imageSrc
        } : null,
        jobCode: appointment.jobCode ?? '',
        customerName: customerName,
        appointmentDate: formattedDate,
        appointmentAddress: appointment.address ?? '',
        storageUnitNumber: storageUnitInfo?.storageUnitNumber || 'Unknown',
        appointmentId: appointmentId.toString(),
        storageUnitId: storageUnitInfo?.id?.toString(),
        appointment: {
          date: formattedDate,
          appointmentType: appointment.appointmentType ?? '',
          user: appointment.user
        }
      };
    } catch (error) {
      console.error('Error getting storage unit return task:', error);
      return null;
    }
  }

  /**
   * Process storage unit return with inspection and status updates
   * @source boombox-10.0/src/app/api/admin/appointments/[id]/storage-unit-return/route.ts
   */
  async processStorageUnitReturn(
    appointmentId: number,
    adminId: number,
    request: StorageUnitReturnRequest
  ): Promise<StorageUnitReturnResult> {
    try {
      const { 
        hasDamage, 
        damageDescription, 
        frontPhotos, 
        backPhotos,
        isStillStoringItems,
        isAllItemsRemoved,
        isUnitEmpty
      } = request;

      // Get the appointment and its associated storage unit usage
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          storageStartUsages: {
            include: {
              storageUnit: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!appointment) {
        return {
          success: false,
          message: '',
          error: 'Appointment not found'
        };
      }

      // Update the appointment status
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'Completed' },
      });

      const appointmentType = appointment.appointmentType ?? '';

      // Handle different appointment types with specific business logic
      if (appointmentType === 'Initial Pickup' || appointmentType === 'Additional Storage') {
        if (isUnitEmpty === undefined) {
          return {
            success: false,
            message: '',
            error: 'Missing required field: isUnitEmpty'
          };
        }

        // Create damage reports if damage is reported
        if (hasDamage) {
          await createStorageUnitDamageReports(
            appointment.storageStartUsages,
            appointmentId,
            adminId,
            damageDescription,
            frontPhotos,
            backPhotos
          );
        }

        // Update storage units based on isUnitEmpty value
        for (const usage of appointment.storageStartUsages) {
          await updateStorageUnitForReturn(usage, appointmentId, isUnitEmpty);
        }
        
        // Create admin log entry
        await createStorageReturnLog(
          adminId,
          appointmentId,
          appointmentType,
          hasDamage,
          `COMPLETED_${isUnitEmpty ? 'EMPTY' : 'OCCUPIED'}`
        );
        
      } else if (appointmentType === 'Storage Unit Access') {
        if (isStillStoringItems === undefined) {
          return {
            success: false,
            message: '',
            error: 'Missing required field: isStillStoringItems'
          };
        }
        
        // Update storage unit usage records
        for (const usage of appointment.storageStartUsages) {
          await updateStorageUnitUsageForAccess(usage, appointmentId);
        }
        
        if (isStillStoringItems) {
          // Customer still storing items - unit remains Occupied
          if (hasDamage) {
            await createStorageUnitDamageReports(
              appointment.storageStartUsages,
              appointmentId,
              adminId,
              damageDescription,
              frontPhotos,
              backPhotos
            );
          }
          
          await createStorageReturnLog(
            adminId,
            appointmentId,
            'STORAGE_UNIT_ACCESS',
            hasDamage,
            'COMPLETED_STILL_STORING'
          );
        } else {
          // Customer not storing items anymore (unexpected emptying)
          if (hasDamage) {
            await createStorageUnitDamageReports(
              appointment.storageStartUsages,
              appointmentId,
              adminId,
              damageDescription,
              frontPhotos,
              backPhotos
            );
          }
          
          // Update storage units to Pending Cleaning
          for (const usage of appointment.storageStartUsages) {
            await prisma.storageUnit.update({
              where: { id: usage.storageUnitId },
              data: { status: 'Pending Cleaning' },
            });
          }
          
          await createStorageReturnLog(
            adminId,
            appointmentId,
            'STORAGE_UNIT_ACCESS',
            hasDamage,
            'COMPLETED_EMPTIED_UNEXPECTEDLY'
          );
        }
        
      } else if (appointmentType === 'End Storage Term') {
        if (isAllItemsRemoved === undefined) {
          return {
            success: false,
            message: '',
            error: 'Missing required field: isAllItemsRemoved'
          };
        }
        
        // Update storage unit usage records
        for (const usage of appointment.storageStartUsages) {
          await updateStorageUnitUsageForAccess(usage, appointmentId);
        }
        
        if (isAllItemsRemoved) {
          // Customer removed all items
          if (hasDamage) {
            await createStorageUnitDamageReports(
              appointment.storageStartUsages,
              appointmentId,
              adminId,
              damageDescription,
              frontPhotos,
              backPhotos
            );
          }
          
          // Update storage units to Pending Cleaning
          for (const usage of appointment.storageStartUsages) {
            await prisma.storageUnit.update({
              where: { id: usage.storageUnitId },
              data: { status: 'Pending Cleaning' },
            });
          }
          
          await createStorageReturnLog(
            adminId,
            appointmentId,
            'END_STORAGE_TERM',
            hasDamage,
            hasDamage ? 'COMPLETED_WITH_DAMAGE' : 'COMPLETED_NO_DAMAGE'
          );
        } else {
          // Customer did not remove all items (unexpected continuation)
          if (hasDamage) {
            await createStorageUnitDamageReports(
              appointment.storageStartUsages,
              appointmentId,
              adminId,
              damageDescription,
              frontPhotos,
              backPhotos
            );
          }
          
          await createStorageReturnLog(
            adminId,
            appointmentId,
            'END_STORAGE_TERM',
            hasDamage,
            'INCOMPLETE_ITEMS_REMAIN'
          );
        }
      }

      return {
        success: true,
        message: 'Storage unit return processed successfully',
        appointment: updatedAppointment
      };

    } catch (error) {
      console.error('Error processing storage unit return:', error);
      return {
        success: false,
        message: '',
        error: 'Failed to process storage unit return'
      };
    }
  }

  /**
   * Check if appointment needs storage unit return processing
   * Used by the task listing service to determine if tasks should be created
   */
  async isStorageReturnNeeded(appointmentId: number): Promise<boolean> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          appointmentType: true,
          status: true,
          storageStartUsages: {
            select: { id: true }
          },
          requestedStorageUnits: {
            select: { id: true }
          }
        }
      });

      if (!appointment) return false;

      // Check if this is a return-type appointment awaiting admin check-in
      const returnTypes = ['End Storage Plan', 'Storage Unit Access'];
      const hasStorageUnits = appointment.storageStartUsages.length > 0 || appointment.requestedStorageUnits.length > 0;
      
      return returnTypes.includes(appointment.appointmentType ?? '') && 
             appointment.status === 'Awaiting Admin Check In' &&
             hasStorageUnits;
    } catch (error) {
      console.error('Error checking storage return need:', error);
      return false;
    }
  }

  /**
   * Get all storage returns that need processing for task listing
   * Helper method for AdminTaskListingService
   */
  async getAllStorageReturnsNeeded() {
    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          appointmentType: 'End Storage Plan',
          date: {
            gte: new Date(),
            lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          }
        },
        select: {
          id: true,
          jobCode: true,
          date: true,
          storageEndUsages: {
            select: {
              id: true,
              storageUnit: {
                select: {
                  storageUnitNumber: true
                }
              }
            }
          }
        },
        orderBy: {
          date: 'asc'
        }
      });

      return appointments.map(appointment => {
        const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });

        return {
          appointmentId: appointment.id,
          jobCode: appointment.jobCode ?? '',
          appointmentDate: formattedDate,
          storageUnits: appointment.storageEndUsages.map(usage => 
            usage.storageUnit.storageUnitNumber
          )
        };
      });
    } catch (error) {
      console.error('Error getting all storage returns needed:', error);
      return [];
    }
  }
}
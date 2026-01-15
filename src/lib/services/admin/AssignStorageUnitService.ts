/**
 * @fileoverview Service for handling storage unit assignment to appointments
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/assign-storage-units/route.ts
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (storage task display logic)
 * 
 * SERVICE FUNCTIONALITY:
 * - Get storage unit assignment task details for display
 * - Execute storage unit assignment to appointments
 * - Handle multi-unit assignments with proper indexing
 * - Update Onfleet tasks with storage unit associations
 * - Create audit logs for admin actions
 * 
 * USED BY:
 * - Admin task management interface
 * - Storage unit assignment workflows  
 * - Task detail displays
 * 
 * @refactor Extracted from monolithic admin tasks route for better organization
 */

import { prisma } from '@/lib/database/prismaClient';
import { 
  formatTaskDate, 
  formatTaskTime,
  validateStorageUnitsAvailable,
  createStorageUnitUsages,
  updateOnfleetTasksWithStorageUnits,
  createStorageAssignmentLog
} from '@/lib/utils/adminTaskUtils';

// Storage unit assignment task interface
export interface AssignStorageUnitTask {
  id: string;
  title: 'Assign Storage Unit';
  description: string;
  action: 'Assign';
  color: 'orange';
  details: string;
  jobCode: string;
  appointmentDate: string;
  appointmentAddress: string;
  unitIndex?: number;
  storageTotalUnits: number;
}

// Assignment request interface
export interface StorageUnitAssignmentRequest {
  storageUnitNumbers: string[];
  driverMatches: boolean;
  trailerPhotos?: string[];
  unitIndex: number;
}

// Assignment result interface
export interface StorageUnitAssignmentResult {
  success: boolean;
  message: string;
  usages?: any[];
  error?: string;
}

export class AssignStorageUnitService {
  /**
   * Get storage unit assignment task details for display
   * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 578-602)
   */
  async getStorageUnitAssignmentTask(appointmentId: number, unitIndex?: number): Promise<AssignStorageUnitTask | null> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          jobCode: true,
          address: true,
          date: true,
          time: true,
          numberOfUnits: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!appointment) {
        return null;
      }

      const formattedDate = formatTaskDate(appointment.date);
      const storageTotalUnits = appointment.numberOfUnits || 1;
      
      // Generate task ID in the expected format
      const taskId = unitIndex ? `storage-${appointmentId}-${unitIndex}` : `storage-${appointmentId}`;

      return {
        id: taskId,
        title: 'Assign Storage Unit',
        description: 'Assign storage unit to job. Verify job code and driver.',
        action: 'Assign',
        color: 'orange',
        details: `<strong>Job Code:</strong> ${appointment.jobCode}<br><strong>Job Date:</strong> ${formattedDate}${unitIndex ? `<br><strong>Unit:</strong> ${unitIndex} of ${storageTotalUnits}` : ''}`,
        jobCode: appointment.jobCode ?? '',
        appointmentDate: formattedDate,
        appointmentAddress: appointment.address ?? '',
        unitIndex: unitIndex,
        storageTotalUnits: storageTotalUnits
      };
    } catch (error) {
      console.error('Error getting storage unit assignment task:', error);
      return null;
    }
  }

  /**
   * Execute storage unit assignment to appointment
   * @source boombox-10.0/src/app/api/admin/appointments/[id]/assign-storage-units/route.ts
   */
  async assignStorageUnitsToAppointment(
    appointmentId: number,
    adminId: number,
    request: StorageUnitAssignmentRequest
  ): Promise<StorageUnitAssignmentResult> {
    try {
      const { storageUnitNumbers, driverMatches, trailerPhotos, unitIndex } = request;

      // Validate appointment exists
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { user: true }
      });

      if (!appointment) {
        return {
          success: false,
          message: '',
          error: 'Appointment not found'
        };
      }

      // Validate storage units are available
      const validation = await validateStorageUnitsAvailable(storageUnitNumbers);
      if (!validation.valid) {
        return {
          success: false,
          message: '',
          error: validation.error || 'Storage units not available'
        };
      }

      // Create storage unit usage records
      const createdUsages = await createStorageUnitUsages(
        validation.availableUnits,
        appointmentId,
        appointment.userId,
        trailerPhotos
      );

      // Update Onfleet tasks with storage unit assignments and driver verification
      await updateOnfleetTasksWithStorageUnits(
        appointmentId,
        unitIndex,
        validation.availableUnits,
        driverMatches
      );

      // Create admin log entry
      await createStorageAssignmentLog(adminId, appointmentId);

      return {
        success: true,
        message: 'Storage units assigned successfully',
        usages: createdUsages
      };

    } catch (error) {
      console.error('Error assigning storage units:', error);
      return {
        success: false,
        message: '',
        error: 'Failed to assign storage units'
      };
    }
  }

  /**
   * Check if storage unit assignment is needed for appointment
   * Used by the task listing service to determine if tasks should be created
   */
  async isStorageUnitAssignmentNeeded(appointmentId: number): Promise<boolean> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          numberOfUnits: true,
          storageStartUsages: {
            select: { id: true }
          }
        }
      });

      if (!appointment) return false;

      const numberOfUnits = appointment.numberOfUnits || 1;
      const assignedUnits = appointment.storageStartUsages?.length || 0;
      
      return assignedUnits < numberOfUnits;
    } catch (error) {
      console.error('Error checking storage unit assignment need:', error);
      return false;
    }
  }
}
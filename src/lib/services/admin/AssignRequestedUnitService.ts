/**
 * @fileoverview Service for handling requested storage unit assignment to appointments
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (requested-unit task display logic)
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/assign-requested-unit/route.ts (assignment processing logic)
 * 
 * SERVICE FUNCTIONALITY:
 * - Get requested storage unit assignment task details for display
 * - Process requested storage unit assignments with driver verification
 * - Handle trailer photo uploads and OnfleetTask associations
 * - Manage unit indexing for multi-unit requested storage scenarios
 * - Create audit logs for admin actions
 * 
 * USED BY:
 * - Admin task management interface for requested unit assignments
 * - Storage access appointment workflows
 * - Customer-requested storage unit preparation tasks
 * 
 * @refactor Extracted from monolithic admin tasks route for better organization
 */

import { prisma } from '@/lib/database/prismaClient';
import { 
  formatTaskDate,
  markRequestedUnitReady,
  updateOnfleetTasksForRequestedUnit,
  createRequestedUnitAssignmentLog
} from '@/lib/utils/adminTaskUtils';

/**
 * Appointment statuses that should be excluded from task generation
 * Completed and Canceled/Cancelled appointments should not generate tasks
 */
const EXCLUDED_APPOINTMENT_STATUSES = ['Completed', 'Cancelled', 'Canceled'];

// Requested unit assignment task interface
export interface AssignRequestedUnitTask {
  id: string;
  title: 'Assign Requested Unit';
  description: string;
  action: 'Assign';
  color: 'indigo';
  details: string;
  jobCode: string;
  appointmentDate: string;
  appointmentAddress: string;
  storageUnitNumber: string;
  unitIndex: number;
  requestedTotalUnits: number;
}

// Requested unit assignment request interface
export interface RequestedUnitAssignmentRequest {
  storageUnitId: number;
  driverMatches: boolean;
  trailerPhotos?: string[];
  unitIndex: number;
}

// Assignment result interface
export interface RequestedUnitAssignmentResult {
  success: boolean;
  message: string;
  error?: string;
}

export class AssignRequestedUnitService {
  /**
   * Get requested storage unit assignment task details for display
   * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 531-576)
   */
  async getRequestedUnitAssignmentTask(appointmentId: number, unitIndex: number, storageUnitId: number): Promise<AssignRequestedUnitTask | null> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          jobCode: true,
          address: true,
          date: true,
        }
      });

      if (!appointment) {
        return null;
      }

      // Get all requested storage units for this appointment
      const requestedStorageUnits = await prisma.requestedAccessStorageUnit.findMany({
        where: {
          appointmentId: appointmentId
        },
        include: {
          storageUnit: {
            select: {
              id: true,
              storageUnitNumber: true
            }
          }
        },
        orderBy: {
          id: 'asc'
        }
      });

      // Get the specific unit for this task (if available)
      const specificUnit = requestedStorageUnits.length >= unitIndex 
        ? requestedStorageUnits[unitIndex - 1] 
        : null;

      const unitNumber = specificUnit?.storageUnit?.storageUnitNumber || 'Unknown';
      const requestedTotalUnits = requestedStorageUnits.length;
      const formattedDate = formatTaskDate(appointment.date);

      // Generate task ID in the expected format
      const taskId = `requested-unit-${appointmentId}-${unitIndex}-${storageUnitId}`;

      return {
        id: taskId,
        title: 'Assign Requested Unit',
        description: 'Verify job code and driver. Take photo of Boombox trailer on vehicle.',
        action: 'Assign',
        color: 'indigo',
        details: `<strong>Job Code:</strong> ${appointment.jobCode ?? ''}<br><strong>Job Date:</strong> ${formattedDate}<br><strong>Unit:</strong> ${unitNumber}${requestedTotalUnits > 1 ? ` (${unitIndex} of ${requestedTotalUnits})` : ''}`,
        jobCode: appointment.jobCode ?? '',
        appointmentDate: formattedDate,
        appointmentAddress: appointment.address ?? '',
        storageUnitNumber: unitNumber,
        unitIndex: unitIndex,
        requestedTotalUnits: requestedTotalUnits
      };
    } catch (error) {
      console.error('Error getting requested unit assignment task:', error);
      return null;
    }
  }

  /**
   * Process requested storage unit assignment
   * @source boombox-10.0/src/app/api/admin/appointments/[id]/assign-requested-unit/route.ts
   */
  async assignRequestedStorageUnit(
    appointmentId: number,
    adminId: number,
    request: RequestedUnitAssignmentRequest
  ): Promise<RequestedUnitAssignmentResult> {
    try {
      const { storageUnitId, driverMatches, trailerPhotos, unitIndex } = request;

      // Validate that the storage unit exists
      const storageUnit = await prisma.storageUnit.findUnique({
        where: { id: storageUnitId },
        select: { storageUnitNumber: true }
      });

      if (!storageUnit) {
        return {
          success: false,
          message: '',
          error: 'Storage unit not found'
        };
      }

      // Update the requested storage unit to mark it as ready and store the trailer photos
      await markRequestedUnitReady(appointmentId, storageUnitId, trailerPhotos || []);

      // Update OnfleetTask records with storage unit association and driver verification
      const driverId = await updateOnfleetTasksForRequestedUnit(
        appointmentId,
        storageUnitId,
        unitIndex,
        driverMatches
      );

      // Create admin log entry
      await createRequestedUnitAssignmentLog(
        adminId,
        appointmentId,
        storageUnit.storageUnitNumber,
        unitIndex,
        driverId,
        driverMatches
      );

      return {
        success: true,
        message: 'Storage unit assigned successfully'
      };

    } catch (error) {
      console.error('Error assigning requested storage unit:', error);
      return {
        success: false,
        message: '',
        error: 'Failed to assign requested storage unit'
      };
    }
  }

  /**
   * Check if requested unit assignment is needed for appointment
   * Used by the task listing service to determine if tasks should be created
   */
  async isRequestedUnitAssignmentNeeded(appointmentId: number): Promise<boolean> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          requestedStorageUnits: {
            select: { id: true, storageUnitId: true }
          },
          onfleetTasks: {
            select: { storageUnitId: true }
          }
        }
      });

      if (!appointment) return false;

      // Get the list of storage unit IDs already assigned to Onfleet tasks
      const assignedStorageUnitIds = appointment.onfleetTasks
        .filter(task => task.storageUnitId !== null)
        .map(task => task.storageUnitId);

      // Check if there are any requested units not yet assigned
      const hasUnassignedRequestedUnits = appointment.requestedStorageUnits.length > 0 &&
        appointment.requestedStorageUnits.some(unit => 
          !assignedStorageUnitIds.includes(unit.storageUnitId)
        );

      return hasUnassignedRequestedUnits;
    } catch (error) {
      console.error('Error checking requested unit assignment need:', error);
      return false;
    }
  }

  /**
   * Get all requested units that need assignment for task listing
   * Helper method for AdminTaskListingService
   * Excludes canceled and completed appointments
   * 
   * NOTE: This task shows when a requested storage unit has NOT had pickup photos uploaded yet.
   * The pickup photos are uploaded when the "Assign Requested Unit" task is completed.
   * This is separate from the "Prep Units for Delivery" task which checks unitsReady flag.
   * 
   * Workflow:
   * 1) "Prep Units for Delivery" task - Admin forklifts unit to staging area (sets unitsReady=true)
   * 2) "Assign Requested Unit" task - Driver arrives, admin verifies driver and uploads trailer photo
   *    (sets requestedUnitPickupPhotos)
   */
  async getAllRequestedUnitsNeedingAssignment() {
    try {
      const today = new Date();
      const twoDaysFromNow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

      const appointments = await prisma.appointment.findMany({
        where: {
          appointmentType: {
            in: ['Storage Unit Access', 'End Storage Plan']
          },
          date: {
            gte: today,
            lt: twoDaysFromNow
          },
          // Must have at least one requested storage unit
          // We filter for empty requestedUnitPickupPhotos in JavaScript below
          // because Prisma's isEmpty doesn't work reliably with PostgreSQL arrays
          requestedStorageUnits: {
            some: {}
          },
          // Exclude canceled and completed appointments
          status: {
            notIn: EXCLUDED_APPOINTMENT_STATUSES
          }
        },
        select: {
          id: true,
          jobCode: true,
          date: true,
          status: true,
          appointmentType: true,
          requestedStorageUnits: {
            select: {
              id: true,
              storageUnitId: true,
              requestedUnitPickupPhotos: true,
              storageUnit: {
                select: {
                  storageUnitNumber: true
                }
              }
            }
          }
        }
      });

      // Filter to only include requested units where the assign task hasn't been completed
      // (no pickup photos uploaded yet)
      return appointments.flatMap(appointment => {
        // Filter to units that don't have pickup photos yet (assign task not completed)
        const unassignedUnits = appointment.requestedStorageUnits.filter(
          unit => unit.requestedUnitPickupPhotos.length === 0
        );

        return unassignedUnits.map((unit, index) => ({
          appointmentId: appointment.id,
          jobCode: appointment.jobCode ?? '',
          requestedUnitNumber: unit.storageUnit.storageUnitNumber,
          unitIndex: index + 1
        }));
      });
    } catch (error) {
      console.error('Error getting all requested units needing assignment:', error);
      return [];
    }
  }

  /**
   * Get unassigned requested storage units for an appointment
   * Helper method for task generation
   */
  async getUnassignedRequestedUnits(appointmentId: number) {
    try {
      // Get appointment with onfleet tasks
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          onfleetTasks: {
            select: {
              storageUnitId: true
            }
          }
        }
      });

      if (!appointment) return [];

      // Extract the list of storage unit IDs already assigned to Onfleet tasks
      const assignedStorageUnitIds = appointment.onfleetTasks
        .filter(task => task.storageUnitId !== null)
        .map(task => task.storageUnitId);

      // Get all requested storage units
      const requestedUnits = await prisma.requestedAccessStorageUnit.findMany({
        where: {
          appointmentId: appointmentId
        },
        include: {
          storageUnit: {
            select: {
              id: true,
              storageUnitNumber: true,
              status: true
            }
          }
        },
        orderBy: {
          storageUnit: {
            storageUnitNumber: 'asc'
          }
        }
      });

      // Filter out units that are already assigned to Onfleet tasks
      return requestedUnits.filter(
        unit => !assignedStorageUnitIds.includes(unit.storageUnit.id)
      );
    } catch (error) {
      console.error('Error getting unassigned requested units:', error);
      return [];
    }
  }
}
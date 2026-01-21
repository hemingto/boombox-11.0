/**
 * @fileoverview High-level appointment update orchestrator for coordinating DB, Onfleet, and notifications
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (orchestration logic)
 * @refactor Extracted coordination logic into centralized orchestrator service
 */

import { prisma } from '@/lib/database/prismaClient';
import { OnfleetTaskUpdateService } from './onfleet/OnfleetTaskUpdateService';
import { OnfleetTaskCreationService } from './onfleet/OnfleetTaskCreationService';
import { NotificationOrchestrator } from './NotificationOrchestrator';
import { NotificationService } from './NotificationService';
import { TimeSlotBookingService } from './TimeSlotBookingService';
import { DriverReconfirmationService, DriverReconfirmInfo } from './DriverReconfirmationService';
import { DriverReassignmentService } from './DriverReassignmentService';
import { getUnitSpecificStartTime, updateDriverTimeSlotBooking } from '@/lib/utils/driverAssignmentUtils';
import { 
  determineTeamAssignment,
  buildTaskPayload,
  getStorageUnitMapping,
  fetchOriginalOnfleetTask,
  type AppointmentUpdateData
} from './appointmentOnfleetService';
import { geocodeAddress } from './geocodingService';
import { WAREHOUSE_ADDRESS } from '@/lib/utils/onfleetTaskUtils';
import { 
  calculateAppointmentChanges,
  getUnitNumbersToRemove as getUnitNumbersFromIds,
  type AppointmentChanges
} from '@/lib/utils/appointmentUtils';

/**
 * Appointment update input interface
 */
export interface AppointmentUpdateInput {
  appointmentId: number;
  userId?: number;
  address?: string;
  zipcode?: string;
  planType?: string;
  appointmentDateTime?: Date | string;
  description?: string;
  selectedLabor?: {
    onfleetTeamId?: string;
    [key: string]: any;
  };
  movingPartnerId?: number | null;
  thirdPartyMovingPartnerId?: number | null;
  selectedStorageUnits?: number[];
  storageUnitCount?: number;
  numberOfUnits?: number;
  loadingHelpPrice?: number;
  monthlyStorageRate?: number;
  monthlyInsuranceRate?: number;
  insuranceCoverage?: number;
  quotedPrice?: number;
  /** For Additional Storage: number of new units to create (count-based) */
  additionalUnitsCount?: number;
  /** Flag indicating we're creating tasks for additional units only (not replacing all) */
  additionalUnitsOnly?: boolean;
}

/**
 * Appointment with relations interface
 */
export interface AppointmentWithRelations {
  id: number;
  planType: string | null;
  date: Date;
  time: Date;
  address: string | null;
  zipcode: string | null;
  numberOfUnits: number | null;
  userId: number;
  movingPartnerId: number | null;
  thirdPartyMovingPartnerId: number | null;
  description: string | null;
  loadingHelpPrice: number | null;
  appointmentType: string;
  onfleetTasks: Array<{
    id: number;
    taskId: string;
    shortId: string;
    stepNumber: number | null;
    unitNumber: number | null;
    driverId: number | null;
    driverNotificationStatus: string | null;
    driver?: {
      id: number;
      firstName: string | null;
      lastName: string | null;
      phoneNumber: string | null;
    } | null;
  }>;
  movingPartner?: {
    id: number;
    name: string;
    phoneNumber: string | null;
    email: string | null;
  } | null;
  user: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
  };
  requestedStorageUnits: Array<{
    storageUnitId: number;
    storageUnit: {
      id: number;
      storageUnitNumber: string | null;
    };
  }>;
}

/**
 * Update result interface
 */
export interface AppointmentUpdateResult {
  success: boolean;
  appointment?: any;
  changes?: AppointmentChanges;
  onfleetUpdateResults?: any[];
  notificationsSent?: string[];
  error?: string;
}

/**
 * Pending reconfirmation interface - used when a driver needs to reconfirm
 * for a unit that doesn't exist yet (will be created after plan switch)
 */
export interface PendingReconfirmation {
  driverId: number;
  driverName: string;
  driverPhone: string;
  newUnitNumber: number;
  newArrivalTime: Date;
}

/**
 * AppointmentUpdateOrchestrator - Coordinates appointment updates with Onfleet and notifications
 */
export class AppointmentUpdateOrchestrator {
  /**
   * Main entry point for processing appointment updates
   * @param appointmentId - Appointment ID
   * @param updateInput - Update data
   * @returns Update result
   */
  static async processAppointmentUpdate(
    appointmentId: number,
    updateInput: AppointmentUpdateInput
  ): Promise<AppointmentUpdateResult> {
    console.log(`🔄 Processing appointment update for appointment ${appointmentId}`);

    try {
      // 1. Fetch existing appointment with all relations
      const existingAppointment = await this.fetchAppointmentWithRelations(appointmentId);
      if (!existingAppointment) {
        return {
          success: false,
          error: 'Appointment not found',
        };
      }

      // 2. Calculate what changes are being made
      const changes = calculateAppointmentChanges(existingAppointment, updateInput);
      console.log(`📊 Detected changes:`, changes);

      // 3. Validate business rules
      const validation = await this.validateBusinessRules(existingAppointment, updateInput, changes);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // 4. Handle plan switch if needed (must happen before DB update to notify drivers)
      // This returns pending reconfirmations for drivers being shifted to new units
      let pendingReconfirmations: PendingReconfirmation[] = [];
      if (changes.planChanged && updateInput.planType) {
        const switchType = this.determinePlanSwitchType(
          existingAppointment.planType,
          updateInput.planType
        );
        if (switchType) {
          // Pass the new unit count so drivers can be shifted to new units
          const newUnitCount = updateInput.numberOfUnits ?? existingAppointment.numberOfUnits ?? 1;
          pendingReconfirmations = await this.handlePlanSwitch(switchType, existingAppointment, newUnitCount);
        }
      }

      // 5. Handle storage unit reduction if needed (must happen before DB update)
      if (changes.unitsRemoved.length > 0) {
        // 5a. Access Storage: remove specific storage unit IDs
        console.log(`🗑️  Handling storage unit reduction: ${changes.unitsRemoved.length} units (Access Storage)`);
        await this.handleStorageUnitReduction(existingAppointment, changes.unitsRemoved, updateInput.planType || existingAppointment.planType);
      } else if (changes.unitsToRemoveByCount > 0) {
        // 5b. Additional Storage / Initial Pickup: remove by count (highest unit numbers first)
        console.log(`🗑️  Handling storage unit reduction: ${changes.unitsToRemoveByCount} units (Additional Storage)`);
        await this.handleStorageUnitReductionByCount(
          existingAppointment,
          changes.unitsToRemoveByCount,
          updateInput.numberOfUnits || 0,
          updateInput.planType || existingAppointment.planType
        );
      }

      // 6. Update database in transaction
      const updatedAppointment = await this.updateAppointmentInDatabase(
        appointmentId,
        updateInput,
        existingAppointment
      );

      // 7. Update Onfleet tasks
      const onfleetResults = await this.updateOnfleetTasks(
        appointmentId,
        updatedAppointment,
        updateInput,
        changes
      );

      // 8. Handle storage unit additions (create new Onfleet tasks)
      if (changes.unitsAdded.length > 0) {
        // 8a. Access Storage appointments: create tasks for specific new unit IDs
        console.log(`📦 Creating tasks for ${changes.unitsAdded.length} added units (Access Storage)`);
        await OnfleetTaskCreationService.createTasksForAdditionalUnits(
          appointmentId,
          changes.unitsAdded,
          updateInput
        );
      } else if (changes.additionalUnitsToCreate > 0) {
        // 8b. Additional Storage / Initial Pickup: create tasks by count (not specific unit IDs)
        console.log(`📦 Creating tasks for ${changes.additionalUnitsToCreate} additional units (Additional Storage)`);
        await OnfleetTaskCreationService.createTasksForAdditionalUnits(
          appointmentId,
          [],  // No specific unit IDs for count-based appointments
          {
            ...updateInput,
            additionalUnitsCount: changes.additionalUnitsToCreate,
            additionalUnitsOnly: true,
          }
        );
      }

      // 8c. Apply pending reconfirmations to newly created tasks (if any)
      // This sets pending_reconfirmation status on new unit tasks for drivers being shifted
      if (pendingReconfirmations.length > 0) {
        await this.applyPendingReconfirmations(appointmentId, pendingReconfirmations);
      }

      // 9. Update time slot booking for moving partner
      if (updateInput.movingPartnerId !== undefined || updateInput.appointmentDateTime) {
        const appointmentDate = updateInput.appointmentDateTime 
          ? new Date(updateInput.appointmentDateTime) 
          : existingAppointment.time;
        
        await TimeSlotBookingService.updateBookingForAppointment(
          appointmentId,
          appointmentDate,
          updateInput.movingPartnerId ?? existingAppointment.movingPartnerId,
          existingAppointment.movingPartnerId
        );
      }

      // 9b. Update driver time slot bookings if time changed
      if (changes.timeChanged) {
        const newTime = updateInput.appointmentDateTime 
          ? new Date(updateInput.appointmentDateTime) 
          : existingAppointment.time;
        
        // Get all assigned drivers from the appointment
        const assignedTasks = existingAppointment.onfleetTasks.filter(task => task.driverId);
        
        if (assignedTasks.length > 0) {
          console.log(`📅 Updating driver time slot bookings for ${assignedTasks.length} assigned tasks`);
          
          // Group tasks by unit number to get unique units with assigned drivers
          const unitNumbers = [...new Set(assignedTasks.map(t => t.unitNumber || 1))];
          
          for (const unitNumber of unitNumbers) {
            const result = await updateDriverTimeSlotBooking(
              appointmentId,
              newTime,
              newTime,
              unitNumber
            );
            
            if (!result.success) {
              console.warn(`⚠️ Failed to update driver time slot booking for unit ${unitNumber}: ${result.error}`);
            }
          }
        }
      }

      // 10. Handle driver reconfirmation if time changed and drivers are assigned
      // Boombox Delivery Network drivers need to reconfirm when time changes
      // Moving Partner drivers only get informational notifications (handled in step 11)
      if (changes.timeChanged) {
        const hasAssignedBoomboxDrivers = await DriverReconfirmationService.hasAssignedBoomboxDrivers(appointmentId);
        
        if (hasAssignedBoomboxDrivers) {
          console.log(`📱 Time changed with assigned Boombox drivers - sending reconfirmation requests`);
          
          // Send reconfirmation requests to Boombox Delivery Network drivers
          // (Moving Partner drivers don't need reconfirmation - they coordinate with their employer)
          await DriverReconfirmationService.processReconfirmationsForAppointment(
            existingAppointment,
            existingAppointment.time,
            updateInput.appointmentDateTime 
              ? new Date(updateInput.appointmentDateTime) 
              : existingAppointment.time
          );
        }
      }

      // 11. Send notifications based on changes
      const notificationsSent = await NotificationOrchestrator.handleAppointmentChangeNotifications(
        existingAppointment,
        updatedAppointment,
        changes
      );

      console.log(`✅ Appointment update complete for ${appointmentId}`);

      return {
        success: true,
        appointment: updatedAppointment,
        changes,
        onfleetUpdateResults: onfleetResults,
        notificationsSent,
      };
    } catch (error) {
      console.error(`❌ Error processing appointment update:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch appointment with all necessary relations
   */
  private static async fetchAppointmentWithRelations(
    appointmentId: number
  ): Promise<AppointmentWithRelations | null> {
    return await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        onfleetTasks: {
          include: {
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
          },
        },
        movingPartner: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        requestedStorageUnits: {
          include: {
            storageUnit: {
              select: {
                id: true,
                storageUnitNumber: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Validate business rules before updating
   */
  private static async validateBusinessRules(
    existingAppointment: AppointmentWithRelations,
    updateInput: AppointmentUpdateInput,
    changes: AppointmentChanges
  ): Promise<{ valid: boolean; error?: string }> {
    // Validate unit count doesn't go below 1
    if (updateInput.numberOfUnits !== undefined && updateInput.numberOfUnits < 1) {
      return { valid: false, error: 'Unit count cannot be less than 1' };
    }

    // Validate storage unit IDs if provided - but only for Access Storage appointments
    // that require selecting existing units (not for Initial Pickup/Additional Storage
    // where units are created, not selected)
    const isAccessStorageAppointment = 
      existingAppointment.appointmentType === 'Storage Unit Access' ||
      existingAppointment.appointmentType === 'End Storage Term';
    
    if (
      isAccessStorageAppointment &&
      updateInput.selectedStorageUnits && 
      updateInput.selectedStorageUnits.length < 1
    ) {
      return { valid: false, error: 'At least one storage unit must be selected' };
    }

    // Add more business rule validations as needed

    return { valid: true };
  }

  /**
   * Handle storage unit reduction: notify drivers, delete tasks, reassign teams
   */
  static async handleStorageUnitReduction(
    appointment: AppointmentWithRelations,
    unitIdsToRemove: number[],
    planType?: string | null
  ): Promise<void> {
    console.log(`🗑️  Handling storage unit reduction for appointment ${appointment.id}`);

    try {
      // Calculate which unit numbers to remove
      const existingUnitIds = appointment.requestedStorageUnits.map(u => u.storageUnitId);
      const unitNumbersToRemove: number[] = [];
      
      for (const unitId of unitIdsToRemove) {
        const index = existingUnitIds.indexOf(unitId);
        if (index !== -1) {
          // Convert 0-based index to 1-based unit number
          unitNumbersToRemove.push(index + 1);
        }
      }

      if (unitNumbersToRemove.length === 0) {
        console.log('No unit numbers to remove');
        return;
      }

      // 1. Get tasks to delete
      const tasksToDelete = appointment.onfleetTasks.filter(task =>
        task.unitNumber && unitNumbersToRemove.includes(task.unitNumber)
      );

      if (tasksToDelete.length === 0) {
        console.log('No tasks to delete');
        return;
      }

      console.log(`Found ${tasksToDelete.length} tasks to delete`);

      // 2. Collect unique drivers and notify BEFORE deletion
      const uniqueDrivers = NotificationOrchestrator.collectUniqueDrivers(tasksToDelete);
      console.log(`Notifying ${uniqueDrivers.length} unique drivers`);

      for (const driver of uniqueDrivers) {
        await NotificationOrchestrator.notifyDriverTaskCancellation(
          driver,
          appointment,
          'Storage unit count reduced'
        );
      }

      // 2b. Send in-app notification to Moving Partner about unit reduction (no SMS)
      // This is for when a Full Service job has units reduced but Moving Partner remains assigned
      if (appointment.movingPartnerId) {
        const existingUnitCount = appointment.requestedStorageUnits.length;
        const newUnitCount = existingUnitCount - unitIdsToRemove.length;
        try {
          await NotificationService.createNotification({
            recipientId: appointment.movingPartnerId,
            recipientType: 'MOVER',
            type: 'APPOINTMENT_UPDATED',
            data: {
              appointmentId: appointment.id,
              changeType: 'unit_count_reduced',
              message: `Unit count reduced from ${existingUnitCount} to ${newUnitCount}`,
              date: appointment.date,
              address: appointment.address,
            },
            appointmentId: appointment.id,
            movingPartnerId: appointment.movingPartnerId,
          });
          console.log(`📬 In-app notification sent to Moving Partner ${appointment.movingPartnerId} about unit reduction`);
        } catch (notifError) {
          console.error('Error creating Moving Partner unit reduction notification:', notifError);
        }
      }

      // 3. Delete from Onfleet
      const taskIds = tasksToDelete.map(t => t.taskId);
      const deleteResults = await OnfleetTaskUpdateService.batchDeleteTasks(taskIds);
      console.log(`Deleted ${deleteResults.filter(r => r.success).length}/${taskIds.length} tasks from Onfleet`);

      // 4. Delete from database
      const dbDeleteResult = await prisma.onfleetTask.deleteMany({
        where: {
          appointmentId: appointment.id,
          unitNumber: {
            in: unitNumbersToRemove,
          },
        },
      });

      console.log(`Deleted ${dbDeleteResult.count} OnfleetTask records from database`);

      // 5. Reassign remaining tasks to correct teams after unit reduction
      await this.reassignTeamsAfterUnitReduction(
        appointment,
        unitNumbersToRemove,
        planType || appointment.planType
      );
    } catch (error) {
      console.error('Error handling storage unit reduction:', error);
      throw error;
    }
  }

  /**
   * Handle storage unit reduction for Additional Storage / Initial Pickup appointments
   * These appointments use count-based units (no specific unit IDs)
   * We delete tasks where unitNumber > newCount
   * 
   * @param appointment - The appointment with relations
   * @param unitsToRemove - Number of units being removed
   * @param newCount - The new total unit count
   * @param planType - Current or updated plan type
   */
  static async handleStorageUnitReductionByCount(
    appointment: AppointmentWithRelations,
    unitsToRemove: number,
    newCount: number,
    planType?: string | null
  ): Promise<void> {
    console.log(`🗑️  Handling count-based storage unit reduction for appointment ${appointment.id}`);
    console.log(`   Removing ${unitsToRemove} units, new count: ${newCount}`);

    try {
      // For count-based appointments, we remove the highest unit numbers
      // e.g., if going from 3 units to 1, we remove unit numbers 2 and 3
      const unitNumbersToRemove: number[] = [];
      const existingCount = (appointment.numberOfUnits || 0);
      
      for (let i = newCount + 1; i <= existingCount; i++) {
        unitNumbersToRemove.push(i);
      }

      if (unitNumbersToRemove.length === 0) {
        console.log('No unit numbers to remove');
        return;
      }

      console.log(`Removing tasks for unit numbers: ${unitNumbersToRemove.join(', ')}`);

      // 1. Get tasks to delete
      const tasksToDelete = appointment.onfleetTasks.filter(task =>
        task.unitNumber && unitNumbersToRemove.includes(task.unitNumber)
      );

      if (tasksToDelete.length === 0) {
        console.log('No tasks found for removal');
        return;
      }

      console.log(`Found ${tasksToDelete.length} tasks to delete`);

      // 2. Collect unique drivers and notify BEFORE deletion
      const uniqueDrivers = NotificationOrchestrator.collectUniqueDrivers(tasksToDelete);
      console.log(`Notifying ${uniqueDrivers.length} unique drivers`);

      for (const driver of uniqueDrivers) {
        await NotificationOrchestrator.notifyDriverTaskCancellation(
          driver,
          appointment,
          'Storage unit count reduced'
        );
      }

      // 2b. Send in-app notification to Moving Partner about unit reduction (no SMS)
      // This is for when a Full Service job has units reduced but Moving Partner remains assigned
      if (appointment.movingPartnerId) {
        try {
          await NotificationService.createNotification({
            recipientId: appointment.movingPartnerId,
            recipientType: 'MOVER',
            type: 'APPOINTMENT_UPDATED',
            data: {
              appointmentId: appointment.id,
              changeType: 'unit_count_reduced',
              message: `Unit count reduced from ${existingCount} to ${newCount}`,
              date: appointment.date,
              address: appointment.address,
            },
            appointmentId: appointment.id,
            movingPartnerId: appointment.movingPartnerId,
          });
          console.log(`📬 In-app notification sent to Moving Partner ${appointment.movingPartnerId} about unit reduction`);
        } catch (notifError) {
          console.error('Error creating Moving Partner unit reduction notification:', notifError);
        }
      }

      // 3. Delete from Onfleet
      const taskIds = tasksToDelete.map(t => t.taskId);
      const deleteResults = await OnfleetTaskUpdateService.batchDeleteTasks(taskIds);
      console.log(`Deleted ${deleteResults.filter(r => r.success).length}/${taskIds.length} tasks from Onfleet`);

      // 4. Delete from database
      const dbDeleteResult = await prisma.onfleetTask.deleteMany({
        where: {
          appointmentId: appointment.id,
          unitNumber: {
            in: unitNumbersToRemove,
          },
        },
      });

      console.log(`Deleted ${dbDeleteResult.count} OnfleetTask records from database`);

      // 5. Reassign remaining tasks to correct teams after unit reduction
      await this.reassignTeamsAfterUnitReduction(
        appointment,
        unitNumbersToRemove,
        planType || appointment.planType
      );
    } catch (error) {
      console.error('Error handling count-based storage unit reduction:', error);
      throw error;
    }
  }

  /**
   * Reassign remaining tasks to correct teams after unit reduction
   * If unit 1 is removed, the new lowest unit becomes the "first unit" and
   * should be assigned to moving partner team (Full Service) or Boombox (DIY)
   */
  private static async reassignTeamsAfterUnitReduction(
    appointment: AppointmentWithRelations,
    removedUnitNumbers: number[],
    planType: string | null
  ): Promise<void> {
    console.log(`🔄 Reassigning teams after unit reduction for appointment ${appointment.id}`);

    try {
      // Get remaining tasks
      const remainingTasks = await prisma.onfleetTask.findMany({
        where: { appointmentId: appointment.id },
        orderBy: [{ unitNumber: 'asc' }, { stepNumber: 'asc' }]
      });

      if (remainingTasks.length === 0) {
        console.log('No remaining tasks to reassign');
        return;
      }

      // Find the new lowest unit number
      const remainingUnitNumbers = [...new Set(remainingTasks.map(t => t.unitNumber || 0))].filter(n => n > 0);
      if (remainingUnitNumbers.length === 0) {
        console.log('No valid unit numbers in remaining tasks');
        return;
      }

      const newLowestUnitNumber = Math.min(...remainingUnitNumbers);
      console.log(`New lowest unit number after reduction: ${newLowestUnitNumber}`);

      // Determine which team should handle the first unit
      const isDIY = planType === 'Do It Yourself Plan';
      const boomboxTeamId = process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID;

      let firstUnitTeamId: string | null = boomboxTeamId || null;

      // For Full Service, first unit goes to moving partner team
      if (!isDIY && appointment.movingPartnerId) {
        const movingPartner = await prisma.movingPartner.findUnique({
          where: { id: appointment.movingPartnerId },
          select: { onfleetTeamId: true }
        });
        
        if (movingPartner?.onfleetTeamId) {
          firstUnitTeamId = movingPartner.onfleetTeamId;
        }
      }

      // Get first unit tasks (steps 1-3 for the new lowest unit)
      const firstUnitTasks = remainingTasks.filter(
        task => task.unitNumber === newLowestUnitNumber
      );

      console.log(`Reassigning ${firstUnitTasks.length} tasks for unit ${newLowestUnitNumber}`);

      // Update teams in Onfleet
      for (const task of firstUnitTasks) {
        if (firstUnitTeamId) {
          await OnfleetTaskUpdateService.updateTask(
            task.taskId,
            {
              container: {
                type: 'TEAM',
                team: firstUnitTeamId
              }
            },
            task.shortId
          );
        }
      }

      console.log(`✅ Team reassignment complete`);
    } catch (error) {
      console.error('Error reassigning teams after unit reduction:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Determine the type of plan switch
   */
  private static determinePlanSwitchType(
    existingPlanType: string | null,
    newPlanType: string
  ): 'diy_to_full_service' | 'full_service_to_diy' | null {
    const isDIYToFullService = 
      existingPlanType === 'Do It Yourself Plan' && 
      newPlanType === 'Full Service Plan';
    
    const isFullServiceToDIY = 
      existingPlanType === 'Full Service Plan' && 
      newPlanType === 'Do It Yourself Plan';

    if (isDIYToFullService) return 'diy_to_full_service';
    if (isFullServiceToDIY) return 'full_service_to_diy';
    return null;
  }

  /**
   * Update appointment in database with transaction
   */
  private static async updateAppointmentInDatabase(
    appointmentId: number,
    updateInput: AppointmentUpdateInput,
    existingAppointment: AppointmentWithRelations
  ): Promise<any> {
    const appointmentDateTime = updateInput.appointmentDateTime
      ? new Date(updateInput.appointmentDateTime)
      : existingAppointment.time;

    // Calculate loading help price with defaults for plan switches
    let finalLoadingHelpPrice = updateInput.loadingHelpPrice;
    if (updateInput.planType && updateInput.loadingHelpPrice !== undefined) {
      finalLoadingHelpPrice = this.calculateLoadingHelpPrice(
        updateInput.planType,
        existingAppointment.planType,
        updateInput.loadingHelpPrice
      );
    }

    // Prepare update data
    const updateData: any = {
      ...(updateInput.userId && { userId: updateInput.userId }),
      ...(updateInput.address && { address: updateInput.address }),
      ...(updateInput.zipcode && { zipcode: updateInput.zipcode }),
      ...(updateInput.planType && { planType: updateInput.planType }),
      date: appointmentDateTime,
      time: appointmentDateTime,
      ...(updateInput.description !== undefined && { description: updateInput.description }),
      ...(finalLoadingHelpPrice !== undefined && { loadingHelpPrice: finalLoadingHelpPrice }),
      ...(updateInput.monthlyStorageRate !== undefined && { monthlyStorageRate: updateInput.monthlyStorageRate }),
      ...(updateInput.monthlyInsuranceRate !== undefined && { monthlyInsuranceRate: updateInput.monthlyInsuranceRate }),
      ...(updateInput.insuranceCoverage !== undefined && { insuranceCoverage: updateInput.insuranceCoverage }),
      ...(updateInput.quotedPrice !== undefined && { quotedPrice: updateInput.quotedPrice }),
      ...(updateInput.numberOfUnits !== undefined && { numberOfUnits: updateInput.numberOfUnits }),
      ...(updateInput.movingPartnerId !== undefined && { movingPartnerId: updateInput.movingPartnerId }),
      ...(updateInput.thirdPartyMovingPartnerId !== undefined && { thirdPartyMovingPartnerId: updateInput.thirdPartyMovingPartnerId }),
    };

    // Handle storage unit updates
    if (updateInput.selectedStorageUnits) {
      updateData.requestedStorageUnits = {
        deleteMany: {},
        create: updateInput.selectedStorageUnits.map((unitId: number) => ({
          storageUnit: { connect: { id: unitId } },
        })),
      };
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        onfleetTasks: true,
        requestedStorageUnits: {
          include: {
            storageUnit: true,
          },
        },
        movingPartner: true,
        user: true,
      },
    });

    return updatedAppointment;
  }

  /**
   * Update Onfleet tasks for the appointment
   * @param appointmentId - Appointment ID
   * @param appointment - Updated appointment data
   * @param updateInput - Original update input
   * @param changes - Detected changes from calculateAppointmentChanges
   */
  private static async updateOnfleetTasks(
    appointmentId: number,
    appointment: any,
    updateInput: AppointmentUpdateInput,
    changes: AppointmentChanges
  ): Promise<any[]> {
    console.log(`🔄 Updating Onfleet tasks for appointment ${appointmentId}`);

    try {
      const appointmentData: AppointmentUpdateData = {
        id: appointment.id,
        appointmentType: appointment.appointmentType,
        address: appointment.address,
        zipcode: appointment.zipcode,
        date: appointment.date,
        time: appointment.time,
        description: appointment.description,
        numberOfUnits: appointment.numberOfUnits,
        planType: appointment.planType,
        movingPartnerId: appointment.movingPartnerId,
        selectedLabor: updateInput.selectedLabor,
        storageUnitCount: appointment.numberOfUnits,
      };

      // Get coordinates for the address
      const coordinates = appointmentData.address
        ? await geocodeAddress(appointmentData.address)
        : null;
      const warehouseCoordinates = await geocodeAddress(WAREHOUSE_ADDRESS);

      // Get storage unit mappings
      const storageUnitMappings = await getStorageUnitMapping(appointmentId);

      // Create storage unit numbers mapping
      const storageUnitNumbersMap: Record<number, string> = {};
      storageUnitMappings.forEach(relation => {
        storageUnitNumbersMap[relation.storageUnitId] =
          relation.storageUnit.storageUnitNumber || `Unit #${relation.storageUnitId}`;
      });

      // Get all current storage unit numbers
      const allCurrentUnitNumbers = storageUnitMappings
        .map(relation =>
          storageUnitNumbersMap[relation.storageUnitId] || relation.storageUnitId.toString()
        )
        .join(', ');

      // Determine if we should reassign team containers
      // Only reassign when plan or moving partner changed - preserve existing driver assignments otherwise
      const shouldReassignTeam = changes.planChanged || changes.movingPartnerChanged;

      // Update each Onfleet task
      const updates = await Promise.all(
        appointment.onfleetTasks.map(async (task: any) => {
          const stepNumber = task.stepNumber || 0;
          const unitNumber = task.unitNumber || 0;

          // Only determine team assignment if we should reassign
          // If moving partner and plan haven't changed, pass null to preserve current driver
          let teamId: string | null = null;
          if (shouldReassignTeam || !task.driverId) {
            teamId = await determineTeamAssignment(
              appointmentData,
              stepNumber,
              unitNumber
            );
          }

          // Fetch original task notes from Onfleet
          const originalTask = await fetchOriginalOnfleetTask(task.taskId);
          if (!originalTask) {
            return {
              taskId: task.taskId,
              shortId: task.shortId,
              success: false,
              error: 'Failed to fetch original task from Onfleet',
            };
          }

          const originalNotes =
            originalTask.notes ||
            `${appointmentData.appointmentType || 'Appointment'} - ${
              appointmentData.description || 'No added info'
            }`;

          // Get actual unit number for this task
          let actualUnitNumber = '';
          const onfleetTask = await prisma.onfleetTask.findUnique({
            where: { id: task.id },
            include: {
              appointment: {
                include: {
                  requestedStorageUnits: {
                    include: {
                      storageUnit: true,
                    },
                  },
                },
              },
            },
          });

          if (onfleetTask?.unitNumber) {
            const unitIndex = onfleetTask.unitNumber - 1;
            if (onfleetTask.appointment?.requestedStorageUnits[unitIndex]) {
              const storageUnit =
                onfleetTask.appointment.requestedStorageUnits[unitIndex].storageUnit;
              actualUnitNumber =
                storageUnit.storageUnitNumber || `Unit #${storageUnit.id}`;
            }
          }

          // Build the complete task payload
          const payload = await buildTaskPayload(
            originalNotes,
            appointmentData,
            stepNumber,
            allCurrentUnitNumbers,
            actualUnitNumber,
            teamId,
            coordinates,
            warehouseCoordinates
          );

          // Cast to OnfleetTaskPayload for type compatibility
          const onfleetPayload: any = {
            ...payload,
            container: payload.container ? {
              ...payload.container,
              type: payload.container.type as 'TEAM' | 'WORKER' | 'ORGANIZATION',
            } : undefined,
          };

          // Update the Onfleet task
          return await OnfleetTaskUpdateService.updateTask(
            task.taskId,
            onfleetPayload,
            task.shortId
          );
        })
      );

      const successCount = updates.filter(r => r.success).length;
      console.log(`✅ Updated ${successCount}/${updates.length} Onfleet tasks`);

      return updates;
    } catch (error) {
      console.error('Error updating Onfleet tasks:', error);
      throw error;
    }
  }

  /**
   * Handle plan switch coordination (DIY ↔ Full Service)
   * Uses smart reassignment to minimize driver notification churn
   * This includes driver/partner notifications AND Onfleet container updates
   * 
   * @param switchType - Direction of plan switch
   * @param appointment - Existing appointment with relations
   * @param newUnitCount - The new unit count after the edit (may differ from current)
   * @returns Array of pending reconfirmations that need to be applied AFTER new tasks are created
   */
  static async handlePlanSwitch(
    switchType: 'diy_to_full_service' | 'full_service_to_diy',
    appointment: AppointmentWithRelations,
    newUnitCount?: number
  ): Promise<PendingReconfirmation[]> {
    const oldUnitCount = appointment.numberOfUnits || 1;
    const finalNewUnitCount = newUnitCount ?? oldUnitCount;
    
    console.log(`🔄 Handling plan switch: ${switchType} for appointment ${appointment.id}`);
    console.log(`   Unit count: ${oldUnitCount} → ${finalNewUnitCount}`);

    const boomboxTeamId = process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID;
    
    // Track pending reconfirmations for drivers shifting to new units
    // These will be applied AFTER the new unit tasks are created
    const pendingReconfirmations: PendingReconfirmation[] = [];

    // Determine old and new plan types
    const oldPlanType = switchType === 'diy_to_full_service' 
      ? 'Do It Yourself Plan' 
      : 'Full Service Plan';
    const newPlanType = switchType === 'diy_to_full_service' 
      ? 'Full Service Plan' 
      : 'Do It Yourself Plan';

    // Get existing task assignments
    const existingTasks = await DriverReassignmentService.getExistingAssignments(appointment.id);

    // Analyze what driver changes are needed - use the NEW unit count so drivers can shift to new units
    const reassignmentPlan = await DriverReassignmentService.analyzeDriverRequirements(
      existingTasks,
      oldPlanType,
      newPlanType,
      oldUnitCount,
      finalNewUnitCount, // Use the new unit count so drivers can shift to Unit 2+
      appointment.time,
      appointment.movingPartnerId || undefined
    );

    if (switchType === 'diy_to_full_service') {
      // Handle DIY → Full Service upgrade
      
      // 1. Handle drivers being shifted to different units
      // Instead of immediately reassigning, send a reconfirmation request
      // so the driver can confirm the new arrival time works for them
      for (const shift of reassignmentPlan.driversToKeep) {
        if (shift.currentUnit !== shift.newUnit) {
          // Driver is being shifted to a later unit - send reconfirmation request
          console.log(`📱 Sending unit shift reconfirmation to ${shift.driverName}: Unit ${shift.currentUnit} → ${shift.newUnit}`);
          
          const driverInfo: DriverReconfirmInfo = {
            id: shift.driverId,
            firstName: shift.driverName.split(' ')[0] || null,
            lastName: shift.driverName.split(' ').slice(1).join(' ') || null,
            phoneNumber: shift.driverPhone,
          };

          // Send reconfirmation request SMS
          const reconfirmResult = await DriverReconfirmationService.sendUnitShiftReconfirmation(
            driverInfo,
            appointment.id,
            appointment.date,
            shift.currentUnit,
            shift.newUnit,
            shift.newArrivalTime
          );

          if (reconfirmResult.success) {
            // Clear driver from old unit tasks (move to team container)
            const tasksForOldUnit = await prisma.onfleetTask.findMany({
              where: {
                appointmentId: appointment.id,
                unitNumber: shift.currentUnit
              }
            });

            for (const task of tasksForOldUnit) {
              // Disconnect driver from old unit tasks
              await prisma.onfleetTask.update({
                where: { id: task.id },
                data: {
                  driver: { disconnect: true },
                  driverNotificationStatus: null,
                  lastNotifiedDriverId: null,
                  driverNotificationSentAt: null,
                  driverAcceptedAt: null,
                  driverDeclinedAt: null
                }
              });
              
              // Move to team container in Onfleet
              if (boomboxTeamId) {
                await OnfleetTaskUpdateService.updateTask(
                  task.taskId,
                  { container: { type: 'TEAM', team: boomboxTeamId } },
                  task.shortId
                );
              }
            }

            // Collect pending reconfirmation to apply AFTER new unit tasks are created
            // (Unit 2 tasks don't exist yet - they'll be created after this function returns)
            pendingReconfirmations.push({
              driverId: shift.driverId,
              driverName: shift.driverName,
              driverPhone: shift.driverPhone || '',
              newUnitNumber: shift.newUnit,
              newArrivalTime: shift.newArrivalTime
            });

            console.log(`✅ Driver ${shift.driverName} sent reconfirmation for Unit ${shift.newUnit} (arrive ${shift.newArrivalTime.toLocaleTimeString()})`);
            console.log(`   ⏳ Pending reconfirmation will be applied to Unit ${shift.newUnit} tasks after they're created`);
          } else {
            console.error(`❌ Failed to send reconfirmation to ${shift.driverName}: ${reconfirmResult.error}`);
          }
        }
      }

      // 2. Handle drivers being removed completely (send unassign notifications)
      for (const removal of reassignmentPlan.driversToRemove) {
        await NotificationOrchestrator.notifyDriverReassignment(
          {
            id: removal.driverId,
            firstName: removal.driverName.split(' ')[0] || null,
            lastName: removal.driverName.split(' ').slice(1).join(' ') || null,
            phoneNumber: removal.driverPhone,
          },
          appointment,
          removal.reason
        );

        // Delete driver's time slot booking to free up their availability
        await TimeSlotBookingService.deleteDriverBookingForDriver(
          removal.driverId,
          appointment.id
        );

        // Clear assignments for removed drivers
        const tasksForDriver = await prisma.onfleetTask.findMany({
          where: {
            appointmentId: appointment.id,
            driverId: removal.driverId
          }
        });

        for (const task of tasksForDriver) {
          await prisma.onfleetTask.update({
            where: { id: task.id },
            data: {
              driver: { disconnect: true },
              driverNotificationStatus: null,
              lastNotifiedDriverId: null,
              driverNotificationSentAt: null,
              driverAcceptedAt: null,
              driverDeclinedAt: null
            }
          });
          
          // Move to team container in Onfleet
          if (boomboxTeamId) {
            await OnfleetTaskUpdateService.updateTask(
              task.taskId,
              { container: { type: 'TEAM', team: boomboxTeamId } },
              task.shortId
            );
          }
        }
      }

      // 3. Clear assignments for units needing new drivers (Moving Partner for Unit 1)
      for (const slot of reassignmentPlan.unitsNeedingNewDriver) {
        const tasksForUnit = await prisma.onfleetTask.findMany({
          where: {
            appointmentId: appointment.id,
            unitNumber: slot.unitNumber
          }
        });

        for (const task of tasksForUnit) {
          await prisma.onfleetTask.update({
            where: { id: task.id },
            data: {
              driver: { disconnect: true },
              driverNotificationStatus: null,
              lastNotifiedDriverId: null,
              driverNotificationSentAt: null,
              driverAcceptedAt: null,
              driverDeclinedAt: null
            }
          });
          
          // Move to team container in Onfleet
          if (boomboxTeamId) {
            await OnfleetTaskUpdateService.updateTask(
              task.taskId,
              { container: { type: 'TEAM', team: boomboxTeamId } },
              task.shortId
            );
          }
        }
      }

      console.log(`✅ Smart reassignment complete: ${reassignmentPlan.driversToKeep.length} kept/shifted, ${reassignmentPlan.driversToRemove.length} removed, ${reassignmentPlan.unitsNeedingNewDriver.length} slots to fill`);

    } else if (switchType === 'full_service_to_diy') {
      // Handle Full Service → DIY downgrade

      // 1. Notify moving partner of plan change
      if (appointment.movingPartner) {
        await NotificationOrchestrator.notifyMovingPartnerPlanChangeToDIY(
          appointment.movingPartner,
          appointment
        );
      }

      // 2. Handle drivers being removed (Moving Partner drivers can't do DIY)
      for (const removal of reassignmentPlan.driversToRemove) {
        await NotificationOrchestrator.notifyDriverReassignment(
          {
            id: removal.driverId,
            firstName: removal.driverName.split(' ')[0] || null,
            lastName: removal.driverName.split(' ').slice(1).join(' ') || null,
            phoneNumber: removal.driverPhone,
          },
          appointment,
          removal.reason
        );

        // Delete driver's time slot booking to free up their availability
        await TimeSlotBookingService.deleteDriverBookingForDriver(
          removal.driverId,
          appointment.id
        );
      }

      // 3. Handle Boombox drivers that can stay (might shift units)
      for (const shift of reassignmentPlan.driversToKeep) {
        if (shift.currentUnit !== shift.newUnit) {
          await NotificationOrchestrator.notifyDriverUnitShift(
            {
              id: shift.driverId,
              firstName: shift.driverName.split(' ')[0] || null,
              lastName: shift.driverName.split(' ').slice(1).join(' ') || null,
              phoneNumber: shift.driverPhone,
            },
            appointment,
            shift.currentUnit,
            shift.newUnit,
            shift.newArrivalTime
          );
        }
        // Drivers staying on same unit don't need notification
      }

      // 4. Move all tasks to Boombox Delivery Network team and clear MP driver assignments
      if (boomboxTeamId) {
        console.log(`🔄 Moving ${appointment.onfleetTasks.length} tasks to Boombox Delivery Network`);
        
        for (const task of appointment.onfleetTasks) {
          try {
            await OnfleetTaskUpdateService.updateTask(
              task.taskId,
              {
                container: {
                  type: 'TEAM',
                  team: boomboxTeamId
                }
              },
              task.shortId
            );
          } catch (error) {
            console.error(`Failed to reassign task ${task.shortId}:`, error);
          }
        }
      }

      // 5. Clear all driver assignments (new DIY drivers will be assigned)
      await prisma.onfleetTask.updateMany({
        where: { appointmentId: appointment.id },
        data: {
          driverNotificationStatus: null,
          lastNotifiedDriverId: null,
          driverNotificationSentAt: null,
          driverAcceptedAt: null,
          driverDeclinedAt: null
        }
      });
      
      // Clear driverId separately using individual updates (for relation field)
      const tasksToUpdate = await prisma.onfleetTask.findMany({
        where: { appointmentId: appointment.id },
        select: { id: true }
      });
      
      for (const task of tasksToUpdate) {
        await prisma.onfleetTask.update({
          where: { id: task.id },
          data: { driver: { disconnect: true } }
        });
      }

      // 6. Delete time slot booking if exists
      await TimeSlotBookingService.deleteBooking(appointment.id);

      console.log(`✅ Smart reassignment complete for DIY conversion`);
    }
    
    // Return pending reconfirmations to be applied after new unit tasks are created
    return pendingReconfirmations;
  }

  /**
   * Apply pending reconfirmations to newly created unit tasks
   * This is called AFTER new tasks are created to set the pending_reconfirmation status
   */
  static async applyPendingReconfirmations(
    appointmentId: number,
    pendingReconfirmations: PendingReconfirmation[]
  ): Promise<void> {
    if (pendingReconfirmations.length === 0) return;

    console.log(`📋 Applying ${pendingReconfirmations.length} pending reconfirmation(s) to new tasks`);

    for (const reconfirm of pendingReconfirmations) {
      // Find the newly created tasks for this unit
      const tasksForUnit = await prisma.onfleetTask.findMany({
        where: {
          appointmentId,
          unitNumber: reconfirm.newUnitNumber
        }
      });

      if (tasksForUnit.length === 0) {
        console.warn(`⚠️ No tasks found for Unit ${reconfirm.newUnitNumber} to apply reconfirmation`);
        continue;
      }

      // Set pending_reconfirmation status on these tasks
      for (const task of tasksForUnit) {
        await prisma.onfleetTask.update({
          where: { id: task.id },
          data: {
            driverNotificationStatus: 'pending_reconfirmation',
            lastNotifiedDriverId: reconfirm.driverId,
            driverNotificationSentAt: new Date(),
          }
        });
      }

      console.log(`✅ Applied pending_reconfirmation to ${tasksForUnit.length} tasks for Unit ${reconfirm.newUnitNumber} (driver: ${reconfirm.driverName})`);
    }
  }

  /**
   * Calculate loading help price with defaults for plan switches
   * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts
   */
  private static calculateLoadingHelpPrice(
    newPlanType: string,
    existingPlanType: string | null,
    providedPrice: number
  ): number {
    // DIY plan has no loading help price
    if (newPlanType === 'Do It Yourself Plan') {
      return 0;
    }
    
    // Switching from DIY to Full Service with no price provided - use default
    if (
      newPlanType === 'Full Service Plan' && 
      existingPlanType === 'Do It Yourself Plan' && 
      providedPrice === 0
    ) {
      return 189; // Default Full Service loading help price
    }
    
    return providedPrice;
  }
}


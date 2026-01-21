/**
 * @fileoverview Onfleet task creation service for additional storage units
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (createAdditionalOnfleetTasks function)
 * @refactor Extracted into dedicated service leveraging existing createOnfleetTasksWithDatabaseSave
 */

import { prisma } from '@/lib/database/prismaClient';
import { createOnfleetTasksWithDatabaseSave } from '@/lib/services/appointmentOnfleetService';
import type { AppointmentUpdateInput } from '@/lib/services/AppointmentUpdateOrchestrator';

/**
 * Task creation result interface
 */
export interface TaskCreationResult {
  success: boolean;
  tasksCreated?: number;
  taskIds?: string[];
  error?: string;
}

/**
 * OnfleetTaskCreationService - Creates Onfleet tasks for additional storage units during appointment edits
 */
export class OnfleetTaskCreationService {
  /**
   * Create Onfleet tasks for newly added storage units
   * 
   * Handles two scenarios:
   * 1. Access Storage: specific newUnitIds are provided
   * 2. Additional Storage: additionalUnitsCount is provided (no specific IDs)
   * 
   * @param appointmentId - The appointment ID
   * @param newUnitIds - Array of new storage unit IDs (for Access Storage)
   * @param updateData - Appointment update data (may include additionalUnitsCount for Additional Storage)
   */
  static async createTasksForAdditionalUnits(
    appointmentId: number,
    newUnitIds: number[],
    updateData: AppointmentUpdateInput
  ): Promise<TaskCreationResult> {
    try {
      // Handle Additional Storage appointments (count-based, no specific unit IDs)
      const additionalUnitsCount = (updateData as any).additionalUnitsCount || 0;
      const isCountBasedCreation = newUnitIds.length === 0 && additionalUnitsCount > 0;

      if (newUnitIds.length === 0 && !isCountBasedCreation) {
        return { success: true, tasksCreated: 0 };
      }

      // For count-based creation, delegate to the dedicated method
      if (isCountBasedCreation) {
        console.log(`📦 Delegating to createTasksForUnitCountIncrease for ${additionalUnitsCount} units`);
        return await this.createTasksForUnitCountIncrease(appointmentId, additionalUnitsCount, updateData);
      }

      console.log(`📦 Creating Onfleet tasks for ${newUnitIds.length} additional units (appointment ${appointmentId})`);

      // Fetch appointment with user details
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          user: true,
          movingPartner: {
            select: { id: true, onfleetTeamId: true }
          },
          onfleetTasks: {
            select: { unitNumber: true }
          },
          requestedStorageUnits: {
            include: { storageUnit: true }
          }
        }
      });

      if (!appointment || !appointment.user) {
        return { success: false, error: 'Appointment or user not found' };
      }

      // Find the highest unit number currently in use
      const highestUnitNumber = appointment.onfleetTasks.length > 0
        ? Math.max(...appointment.onfleetTasks.map(task => task.unitNumber || 0))
        : 0;

      // Create storage unit numbers mapping
      const storageUnitNumbers: Record<number, string> = {};
      appointment.requestedStorageUnits.forEach(relation => {
        storageUnitNumbers[relation.storageUnit.id] = 
          relation.storageUnit.storageUnitNumber || relation.storageUnit.id.toString();
      });

      // Build payload for Onfleet task creation
      const payload = {
        appointmentId,
        userId: appointment.userId,
        firstName: appointment.user.firstName || 'Customer',
        lastName: appointment.user.lastName || '',
        phoneNumber: appointment.user.phoneNumber || '',
        address: updateData.address || appointment.address,
        zipCode: updateData.zipcode || appointment.zipcode,
        appointmentDateTime: updateData.appointmentDateTime 
          ? new Date(updateData.appointmentDateTime).getTime()
          : appointment.time.getTime(),
        selectedPlanName: updateData.planType || appointment.planType,
        deliveryReason: (updateData as any).deliveryReason || appointment.deliveryReason,
        description: updateData.description || appointment.description,
        appointmentType: appointment.appointmentType,
        parsedLoadingHelpPrice: updateData.loadingHelpPrice || appointment.loadingHelpPrice,
        monthlyStorageRate: updateData.monthlyStorageRate || appointment.monthlyStorageRate,
        monthlyInsuranceRate: updateData.monthlyInsuranceRate || appointment.monthlyInsuranceRate,
        calculatedTotal: updateData.quotedPrice || appointment.quotedPrice,
        storageUnitIds: newUnitIds,
        storageUnitNumbers,
        storageUnitCount: newUnitIds.length,
        selectedLabor: updateData.selectedLabor,
        movingPartnerId: updateData.movingPartnerId || appointment.movingPartnerId,
        thirdPartyMovingPartnerId: updateData.thirdPartyMovingPartnerId || appointment.thirdPartyMovingPartnerId,
        stripeCustomerId: 'none',
        startingUnitNumber: highestUnitNumber + 1,
        additionalUnitsOnly: true,
        totalUnitCount: (appointment.numberOfUnits || 0) + newUnitIds.length
      };

      console.log(`📦 Creating tasks starting at unit ${payload.startingUnitNumber}`);

      // Create tasks using existing service
      const result = await createOnfleetTasksWithDatabaseSave(payload);

      console.log(`✅ Created Onfleet tasks for additional units`);

      // Flatten taskIds object into a single array
      const flatTaskIds = result?.taskIds 
        ? [
            ...result.taskIds.pickup, 
            ...result.taskIds.customer, 
            ...result.taskIds.return
          ]
        : [];

      return {
        success: true,
        tasksCreated: newUnitIds.length * 3, // 3 tasks per unit (pickup, customer, return)
        taskIds: flatTaskIds
      };
    } catch (error) {
      console.error(`❌ Error creating tasks for additional units:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create Onfleet tasks for unit count increase (Additional Storage appointments)
   * Used when storage unit count increases but no specific unit IDs are provided
   * 
   * @param appointmentId - The appointment ID
   * @param additionalUnitsCount - Number of additional units to create tasks for
   * @param updateData - Appointment update data
   */
  static async createTasksForUnitCountIncrease(
    appointmentId: number,
    additionalUnitsCount: number,
    updateData: AppointmentUpdateInput
  ): Promise<TaskCreationResult> {
    try {
      console.log(`📦 Creating Onfleet tasks for ${additionalUnitsCount} additional units (appointment ${appointmentId})`);

      if (additionalUnitsCount <= 0) {
        return { success: true, tasksCreated: 0 };
      }

      // Fetch appointment with user details
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          user: true,
          movingPartner: {
            select: { id: true, onfleetTeamId: true }
          },
          onfleetTasks: {
            select: { unitNumber: true }
          }
        }
      });

      if (!appointment || !appointment.user) {
        return { success: false, error: 'Appointment or user not found' };
      }

      // Find the highest unit number currently in use
      const highestUnitNumber = appointment.onfleetTasks.length > 0
        ? Math.max(...appointment.onfleetTasks.map(task => task.unitNumber || 0))
        : 0;

      // Build payload for Onfleet task creation
      const payload = {
        appointmentId,
        userId: appointment.userId,
        firstName: appointment.user.firstName || 'Customer',
        lastName: appointment.user.lastName || '',
        phoneNumber: appointment.user.phoneNumber || '',
        address: updateData.address || appointment.address,
        zipCode: updateData.zipcode || appointment.zipcode,
        appointmentDateTime: updateData.appointmentDateTime 
          ? new Date(updateData.appointmentDateTime).getTime()
          : appointment.time.getTime(),
        selectedPlanName: updateData.planType || appointment.planType,
        description: updateData.description || appointment.description,
        appointmentType: appointment.appointmentType,
        parsedLoadingHelpPrice: updateData.loadingHelpPrice || appointment.loadingHelpPrice,
        monthlyStorageRate: updateData.monthlyStorageRate || appointment.monthlyStorageRate,
        monthlyInsuranceRate: updateData.monthlyInsuranceRate || appointment.monthlyInsuranceRate,
        calculatedTotal: updateData.quotedPrice || appointment.quotedPrice,
        storageUnitIds: [], // No specific unit IDs for Additional Storage
        storageUnitCount: additionalUnitsCount,
        selectedLabor: updateData.selectedLabor,
        movingPartnerId: updateData.movingPartnerId || appointment.movingPartnerId,
        thirdPartyMovingPartnerId: updateData.thirdPartyMovingPartnerId || appointment.thirdPartyMovingPartnerId,
        stripeCustomerId: 'none',
        startingUnitNumber: highestUnitNumber + 1,
        additionalUnitsOnly: true,
        totalUnitCount: (appointment.numberOfUnits || 0) + additionalUnitsCount
      };

      console.log(`📦 Creating tasks starting at unit ${payload.startingUnitNumber}`);

      // Create tasks using existing service
      const result = await createOnfleetTasksWithDatabaseSave(payload);

      console.log(`✅ Created Onfleet tasks for unit count increase`);

      // Flatten taskIds object into a single array
      const flatTaskIds = result?.taskIds 
        ? [
            ...result.taskIds.pickup, 
            ...result.taskIds.customer, 
            ...result.taskIds.return
          ]
        : [];

      return {
        success: true,
        tasksCreated: additionalUnitsCount * 3, // 3 tasks per unit
        taskIds: flatTaskIds
      };
    } catch (error) {
      console.error(`❌ Error creating tasks for unit count increase:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}


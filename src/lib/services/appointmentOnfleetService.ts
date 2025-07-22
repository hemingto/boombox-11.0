/**
 * @fileoverview Appointment-specific Onfleet service for task management during edits
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (various Onfleet functions)
 * @refactor Extracted Onfleet appointment logic into service layer
 */

import { getOnfleetClient } from '@/lib/integrations/onfleetClient';
import { prisma } from '@/lib/database/prismaClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { 
  driverJobCancellationNotificationSms,
  driverPlanChangeNotificationSms,
  movingPartnerPlanChangeNotificationSms,
  movingPartnerTimeChangeNotificationSms
} from '@/lib/messaging/templates/sms/appointment';
import type { AppointmentChanges } from '@/lib/utils/appointmentUtils';

export class AppointmentOnfleetService {
  private messageService: MessageService;

  constructor() {
    this.messageService = new MessageService();
  }

  /**
   * Update Onfleet tasks with new appointment data
   * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (line 74)
   */
  async updateAppointmentTasks(appointmentId: number, updatedData: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Enrich the updatedData if we have movingPartnerId but no selectedLabor.onfleetTeamId
      if (updatedData.planType === 'Full Service Plan' && updatedData.movingPartnerId && 
          (!updatedData.selectedLabor || !updatedData.selectedLabor.onfleetTeamId)) {
        
        // Lookup the moving partner to get their onfleetTeamId
        const movingPartner = await prisma.movingPartner.findUnique({
          where: { id: updatedData.movingPartnerId },
          select: { id: true, name: true, onfleetTeamId: true, hourlyRate: true }
        });
        
        if (movingPartner && movingPartner.onfleetTeamId) {
          // Create or update selectedLabor with the correct information
          updatedData.selectedLabor = {
            id: movingPartner.id.toString(),
            price: `$${movingPartner.hourlyRate}/hr`,
            title: movingPartner.name,
            onfleetTeamId: movingPartner.onfleetTeamId
          };
          console.log('Enriched selectedLabor with onfleetTeamId:', updatedData.selectedLabor);
        }
      }

      // Create request for existing Onfleet update task handler
      const requestData = {
        appointmentId,
        updatedData,
      };

      // Call the existing Onfleet update task logic
      const { updateOnfleetTaskHandler } = await import('@/app/api/onfleet/update-task/route');
      const response = await updateOnfleetTaskHandler(
        new Request('http://localhost:3000/api/onfleet/update-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        })
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Onfleet update failed:', errorData);
        return { success: false, error: 'Failed to update Onfleet tasks' };
      }

      const data = await response.json();
      console.log('Onfleet tasks updated successfully:', data);
      return { success: true };
    } catch (error) {
      console.error('Error updating Onfleet tasks:', error);
      // Don't throw the error to prevent the appointment update from failing
      return { success: false, error: String(error) };
    }
  }

  /**
   * Create additional Onfleet tasks for new storage units
   * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (line 129)
   */
  async createAdditionalTasks(
    appointmentId: number, 
    newStorageUnitIds: number[], 
    updatedData: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          user: true,
          requestedStorageUnits: {
            include: { storageUnit: true }
          }
        }
      });

      if (!appointment) {
        return { success: false, error: 'Appointment not found' };
      }

      // Find highest existing unit number
      const existingTasks = await prisma.onfleetTask.findMany({
        where: { appointmentId },
        select: { unitNumber: true }
      });
      
      const highestUnitNumber = existingTasks.length > 0 
        ? Math.max(...existingTasks.map(task => task.unitNumber || 0))
        : 0;

      // Get storage unit numbers for the new units
      const storageUnits = await prisma.storageUnit.findMany({
        where: { id: { in: newStorageUnitIds } },
        select: { id: true, storageUnitNumber: true }
      });
      
      const storageUnitNumbers = storageUnits.map(unit => unit.storageUnitNumber);

      // Create payload for the Onfleet task creation
      const payload = {
        appointmentId,
        userId: appointment.userId,
        firstName: appointment.user.firstName || 'Customer',
        lastName: appointment.user.lastName || '',
        phoneNumber: appointment.user.phoneNumber || '',
        address: updatedData.address || appointment.address,
        zipCode: updatedData.zipCode || appointment.zipcode,
        appointmentDateTime: updatedData.appointmentDateTime || appointment.time.toISOString(),
        selectedPlanName: updatedData.planType || appointment.planType,
        deliveryReason: updatedData.deliveryReason || appointment.deliveryReason,
        description: updatedData.description || appointment.description,
        appointmentType: updatedData.appointmentType || appointment.appointmentType,
        parsedLoadingHelpPrice: updatedData.parsedLoadingHelpPrice || appointment.loadingHelpPrice,
        monthlyStorageRate: updatedData.monthlyStorageRate || appointment.monthlyStorageRate,
        monthlyInsuranceRate: updatedData.monthlyInsuranceRate || appointment.monthlyInsuranceRate,
        calculatedTotal: updatedData.calculatedTotal || appointment.quotedPrice,
        // Pass the new storage unit IDs
        storageUnitIds: newStorageUnitIds,
        storageUnitNumbers,
        // Use the additionalUnitsCount parameter if provided and no specific unit IDs
        storageUnitCount: newStorageUnitIds.length > 0 ? newStorageUnitIds.length : (updatedData.additionalUnitsCount || 0),
        selectedLabor: updatedData.selectedLabor,
        // Include IDs for proper team assignment
        movingPartnerId: updatedData.movingPartnerId || appointment.movingPartnerId,
        thirdPartyMovingPartnerId: updatedData.thirdPartyMovingPartnerId || appointment.thirdPartyMovingPartnerId,
        stripeCustomerId: updatedData.stripeCustomerId || "none",
        // Add the starting unit number for the new tasks
        startingUnitNumber: highestUnitNumber + 1,
      };

      // Call the existing create Onfleet task handler
      const { POST: createOnfleetTaskHandler } = await import('@/app/api/onfleet/create-task/route');
      const response = await createOnfleetTaskHandler(
        new Request('http://localhost:3000/api/onfleet/create-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Onfleet task creation failed:', errorData);
        return { success: false, error: 'Failed to create additional Onfleet tasks' };
      }

      console.log('Additional Onfleet tasks created successfully');
      return { success: true };
    } catch (error) {
      console.error('Error creating additional Onfleet tasks:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete Onfleet tasks for removed storage units with driver notifications
   * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (line 252)
   */
  async deleteTasksForRemovedUnits(appointmentId: number, unitNumbers: number[]): Promise<number> {
    try {
      console.log(`Finding tasks to delete for appointment ${appointmentId}, units:`, unitNumbers);
      
      // Find all Onfleet tasks for this appointment with the specified unit numbers, including driver info
      const tasksToDelete = await prisma.onfleetTask.findMany({
        where: {
          appointmentId: appointmentId,
          unitNumber: {
            in: unitNumbers
          }
        },
        include: {
          driver: true,
          appointment: true
        }
      });

      console.log(`Found ${tasksToDelete.length} Onfleet tasks to delete:`, 
        tasksToDelete.map(t => ({ id: t.id, taskId: t.taskId, shortId: t.shortId, unit: t.unitNumber, step: t.stepNumber, driverId: t.driverId })));

      // Group drivers by unit to send only one notification per driver per unit
      const driverNotifications: { [key: string]: { driverId: number, phoneNumber: string, unitNumber: number, appointmentDate: Date } } = {};
      
      for (const task of tasksToDelete) {
        if (task.driverId && task.driver?.phoneNumber) {
          const key = `${task.driverId}-${task.unitNumber}`; // Unique key per driver per unit
          if (!driverNotifications[key]) {
            driverNotifications[key] = {
              driverId: task.driverId,
              phoneNumber: task.driver.phoneNumber,
              unitNumber: task.unitNumber,
              appointmentDate: task.appointment.date
            };
          }
        }
      }

      // Send cancellation notifications to affected drivers BEFORE deleting tasks (one per driver per unit)
      for (const notification of Object.values(driverNotifications)) {
        try {
          await MessageService.sendSms(
            notification.phoneNumber,
            driverJobCancellationNotificationSms,
            {
              unitNumber: notification.unitNumber.toString(),
              appointmentDate: notification.appointmentDate.toLocaleDateString()
            }
          );
          console.log(`SMS cancellation notification sent to driver ${notification.driverId} at ${notification.phoneNumber} for unit ${notification.unitNumber}`);
        } catch (error) {
          console.error(`Failed to send cancellation SMS to driver ${notification.driverId}:`, error);
        }
      }

      // Delete tasks from Onfleet first
      for (const task of tasksToDelete) {
        try {
          // Call Onfleet API to delete the task
          const response = await fetch(`https://onfleet.com/api/v2/tasks/${task.taskId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Basic ${Buffer.from(process.env.ONFLEET_API_KEY || '').toString('base64')}`
            }
          });

          if (response.ok) {
            console.log(`Successfully deleted Onfleet task ${task.shortId} from Onfleet`);
          } else {
            console.error(`Failed to delete Onfleet task ${task.shortId} from Onfleet:`, await response.text());
          }
        } catch (error) {
          console.error(`Error deleting Onfleet task ${task.taskId}:`, error);
        }
      }

      // Then delete from database
      const result = await prisma.onfleetTask.deleteMany({
        where: {
          appointmentId: appointmentId,
          unitNumber: {
            in: unitNumbers
          }
        }
      });

      console.log(`Deleted ${result.count} OnfleetTask records from database`);
      return result.count;
    } catch (error) {
      console.error('Error deleting Onfleet tasks:', error);
      return 0;
    }
  }

  /**
   * Handle plan transition from DIY to Full Service (notify and unassign drivers)
   * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (line 486)
   */
  async handleDiyToFullServiceTransition(appointmentId: number): Promise<void> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          onfleetTasks: {
            include: { driver: true }
          }
        }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const onfleetClient = await getOnfleetClient();
      
      // First, collect all unique drivers to notify
      const driversToNotify: { [key: number]: { phoneNumber: string, driverId: number } } = {};
      for (const task of appointment.onfleetTasks) {
        if (task.driverId && task.driver?.phoneNumber) {
          driversToNotify[task.driverId] = {
            phoneNumber: task.driver.phoneNumber,
            driverId: task.driverId
          };
        }
      }
      
      // Send one notification per unique driver BEFORE processing tasks
      for (const driverId in driversToNotify) {
        const driverInfo = driversToNotify[driverId];
        try {
          await MessageService.sendSms(
            driverInfo.phoneNumber,
            driverPlanChangeNotificationSms,
            {
              appointmentDate: appointment.date.toLocaleDateString()
            }
          );
          console.log(`SMS notification sent to driver ${driverId} at ${driverInfo.phoneNumber}`);
        } catch (error) {
          console.error(`Failed to send SMS to driver ${driverId}:`, error);
        }
      }
      
      // Now process all tasks (unassign from Onfleet and update database)
      for (const task of appointment.onfleetTasks) {
        if (task.driverId && task.driver?.phoneNumber) {
          try {
            await (onfleetClient as any).tasks.update(task.taskId, { container: { type: "ORGANIZATION" } });
            console.log(`Unassigned driver ${task.driverId} from Onfleet task ${task.taskId}`);
          } catch (error) {
            console.error(`Failed to unassign driver from Onfleet task ${task.taskId}:`, error);
          }
        }
        await prisma.onfleetTask.update({
          where: { id: task.id },
          data: {
            driverId: null,
            driverNotificationStatus: 'cancelled',
            driverAcceptedAt: null,
            declinedDriverIds: [],
          },
        });
      }
    } catch (error) {
      console.error('Error handling DIY to Full Service transition:', error);
      throw error;
    }
  }

  /**
   * Handle plan transition from Full Service to DIY (notify moving partner and reassign tasks)
   * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (line 530)
   */
  async handleFullServiceToDiyTransition(appointmentId: number): Promise<void> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          onfleetTasks: true,
          movingPartner: true,
          user: true
        }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const onfleetClient = await getOnfleetClient();
      
      // Notify the Moving Partner they've been unassigned
      if (appointment.movingPartner) {
        const movingPartner = appointment.movingPartner;
        console.log(`Notifying Moving Partner ${movingPartner.name} they've been unassigned due to plan change to DIY`);
        
        // Send SMS notification if Moving Partner has phone number
        if (movingPartner.phoneNumber) {
          try {
            await MessageService.sendSms(
              movingPartner.phoneNumber,
              movingPartnerPlanChangeNotificationSms,
              {
                appointmentId: appointmentId.toString(),
                appointmentDate: appointment.date.toLocaleDateString()
              }
            );
            console.log(`SMS notification sent to Moving Partner ${movingPartner.phoneNumber}`);
          } catch (error) {
            console.error(`Error sending SMS to Moving Partner:`, error);
          }
        }
      }
      
      // Update Onfleet tasks to move them from Moving Partner team to Boombox Delivery Network
      for (const task of appointment.onfleetTasks) {
        try {
          // Move task from Moving Partner team to Boombox Delivery Network team
          await (onfleetClient as any).tasks.update(task.taskId, {
            container: { type: "TEAM", team: process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID }
          });
          console.log(`Moved task ${task.taskId} from Moving Partner team to Boombox Delivery Network`);
        } catch (error) {
          console.error(`Failed to move task ${task.taskId} to Boombox team:`, error);
        }
        
        // Clear any Moving Partner driver assignments and reset status
        await prisma.onfleetTask.update({
          where: { id: task.id },
          data: {
            driverId: null,
            driverNotificationStatus: null,
            driverAcceptedAt: null,
            declinedDriverIds: [],
            lastNotifiedDriverId: null,
            driverNotificationSentAt: null,
          },
        });
      }
      
      console.log(`Moved tasks to Boombox team for DIY Plan appointment ${appointmentId}`);
    } catch (error) {
      console.error('Error handling Full Service to DIY transition:', error);
      throw error;
    }
  }

  /**
   * Notify moving partner of time change
   * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (line 740)
   */
  async notifyMovingPartnerTimeChange(
    appointmentId: number,
    originalDateTime: Date,
    newDateTime: Date
  ): Promise<void> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          movingPartner: true,
          user: true
        }
      });

      if (!appointment?.movingPartner) {
        return;
      }

      // Format dates for notifications
      const originalDateStr = originalDateTime.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
      const newDateStr = newDateTime.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
      
      // Moving Partners need to arrive 1 hour earlier than the customer appointment time
      const originalTimeMinusOneHour = new Date(originalDateTime.getTime() - (60 * 60 * 1000));
      const newTimeMinusOneHour = new Date(newDateTime.getTime() - (60 * 60 * 1000));
      
      const originalTimeStr = originalTimeMinusOneHour.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
      const newTimeStr = newTimeMinusOneHour.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });

      // Send SMS notification if Moving Partner has phone number
      if (appointment.movingPartner.phoneNumber) {
        try {
          await this.messageService.sendSms(
            appointment.movingPartner.phoneNumber,
            movingPartnerTimeChangeNotificationSms,
            {
              appointmentId: appointmentId.toString(),
              originalDate: originalDateStr,
              originalTime: originalTimeStr,
              newDate: newDateStr,
              newTime: newTimeStr,
              customerName: `${appointment.user?.firstName} ${appointment.user?.lastName}`,
              address: appointment.address
            }
          );
          console.log(`SMS time change notification sent to Moving Partner ${appointment.movingPartner.phoneNumber}`);
        } catch (error) {
          console.error(`Error sending time change SMS to Moving Partner:`, error);
        }
      }
    } catch (error) {
      console.error('Error notifying moving partner of time change:', error);
      throw error;
    }
  }
} 
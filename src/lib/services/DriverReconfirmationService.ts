/**
 * @fileoverview Driver reconfirmation service for handling time change reconfirmation flows
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (reconfirmation logic)
 * @refactor Extracted driver reconfirmation into dedicated service using messaging system
 */

import { prisma } from '@/lib/database/prismaClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { driverReconfirmationRequestSms } from '@/lib/messaging/templates/sms/appointment/driverReconfirmationRequest';
import { driverUnitShiftReconfirmationSms } from '@/lib/messaging/templates/sms/appointment/driverUnitShiftReconfirmation';
import {
  generateDriverReconfirmToken,
  generateDriverWebViewUrl,
  formatTimeMinusOneHour
} from '@/lib/utils/appointmentUtils';
import { formatVerboseDate } from '@/lib/utils/dateUtils';

/**
 * Driver info for reconfirmation
 */
export interface DriverReconfirmInfo {
  id: number;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
}

/**
 * Appointment info for reconfirmation
 */
export interface AppointmentReconfirmInfo {
  id: number;
  appointmentType: string;
  address: string | null;
  date: Date;
  time: Date;
  description: string | null;
}

/**
 * Reconfirmation result
 */
export interface ReconfirmationResult {
  success: boolean;
  driverId: number;
  smsSent?: boolean;
  error?: string;
}

/**
 * DriverReconfirmationService - Handles driver reconfirmation when appointments are edited
 */
export class DriverReconfirmationService {
  /**
   * Send reconfirmation request to a driver after time change
   * 
   * @param driver - Driver info
   * @param appointment - Appointment info
   * @param oldTime - Original appointment time
   * @param newTime - New appointment time
   * @param unitNumber - Unit number for this driver's tasks
   */
  static async sendReconfirmationRequest(
    driver: DriverReconfirmInfo,
    appointment: AppointmentReconfirmInfo,
    oldTime: Date,
    newTime: Date,
    unitNumber: number
  ): Promise<ReconfirmationResult> {
    try {
      console.log(`📱 Sending reconfirmation request to driver ${driver.id} for appointment ${appointment.id}`);

      if (!driver.phoneNumber) {
        console.warn(`⚠️  Driver ${driver.id} has no phone number`);
        return {
          success: false,
          driverId: driver.id,
          error: 'Driver has no phone number'
        };
      }

      // Generate reconfirmation token and URL
      const token = generateDriverReconfirmToken(driver.id, appointment.id, unitNumber);
      const webViewUrl = generateDriverWebViewUrl(token);

      // Format times for SMS
      const originalDate = formatVerboseDate(oldTime);
      const originalTime = formatTimeMinusOneHour(oldTime);
      const newDate = formatVerboseDate(newTime);
      const newTimeFormatted = formatTimeMinusOneHour(newTime);

      // Send SMS using messaging service
      const smsResult = await MessageService.sendSms(
        driver.phoneNumber,
        driverReconfirmationRequestSms,
        {
          appointmentType: appointment.appointmentType,
          originalDate,
          originalTime,
          newDate,
          newTime: newTimeFormatted,
          webViewUrl
        }
      );

      if (!smsResult.success) {
        console.error(`❌ Failed to send reconfirmation SMS to driver ${driver.id}:`, smsResult.error);
        return {
          success: false,
          driverId: driver.id,
          smsSent: false,
          error: smsResult.error
        };
      }

      console.log(`✅ Reconfirmation SMS sent to driver ${driver.id}`);

      return {
        success: true,
        driverId: driver.id,
        smsSent: true
      };
    } catch (error) {
      console.error(`❌ Error sending reconfirmation to driver ${driver.id}:`, error);
      return {
        success: false,
        driverId: driver.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update task status to pending reconfirmation
   * 
   * @param appointmentId - Appointment ID
   * @param driverId - Driver ID
   * @param unitNumber - Unit number for the tasks
   */
  static async updateTasksToReconfirmationPending(
    appointmentId: number,
    driverId: number,
    unitNumber: number
  ): Promise<void> {
    console.log(`📝 Updating tasks to pending_reconfirmation for appointment ${appointmentId}, driver ${driverId}`);

    await prisma.onfleetTask.updateMany({
      where: {
        appointmentId,
        driverId,
        unitNumber
      },
      data: {
        driverNotificationStatus: 'pending_reconfirmation',
        lastNotifiedDriverId: driverId,
        driverNotificationSentAt: new Date()
      }
    });

    console.log(`✅ Task status updated to pending_reconfirmation`);
  }

  /**
   * Process reconfirmation for all assigned drivers on an appointment
   * Called when time changes and drivers need to reconfirm
   * 
   * @param appointment - Appointment with relations
   * @param oldTime - Original appointment time
   * @param newTime - New appointment time
   */
  static async processReconfirmationsForAppointment(
    appointment: {
      id: number;
      appointmentType: string;
      address: string | null;
      date: Date;
      time: Date;
      description: string | null;
      onfleetTasks: Array<{
        id: number;
        unitNumber: number | null;
        driverId: number | null;
        workerType?: string | null;
        driver?: {
          id: number;
          firstName: string | null;
          lastName: string | null;
          phoneNumber: string | null;
        } | null;
      }>;
    },
    oldTime: Date,
    newTime: Date
  ): Promise<ReconfirmationResult[]> {
    console.log(`🔄 Processing reconfirmations for appointment ${appointment.id}`);

    const results: ReconfirmationResult[] = [];
    const processedDriverUnitPairs = new Set<string>();

    for (const task of appointment.onfleetTasks) {
      if (!task.driverId || !task.driver || !task.unitNumber) {
        continue;
      }

      // Only send reconfirmation to Boombox Delivery Network drivers
      // Moving Partner drivers coordinate with their employer, they don't need our reconfirmation
      if (task.workerType !== 'boombox_driver') {
        console.log(`⏭️ Skipping reconfirmation for driver ${task.driverId} - workerType: ${task.workerType || 'unknown'} (not boombox_driver)`);
        continue;
      }

      // Avoid sending duplicate SMS to same driver for same unit
      const pairKey = `${task.driverId}-${task.unitNumber}`;
      if (processedDriverUnitPairs.has(pairKey)) {
        continue;
      }
      processedDriverUnitPairs.add(pairKey);

      // Send reconfirmation request
      const result = await this.sendReconfirmationRequest(
        task.driver,
        {
          id: appointment.id,
          appointmentType: appointment.appointmentType,
          address: appointment.address,
          date: appointment.date,
          time: appointment.time,
          description: appointment.description
        },
        oldTime,
        newTime,
        task.unitNumber
      );

      results.push(result);

      // Update task status if SMS was sent successfully
      if (result.success && result.smsSent) {
        await this.updateTasksToReconfirmationPending(
          appointment.id,
          task.driverId,
          task.unitNumber
        );
      }
    }

    console.log(`✅ Processed ${results.length} reconfirmation requests`);
    return results;
  }

  /**
   * Check if any drivers need reconfirmation for an appointment
   * 
   * @param appointmentId - Appointment ID
   * @returns True if any tasks have assigned drivers
   */
  static async hasAssignedDrivers(appointmentId: number): Promise<boolean> {
    const tasksWithDrivers = await prisma.onfleetTask.count({
      where: {
        appointmentId,
        driverId: { not: null }
      }
    });

    return tasksWithDrivers > 0;
  }

  /**
   * Check if any Boombox Delivery Network drivers are assigned to an appointment
   * Only Boombox drivers need reconfirmation when time changes.
   * Moving Partner drivers coordinate with their employer instead.
   * 
   * @param appointmentId - Appointment ID
   * @returns True if any tasks have assigned Boombox drivers
   */
  static async hasAssignedBoomboxDrivers(appointmentId: number): Promise<boolean> {
    const tasksWithBoomboxDrivers = await prisma.onfleetTask.count({
      where: {
        appointmentId,
        driverId: { not: null },
        workerType: 'boombox_driver'  // Note: value is 'boombox_driver' not 'boombox'
      }
    });

    console.log(`DEBUG: hasAssignedBoomboxDrivers for appointment ${appointmentId}: ${tasksWithBoomboxDrivers} tasks found`);
    return tasksWithBoomboxDrivers > 0;
  }

  /**
   * Send unit shift reconfirmation request to a driver
   * Used when a driver is shifted to a different unit (e.g., DIY → Full Service)
   * and needs to confirm the new arrival time works for them.
   * 
   * @param driver - Driver info
   * @param appointmentId - Appointment ID
   * @param appointmentDate - Date of the appointment
   * @param oldUnitNumber - Original unit number
   * @param newUnitNumber - New unit number
   * @param newArrivalTime - New arrival time for the shifted unit
   */
  static async sendUnitShiftReconfirmation(
    driver: DriverReconfirmInfo,
    appointmentId: number,
    appointmentDate: Date,
    oldUnitNumber: number,
    newUnitNumber: number,
    newArrivalTime: Date
  ): Promise<ReconfirmationResult> {
    try {
      console.log(`📱 Sending unit shift reconfirmation to driver ${driver.id} for appointment ${appointmentId}`);
      console.log(`   Shift: Unit ${oldUnitNumber} → Unit ${newUnitNumber}, arrival time: ${newArrivalTime.toISOString()}`);

      if (!driver.phoneNumber) {
        console.warn(`⚠️  Driver ${driver.id} has no phone number`);
        return {
          success: false,
          driverId: driver.id,
          error: 'Driver has no phone number'
        };
      }

      // Generate reconfirmation token and URL for the NEW unit
      const token = generateDriverReconfirmToken(driver.id, appointmentId, newUnitNumber);
      const webViewUrl = generateDriverWebViewUrl(token);

      // Format date and time for SMS
      const formattedDate = formatVerboseDate(appointmentDate);
      const formattedArrivalTime = formatTimeMinusOneHour(newArrivalTime);

      // Send SMS using messaging service
      const smsResult = await MessageService.sendSms(
        driver.phoneNumber,
        driverUnitShiftReconfirmationSms,
        {
          appointmentDate: formattedDate,
          newUnit: newUnitNumber.toString(),
          newArrivalTime: formattedArrivalTime,
          webViewUrl
        }
      );

      if (!smsResult.success) {
        console.error(`❌ Failed to send unit shift reconfirmation SMS to driver ${driver.id}:`, smsResult.error);
        return {
          success: false,
          driverId: driver.id,
          smsSent: false,
          error: smsResult.error
        };
      }

      console.log(`✅ Unit shift reconfirmation SMS sent to driver ${driver.id}`);

      return {
        success: true,
        driverId: driver.id,
        smsSent: true
      };
    } catch (error) {
      console.error(`❌ Error sending unit shift reconfirmation to driver ${driver.id}:`, error);
      return {
        success: false,
        driverId: driver.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update tasks for a driver being shifted to a new unit.
   * Sets status to pending_reconfirmation and prepares tasks for the new unit assignment.
   * 
   * @param appointmentId - Appointment ID
   * @param driverId - Driver ID
   * @param oldUnitNumber - Original unit number (to clear)
   * @param newUnitNumber - New unit number (to assign pending reconfirmation)
   */
  static async updateTasksForUnitShiftReconfirmation(
    appointmentId: number,
    driverId: number,
    oldUnitNumber: number,
    newUnitNumber: number
  ): Promise<void> {
    console.log(`📝 Updating tasks for unit shift reconfirmation: appointment ${appointmentId}, driver ${driverId}`);
    console.log(`   Clearing assignment from unit ${oldUnitNumber}, setting pending_reconfirmation for unit ${newUnitNumber}`);

    // 1. Clear driver from old unit tasks
    await prisma.onfleetTask.updateMany({
      where: {
        appointmentId,
        unitNumber: oldUnitNumber,
        driverId
      },
      data: {
        driverNotificationStatus: null,
        lastNotifiedDriverId: null,
        driverNotificationSentAt: null,
        driverAcceptedAt: null,
        driverDeclinedAt: null
      }
    });

    // Disconnect driver relation (need individual updates for relation field)
    const oldUnitTasks = await prisma.onfleetTask.findMany({
      where: {
        appointmentId,
        unitNumber: oldUnitNumber,
        driverId
      },
      select: { id: true }
    });

    for (const task of oldUnitTasks) {
      await prisma.onfleetTask.update({
        where: { id: task.id },
        data: { driver: { disconnect: true } }
      });
    }

    // 2. Set new unit tasks to pending_reconfirmation with this driver as pending
    await prisma.onfleetTask.updateMany({
      where: {
        appointmentId,
        unitNumber: newUnitNumber
      },
      data: {
        driverNotificationStatus: 'pending_reconfirmation',
        lastNotifiedDriverId: driverId,
        driverNotificationSentAt: new Date()
      }
    });

    console.log(`✅ Tasks updated for unit shift reconfirmation`);
  }
}


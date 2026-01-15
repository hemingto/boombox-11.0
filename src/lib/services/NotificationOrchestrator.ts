/**
 * @fileoverview Centralized notification orchestrator for appointment changes
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (notification logic)
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/mover-driver-cancel/route.ts (mover change notifications)
 * @refactor Consolidated notification logic with driver de-duplication and template usage
 */

import { MessageService } from '@/lib/messaging/MessageService';
import { prisma } from '@/lib/database/prismaClient';
import {
  formatAppointmentDateForSms,
  formatTimeMinusOneHour,
  type AppointmentChanges,
} from '@/lib/utils/appointmentUtils';
import { NotificationService } from './NotificationService';

// Import templates (will be created in Phase 3)
import {
  driverTimeChangeNotificationSms,
  driverReassignmentNotificationSms,
  driverTaskCancellationNotificationSms,
  driverUnitShiftNotificationSms,
  movingPartnerTimeChangeNotificationSms,
} from '@/lib/messaging/templates/sms/appointment';
import {
  movingPartnerTimeChangeNotificationEmail,
  movingPartnerPlanChangeToDIYEmail,
} from '@/lib/messaging/templates/email/appointment';

/**
 * Driver information interface
 */
export interface DriverInfo {
  id: number;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  workerType?: string | null;
}

/**
 * Moving partner information interface
 */
export interface MovingPartnerInfo {
  id: number;
  name: string;
  phoneNumber: string | null;
  email: string | null;
}

/**
 * Appointment information for notifications
 */
export interface AppointmentInfo {
  id: number;
  appointmentType: string;
  date: Date;
  time: Date;
  address: string | null;
  description: string | null;
  user: {
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
  };
}

/**
 * NotificationOrchestrator - Centralized notification logic with de-duplication
 */
export class NotificationOrchestrator {
  /**
   * Collect unique drivers from tasks (prevents duplicate notifications)
   * @param tasks - Array of tasks with driver information
   * @returns Array of unique drivers with workerType
   */
  static collectUniqueDrivers(tasks: any[]): DriverInfo[] {
    const driverMap = new Map<number, DriverInfo>();

    for (const task of tasks) {
      if (task.driverId && task.driver) {
        driverMap.set(task.driverId, {
          id: task.driverId,
          firstName: task.driver.firstName,
          lastName: task.driver.lastName,
          phoneNumber: task.driver.phoneNumber,
          workerType: task.workerType || null,
        });
      }
    }

    return Array.from(driverMap.values());
  }

  /**
   * Collect unique Moving Partner drivers from tasks
   * These drivers only get informational notifications, not reconfirmation requests
   * Note: workerType values are 'moving_partner' or 'boombox_driver'
   * @param tasks - Array of tasks with driver information
   * @returns Array of unique Moving Partner drivers
   */
  static collectUniqueMovingPartnerDrivers(tasks: any[]): DriverInfo[] {
    const driverMap = new Map<number, DriverInfo>();

    for (const task of tasks) {
      // Only collect moving_partner drivers (not boombox_driver)
      // boombox_driver types get reconfirmation requests instead
      if (task.driverId && task.driver && task.workerType === 'moving_partner') {
        driverMap.set(task.driverId, {
          id: task.driverId,
          firstName: task.driver.firstName,
          lastName: task.driver.lastName,
          phoneNumber: task.driver.phoneNumber,
          workerType: 'moving_partner',
        });
      }
    }

    return Array.from(driverMap.values());
  }

  /**
   * Notify driver of appointment time change
   * @param driver - Driver information
   * @param oldTime - Original appointment time
   * @param newTime - New appointment time
   * @param appointment - Appointment information
   */
  static async notifyDriverOfTimeChange(
    driver: DriverInfo,
    oldTime: Date,
    newTime: Date,
    appointment: AppointmentInfo
  ): Promise<boolean> {
    if (!driver.phoneNumber) {
      console.log(`Driver ${driver.id} has no phone number, skipping SMS`);
      return false;
    }

    try {
      const originalDateStr = formatAppointmentDateForSms(oldTime);
      const newDateStr = formatAppointmentDateForSms(newTime);
      const originalTimeStr = formatTimeMinusOneHour(oldTime);
      const newTimeStr = formatTimeMinusOneHour(newTime);

      await MessageService.sendSms(
        driver.phoneNumber,
        driverTimeChangeNotificationSms,
        {
          appointmentId: appointment.id.toString(),
          originalDate: originalDateStr,
          originalTime: originalTimeStr,
          newDate: newDateStr,
          newTime: newTimeStr,
          customerName: `${appointment.user.firstName} ${appointment.user.lastName}`,
          address: appointment.address || 'Unknown address',
        }
      );

      console.log(`✅ Time change SMS sent to driver ${driver.id} at ${driver.phoneNumber}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send time change SMS to driver ${driver.id}:`, error);
      return false;
    }
  }

  /**
   * Notify moving partner of appointment time change
   * @param mover - Moving partner information
   * @param oldTime - Original appointment time
   * @param newTime - New appointment time
   * @param appointment - Appointment information
   */
  static async notifyMovingPartnerOfTimeChange(
    mover: MovingPartnerInfo,
    oldTime: Date,
    newTime: Date,
    appointment: AppointmentInfo
  ): Promise<{ sms: boolean; email: boolean }> {
    const result = { sms: false, email: false };

    const originalDateStr = formatAppointmentDateForSms(oldTime);
    const newDateStr = formatAppointmentDateForSms(newTime);
    const originalTimeStr = formatTimeMinusOneHour(oldTime);
    const newTimeStr = formatTimeMinusOneHour(newTime);

    // Send SMS if phone number available
    if (mover.phoneNumber) {
      try {
        await MessageService.sendSms(
          mover.phoneNumber,
          movingPartnerTimeChangeNotificationSms,
          {
            appointmentId: appointment.id.toString(),
            originalDate: originalDateStr,
            originalTime: originalTimeStr,
            newDate: newDateStr,
            newTime: newTimeStr,
            customerName: `${appointment.user.firstName} ${appointment.user.lastName}`,
            address: appointment.address || 'Unknown address',
          }
        );

        console.log(`✅ Time change SMS sent to moving partner ${mover.name}`);
        result.sms = true;
      } catch (error) {
        console.error(`❌ Failed to send time change SMS to moving partner ${mover.name}:`, error);
      }
    }

    // Send email if email available
    if (mover.email) {
      try {
        await MessageService.sendEmail(
          mover.email,
          movingPartnerTimeChangeNotificationEmail,
          {
            movingPartnerName: mover.name,
            appointmentId: appointment.id.toString(),
            originalDate: originalDateStr,
            originalTime: originalTimeStr,
            newDate: newDateStr,
            newTime: newTimeStr,
            customerName: `${appointment.user.firstName} ${appointment.user.lastName}`,
            appointmentType: appointment.appointmentType,
            address: appointment.address || 'Unknown address',
          }
        );

        console.log(`✅ Time change email sent to moving partner ${mover.email}`);
        result.email = true;
      } catch (error) {
        console.error(`❌ Failed to send time change email to moving partner ${mover.email}:`, error);
      }
    }

    return result;
  }

  /**
   * Notify driver of task reassignment
   * @param driver - Driver information
   * @param appointment - Appointment information
   * @param reason - Reason for reassignment
   */
  static async notifyDriverReassignment(
    driver: DriverInfo,
    appointment: AppointmentInfo,
    reason: string
  ): Promise<boolean> {
    if (!driver.phoneNumber) {
      console.log(`Driver ${driver.id} has no phone number, skipping SMS`);
      return false;
    }

    try {
      const appointmentDateStr = formatAppointmentDateForSms(appointment.date);

      await MessageService.sendSms(
        driver.phoneNumber,
        driverReassignmentNotificationSms,
        {
          appointmentDate: appointmentDateStr,
          reason: reason,
        }
      );

      console.log(`✅ Reassignment SMS sent to driver ${driver.id} at ${driver.phoneNumber}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send reassignment SMS to driver ${driver.id}:`, error);
      return false;
    }
  }

  /**
   * Notify driver of unit shift (moved to different unit, not removed from job)
   * This is used when a driver is shifted to a later unit during plan changes
   * (e.g., DIY → Full Service: Boombox driver moves from Unit 1 to Unit 2)
   * 
   * @param driver - Driver information
   * @param appointment - Appointment information
   * @param oldUnitNumber - Original unit number
   * @param newUnitNumber - New unit number
   * @param newArrivalTime - New arrival time for the shifted unit
   */
  static async notifyDriverUnitShift(
    driver: DriverInfo,
    appointment: AppointmentInfo,
    oldUnitNumber: number,
    newUnitNumber: number,
    newArrivalTime: Date
  ): Promise<boolean> {
    if (!driver.phoneNumber) {
      console.log(`Driver ${driver.id} has no phone number, skipping SMS`);
      return false;
    }

    try {
      const appointmentDateStr = formatAppointmentDateForSms(appointment.date);
      
      // Format arrival time (e.g., "9:45 AM")
      const arrivalTimeStr = newArrivalTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      await MessageService.sendSms(
        driver.phoneNumber,
        driverUnitShiftNotificationSms,
        {
          appointmentDate: appointmentDateStr,
          newUnit: newUnitNumber.toString(),
          arrivalTime: arrivalTimeStr,
          oldUnit: oldUnitNumber.toString(),
        }
      );

      console.log(`✅ Unit shift SMS sent to driver ${driver.id} at ${driver.phoneNumber} (Unit ${oldUnitNumber} → ${newUnitNumber})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send unit shift SMS to driver ${driver.id}:`, error);
      return false;
    }
  }

  /**
   * Notify moving partner of job assignment
   * @param mover - Moving partner information
   * @param appointment - Appointment information
   */
  static async notifyMovingPartnerAssignment(
    mover: MovingPartnerInfo,
    appointment: AppointmentInfo
  ): Promise<{ sms: boolean; email: boolean }> {
    const result = { sms: false, email: false };

    const appointmentDateStr = formatAppointmentDateForSms(appointment.date);
    const appointmentTimeStr = formatTimeMinusOneHour(appointment.time);

    // For now, using simple inline messages (can be templatized later)
    const smsMessage = `Boombox: New job assigned! Customer: ${appointment.user.firstName} ${appointment.user.lastName}. Date: ${appointmentDateStr} at ${appointmentTimeStr}. Address: ${appointment.address}`;

    if (mover.phoneNumber) {
      try {
        // Using MessageService's direct sendSms with string message
        const twilioClient = require('twilio')(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        
        await twilioClient.messages.create({
          body: smsMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: mover.phoneNumber,
        });

        console.log(`✅ Assignment SMS sent to moving partner ${mover.name}`);
        result.sms = true;
      } catch (error) {
        console.error(`❌ Failed to send assignment SMS to moving partner ${mover.name}:`, error);
      }
    }

    return result;
  }

  /**
   * Notify driver of task cancellation (for storage unit reduction)
   * @param driver - Driver information
   * @param appointment - Appointment information
   * @param reason - Reason for cancellation
   */
  static async notifyDriverTaskCancellation(
    driver: DriverInfo,
    appointment: AppointmentInfo,
    reason: string
  ): Promise<boolean> {
    if (!driver.phoneNumber) {
      console.log(`Driver ${driver.id} has no phone number, skipping SMS`);
      return false;
    }

    try {
      const appointmentDateStr = formatAppointmentDateForSms(appointment.date);

      await MessageService.sendSms(
        driver.phoneNumber,
        driverTaskCancellationNotificationSms,
        {
          appointmentDate: appointmentDateStr,
          reason: reason,
        }
      );

      console.log(`✅ Task cancellation SMS sent to driver ${driver.id} at ${driver.phoneNumber}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send task cancellation SMS to driver ${driver.id}:`, error);
      return false;
    }
  }

  /**
   * Notify moving partner of plan change to DIY
   * @param mover - Moving partner information
   * @param appointment - Appointment information
   */
  static async notifyMovingPartnerPlanChangeToDIY(
    mover: MovingPartnerInfo,
    appointment: AppointmentInfo
  ): Promise<{ sms: boolean; email: boolean }> {
    const result = { sms: false, email: false };

    const appointmentDateStr = formatAppointmentDateForSms(appointment.date);
    const appointmentTimeStr = formatTimeMinusOneHour(appointment.time);

    // Send SMS if phone number available
    if (mover.phoneNumber) {
      try {
        const smsMessage = `Boombox: Job cancelled for ${appointmentDateStr}. Customer switched to DIY plan. You are no longer assigned to this job.`;

        const twilioClient = require('twilio')(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        
        await twilioClient.messages.create({
          body: smsMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: mover.phoneNumber,
        });

        console.log(`✅ Plan change SMS sent to moving partner ${mover.name}`);
        result.sms = true;
      } catch (error) {
        console.error(`❌ Failed to send plan change SMS to moving partner ${mover.name}:`, error);
      }
    }

    // Send email if email available
    if (mover.email) {
      try {
        await MessageService.sendEmail(
          mover.email,
          movingPartnerPlanChangeToDIYEmail,
          {
            movingPartnerName: mover.name,
            appointmentId: appointment.id.toString(),
            customerName: `${appointment.user.firstName} ${appointment.user.lastName}`,
            appointmentDate: appointmentDateStr,
            appointmentTime: appointmentTimeStr,
            address: appointment.address || 'Unknown address',
            appointmentType: appointment.appointmentType,
          }
        );

        console.log(`✅ Plan change email sent to moving partner ${mover.email}`);
        result.email = true;
      } catch (error) {
        console.error(`❌ Failed to send plan change email to moving partner ${mover.email}:`, error);
      }
    }

    return result;
  }

  /**
   * Request customer approval for mover change (via SMS web link)
   * @param customer - Customer information
   * @param oldMover - Original moving partner
   * @param newMover - Suggested replacement moving partner
   * @param appointment - Appointment information
   */
  static async requestCustomerMoverChangeApproval(
    customer: { phoneNumber: string | null },
    oldMover: MovingPartnerInfo,
    newMover: MovingPartnerInfo,
    appointment: AppointmentInfo
  ): Promise<boolean> {
    if (!customer.phoneNumber) {
      console.log('Customer has no phone number, cannot send mover change request');
      return false;
    }

    try {
      // Generate token and web view URL
      const token = await this.generateCustomerMoverChangeToken(
        appointment.id,
        newMover.id,
        oldMover.id
      );
      
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.boomboxstorage.com';
      const webViewUrl = `${baseUrl}/customer/mover-change/${token}`;

      const appointmentDateStr = formatAppointmentDateForSms(appointment.date);
      const appointmentTimeStr = formatTimeMinusOneHour(appointment.time);

      // For now, using inline message (can be templatized)
      const message = `Your moving partner for ${appointmentDateStr} at ${appointmentTimeStr} has cancelled. We've found ${newMover.name} as a replacement. Reply "ACCEPT" to confirm or "DIY" to switch to DIY plan. Details: ${webViewUrl}`;

      const twilioClient = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: customer.phoneNumber,
      });

      console.log(`✅ Mover change request SMS sent to customer`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send mover change request SMS:', error);
      return false;
    }
  }

  /**
   * Generate customer mover change token
   */
  private static async generateCustomerMoverChangeToken(
    appointmentId: number,
    suggestedMovingPartnerId: number,
    originalMovingPartnerId: number
  ): Promise<string> {
    const payload = {
      appointmentId,
      suggestedMovingPartnerId,
      originalMovingPartnerId,
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Handle all appointment change notifications based on detected changes
   * @param existingAppointment - Original appointment
   * @param updatedAppointment - Updated appointment
   * @param changes - Detected changes
   * @returns Array of notification types sent
   */
  static async handleAppointmentChangeNotifications(
    existingAppointment: any,
    updatedAppointment: any,
    changes: AppointmentChanges
  ): Promise<string[]> {
    const notificationsSent: string[] = [];

    try {
      // Handle time changes
      if (changes.timeChanged) {
        console.log('⏰ Time changed, notifying moving partners and moving partner drivers');

        // Only notify Moving Partner drivers with informational SMS
        // Boombox Delivery Network drivers get reconfirmation requests (handled in AppointmentUpdateOrchestrator step 10)
        const movingPartnerDrivers = this.collectUniqueMovingPartnerDrivers(existingAppointment.onfleetTasks);
        for (const driver of movingPartnerDrivers) {
          const sent = await this.notifyDriverOfTimeChange(
            driver,
            existingAppointment.time,
            updatedAppointment.time,
            updatedAppointment
          );
          if (sent) notificationsSent.push(`driver_time_change_${driver.id}`);
        }

        // Notify moving partner company if assigned
        if (existingAppointment.movingPartner) {
          const result = await this.notifyMovingPartnerOfTimeChange(
            existingAppointment.movingPartner,
            existingAppointment.time,
            updatedAppointment.time,
            updatedAppointment
          );
          if (result.sms) notificationsSent.push('mover_time_change_sms');
          if (result.email) notificationsSent.push('mover_time_change_email');
        }

        // Create in-app notification for customer (APPOINTMENT_UPDATED)
        try {
          await NotificationService.notifyAppointmentUpdated(
            updatedAppointment.user.id || updatedAppointment.userId,
            {
              appointmentId: updatedAppointment.id,
              appointmentType: updatedAppointment.appointmentType,
              date: updatedAppointment.date,
              time: updatedAppointment.time,
              address: updatedAppointment.address || ''
            }
          );
          notificationsSent.push('customer_appointment_updated');
        } catch (notificationError) {
          console.error('Error creating in-app update notification:', notificationError);
        }
      }

      // Handle plan changes
      // NOTE: Driver and Moving Partner notifications for plan changes are now handled 
      // by AppointmentUpdateOrchestrator.handlePlanSwitch() which uses smart reassignment
      // to send reconfirmation requests instead of simple unassign notifications.
      // We only handle customer in-app notifications here.
      if (changes.planChanged) {
        console.log('📋 Plan changed, sending customer notification (driver notifications handled by handlePlanSwitch)');
        
        // Create in-app notification for customer (APPOINTMENT_UPDATED for plan change)
        try {
          await NotificationService.notifyAppointmentUpdated(
            updatedAppointment.user.id || updatedAppointment.userId,
            {
              appointmentId: updatedAppointment.id,
              appointmentType: updatedAppointment.appointmentType,
              date: updatedAppointment.date,
              time: updatedAppointment.time,
              address: updatedAppointment.address || ''
            }
          );
          notificationsSent.push('customer_appointment_updated');
        } catch (notificationError) {
          console.error('Error creating in-app update notification:', notificationError);
        }
      }

      console.log(`✅ Sent ${notificationsSent.length} notifications`);
      return notificationsSent;
    } catch (error) {
      console.error('Error handling appointment change notifications:', error);
      return notificationsSent;
    }
  }
}


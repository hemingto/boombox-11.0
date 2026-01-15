/**
 * @fileoverview ApprovalNotificationService - Multi-channel approval notification orchestration
 * @source New service for boombox-11.0 approval notification system
 * 
 * SERVICE FUNCTIONALITY:
 * Orchestrates sending notifications via all three channels (in-app, SMS, email)
 * when an admin approves a driver or moving partner account.
 * 
 * FEATURES:
 * - Sends in-app notifications via NotificationService
 * - Sends SMS via MessageService
 * - Sends email via MessageService
 * - Non-blocking error handling (approval succeeds even if notifications fail)
 * - Comprehensive logging for troubleshooting
 * 
 * INTEGRATION:
 * - Uses NotificationService for in-app notifications
 * - Uses MessageService for SMS and email
 * - Uses approval templates from messaging/templates
 */

import { NotificationService } from './NotificationService';
import { MessageService } from '@/lib/messaging/MessageService';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';
import { driverApprovalSms } from '@/lib/messaging/templates/sms/account/driverApprovalSms';
import { moverApprovalSms } from '@/lib/messaging/templates/sms/account/moverApprovalSms';
import { driverApprovalEmail } from '@/lib/messaging/templates/email/account/driverApprovalEmail';
import { moverApprovalEmail } from '@/lib/messaging/templates/email/account/moverApprovalEmail';

/**
 * Driver data required for approval notifications
 */
export interface DriverApprovalData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  services?: string[];
  movingPartnerName?: string;
  isMovingPartnerDriver?: boolean;
}

/**
 * Moving partner data required for approval notifications
 */
export interface MoverApprovalData {
  id: number;
  name: string;
  email: string | null;
  phoneNumber: string | null;
}

/**
 * Result of sending approval notifications
 */
export interface ApprovalNotificationResult {
  inAppSuccess: boolean;
  smsSuccess: boolean;
  emailSuccess: boolean;
  errors: string[];
}

export class ApprovalNotificationService {
  /**
   * Send all approval notifications for a driver
   * Sends in-app notification, SMS, and email
   * 
   * @param driver - Driver data for notifications
   * @returns Result indicating success/failure of each channel
   */
  static async notifyDriverApproved(driver: DriverApprovalData): Promise<ApprovalNotificationResult> {
    const result: ApprovalNotificationResult = {
      inAppSuccess: false,
      smsSuccess: false,
      emailSuccess: false,
      errors: []
    };

    console.log(`[ApprovalNotificationService] Sending approval notifications for driver ${driver.id}`);

    // Send all notifications concurrently (non-blocking)
    const [inAppResult, smsResult, emailResult] = await Promise.allSettled([
      this.sendDriverInAppNotification(driver),
      this.sendDriverSmsNotification(driver),
      this.sendDriverEmailNotification(driver)
    ]);

    // Process in-app notification result
    if (inAppResult.status === 'fulfilled') {
      result.inAppSuccess = true;
      console.log(`[ApprovalNotificationService] In-app notification sent for driver ${driver.id}`);
    } else {
      const error = `In-app notification failed: ${inAppResult.reason}`;
      result.errors.push(error);
      console.error(`[ApprovalNotificationService] ${error}`);
    }

    // Process SMS result
    if (smsResult.status === 'fulfilled' && smsResult.value) {
      result.smsSuccess = true;
      console.log(`[ApprovalNotificationService] SMS sent for driver ${driver.id}`);
    } else if (smsResult.status === 'rejected') {
      const error = `SMS failed: ${smsResult.reason}`;
      result.errors.push(error);
      console.error(`[ApprovalNotificationService] ${error}`);
    } else if (smsResult.status === 'fulfilled' && !smsResult.value) {
      const error = 'SMS skipped: No phone number available';
      result.errors.push(error);
      console.log(`[ApprovalNotificationService] ${error}`);
    }

    // Process email result
    if (emailResult.status === 'fulfilled' && emailResult.value) {
      result.emailSuccess = true;
      console.log(`[ApprovalNotificationService] Email sent for driver ${driver.id}`);
    } else if (emailResult.status === 'rejected') {
      const error = `Email failed: ${emailResult.reason}`;
      result.errors.push(error);
      console.error(`[ApprovalNotificationService] ${error}`);
    } else if (emailResult.status === 'fulfilled' && !emailResult.value) {
      const error = 'Email skipped: No email available';
      result.errors.push(error);
      console.log(`[ApprovalNotificationService] ${error}`);
    }

    console.log(`[ApprovalNotificationService] Driver ${driver.id} notification results:`, result);
    return result;
  }

  /**
   * Send all approval notifications for a moving partner
   * Sends in-app notification, SMS, and email
   * 
   * @param mover - Moving partner data for notifications
   * @returns Result indicating success/failure of each channel
   */
  static async notifyMoverApproved(mover: MoverApprovalData): Promise<ApprovalNotificationResult> {
    const result: ApprovalNotificationResult = {
      inAppSuccess: false,
      smsSuccess: false,
      emailSuccess: false,
      errors: []
    };

    console.log(`[ApprovalNotificationService] Sending approval notifications for mover ${mover.id}`);

    // Send all notifications concurrently (non-blocking)
    const [inAppResult, smsResult, emailResult] = await Promise.allSettled([
      this.sendMoverInAppNotification(mover),
      this.sendMoverSmsNotification(mover),
      this.sendMoverEmailNotification(mover)
    ]);

    // Process in-app notification result
    if (inAppResult.status === 'fulfilled') {
      result.inAppSuccess = true;
      console.log(`[ApprovalNotificationService] In-app notification sent for mover ${mover.id}`);
    } else {
      const error = `In-app notification failed: ${inAppResult.reason}`;
      result.errors.push(error);
      console.error(`[ApprovalNotificationService] ${error}`);
    }

    // Process SMS result
    if (smsResult.status === 'fulfilled' && smsResult.value) {
      result.smsSuccess = true;
      console.log(`[ApprovalNotificationService] SMS sent for mover ${mover.id}`);
    } else if (smsResult.status === 'rejected') {
      const error = `SMS failed: ${smsResult.reason}`;
      result.errors.push(error);
      console.error(`[ApprovalNotificationService] ${error}`);
    } else if (smsResult.status === 'fulfilled' && !smsResult.value) {
      const error = 'SMS skipped: No phone number available';
      result.errors.push(error);
      console.log(`[ApprovalNotificationService] ${error}`);
    }

    // Process email result
    if (emailResult.status === 'fulfilled' && emailResult.value) {
      result.emailSuccess = true;
      console.log(`[ApprovalNotificationService] Email sent for mover ${mover.id}`);
    } else if (emailResult.status === 'rejected') {
      const error = `Email failed: ${emailResult.reason}`;
      result.errors.push(error);
      console.error(`[ApprovalNotificationService] ${error}`);
    } else if (emailResult.status === 'fulfilled' && !emailResult.value) {
      const error = 'Email skipped: No email available';
      result.errors.push(error);
      console.log(`[ApprovalNotificationService] ${error}`);
    }

    console.log(`[ApprovalNotificationService] Mover ${mover.id} notification results:`, result);
    return result;
  }

  /**
   * Send in-app notification for driver approval
   * Customized based on whether driver is linked to a moving partner
   */
  private static async sendDriverInAppNotification(driver: DriverApprovalData): Promise<void> {
    await NotificationService.createNotification({
      recipientId: driver.id,
      recipientType: 'DRIVER',
      type: 'ACCOUNT_APPROVED',
      data: {
        accountType: 'driver',
        userName: `${driver.firstName} ${driver.lastName}`,
        approvalDate: new Date(),
        movingPartnerName: driver.movingPartnerName,
        isMovingPartnerDriver: driver.isMovingPartnerDriver
      }
    });
  }

  /**
   * Send SMS notification for driver approval
   * @returns true if sent, false if no phone number
   */
  private static async sendDriverSmsNotification(driver: DriverApprovalData): Promise<boolean> {
    if (!driver.phoneNumber) {
      return false;
    }

    // Compute the status message based on moving partner association
    const statusMessage = driver.movingPartnerName
      ? `driving for ${driver.movingPartnerName} on Boombox`
      : 'accepting jobs and earning money';

    const normalizedPhone = normalizePhoneNumberToE164(driver.phoneNumber);
    const smsResult = await MessageService.sendSms(
      normalizedPhone,
      driverApprovalSms,
      {
        firstName: driver.firstName,
        statusMessage
      }
    );

    if (!smsResult.success) {
      throw new Error(smsResult.error || 'Unknown SMS error');
    }

    return true;
  }

  /**
   * Send email notification for driver approval
   * @returns true if sent, false if no email
   */
  private static async sendDriverEmailNotification(driver: DriverApprovalData): Promise<boolean> {
    if (!driver.email) {
      return false;
    }

    const servicesText = driver.services && driver.services.length > 0 
      ? driver.services.join(', ') 
      : 'Storage Unit Delivery';

    const emailResult = await MessageService.sendEmail(
      driver.email,
      driverApprovalEmail,
      {
        firstName: driver.firstName,
        lastName: driver.lastName,
        services: servicesText
      }
    );

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Unknown email error');
    }

    return true;
  }

  /**
   * Send in-app notification for mover approval
   */
  private static async sendMoverInAppNotification(mover: MoverApprovalData): Promise<void> {
    await NotificationService.notifyAccountApproved(
      mover.id,
      'MOVER',
      {
        accountType: 'mover',
        userName: mover.name,
        approvalDate: new Date()
      }
    );
  }

  /**
   * Send SMS notification for mover approval
   * @returns true if sent, false if no phone number
   */
  private static async sendMoverSmsNotification(mover: MoverApprovalData): Promise<boolean> {
    if (!mover.phoneNumber) {
      return false;
    }

    const normalizedPhone = normalizePhoneNumberToE164(mover.phoneNumber);
    const smsResult = await MessageService.sendSms(
      normalizedPhone,
      moverApprovalSms,
      {
        companyName: mover.name
      }
    );

    if (!smsResult.success) {
      throw new Error(smsResult.error || 'Unknown SMS error');
    }

    return true;
  }

  /**
   * Send email notification for mover approval
   * @returns true if sent, false if no email
   */
  private static async sendMoverEmailNotification(mover: MoverApprovalData): Promise<boolean> {
    if (!mover.email) {
      return false;
    }

    const emailResult = await MessageService.sendEmail(
      mover.email,
      moverApprovalEmail,
      {
        companyName: mover.name,
        email: mover.email
      }
    );

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Unknown email error');
    }

    return true;
  }

  /**
   * Send internal notification only when mover is approved but needs to add drivers
   * Only sends in-app notification, no SMS or email
   * 
   * @param mover - Moving partner data for notification
   */
  static async notifyMoverPendingDrivers(mover: MoverApprovalData): Promise<void> {
    console.log(`[ApprovalNotificationService] Sending pending drivers notification for mover ${mover.id}`);

    try {
      await NotificationService.createNotification({
        recipientId: mover.id,
        recipientType: 'MOVER',
        type: 'MOVER_PENDING_DRIVERS',
        data: {
          accountType: 'mover',
          companyName: mover.name
        },
        movingPartnerId: mover.id
      });
      console.log(`[ApprovalNotificationService] Pending drivers notification sent for mover ${mover.id}`);
    } catch (error) {
      console.error(`[ApprovalNotificationService] Failed to send pending drivers notification:`, error);
      throw error;
    }
  }

  /**
   * Send all notifications when mover account is activated (first driver approved)
   * Sends in-app notification, SMS, and email with activation message
   * 
   * @param mover - Moving partner data for notifications
   * @param driverName - Name of the first approved driver
   * @returns Result indicating success/failure of each channel
   */
  static async notifyMoverActivated(
    mover: MoverApprovalData, 
    driverName: string
  ): Promise<ApprovalNotificationResult> {
    const result: ApprovalNotificationResult = {
      inAppSuccess: false,
      smsSuccess: false,
      emailSuccess: false,
      errors: []
    };

    console.log(`[ApprovalNotificationService] Sending activation notifications for mover ${mover.id}`);

    // Send all notifications concurrently (non-blocking)
    const [inAppResult, smsResult, emailResult] = await Promise.allSettled([
      this.sendMoverActivatedInAppNotification(mover, driverName),
      this.sendMoverActivatedSmsNotification(mover, driverName),
      this.sendMoverActivatedEmailNotification(mover, driverName)
    ]);

    // Process in-app notification result
    if (inAppResult.status === 'fulfilled') {
      result.inAppSuccess = true;
      console.log(`[ApprovalNotificationService] In-app activation notification sent for mover ${mover.id}`);
    } else {
      const error = `In-app activation notification failed: ${inAppResult.reason}`;
      result.errors.push(error);
      console.error(`[ApprovalNotificationService] ${error}`);
    }

    // Process SMS result
    if (smsResult.status === 'fulfilled' && smsResult.value) {
      result.smsSuccess = true;
      console.log(`[ApprovalNotificationService] SMS activation sent for mover ${mover.id}`);
    } else if (smsResult.status === 'rejected') {
      const error = `SMS activation failed: ${smsResult.reason}`;
      result.errors.push(error);
      console.error(`[ApprovalNotificationService] ${error}`);
    } else if (smsResult.status === 'fulfilled' && !smsResult.value) {
      const error = 'SMS skipped: No phone number available';
      result.errors.push(error);
      console.log(`[ApprovalNotificationService] ${error}`);
    }

    // Process email result
    if (emailResult.status === 'fulfilled' && emailResult.value) {
      result.emailSuccess = true;
      console.log(`[ApprovalNotificationService] Email activation sent for mover ${mover.id}`);
    } else if (emailResult.status === 'rejected') {
      const error = `Email activation failed: ${emailResult.reason}`;
      result.errors.push(error);
      console.error(`[ApprovalNotificationService] ${error}`);
    } else if (emailResult.status === 'fulfilled' && !emailResult.value) {
      const error = 'Email skipped: No email available';
      result.errors.push(error);
      console.log(`[ApprovalNotificationService] ${error}`);
    }

    console.log(`[ApprovalNotificationService] Mover ${mover.id} activation notification results:`, result);
    return result;
  }

  /**
   * Send in-app notification for mover activation
   */
  private static async sendMoverActivatedInAppNotification(
    mover: MoverApprovalData, 
    driverName: string
  ): Promise<void> {
    await NotificationService.createNotification({
      recipientId: mover.id,
      recipientType: 'MOVER',
      type: 'MOVER_ACTIVATED',
      data: {
        accountType: 'mover',
        userName: driverName,
        companyName: mover.name
      },
      movingPartnerId: mover.id
    });
  }

  /**
   * Send SMS notification for mover activation
   */
  private static async sendMoverActivatedSmsNotification(
    mover: MoverApprovalData, 
    driverName: string
  ): Promise<boolean> {
    if (!mover.phoneNumber) {
      return false;
    }

    const normalizedPhone = normalizePhoneNumberToE164(mover.phoneNumber);
    const smsResult = await MessageService.sendSms(
      normalizedPhone,
      moverApprovalSms,
      {
        companyName: mover.name,
        driverName: driverName
      }
    );

    if (!smsResult.success) {
      throw new Error(smsResult.error || 'Unknown SMS error');
    }

    return true;
  }

  /**
   * Send email notification for mover activation
   */
  private static async sendMoverActivatedEmailNotification(
    mover: MoverApprovalData, 
    driverName: string
  ): Promise<boolean> {
    if (!mover.email) {
      return false;
    }

    const emailResult = await MessageService.sendEmail(
      mover.email,
      moverApprovalEmail,
      {
        companyName: mover.name,
        email: mover.email,
        driverName: driverName
      }
    );

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Unknown email error');
    }

    return true;
  }
}


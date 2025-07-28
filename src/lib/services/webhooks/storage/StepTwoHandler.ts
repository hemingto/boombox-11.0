/**
 * @fileoverview Step 2 handler for storage unit service/delivery webhook events
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (step 2 logic)
 * @refactor Extracted step 2 specific logic including arrival, completion, and billing
 */

import { MessageService } from '@/lib/messaging/MessageService';
import {
  storageDeliveryStartedTemplate,
  storageServiceArrivalTemplate,
  storageLoadingCompletedTemplate,
  storageTermEndedTemplate,
  storageAccessCompletedTemplate
} from '@/lib/messaging/templates/sms/booking';
import {
  createTrackingToken,
  getWorkerName,
  buildTrackingUrl
} from '@/lib/utils/onfleetWebhookUtils';
import {
  findAppointmentByOnfleetTask,
  updateAppointmentStatus,
  updateStorageUnitMainImage,
  findOnfleetTaskByShortId
} from '@/lib/utils/webhookQueries';
import { AppointmentBillingService } from '@/lib/services/billing/AppointmentBillingService';
import type { OnfleetWebhookPayload } from '@/lib/validations/api.validations';

export class StepTwoHandler {
  /**
   * Handle taskStarted event for Step 2 (Delivery Started)
   * Sends delivery started notification to customer
   */
  static async handleTaskStarted(webhookData: OnfleetWebhookPayload): Promise<void> {
    const { data } = webhookData;
    const taskDetails = data?.task;
    const worker = taskDetails?.worker;

    if (!taskDetails) {
      throw new Error('No task details found in webhook data');
    }

    // Find appointment with all necessary includes
    const appointment = await findAppointmentByOnfleetTask(taskDetails.shortId);

    if (!appointment) {
      console.log('No appointment found for task:', taskDetails.shortId);
      return;
    }

    // Send delivery started notification
    const driverName = getWorkerName(worker);
    const crewName = appointment.movingPartner?.name || driverName;

    const smsResult = await MessageService.sendSms(
      appointment.user.phoneNumber,
      storageDeliveryStartedTemplate,
      { 
        crewName, 
        trackingUrl: taskDetails.trackingURL || '' 
      }
    );

    if (smsResult.success) {
      console.log(`Delivery started SMS sent for appointment ${appointment.id}`);
    } else {
      console.error(`Failed to send delivery started SMS for appointment ${appointment.id}:`, smsResult.error);
    }
  }

  /**
   * Handle taskArrival event for Step 2 (Service Arrival)
   * Updates service start time and sends arrival notification
   */
  static async handleTaskArrival(webhookData: OnfleetWebhookPayload): Promise<void> {
    const { time, data } = webhookData;
    const taskDetails = data?.task;
    const worker = taskDetails?.worker;

    if (!taskDetails) {
      throw new Error('No task details found in webhook data');
    }

    console.log('Processing step 2 taskArrival webhook...');

    // Find appointment excluding completed ones
    const appointment = await findAppointmentByOnfleetTask(
      taskDetails.shortId,
      { stepNumber: 2, excludeStatus: 'Loading Complete' }
    );

    if (!appointment) {
      console.log('No appointment found for task:', taskDetails.shortId);
      return;
    }

    // Generate new tracking token for arrival
    const token = createTrackingToken({
      appointmentId: appointment.id,
      taskId: taskDetails.shortId,
      webhookTime: time,
      triggerName: 'taskArrival'
    });

    // Update appointment with service start time and new token
    await updateAppointmentStatus(appointment.id, appointment.status, {
      serviceStartTime: time.toString(),
      trackingToken: token
    });

    // Send arrival notification
    const crewName = appointment.movingPartner?.name || getWorkerName(worker);

    const smsResult = await MessageService.sendSms(
      appointment.user.phoneNumber,
      storageServiceArrivalTemplate,
      { crewName }
    );

    if (smsResult.success) {
      console.log(`Service arrival SMS sent for appointment ${appointment.id}`);
    } else {
      console.error(`Failed to send arrival SMS for appointment ${appointment.id}:`, smsResult.error);
    }

    console.log('Updated service start time and sent arrival notification for appointment:', appointment.id);
  }

  /**
   * Handle taskCompleted event for Step 2 (Service Completion)
   * This is the most complex handler - processes billing, subscriptions, and notifications
   */
  static async handleTaskCompleted(webhookData: OnfleetWebhookPayload): Promise<void> {
    const { time, data } = webhookData;
    const taskDetails = data?.task;
    const worker = taskDetails?.worker;

    if (!taskDetails) {
      throw new Error('No task details found in webhook data');
    }

    console.log('Processing Step 2 completion webhook with shortId:', taskDetails.shortId);

    // Find appointment with all necessary includes
    const appointment = await findAppointmentByOnfleetTask(
      taskDetails.shortId,
      { stepNumber: 2 }
    );

    if (!appointment) {
      console.log('No appointment found for task:', taskDetails.shortId);
      return;
    }

    // Handle StorageUnitUsage.mainImage update for Step 2 completion photo
    await this.updateStorageUnitMainImageIfNeeded(taskDetails.shortId);

    // Generate new tracking token for completion
    const token = createTrackingToken({
      appointmentId: appointment.id,
      taskId: taskDetails.shortId,
      webhookTime: time,
      triggerName: 'taskCompleted'
    });

    // Update appointment with service end time and new token
    await updateAppointmentStatus(appointment.id, appointment.status, {
      serviceEndTime: time.toString(),
      trackingToken: token
    });

    console.log('Found appointment for billing processing:', appointment.appointmentType);

    // Process billing if customer has Stripe ID
    if (appointment.user.stripeCustomerId) {
      await AppointmentBillingService.processWebhookCompletion(
        appointment,
        taskDetails,
        time
      );
    } else {
      console.log('Skipping billing processing - no stripeCustomerId found');
    }

    // Send completion SMS notification
    await this.sendCompletionNotification(appointment, worker);
  }

  /**
   * Update StorageUnitUsage.mainImage with Step 2 completion photo
   */
  private static async updateStorageUnitMainImageIfNeeded(taskShortId: string): Promise<void> {
    const onfleetTask = await findOnfleetTaskByShortId(taskShortId);

    if (onfleetTask?.completionPhotoUrl && onfleetTask.storageUnitId) {
      try {
        await updateStorageUnitMainImage(
          onfleetTask.storageUnitId,
          onfleetTask.completionPhotoUrl
        );
        console.log('Updated StorageUnitUsage.mainImage with Step 2 completion photo for storage unit:', onfleetTask.storageUnitId);
      } catch (error) {
        console.error('Error updating StorageUnitUsage.mainImage:', error);
      }
    }
  }

  /**
   * Send appropriate completion SMS based on appointment type
   */
  private static async sendCompletionNotification(appointment: any, worker: any): Promise<void> {
    const driverName = getWorkerName(worker);
    const crewName = appointment.movingPartner?.name || driverName;
    const feedbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/feedback/${appointment.trackingToken}`;

    // Determine template based on appointment type
    let template;
    if (appointment.appointmentType === 'Initial Pickup' || appointment.appointmentType === 'Additional Storage') {
      template = storageLoadingCompletedTemplate;
    } else if (appointment.appointmentType === 'End Storage Term') {
      template = storageTermEndedTemplate;
    } else {
      template = storageAccessCompletedTemplate;
    }

    try {
      const smsResult = await MessageService.sendSms(
        appointment.user.phoneNumber,
        template,
        { crewName, feedbackUrl }
      );

      if (smsResult.success) {
        console.log(`Completion SMS sent for appointment ${appointment.id}`);
      } else {
        console.error(`Failed to send completion SMS for appointment ${appointment.id}:`, smsResult.error);
      }
    } catch (smsError) {
      console.error(`Failed to send completion SMS for appointment ${appointment.id}:`, smsError);
    }
  }
} 
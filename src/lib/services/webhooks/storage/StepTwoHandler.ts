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
  buildTrackingUrl,
  extractAllDeliveryPhotoUrls,
  type WebhookTaskDetails
} from '@/lib/utils/onfleetWebhookUtils';
import {
  findAppointmentByOnfleetTask,
  updateAppointmentStatus,
  updateStorageUnitPhotosFromWebhook,
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
    console.log('=== [StepTwoHandler] handleTaskStarted START ===');
    
    const { data } = webhookData;
    const taskDetails = data?.task;
    const worker = taskDetails?.worker;

    console.log(`[StepTwoHandler:Started] taskDetails exists: ${!!taskDetails}`);
    console.log(`[StepTwoHandler:Started] worker:`, worker);

    if (!taskDetails) {
      console.error('[StepTwoHandler:Started] ERROR: No task details found');
      throw new Error('No task details found in webhook data');
    }

    console.log(`[StepTwoHandler:Started] Task shortId: ${taskDetails.shortId}`);

    // Find appointment with all necessary includes
    console.log(`[StepTwoHandler:Started] Looking up appointment for task: ${taskDetails.shortId}`);
    const appointment = await findAppointmentByOnfleetTask(taskDetails.shortId);

    if (!appointment) {
      console.log(`[StepTwoHandler:Started] WARNING: No appointment found for task: ${taskDetails.shortId}`);
      return;
    }

    console.log(`[StepTwoHandler:Started] Appointment found: ${appointment.id}, status: ${appointment.status}`);

    if (this.CANCELED_STATUSES.includes(appointment.status)) {
      console.log(`[StepTwoHandler:Started] SKIPPING: Appointment ${appointment.id} is ${appointment.status}`);
      return;
    }

    // Send delivery started notification
    const driverName = getWorkerName(worker);
    const crewName = appointment.movingPartner?.name || driverName;

    console.log(`[StepTwoHandler:Started] Sending SMS - phone: ${appointment.user.phoneNumber}, crewName: ${crewName}`);

    const smsResult = await MessageService.sendSms(
      appointment.user.phoneNumber,
      storageDeliveryStartedTemplate,
      { 
        crewName, 
        trackingUrl: taskDetails.trackingURL || '' 
      }
    );

    if (smsResult.success) {
      console.log(`[StepTwoHandler:Started] SUCCESS: Delivery started SMS sent for appointment ${appointment.id}`);
    } else {
      console.error(`[StepTwoHandler:Started] FAILED: Could not send delivery started SMS for appointment ${appointment.id}:`, smsResult.error);
    }
    
    console.log('=== [StepTwoHandler] handleTaskStarted COMPLETE ===');
  }

  /**
   * Handle taskArrival event for Step 2 (Service Arrival)
   * Updates service start time and sends arrival notification
   */
  static async handleTaskArrival(webhookData: OnfleetWebhookPayload): Promise<void> {
    console.log('=== [StepTwoHandler] handleTaskArrival START ===');
    
    const { time, data } = webhookData;
    const taskDetails = data?.task;
    const worker = taskDetails?.worker;

    console.log(`[StepTwoHandler:Arrival] time: ${time}`);
    console.log(`[StepTwoHandler:Arrival] taskDetails exists: ${!!taskDetails}`);

    if (!taskDetails) {
      console.error('[StepTwoHandler:Arrival] ERROR: No task details found');
      throw new Error('No task details found in webhook data');
    }

    console.log(`[StepTwoHandler:Arrival] Task shortId: ${taskDetails.shortId}`);

    // Find appointment excluding completed ones
    console.log(`[StepTwoHandler:Arrival] Looking up appointment (stepNumber: 2, excludeStatus: 'Loading Complete')`);
    const appointment = await findAppointmentByOnfleetTask(
      taskDetails.shortId,
      { stepNumber: 2, excludeStatus: 'Loading Complete' }
    );

    if (!appointment) {
      console.log(`[StepTwoHandler:Arrival] WARNING: No appointment found for task: ${taskDetails.shortId}`);
      return;
    }

    console.log(`[StepTwoHandler:Arrival] Appointment found: ${appointment.id}, current status: ${appointment.status}`);

    if (this.CANCELED_STATUSES.includes(appointment.status)) {
      console.log(`[StepTwoHandler:Arrival] SKIPPING: Appointment ${appointment.id} is ${appointment.status}`);
      return;
    }

    // Generate new tracking token for arrival
    console.log('[StepTwoHandler:Arrival] Generating tracking token for arrival...');
    const token = createTrackingToken({
      appointmentId: appointment.id,
      taskId: taskDetails.shortId,
      webhookTime: time,
      triggerName: 'taskArrival'
    });

    // Update appointment with service start time and new token
    console.log(`[StepTwoHandler:Arrival] Updating appointment with serviceStartTime: ${time}`);
    await updateAppointmentStatus(appointment.id, appointment.status, {
      serviceStartTime: time.toString(),
      trackingToken: token
    });
    console.log('[StepTwoHandler:Arrival] Appointment updated successfully');

    // Send arrival notification
    const crewName = appointment.movingPartner?.name || getWorkerName(worker);
    console.log(`[StepTwoHandler:Arrival] Sending arrival SMS - phone: ${appointment.user.phoneNumber}, crewName: ${crewName}`);

    const smsResult = await MessageService.sendSms(
      appointment.user.phoneNumber,
      storageServiceArrivalTemplate,
      { crewName }
    );

    if (smsResult.success) {
      console.log(`[StepTwoHandler:Arrival] SUCCESS: Service arrival SMS sent for appointment ${appointment.id}`);
    } else {
      console.error(`[StepTwoHandler:Arrival] FAILED: Could not send arrival SMS for appointment ${appointment.id}:`, smsResult.error);
    }

    console.log('=== [StepTwoHandler] handleTaskArrival COMPLETE ===');
  }

  private static readonly CANCELED_STATUSES = ['Canceled', 'Cancelled'];

  /**
   * Statuses that indicate Step 2 completion has already been processed.
   * Used to prevent duplicate processing on webhook retries.
   */
  private static readonly COMPLETED_STATUSES = [
    'Loading Complete',
    'Storage Term Ended', 
    'Access Complete',
    'Complete'
  ];

  /**
   * Handle taskCompleted event for Step 2 (Service Completion)
   * This is the most complex handler - processes billing, subscriptions, and notifications
   * 
   * IDEMPOTENCY: This handler includes protection against duplicate processing.
   * Onfleet may retry webhooks at 30/60 minute intervals if responses are slow or fail.
   * We check the appointment status to prevent sending duplicate SMS notifications.
   */
  static async handleTaskCompleted(webhookData: OnfleetWebhookPayload): Promise<void> {
    console.log('=== [StepTwoHandler] handleTaskCompleted START ===');
    
    const { time, data } = webhookData;
    const taskDetails = data?.task;
    const worker = taskDetails?.worker;

    console.log(`[StepTwoHandler:Completed] time: ${time}`);
    console.log(`[StepTwoHandler:Completed] taskDetails exists: ${!!taskDetails}`);

    if (!taskDetails) {
      console.error('[StepTwoHandler:Completed] ERROR: No task details found');
      throw new Error('No task details found in webhook data');
    }

    console.log(`[StepTwoHandler:Completed] Task shortId: ${taskDetails.shortId}`);
    console.log(`[StepTwoHandler:Completed] Completion details:`, taskDetails.completionDetails);

    // Find appointment with all necessary includes
    console.log(`[StepTwoHandler:Completed] Looking up appointment (stepNumber: 2)`);
    const appointment = await findAppointmentByOnfleetTask(
      taskDetails.shortId,
      { stepNumber: 2 }
    );

    if (!appointment) {
      console.log(`[StepTwoHandler:Completed] WARNING: No appointment found for task: ${taskDetails.shortId}`);
      return;
    }

    console.log(`[StepTwoHandler:Completed] Appointment found:`, {
      id: appointment.id,
      appointmentType: appointment.appointmentType,
      status: appointment.status,
      stripeCustomerId: appointment.user.stripeCustomerId
    });

    if (this.CANCELED_STATUSES.includes(appointment.status)) {
      console.log(`[StepTwoHandler:Completed] SKIPPING: Appointment ${appointment.id} is ${appointment.status} — no billing or notifications`);
      return;
    }

    // IDEMPOTENCY CHECK: Skip if appointment has already been completed
    // This prevents duplicate SMS notifications on Onfleet webhook retries
    if (this.COMPLETED_STATUSES.includes(appointment.status)) {
      console.log(`[StepTwoHandler:Completed] SKIPPING: Appointment ${appointment.id} already has completed status: ${appointment.status}`);
      console.log('[StepTwoHandler:Completed] This is likely a webhook retry - returning early to prevent duplicate processing');
      return;
    }

    // Handle StorageUnitUsage photos update for Step 2 completion (mainImage + uploadedImages)
    console.log('[StepTwoHandler:Completed] Updating StorageUnitUsage photos if needed...');
    await this.updateStorageUnitPhotosIfNeeded(taskDetails);

    // Generate new tracking token for completion
    console.log('[StepTwoHandler:Completed] Generating completion tracking token...');
    const token = createTrackingToken({
      appointmentId: appointment.id,
      taskId: taskDetails.shortId,
      webhookTime: time,
      triggerName: 'taskCompleted'
    });

    // Update appointment with service end time and new token
    console.log(`[StepTwoHandler:Completed] Updating appointment with serviceEndTime: ${time}`);
    await updateAppointmentStatus(appointment.id, appointment.status, {
      serviceEndTime: time.toString(),
      trackingToken: token
    });
    console.log('[StepTwoHandler:Completed] Appointment updated successfully');

    console.log(`[StepTwoHandler:Completed] Appointment type for billing: ${appointment.appointmentType}`);

    // Process billing if customer has Stripe ID
    if (appointment.user.stripeCustomerId) {
      console.log(`[StepTwoHandler:Completed] Processing billing for Stripe customer: ${appointment.user.stripeCustomerId}`);
      await AppointmentBillingService.processWebhookCompletion(
        appointment,
        taskDetails,
        time
      );
      console.log('[StepTwoHandler:Completed] Billing processing complete');
    } else {
      // IMPORTANT: When billing is skipped, we must still update the appointment status
      // to a completed state. This ensures the idempotency check will catch retries.
      console.log('[StepTwoHandler:Completed] Skipping billing - no stripeCustomerId found');
      const completedStatus = this.getCompletedStatusForAppointmentType(appointment.appointmentType);
      console.log(`[StepTwoHandler:Completed] Updating status to '${completedStatus}' (billing skipped)`);
      await updateAppointmentStatus(appointment.id, completedStatus);
    }

    // Send completion SMS notification
    console.log('[StepTwoHandler:Completed] Sending completion notification...');
    await this.sendCompletionNotification(appointment, worker);

    console.log('=== [StepTwoHandler] handleTaskCompleted COMPLETE ===');
  }

  /**
   * Determine the completed status based on appointment type
   * This mirrors the logic in AppointmentBillingService.determineAppointmentStatus
   */
  private static getCompletedStatusForAppointmentType(appointmentType: string): string {
    if (appointmentType === 'Initial Pickup' || appointmentType === 'Additional Storage') {
      return 'Loading Complete';
    } else if (appointmentType === 'End Storage Term') {
      return 'Storage Term Ended';
    } else if (appointmentType === 'Storage Unit Access') {
      return 'Access Complete';
    }
    return 'Complete';
  }

  /**
   * Update StorageUnitUsage with all completion photos from webhook
   * First photo becomes mainImage, additional photos are added to uploadedImages
   */
  private static async updateStorageUnitPhotosIfNeeded(taskDetails: WebhookTaskDetails): Promise<void> {
    console.log(`[StepTwoHandler:Photos] Looking up OnfleetTask: ${taskDetails.shortId}`);
    const onfleetTask = await findOnfleetTaskByShortId(taskDetails.shortId);

    console.log(`[StepTwoHandler:Photos] OnfleetTask result:`, onfleetTask ? {
      storageUnitId: onfleetTask.storageUnitId
    } : 'NOT FOUND');

    if (!onfleetTask?.storageUnitId) {
      console.log('[StepTwoHandler:Photos] Skipping - no storageUnitId found on OnfleetTask');
      return;
    }

    // Extract ALL photo URLs from the webhook payload
    const allPhotoUrls = extractAllDeliveryPhotoUrls(taskDetails);
    console.log(`[StepTwoHandler:Photos] Extracted ${allPhotoUrls.length} photos from webhook:`, allPhotoUrls);

    if (allPhotoUrls.length === 0) {
      console.log('[StepTwoHandler:Photos] Skipping - no completion photos found in webhook data');
      return;
    }

    try {
      // First photo is the main image, rest go to uploadedImages
      const mainImage = allPhotoUrls[0];
      const additionalImages = allPhotoUrls.slice(1);

      console.log(`[StepTwoHandler:Photos] Updating storageUnitId: ${onfleetTask.storageUnitId}`);
      console.log(`[StepTwoHandler:Photos] mainImage: ${mainImage}`);
      console.log(`[StepTwoHandler:Photos] additionalImages count: ${additionalImages.length}`);

      await updateStorageUnitPhotosFromWebhook(
        onfleetTask.storageUnitId,
        mainImage,
        additionalImages
      );

      console.log(`[StepTwoHandler:Photos] SUCCESS: Updated photos for storage unit: ${onfleetTask.storageUnitId}`);
    } catch (error) {
      console.error('[StepTwoHandler:Photos] ERROR updating photos:', error);
    }
  }

  /**
   * Send appropriate completion SMS based on appointment type
   */
  private static async sendCompletionNotification(appointment: any, worker: any): Promise<void> {
    console.log('[StepTwoHandler:Notification] Preparing completion notification...');
    
    const driverName = getWorkerName(worker);
    const crewName = appointment.movingPartner?.name || driverName;
    const feedbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/feedback/${appointment.trackingToken}`;

    console.log(`[StepTwoHandler:Notification] crewName: ${crewName}`);
    console.log(`[StepTwoHandler:Notification] feedbackUrl: ${feedbackUrl}`);
    console.log(`[StepTwoHandler:Notification] appointmentType: ${appointment.appointmentType}`);

    // Determine template based on appointment type
    let template;
    let templateName;
    if (appointment.appointmentType === 'Initial Pickup' || appointment.appointmentType === 'Additional Storage') {
      template = storageLoadingCompletedTemplate;
      templateName = 'storageLoadingCompletedTemplate';
    } else if (appointment.appointmentType === 'End Storage Term') {
      template = storageTermEndedTemplate;
      templateName = 'storageTermEndedTemplate';
    } else {
      template = storageAccessCompletedTemplate;
      templateName = 'storageAccessCompletedTemplate';
    }

    console.log(`[StepTwoHandler:Notification] Using template: ${templateName}`);

    try {
      console.log(`[StepTwoHandler:Notification] Sending SMS to: ${appointment.user.phoneNumber}`);
      const smsResult = await MessageService.sendSms(
        appointment.user.phoneNumber,
        template,
        { crewName, feedbackUrl }
      );

      if (smsResult.success) {
        console.log(`[StepTwoHandler:Notification] SUCCESS: Completion SMS sent for appointment ${appointment.id}`);
      } else {
        console.error(`[StepTwoHandler:Notification] FAILED: Could not send completion SMS for appointment ${appointment.id}:`, smsResult.error);
      }
    } catch (smsError) {
      console.error(`[StepTwoHandler:Notification] ERROR: Exception sending completion SMS for appointment ${appointment.id}:`, smsError);
    }
  }
} 
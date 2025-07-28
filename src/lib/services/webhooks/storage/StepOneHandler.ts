/**
 * @fileoverview Step 1 handler for storage unit pickup started webhook events
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (step 1 logic)
 * @refactor Extracted step 1 specific logic into dedicated handler
 */

import { MessageService } from '@/lib/messaging/MessageService';
import { storagePickupStartedTemplate } from '@/lib/messaging/templates/sms/booking';
import {
  createTrackingToken,
  getWorkerName,
  buildTrackingUrl
} from '@/lib/utils/onfleetWebhookUtils';
import {
  findAppointmentByOnfleetTask,
  updateAppointmentStatus
} from '@/lib/utils/webhookQueries';
import type { OnfleetWebhookPayload } from '@/lib/validations/api.validations';

export class StepOneHandler {
  /**
   * Handle taskStarted event for Step 1 (Pickup Started)
   * Updates appointment status to "In Transit" and sends customer notification
   */
  static async handleTaskStarted(webhookData: OnfleetWebhookPayload): Promise<void> {
    const { time, data } = webhookData;
    const taskDetails = data?.task;
    const worker = taskDetails?.worker;

    if (!taskDetails) {
      throw new Error('No task details found in webhook data');
    }

    console.log('Processing step 1 taskStarted webhook...');

    // Find appointment with all necessary includes
    const appointment = await findAppointmentByOnfleetTask(taskDetails.shortId);

    if (!appointment) {
      console.log('No appointment found for task:', taskDetails.shortId);
      return;
    }

    // Generate tracking token and URL
    const token = createTrackingToken({
      appointmentId: appointment.id,
      taskId: taskDetails.shortId,
      webhookTime: time,
      eta: taskDetails.estimatedArrivalTime,
      triggerName: 'taskStarted'
    });

    const trackingUrl = buildTrackingUrl(token);

    try {
      // Update appointment status and tracking info
      await updateAppointmentStatus(appointment.id, 'In Transit', {
        trackingToken: token,
        trackingUrl: trackingUrl
      });

      // Send SMS notification to customer
      const driverName = getWorkerName(worker);
      const crewName = appointment.movingPartner?.name || driverName;

      const smsResult = await MessageService.sendSms(
        appointment.user.phoneNumber,
        storagePickupStartedTemplate,
        { crewName, trackingUrl }
      );

      if (smsResult.success) {
        console.log(`Pickup started SMS sent for appointment ${appointment.id}`);
      } else {
        console.error(`Failed to send pickup started SMS for appointment ${appointment.id}:`, smsResult.error);
      }

    } catch (error) {
      console.error('Failed to update appointment or send SMS:', error);
      throw error;
    }
  }
} 
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
    console.log('=== [StepOneHandler] handleTaskStarted START ===');
    
    const { time, data } = webhookData;
    const taskDetails = data?.task;
    const worker = taskDetails?.worker;

    console.log(`[StepOneHandler] time: ${time}`);
    console.log(`[StepOneHandler] taskDetails exists: ${!!taskDetails}`);
    console.log(`[StepOneHandler] worker:`, worker);

    if (!taskDetails) {
      console.error('[StepOneHandler] ERROR: No task details found in webhook data');
      throw new Error('No task details found in webhook data');
    }

    console.log(`[StepOneHandler] Task shortId: ${taskDetails.shortId}`);
    console.log(`[StepOneHandler] Task estimatedArrivalTime: ${taskDetails.estimatedArrivalTime}`);

    // Find appointment with all necessary includes
    console.log(`[StepOneHandler] Looking up appointment by OnfleetTask shortId: ${taskDetails.shortId}`);
    const appointment = await findAppointmentByOnfleetTask(taskDetails.shortId);

    if (!appointment) {
      console.log(`[StepOneHandler] WARNING: No appointment found for task: ${taskDetails.shortId}`);
      console.log('[StepOneHandler] This could mean:');
      console.log('  - The OnfleetTask is not linked to an appointment');
      console.log('  - The shortId does not match any onfleetTasks.shortId in the database');
      return;
    }

    console.log(`[StepOneHandler] Appointment found:`, {
      id: appointment.id,
      appointmentType: appointment.appointmentType,
      status: appointment.status,
      userId: appointment.user?.id,
      userPhone: appointment.user?.phoneNumber,
      movingPartnerName: appointment.movingPartner?.name
    });

    // Generate tracking token and URL
    console.log('[StepOneHandler] Generating tracking token...');
    // Convert eta to string, handling null/number cases
    const etaValue = taskDetails.estimatedArrivalTime != null 
      ? String(taskDetails.estimatedArrivalTime) 
      : undefined;

    const token = createTrackingToken({
      appointmentId: appointment.id,
      taskId: taskDetails.shortId,
      webhookTime: time,
      eta: etaValue,
      triggerName: 'taskStarted'
    });
    console.log(`[StepOneHandler] Token generated (first 50 chars): ${token.substring(0, 50)}...`);

    const trackingUrl = buildTrackingUrl(token);
    console.log(`[StepOneHandler] Tracking URL: ${trackingUrl}`);

    try {
      // Update appointment status and tracking info
      console.log(`[StepOneHandler] Updating appointment ${appointment.id} status to "In Transit"`);
      await updateAppointmentStatus(appointment.id, 'In Transit', {
        trackingToken: token,
        trackingUrl: trackingUrl
      });
      console.log('[StepOneHandler] Appointment status updated successfully');

      // Send SMS notification to customer
      const driverName = getWorkerName(worker);
      const crewName = appointment.movingPartner?.name || driverName;
      
      console.log(`[StepOneHandler] Sending SMS to: ${appointment.user.phoneNumber}`);
      console.log(`[StepOneHandler] SMS params - crewName: ${crewName}, trackingUrl: ${trackingUrl}`);

      const smsResult = await MessageService.sendSms(
        appointment.user.phoneNumber,
        storagePickupStartedTemplate,
        { crewName, trackingUrl }
      );

      if (smsResult.success) {
        console.log(`[StepOneHandler] SUCCESS: Pickup started SMS sent for appointment ${appointment.id}`);
      } else {
        console.error(`[StepOneHandler] FAILED: Could not send pickup started SMS for appointment ${appointment.id}:`, smsResult.error);
      }

      console.log('=== [StepOneHandler] handleTaskStarted COMPLETE ===');

    } catch (error) {
      console.error('[StepOneHandler] ERROR during processing:', error);
      console.error('[StepOneHandler] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }
} 
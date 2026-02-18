/**
 * @fileoverview Step 4 handler for final storage unit completion webhook events
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (step 4 logic)
 * @refactor Extracted step 4 specific logic for final completion
 */

// eslint-disable-next-line no-restricted-imports -- webhookQueries uses prisma (server-only), not re-exported from barrel
import {
  findAppointmentByOnfleetTask,
  updateAppointmentStatus
} from '@/lib/utils/webhookQueries';
import type { OnfleetWebhookPayload } from '@/lib/validations/api.validations';

export class StepFourHandler {
  private static readonly CANCELED_STATUSES = ['Canceled', 'Cancelled'];

  /**
   * Handle taskCompleted event for Step 4 (Final Completion)
   * Updates appointment status to "Complete"
   */
  static async handleTaskCompleted(webhookData: OnfleetWebhookPayload): Promise<void> {
    console.log('=== [StepFourHandler] handleTaskCompleted START ===');
    
    const { data } = webhookData;
    const taskDetails = data?.task;

    console.log(`[StepFourHandler] taskDetails exists: ${!!taskDetails}`);

    if (!taskDetails) {
      console.error('[StepFourHandler] ERROR: No task details found');
      throw new Error('No task details found in webhook data');
    }

    console.log(`[StepFourHandler] Task shortId: ${taskDetails.shortId}`);

    // Find appointment
    console.log(`[StepFourHandler] Looking up appointment (stepNumber: 4)`);
    const appointment = await findAppointmentByOnfleetTask(
      taskDetails.shortId,
      { stepNumber: 4 }
    );

    if (!appointment) {
      console.log(`[StepFourHandler] WARNING: No appointment found for task: ${taskDetails.shortId}`);
      return;
    }

    console.log(`[StepFourHandler] Appointment found: ${appointment.id}, status: ${appointment.status}`);

    if (this.CANCELED_STATUSES.includes(appointment.status)) {
      console.log(`[StepFourHandler] SKIPPING: Appointment ${appointment.id} is ${appointment.status}`);
      return;
    }

    // Update appointment status to complete
    console.log(`[StepFourHandler] Updating appointment ${appointment.id} status to "Complete"`);
    await updateAppointmentStatus(appointment.id, 'Complete');
    
    console.log(`[StepFourHandler] SUCCESS: Appointment ${appointment.id} status updated to Complete`);
    console.log('=== [StepFourHandler] handleTaskCompleted COMPLETE ===');
  }
} 